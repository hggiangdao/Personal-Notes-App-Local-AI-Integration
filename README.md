# 📒 Sổ Tay Ghi Chú Cá Nhân (Personal Notes App)

Hệ thống sổ tay ghi chú cá nhân Full-Stack xây dựng với **React (Vite)**, **Node.js (Express)**, **MongoDB (Mongoose)** và **Python AI Microservice (Flask)**.

> [!NOTE]
> **Về kiến trúc xử lý thông minh & AI:**
> Hệ thống hiện tại **hoàn toàn KHÔNG phụ thuộc vào Cloud API bên ngoài** (như OpenAI ChatGPT, Google Gemini API, Claude API,...). Các tính năng thông minh được vận hành bởi cơ chế **Tự động nhận diện (Self-Detection)** và **Mô hình Học máy Cục bộ (Local Machine Learning)**:
> * **100% Cục bộ (Local & Offline):** Không yêu cầu API Key bên thứ ba, không phát sinh chi phí token.
> * **Tốc độ xử lý tức thì:** Phản hồi dưới 50ms ngay trên máy chủ nội bộ.
> * **Bảo mật dữ liệu cá nhân:** Nội dung ghi chú được lưu trữ và xử lý hoàn toàn cục bộ, không gửi ra internet.

---

## 🌟 Tính Năng Nổi Bật

### 1. Quản lý ghi chú cá nhân
* 🔐 **Xác thực người dùng:** Đăng ký và đăng nhập bảo mật, phân tách dữ liệu độc lập theo từng tài khoản trên MongoDB.
* 🏷️ **Thiết lập Tag linh hoạt:** Hỗ trợ quy trình Onboarding gợi ý tag lần đầu và cho phép tùy biến danh mục thẻ tag (`#Công việc`, `#Học tập`, `#Ý tưởng`, `#Cá nhân`,...).
* 📝 **Soạn thảo đa thông tin:**
  * **Phân loại Tag:** Gắn thẻ phân loại nhanh chóng.
  * **Ngày ghi chú:** Hỗ trợ lưu trữ theo dòng thời gian (`YYYY-MM-DD`).
  * **Tiêu đề & Nội dung:** Soạn thảo văn bản tự do, hỗ trợ định dạng danh sách công việc `[ ]` và xuống dòng linh hoạt.
  * **Bảng màu trực quan:** 7 tông màu pastel dịu mắt (Vàng kem, Xanh mint, Xanh da trời, Tím lavender, Hồng phấn, Cam đào, Xám ghi).
* 📌 **Ghim ưu tiên (Pin to Top):** Đưa các ghi chú quan trọng lên đầu danh sách chỉ với 1 click.
* 🔍 **Lọc & Tìm kiếm thời gian thực:** Lọc danh sách theo từng Tag hoặc tìm kiếm tức thì theo tiêu đề, nội dung.
* ✏️ **Chỉnh sửa & Xóa:** Hỗ trợ cập nhật toàn diện thông tin thẻ và đồng bộ cơ sở dữ liệu.

### 2. 🪄 Cơ Chế Tự Động Nhận Diện (Self-Detection & Local In-House ML)
Khi người dùng soạn thảo ghi chú hoặc kích hoạt chức năng **"🪄 Phân tích AI"**:
* 🔤 **Chuẩn hóa gõ nhanh & viết tắt tiếng Việt (Rule-based NLP):**
  * Tự động phát hiện và chuẩn hóa lỗi gõ Telex nhanh hoặc từ viết tắt phổ biến: `mau đồ ăn` $\rightarrow$ `mua đồ ăn`, `ko` $\rightarrow$ `không`, `dc`/`đk` $\rightarrow$ `được`, `hnay` $\rightarrow$ `hôm nay`, `cv` $\rightarrow$ `công việc`, `bcao` $\rightarrow$ `báo cáo`,...
* 📋 **Tự động trích xuất công việc & tạo Checklist:**
  * Phân tích các động từ hành động (`chuẩn bị`, `kiểm tra`, `gửi`, `nộp`, `hoàn thành`,...), vai trò/người phụ trách và mốc thời gian/deadline.
  * Tự động tái cấu trúc văn bản thô thành danh sách đầu việc `[ ] Checklist` ngăn nắp.
