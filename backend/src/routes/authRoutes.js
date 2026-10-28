import { Router } from 'express';
import { User } from '../models/User.js';

const router = Router();

// 1. Đăng ký tài khoản mới
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp cả Tên đăng nhập và Mật khẩu.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Tên đăng nhập phải có ít nhất 3 ký tự.'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có ít nhất 4 ký tự.'
      });
    }

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.'
      });
    }

    const newUser = await User.create({
      username: cleanUsername,
      password: password, // Simple auth for demo
      tags: [] // Chưa có tag -> sẽ kích hoạt bước Onboarding lần đầu
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: {
        id: newUser._id,
        username: newUser.username,
        tags: newUser.tags
      }
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi đăng ký.'
    });
  }
});

// 2. Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập Tên đăng nhập và Mật khẩu.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
      });
    }

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        id: user._id,
        username: user.username,
        tags: user.tags
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi đăng nhập.'
    });
  }
});

// 3. Cập nhật danh sách Tag của người dùng (khi Onboarding lần đầu hoặc thêm tag mới)
router.put('/tags', async (req, res) => {
  try {
    const { userId, tags } = req.body;

    if (!userId || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu userId hoặc danh sách tags không hợp lệ.'
      });
    }

    // Làm sạch danh sách tag (loại bỏ trùng lặp và khoảng trắng)
    const cleanTags = [...new Set(tags.map(t => String(t).trim()).filter(Boolean))];

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { tags: cleanTags },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng.'
      });
    }

    return res.json({
      success: true,
      message: 'Cập nhật danh sách Tag thành công!',
      tags: updatedUser.tags
    });
  } catch (error) {
    console.error('Lỗi cập nhật tags:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi cập nhật tags.'
    });
  }
});

// 4. Lấy thông tin user hiện tại
router.get('/me/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User không tồn tại.' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
