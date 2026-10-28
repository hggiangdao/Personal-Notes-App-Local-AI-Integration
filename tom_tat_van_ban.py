import sys
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances_argmin_min

# Đảm bảo in tiếng Việt chuẩn trên Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stdin, 'reconfigure'):
    sys.stdin.reconfigure(encoding='utf-8')

# -------------------------------------------------------------
# DỮ LIỆU MẪU TỪ BÀI VIẾT VIBLO
# -------------------------------------------------------------
MAU_BANH_XU_XE = """Bánh xu xê đang bị phường Nguyễn Trung Trực (Ba Đình, Hà Nội) cấm bán vì việc sản xuất bắt buộc phải dùng hàn the. Tuy nhiên, các cửa hàng trên phố Hàng Than vẫn làm bánh này khi có khách đặt mua làm lễ ăn hỏi. Trong buổi kiểm tra vệ sinh thực phẩm sáng 1/4, Sở Y tế Hà Nội đã phát hiện hàn the - chất bị cấm dùng trong thức ăn - trong mẻ bánh xu xê 100 cái của cửa hàng Hồng Ninh, 79 Hàng Than. Mảnh giấy quỳ ngả màu đỏ sẫm chứng tỏ hàm lượng hàn the rất cao. Theo bà chủ cửa hàng, vài tháng nay khi phường Nguyễn Trung Trực cấm bán bánh xu xê, bà không bày bán mặt hàng này nữa, trừ khi có khách đặt cho đám cưới đám hỏi. Tuy biết hàn the là chất bị cấm nhưng bà vẫn phải dùng vì chất phụ gia thay thế hàn the không làm được bánh xu xê.
Ông Nguyễn Trọng Nghĩa, Phó chủ tịch UBND phường, giải thích: Chất phụ gia thay thế hàn the mà ngành y tế cho phép sử dụng tuy rất hiệu quả khi dùng sản xuất giò chả, bánh giò... nhưng nếu dùng sản xuất bánh xu xê thì không đạt yêu cầu. Bánh xu xê làm từ chất phụ gia này không đủ độ trong, độ dai và không bảo quản được lâu, chỉ để khoảng 2 ngày là chảy nước. Do muốn sản xuất bánh xu xê thì bắt buộc dùng hàn the nên để ngăn ngừa nguy cơ từ chất này đối với sức khỏe, từ vài tháng nay phường Nguyễn Trung Trực đã cấm sản xuất và bán bánh này. Hầu như không cửa hàng nào bày bán nữa nhưng nếu có khách đặt thì vẫn nhận. Theo ông Nghĩa, cấm bán bánh xu xê là một hạ sách, là điều cực chẳng đã vì đây là một mặt hàng truyền thống của phường và rất cần thiết cho lễ ăn hỏi theo phong tục Việt Nam. Tuy nhiên, hiện phường chưa có cách nào để vẫn duy trì mặt hàng này mà không ảnh hưởng đến sức khỏe người dân. Ông Lê Anh Tuấn, Giám đốc Sở Y tế, cho biết sẽ đề nghị các cơ quan nghiên cứu tìm ra một chất phụ gia mới an toàn mà vẫn đảm bảo các yêu cầu về độ ngon miệng, thời hạn bảo quản của bánh xu xê."""

MAU_CONG_SO = """Công sở đậm dư âm Tết trong ngày đầu làm việc. Trong lịch công tác của các bộ ngành 3 ngày đầu năm hầu như không có những cuộc họp. Chương trình làm việc chính của các lãnh đạo là chúc Tết. Một số nơi còn ghi lịch làm việc: lãnh đạo giải quyết công việc thường xuyên tại cơ quan. 9h sáng, hội trường Bộ Giáo dục và Đào tạo rộn tiếng cười đùa, chúc tụng, tiếng ly rượu cụng nhau chan chát. Sau đó các vụ, phòng bắt đầu những cuộc gặp gỡ riêng. Buổi làm việc đầu năm kết thúc sớm, với bữa tiệc tân niên tại gia. Năm qua, người thì xây nhà mới, người thì có con đầu lòng. Đầu xuân, mọi người trong phòng đến nhà nhau, vừa chúc Tết, thăm hỏi luôn. Hôm nay ai có việc gấp quá thì phải làm nhưng ít người như thế lắm. Cả sếp và nhân viên công ty tôi đều đi chúc Tết. Chúc Tết các phòng xong, chúng tôi đang triệu nhau đến thăm nhà mấy người đồng nghiệp, bạn bè gần đây. Rộn ràng trong công sở, không khí xuân còn tràn ngập quanh các hàng quán cà phê. 9h sáng, nhưng các hàng quán trên đường Lý Tự Trọng vẫn khá đông công chức. Họ kể chuyện chơi Tết, chúc tụng, trao lì xì cho nhau và vui vẻ cười đùa. Anh em mời nhau đến nhà chơi, đi làm muộn một chút mình cũng phải thông cảm, quy định cứng nhắc quá thì mất vui."""

