import express from 'express';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

/**
 * GET /api/ai/status
 * Kiểm tra trạng thái hoạt động của Python AI Microservice
 */
router.get('/status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${AI_SERVICE_URL}/api/status`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await response.json();
    return res.json({
      success: true,
      aiEngine: 'Python Scikit-Learn NLP Microservice',
      serviceStatus: data
    });
  } catch (error) {
    return res.json({
      success: false,
      aiEngine: 'Python Scikit-Learn NLP Microservice',
      message: 'AI Microservice hiện chưa khởi động hoặc không phản hồi.',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/analyze-note
 * Phân tích nội dung ghi chú: Tự động đoán Tag, gợi ý màu sắc & tô đậm điểm cốt lõi
 */
router.post('/analyze-note', async (req, res) => {
  try {
    const { content, title, availableTags } = req.body;

    if (!content && !title) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung hoặc tiêu đề để AI phân tích.'
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${AI_SERVICE_URL}/api/analyze-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, title, availableTags }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json(errData);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Lỗi khi kết nối tới Python AI Service:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Không thể kết nối tới Python AI Service. Vui lòng đảm bảo `python app.py` trong thư mục `ai-service/` đang chạy.',
      error: error.message
    });
  }
});

export default router;
