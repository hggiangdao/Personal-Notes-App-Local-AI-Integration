import os
import sys
import joblib
import numpy as np
import re

# Thiết lập UTF-8 để hiển thị và nhập tiếng Việt chuẩn xác trên Windows PowerShell / CMD
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stdin, 'reconfigure'):
    sys.stdin.reconfigure(encoding='utf-8')

# Thêm đường dẫn ai-service vào path
ai_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai-service")
sys.path.append(ai_dir)

from highlighter import extract_and_highlight
from summarizer import summarize_title
from kmeans_summarizer import summarize_with_kmeans

# Tải mô hình Machine Learning phân loại Tag
models_dir = os.path.join(ai_dir, "models")
vectorizer_file = os.path.join(models_dir, "vectorizer.pkl")
model_file = os.path.join(models_dir, "tag_classifier.pkl")

if not os.path.exists(vectorizer_file) or not os.path.exists(model_file):
    print("[LOI] Chua tim thay file mo hinh. Vui long chay `python ai-service/train_model.py` truoc.")
    sys.exit(1)

vectorizer = joblib.load(vectorizer_file)
classifier = joblib.load(model_file)

TAG_COLOR_MAP = {
    "#Công việc": ("#bae6fd", "Xanh da troi"),
    "#Ý tưởng": ("#fed7aa", "Cam dao"),
    "#Học tập": ("#bbf7d0", "Xanh mint"),
    "#Cá nhân": ("#fef08a", "Vang kem")
}

def analyze_input(text: str, n_summary_sentences: int = 3):
    """Phân tích một đoạn văn bản ghi chú hoặc bài báo dài bằng AI Python"""
    clean_text = text.replace('\r', ' ').strip()
    clean_text = re.sub(r'\s+', ' ', clean_text)
    if not clean_text:
        return

    # 1. Kiểm tra văn bản dài -> Áp dụng K-Means Extractive Summarization
    kmeans_res = summarize_with_kmeans(clean_text, n_sentences=n_summary_sentences)
    is_long_doc = kmeans_res["is_summarized"]

    # Văn bản dùng để dự đoán Tag và Tiêu đề
    target_summary = kmeans_res["summary_text"] if is_long_doc else clean_text

    # 2. Dự đoán Tag & độ tin cậy bằng mô hình NLP Scikit-Learn
    X = vectorizer.transform([target_summary])
    pred_tag = classifier.predict(X)[0]
    probs = classifier.predict_proba(X)[0]
    confidence = float(np.max(probs)) * 100

    color_code, color_name = TAG_COLOR_MAP.get(pred_tag, ("#fef08a", "Vang kem"))

    # 3. Tóm tắt Tiêu đề bằng bóc tách hành động & đối tượng
    summary_title = summarize_title(target_summary)

    # 4. Bóc tách ý chính & tự động tô đậm
    hl_res = extract_and_highlight(target_summary)
    highlighted_text = hl_res["highlighted_text"]
    key_points = hl_res["extracted_points"]

    # Hiển thị kết quả ra màn hình rõ ràng, không lỗi font
    print("\n" + "=" * 65)
    print("KET QUA PHAN TICH MACHINE LEARNING:")
    print("=" * 65)
    print(f"[*] TAG DU DOAN:       {pred_tag}  (Do tin cay: {confidence:.1f}%)")
    print(f"[*] MAU SAC GOI Y:     {color_name} ({color_code})")
    print(f"[*] TIEU DE TOM TAT:   {summary_title}")

    # Nếu là văn bản dài có phân cụm K-Means
    if is_long_doc:
        print("\n" + "-" * 65)
        print(f"[*] TOM TAT BANG PHAN CUM K-MEANS ({kmeans_res['total_sentences']} cau ban dau -> {len(kmeans_res['selected_sentences'])} cau dai dien):")
        print("-" * 65)
        for idx, s in enumerate(kmeans_res['selected_sentences'], 1):
            print(f"  [{idx}] {s}")

    print("\n" + "-" * 65)
    print("[*] NOI DUNG TO DAM (Markdown):")
    print("-" * 65)
    print(f"    {highlighted_text}")

    if key_points:
        print("\n[*] CAC Y COT LOI BOC TACH DUOC:")
        for idx, pt in enumerate(key_points, 1):
            print(f"    {idx}. {pt}")

    print("=" * 65 + "\n")

def read_multiline_paste():
    """Hỗ trợ dán văn bản dài nhiều dòng cho đến khi gõ 'END'"""
    print("\n[CHE DO DAN VAN BAN DAI / BAI BAO]")
    print("-> Hay dan noi dung vao day. Dan xong, go chu 'END' o dong moi roi Enter:\n")
    lines = []
    while True:
        try:
            line = input()
            if line.strip().upper() == "END":
                break
            lines.append(line.replace('\r', ''))
        except (EOFError, KeyboardInterrupt):
            break
    return " ".join(lines).strip()

def main():
    print("=" * 65)
    print("CHUONG TRINH PHAN TICH & TOM TAT VAN BAN VOI MACHINE LEARNING")
    print("=" * 65)
    print("-> Nhap 1 cau ngan: Go cau roi Enter")
    print("-> Dan 1 bai bao dai: Go chu 'paste' roi Enter")
    print("-> Thoat: Nhap 'q' hoac 'exit'\n")

    while True:
        try:
            user_input = input("Nhap noi dung (hoac go 'paste'): ")
            user_input_clean = user_input.replace('\r', '').strip()
            if not user_input_clean:
                continue
            if user_input_clean.lower() in ['q', 'exit', 'quit']:
                print("\nTam biet ban!")
                break

            if user_input_clean.lower() == 'paste':
                long_text = read_multiline_paste()
                if long_text:
                    analyze_input(long_text, n_summary_sentences=3)
            else:
                analyze_input(user_input_clean, n_summary_sentences=3)

        except (KeyboardInterrupt, EOFError):
            print("\nDa dung chuong trinh.")
            break

if __name__ == "__main__":
    main()
