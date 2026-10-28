import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances_argmin_min

def split_into_sentences(text: str) -> list:
    """Tách văn bản tiếng Việt thành danh sách các câu đơn lẻ"""
    # Chuẩn hóa khoảng trắng & xuống dòng
    clean_text = text.replace('\r\n', '\n').strip()
    
    # Tách câu theo dấu chấm, chấm hỏi, chấm than, dấu ba chấm hoặc xuống dòng
    raw_sentences = re.split(r'(?<=[.?!…\n])\s+', clean_text)
    
    # Lọc bỏ các câu quá ngắn hoặc rỗng
    sentences = []
    for s in raw_sentences:
        s_clean = s.strip()
        if len(s_clean) >= 15:
            sentences.append(s_clean)
            
    return sentences

def summarize_with_kmeans(text: str, n_sentences: int = 3) -> dict:
    """
    Thuật toán tóm tắt văn bản rút trích (Extractive Summarization) 
    bằng Machine Learning K-Means Clustering:
    
    1. Tiền xử lý & Tách các câu trong văn bản.
    2. Vector hóa từng câu bằng TF-IDF (Unigram & Bigram).
    3. Phân cụm các câu có ngữ nghĩa tương đồng bằng K-Means (k = n_sentences).
    4. Chọn 1 câu đại diện duy nhất gần tâm cụm nhất (Centroid).
    5. Sắp xếp lại các câu đại diện theo đúng trình tự thời gian ban đầu của văn bản.
    """
    sentences = split_into_sentences(text)
    total_sentences = len(sentences)
    
    # Nếu văn bản ngắn (<= số câu yêu cầu tóm tắt), không cần phân cụm
    if total_sentences <= n_sentences:
        return {
            "is_summarized": False,
            "total_sentences": total_sentences,
            "selected_sentences": sentences,
            "summary_text": " ".join(sentences)
        }
        
    # 1. Chuyển các câu sang vector số thực (TF-IDF Vector Space)
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1
    )
    X = vectorizer.fit_transform(sentences)
    
    # 2. Phân cụm bằng K-Means Unsupervised Learning
    k = min(n_sentences, total_sentences)
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X)
    
    # 3. Lấy câu có khoảng cách gần trung tâm cụm nhất
    closest, _ = pairwise_distances_argmin_min(kmeans.cluster_centers_, X)
    
    # 4. Sắp xếp lại theo thứ tự xuất hiện ban đầu trong bài viết
    ordering = sorted(set(closest))
    selected_sentences = [sentences[idx] for idx in ordering]
    summary_text = " ".join(selected_sentences)
    
    return {
        "is_summarized": True,
        "total_sentences": total_sentences,
        "n_clusters": k,
        "selected_indices": ordering,
        "selected_sentences": selected_sentences,
        "summary_text": summary_text
    }

if __name__ == "__main__":
    sample_article = """
    Tất cả bánh xu xê đều có hàn the.
    Bánh xu xê đang bị phường Nguyễn Trung Trực (Ba Đình, Hà Nội) cấm bán vì việc sản xuất bắt buộc phải dùng hàn the. Tuy nhiên, các cửa hàng trên phố Hàng Than vẫn làm bánh này khi có khách đặt mua làm lễ ăn hỏi. Trong buổi kiểm tra vệ sinh thực phẩm sáng 1/4, Sở Y tế Hà Nội đã phát hiện hàn the - chất bị cấm dùng trong thức ăn - trong mẻ bánh xu xê 100 cái của cửa hàng Hồng Ninh, 79 Hàng Than. Mảnh giấy quỳ ngả màu đỏ sẫm chứng tỏ hàm lượng hàn the rất cao. Theo bà chủ cửa hàng, vài tháng nay khi phường Nguyễn Trung Trực cấm bán bánh xu xê, bà không bày bán mặt hàng này nữa, trừ khi có khách đặt cho đám cưới đám hỏi. Tuy biết hàn the là chất bị cấm nhưng bà vẫn phải dùng vì chất phụ gia thay thế hàn the không làm được bánh xu xê.
    Ông Nguyễn Trọng Nghĩa, Phó chủ tịch UBND phường, giải thích: Chất phụ gia thay thế hàn the mà ngành y tế cho phép sử dụng tuy rất hiệu quả khi dùng sản xuất giò chả, bánh giò... nhưng nếu dùng sản xuất bánh xu xê thì không đạt yêu cầu. Bánh xu xê làm từ chất phụ gia này không đủ độ trong, độ dai và không bảo quản được lâu, chỉ để khoảng 2 ngày là chảy nước. Do muốn sản xuất bánh xu xê thì bắt buộc dùng hàn the nên để ngăn ngừa nguy cơ từ chất này đối với sức khỏe, từ vài tháng nay phường Nguyễn Trung Trực đã cấm sản xuất và bán bánh này. Hầu như không cửa hàng nào bày bán nữa nhưng nếu có khách đặt thì vẫn nhận.
    Ông Lê Anh Tuấn, Giám đốc Sở Y tế, cho biết sẽ đề nghị các cơ quan nghiên cứu tìm ra một chất phụ gia mới an toàn mà vẫn đảm bảo các yêu cầu về độ ngon miệng, thời hạn bảo quản của bánh xu xê.
    """
    
    res = summarize_with_kmeans(sample_article, n_sentences=3)
    print(f"Tổng số câu ban đầu: {res['total_sentences']}")
    print(f"Tóm tắt còn: {len(res['selected_sentences'])} câu (K-Means clusters = {res['n_clusters']})")
    print("\n--- CÁC CÂU ĐƯỢC CHỌN ĐẠI DIỆN ---")
    for i, s in enumerate(res['selected_sentences'], 1):
        print(f"[{i}] {s}\n")