* 🏷️ **Phân loại Tag & Gợi ý màu sắc (Local Scikit-Learn Model):**
  * Ứng dụng mô hình phân loại văn bản **TF-IDF Vectorizer + Logistic Regression / Multinomial Naive Bayes** chạy offline trong Python để dự đoán nhãn Tag phù hợp (`#Công việc`, `#Ý tưởng`, `#Học tập`, `#Cá nhân`).
  * Tự động liên kết và đề xuất mã màu pastel tương ứng với Tag dự đoán.
* ✍️ **Trích xuất tiêu đề ngắn gọn:**
  * Tự động bóc tách hành động trọng tâm và đối tượng chính, lược bỏ các trạng từ thời gian hoặc câu rườm rà mở đầu.
* 📑 **Tóm tắt văn bản dài (K-Means Clustering):**
  * Với các tài liệu dài, thuật toán phân cụm không giám sát K-Means phân tích không gian vector câu và trích xuất 3 câu đại diện mang hàm lượng thông tin cao nhất.

---

## 📁 Cấu Trúc Thư Mục

```
ai/
├── ai-service/                       # Microservice Tự Detect & Local ML (Python Flask)
│   ├── data/
│   │   └── training_data.json        # Tập dữ liệu mẫu huấn luyện bộ phân loại Tag
│   ├── models/                       # File mô hình Scikit-Learn đã huấn luyện (.pkl)
│   │   ├── vectorizer.pkl            # TF-IDF Vectorizer
│   │   └── tag_classifier.pkl        # Classifier phân loại Tag
│   ├── personal_normalizer.py        # Module Rule-based regex: Chuẩn hóa telex, trích xuất checklist
│   ├── summarizer.py                 # Module trích xuất tiêu đề ngắn gọn
│   ├── highlighter.py                # Module nhận diện thực thể & tô đậm ý chính
│   ├── kmeans_summarizer.py          # Module tóm tắt trích xuất câu bằng K-Means Clustering
│   ├── train_model.py                # Script huấn luyện mô hình phân loại Tag
│   ├── app.py                        # Flask API Server (Port 5001)
│   └── requirements.txt              # Danh sách thư viện Python
│
├── backend/                          # Máy chủ Node.js & Express
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Kết nối MongoDB
│   │   ├── models/
│   │   │   ├── User.js               # Schema User (username, password, tags)
│   │   │   └── Note.js               # Schema Note (userId, tag, noteDate, title, content, color, isPinned)
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # API Đăng ký, Đăng nhập, Cập nhật Tag
│   │   │   ├── noteRoutes.js         # API CRUD Ghi chú & Ghim
│   │   │   └── aiRoutes.js           # Proxy chuyển tiếp request sang Python AI Service
│   │   └── server.js                 # Khởi chạy Express Server (Port 5000)
│   ├── .env                          # Biến môi trường (PORT, MONGO_URI, AI_SERVICE_URL)
│   └── package.json
│
├── frontend/                         # Giao diện người dùng React (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx         # Giao diện Đăng nhập & Đăng ký
│   │   │   ├── TagSetupModal.jsx     # Giao diện Thiết lập & Quản lý Tag
│   │   │   ├── NoteModal.jsx         # Giao diện Tạo/Sửa ghi chú & Tích hợp Tự Detect
│   │   │   └── NoteCard.jsx          # Thẻ hiển thị ghi chú theo màu pastel
│   │   ├── App.jsx                   # Component điều phối chính
│   │   ├── App.css                   # Giao diện hiện đại & responsive
│   │   ├── index.css                 # CSS reset, tokens & backdrop
│   │   └── main.jsx
│   ├── vite.config.js             # Cấu hình proxy tự động sang backend (Port 3000)
│   └── package.json
│
├── package.json                      # Quản lý script điều khiển toàn bộ dự án
└── README.md
```

---

## 🛠️ Yêu Cầu Môi Trường