def summarize_text(raw_text: str, n_clusters: int = 3):
    """
    Tóm tắt văn bản bằng 5 bước Machine Learning chuẩn theo bài viết:
    Bước 1: Tiền xử lý văn bản
    Bước 2: Tách câu
    Bước 3: Chuyển câu sang vector số thực (TF-IDF Vectorizer)
    Bước 4: Phân cụm K-Means
    Bước 5: Chọn câu gần tâm cụm nhất và ghép lại thành bản tóm tắt
    """
    if not raw_text or not raw_text.strip():
        print("Lỗi: Văn bản trống!")
        return

    # BƯỚC 1: Tiền xử lý văn bản
    # Chuyển về chữ thường, thay đổi xuống dòng thành dấu chấm, bỏ khoảng trắng thừa
    contents_parsed = raw_text.strip().replace('\r', ' ').replace('\n', '. ')
    contents_parsed = re.sub(r'\s+', ' ', contents_parsed)

    # BƯỚC 2: Tách các câu trong văn bản
    # Sử dụng Regex tách theo các dấu ngắt câu (. ? ! …)
    raw_sentences = re.split(r'(?<=[.?!…])\s+', contents_parsed)
    sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 15]

    total_sentences = len(sentences)
    if total_sentences == 0:
        print("Lỗi: Không tìm thấy câu nào có nghĩa trong văn bản.")
        return

    print(f"\n-> Tong so cau trong van ban goc: {total_sentences} cau")

    # Giới hạn số cụm không vượt quá số câu
    actual_k = min(n_clusters, total_sentences)
    if total_sentences <= actual_k:
        print("Van ban qua ngan, giu nguyen toan bo cau:")
        for i, s in enumerate(sentences, 1):
            print(f"[{i}] {s}")
        return

    # BƯỚC 3: Chuyển các câu sang vector số thực
    # Sử dụng TF-IDF để mã hóa ngữ nghĩa đặc trưng của từng câu
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    X = vectorizer.fit_transform(sentences)
    print(f"-> Ma tran vector hoa: {X.shape[0]} cau x {X.shape[1]} dac trung tu")

    # BƯỚC 4: Phân cụm K-Means
    kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init=10)
    kmeans.fit(X)
    print(f"-> Da phan {total_sentences} cau thanh {actual_k} cum y nghia")

    # BƯỚC 5: Chọn câu đại diện gần tâm cụm nhất
    closest, _ = pairwise_distances_argmin_min(kmeans.cluster_centers_, X)

    # Sắp xếp lại các câu theo thứ tự xuất hiện ban đầu trong bài viết
    ordering = sorted(set(closest))

    print("\n" + "=" * 70)
    print(f"KET QUA TOM TAT MACHINE LEARNING (K-MEANS CLUSTERING - {actual_k} CAU):")
    print("=" * 70)
    for idx, sent_idx in enumerate(ordering, 1):
        print(f"\n[Cau {idx}]: {sentences[sent_idx]}")

    print("\n" + "-" * 70)
    print("DOAN VAN TOM TAT HOAN CHINH:")
    print("-" * 70)
    summary_paragraph = " ".join([sentences[idx] for idx in ordering])
    print(summary_paragraph)
    print("=" * 70 + "\n")

def main():
    while True:
        print("\n" + "=" * 65)
        print("CHUONG TRINH TOM TAT VAN BAN BANG MACHINE LEARNING (K-MEANS)")
        print("Theo phuong phap: Tach cau -> Vector hoa -> KMeans -> Centroid")
        print("=" * 65)
        print("[1] Chay thu bai mau: 'Banh xu xe co han the' (Tu bai bao Viblo)")
        print("[2] Chay thu bai mau: 'Cong so ngay dau lam viec sau Tet'")
        print("[3] Tu dan van ban bat ky cua ban vao de tom tat")
        print("[0] Thoat chuong trinh")
        print("-" * 65)

        choice = input("Chon che do (0, 1, 2, 3): ").strip()

        if choice == '0':
            print("Tam biet ban!")
            break
        elif choice == '1':
            print("\n>>> DANG TOM TAT BAI BAO 'BANH XU XE' (k = 3 cau)...")
            summarize_text(MAU_BANH_XU_XE, n_clusters=3)
        elif choice == '2':
            print("\n>>> DANG TOM TAT BAI BAO 'CONG SO NGAY TET' (k = 3 cau)...")
            summarize_text(MAU_CONG_SO, n_clusters=3)
        elif choice == '3':
            print("\nDan van ban cua ban vao day. Khi dan xong, go chu 'END' o dong moi roi Enter:")
            lines = []
            while True:
                try:
                    line = input()
                    if line.strip().upper() == "END":
                        break
                    lines.append(line)
                except (EOFError, KeyboardInterrupt):
                    break
            user_text = "\n".join(lines).strip()
            if user_text:
                num_k = input("Ban muon tom tat thanh may cau (mac dinh la 3): ").strip()
                k = int(num_k) if num_k.isdigit() and int(num_k) > 0 else 3
                summarize_text(user_text, n_clusters=k)
            else:
                print("Chua co van ban nao duoc nhap!")

if __name__ == "__main__":
    main()
