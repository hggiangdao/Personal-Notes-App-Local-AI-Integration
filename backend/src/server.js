import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'Personal Notes API',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Notes Backend đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 API Auth:  http://localhost:${PORT}/api/auth`);
  console.log(`📡 API Notes: http://localhost:${PORT}/api/notes`);
  console.log(`====================================================`);
});
