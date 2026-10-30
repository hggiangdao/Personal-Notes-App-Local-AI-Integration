// Cấu hình URL Backend
// Nếu chạy local (dev), API_BASE_URL là '' (để dùng proxy trong vite.config.js)
// Khi deploy lên Vercel, giá trị sẽ lấy từ biến môi trường VITE_API_URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
