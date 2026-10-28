import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/personal_notes';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ Kết nối MongoDB thành công: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
    console.log(`💡 Mẹo: Hãy kiểm tra xem MongoDB Server (Compass hoặc Service) đang chạy chưa.`);
    return false;
  }
}
