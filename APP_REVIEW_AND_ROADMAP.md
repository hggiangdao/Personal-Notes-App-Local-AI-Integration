# 📌 BÁO CÁO TỔNG QUAN & LỘ TRÌNH PHÁT TRIỂN ỨNG DỤNG

Tài liệu tóm tắt ngắn gọn trạng thái hiện tại của ứng dụng **Sổ Tay Ghi Chú Cá Nhân** và các đề xuất tính năng tiếp theo kèm lý do cụ thể.

---

## PHẦN 1: CÁC CHỨC NĂNG HIỆN CÓ & CÁCH HOẠT ĐỘNG

| Chức năng | Cách hoạt động | Trạng thái |
| :--- | :--- | :---: |
| **1. Đăng ký & Đăng nhập** | Người dùng tạo username/password. Dữ liệu được lưu độc lập trên MongoDB Atlas, mỗi người chỉ xem được ghi chú của mình. | ✅ Hoạt động tốt |
| **2. Thiết lập Tag lần đầu (Onboarding)** | Khi vừa đăng ký tài khoản mới (chưa có tag), app tự động bật popup yêu cầu chọn hoặc tự gõ các tag (`#Học tập`, `#Công việc`...). | ✅ Hoạt động tốt |
| **3. Tạo ghi chú đa thông tin** | Mỗi ghi chú gồm đủ 5 trường: **Loại Tag**, **Ngày ghi chú** (`YYYY-MM-DD`), **Tiêu đề**, **Nội dung**, và **7 màu sắc pastel**. | ✅ Hoạt động tốt |
| **4. Hiển thị & Đổi màu thẻ** | Ghi chú hiển thị dạng lưới thẻ (Cards) với đúng màu sắc đã chọn, giao diện trực quan và tự đổi màu chữ tương phản. | ✅ Hoạt động tốt |
| **5. Lọc Tag & Tìm kiếm tức thì** | Bấm vào từng Tag để lọc nhanh danh sách. Ô tìm kiếm lọc theo thời gian thực theo cả tiêu đề, nội dung và tag. | ✅ Hoạt động tốt |
| **6. Chỉnh sửa & Xóa** | Bấm ✏️ để sửa lại mọi thông tin, bấm 🗑️ để xóa ghi chú khỏi Database MongoDB. | ✅ Hoạt động tốt |
| **7. Quản lý Tag linh hoạt** | Nút *"🏷️ Quản Lý Tag"* trên góc phải cho phép thêm hoặc bớt các thẻ tag bất cứ lúc nào. | ✅ Hoạt động tốt |
| **8. Ghim ghi chú quan trọng (Pin to Top 📌)** | Bấm 📌 trực tiếp trên thẻ hoặc tích chọn khi tạo/sửa để luôn ưu tiên hiển thị ở khu vực **ĐÃ GHIM** trên cùng. | ✅ Hoạt động tốt |
| **9. 🪄 AI Tự Động Phân Loại Tag & Tô Đậm Ý Chính (In-House Python ML)** | Tự huấn luyện mô hình Scikit-Learn (TF-IDF + Naive Bayes) chạy trên Python Flask Microservice: Tự động đoán Tag (#Công việc, #Ý tưởng, #Học tập, #Cá nhân), tự chọn màu pastel, tự đặt tiêu đề và tự động **tô đậm các ý cốt lõi** (thời gian, deadline, việc làm). | ✅ Hoạt động xuất sắc (94-99% accuracy) |

---

## PHẦN 2: LỘ TRÌNH TIẾP THEO

### 🌟 Bước Kế Tiếp: "Khu Vườn Ý Tưởng" (Idea Garden & Semantic Recall Hub)
* **Mục tiêu:** Một không gian chuyên biệt để ươm mầm và lục tìm lại mọi ý tưởng công việc/học tập.
* **Cơ chế:**
  1. **Ươm mầm ý tưởng (Capture & Expand):** Nhập 1 dòng ý tưởng thô $\rightarrow$ AI gợi ý 3 bước triển khai nhanh.
  2. **Lục tìm ý tưởng theo ngữ nghĩa (Vector Search):** Chạy thuật toán Sentence Embeddings trên Python $\rightarrow$ Người dùng gõ câu hỏi tự nhiên để bốc đúng ý tưởng cũ ra màn hình mà không cần nhớ chính xác từ khóa.

