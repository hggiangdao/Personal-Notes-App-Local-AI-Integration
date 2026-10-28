import os
import json
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from highlighter import extract_and_highlight
from summarizer import summarize_title
from kmeans_summarizer import summarize_with_kmeans
from personal_normalizer import parse_personal_note

app = Flask(__name__)
CORS(app)

# Load trained models
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(current_dir, "models")
vectorizer_file = os.path.join(models_dir, "vectorizer.pkl")
model_file = os.path.join(models_dir, "tag_classifier.pkl")

vectorizer = None
classifier = None

if os.path.exists(vectorizer_file) and os.path.exists(model_file):
    vectorizer = joblib.load(vectorizer_file)
    classifier = joblib.load(model_file)
    print("AI Models loaded successfully into memory.")
else:
    print("Warning: Models not found. Please run train_model.py first.")

TAG_COLOR_MAP = {
    "#Công việc": "#bae6fd",  # Xanh da trời
    "#Ý tưởng": "#fed7aa",    # Cam đào
    "#Học tập": "#bbf7d0",    # Xanh mint
    "#Cá nhân": "#fef08a",    # Vàng kem
    "default": "#fef08a"
}

def normalize_tag(tag: str) -> str:
    """Đảm bảo tag có tiền tố #"""
    tag = tag.strip()
    return tag if tag.startswith("#") else f"#{tag}"

def match_closest_user_tag(predicted_tag: str, available_tags: list) -> str:
    """
    Nếu người dùng có danh sách tag riêng, chọn tag khớp nhất
    hoặc trả về predicted_tag nếu hợp lý.
    """
    if not available_tags:
        return predicted_tag

    clean_pred = predicted_tag.lower().replace("#", "").strip()
    
    # 1. Tìm khớp chính xác
    for user_tag in available_tags:
        clean_user = user_tag.lower().replace("#", "").strip()
        if clean_user == clean_pred:
            return user_tag

    # 2. Tìm khớp một phần (substring)
    for user_tag in available_tags:
        clean_user = user_tag.lower().replace("#", "").strip()
        if clean_user in clean_pred or clean_pred in clean_user:
            return user_tag

    # 3. Mặc định trả về predicted_tag
    return predicted_tag

def generate_short_title(text: str, key_points: list = None) -> str:
    """Tóm tắt tiêu đề bằng AI bóc tách hành động và đối tượng cốt lõi"""
    return summarize_title(text)

@app.route("/api/status", methods=["GET"])
def status():
    return jsonify({
        "status": "online",
        "service": "Notes Python AI Microservice",
        "models_loaded": vectorizer is not None and classifier is not None,
        "classes": list(classifier.classes_) if classifier else []
    })

@app.route("/api/analyze-note", methods=["POST"])
def analyze_note():
    data = request.get_json() or {}
    content = data.get("content", "").strip()
    title = data.get("title", "").strip()
    available_tags = data.get("availableTags", [])

    if not content and not title:
        return jsonify({
            "success": False,
            "message": "Vui lòng nhập nội dung hoặc tiêu đề để phân tích"
        }), 400

    # 1. Phân tích theo mô hình Ghi chú cá nhân (Sửa lỗi gõ nhanh & tách Checklist)
    personal_res = parse_personal_note(content) if content else None
    has_tasks = bool(personal_res and len(personal_res["tasks"]) >= 1)
    has_context = bool(personal_res and len(personal_res["context"]) >= 1)
    is_personal_task = has_tasks or (has_context and len(content.split()) < 60)

    # 2. Kiểm tra văn bản dài -> Áp dụng K-Means Extractive Summarization
    kmeans_res = summarize_with_kmeans(content, n_sentences=3) if (content and not is_personal_task) else {"is_summarized": False}
    is_long_doc = kmeans_res.get("is_summarized", False)
    summary_text = kmeans_res.get("summary_text", content)
    summary_sentences = kmeans_res.get("selected_sentences", [])

    text_for_classification = f"{title}. {summary_text}" if title else summary_text

    # 3. Dự đoán Tag
    predicted_tag = "#Công việc"
    confidence = 0.5
    
    if is_personal_task and personal_res.get("tag"):
        predicted_tag = match_closest_user_tag(personal_res["tag"], available_tags)
        confidence = 0.95
    elif classifier and vectorizer and text_for_classification:
        X = vectorizer.transform([text_for_classification])
        raw_pred = classifier.predict(X)[0]
        probs = classifier.predict_proba(X)[0]
        confidence = float(np.max(probs))
        predicted_tag = match_closest_user_tag(raw_pred, available_tags)

    # 4. Gợi ý màu sắc
    suggested_color = personal_res["color"] if (is_personal_task and personal_res.get("color")) else TAG_COLOR_MAP.get(predicted_tag, TAG_COLOR_MAP.get(normalize_tag(predicted_tag), TAG_COLOR_MAP["default"]))

    # 5. Nội dung định dạng (Nếu là việc cá nhân -> Checklist, nếu là bài viết -> Bóc tách tô đậm)
    if is_personal_task:
        highlighted_text = personal_res["formatted_content"]
        key_points = personal_res["tasks"]
        suggested_title = title if title else personal_res["title"]
    else:
        text_to_highlight = summary_text if is_long_doc else (content if content else title)
        highlight_res = extract_and_highlight(text_to_highlight)
        highlighted_text = highlight_res["highlighted_text"]
        key_points = highlight_res["extracted_points"]
        suggested_title = title if title else generate_short_title(summary_text, key_points)

    return jsonify({
        "success": True,
        "isPersonalTask": is_personal_task,
        "isSummarized": is_long_doc,
        "summaryText": summary_text,
        "summarySentences": summary_sentences,
        "totalOriginalSentences": kmeans_res.get("total_sentences", 1),
        "predictedTag": predicted_tag,
        "confidence": round(confidence * 100, 1),
        "suggestedColor": suggested_color,
        "suggestedTitle": suggested_title,
        "highlightedText": highlighted_text,
        "keyPoints": key_points
    })

if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"Starting Python AI Service on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