* **Node.js:** Phiên bản 18+ (khuyến nghị v20.x trở lên).
* **MongoDB:** Phiên bản 6.0+ (MongoDB Community Server cục bộ tại `mongodb://127.0.0.1:27017` hoặc MongoDB Atlas).
* **Python:** Phiên bản 3.9+ (phục vụ module tự detect và machine learning).

---

## 🚀 Hướng Dẫn Cài Đặt & Vận Hành

### Bước 1: Cài đặt Dependencies

Mở terminal tại thư mục gốc của dự án:

```powershell
# Cài đặt thư viện cho Backend và Frontend
npm run install:all

# Cài đặt thư viện cho Python AI Service
npm run install:ai
```
*(Hoặc sử dụng lệnh: `pip install -r ai-service/requirements.txt`)*

### Bước 2: Huấn luyện mô hình phân loại Tag (Tùy chọn)

Mô hình đã được huấn luyện sẵn và lưu tại thư mục `ai-service/models/`. Để cập nhật dữ liệu hoặc huấn luyện lại:
```powershell
npm run train:ai
```

### Bước 3: Khởi chạy hệ thống

Mở **3 cửa sổ Terminal** tại thư mục gốc của dự án:

* **Terminal 1 - Dịch vụ Tự Detect / Python AI:**
  ```powershell
  npm run ai
  ```
  Endpoint hoạt động tại: **http://localhost:5001**

* **Terminal 2 - Máy chủ Backend Express:**
  ```powershell
  npm run server
  ```
  API hoạt động tại: **http://localhost:5000**

* **Terminal 3 - Giao diện Frontend React:**
  ```powershell
  npm run client
  ```
  Truy cập ứng dụng tại: **http://localhost:3000**

---

## 📡 Danh Sách API Hệ Thống

### 1. Xác thực & Tài khoản (`/api/auth`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới (`username`, `password`) |
| `POST` | `/api/auth/login` | Đăng nhập tài khoản |
| `PUT` | `/api/auth/tags` | Cập nhật danh sách loại Tag của người dùng |
| `GET` | `/api/auth/me/:userId` | Truy xuất thông tin người dùng và danh sách tag mới nhất |

### 2. Ghi chú cá nhân (`/api/notes`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/notes?userId=...&tag=...` | Truy xuất danh sách ghi chú (ưu tiên ghi chú đã ghim) |
| `POST` | `/api/notes` | Tạo mới ghi chú (`userId`, `tag`, `noteDate`, `title`, `content`, `color`, `isPinned`) |
| `PUT` | `/api/notes/:id` | Cập nhật toàn bộ thông tin ghi chú theo ID |
| `PATCH` | `/api/notes/:id/pin` | Bật/tắt ghim ghi chú |
| `DELETE` | `/api/notes/:id` | Xóa vĩnh viễn ghi chú theo ID |

### 3. Phân tích & Tự Động Nhận Diện (`/api/ai`)
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/ai/status` | Kiểm tra tình trạng hoạt động của Python Microservice |
| `POST` | `/api/ai/analyze-note` | Nhận diện văn bản: Bóc tách checklist, dự đoán Tag, gợi ý màu và trích xuất tiêu đề |

---

## 🔮 Định Hướng Tích Hợp Cloud AI API

Kiến trúc hiện tại tối ưu cho tốc độ và tính riêng tư thông qua xử lý cục bộ. Khi phát triển các tính năng sinh nội dung tự do phức tạp hơn, hệ thống sẵn sàng tích hợp thêm các dịch vụ Cloud LLM (Google Gemini API / OpenAI API):

1. **Trợ lý hỏi đáp ghi chú (Chat with Notes):** Áp dụng kỹ thuật RAG (Retrieval-Augmented Generation) để truy vấn thông tin thông minh trên toàn bộ cơ sở dữ liệu ghi chú.
2. **Mở rộng ý tưởng sáng tạo (Brainstorming Partner):** Hỗ trợ gợi ý giải pháp và dàn ý chi tiết từ các ý tưởng sơ khai.
3. **Đa ngôn ngữ hóa:** Tự động biên dịch và tinh chỉnh văn phong ghi chú theo ngữ cảnh chuyên nghiệp.
