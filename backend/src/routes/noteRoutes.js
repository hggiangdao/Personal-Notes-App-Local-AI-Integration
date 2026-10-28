import { Router } from 'express';
import { Note } from '../models/Note.js';

const router = Router();

// 1. Lấy tất cả ghi chú của một User (có hỗ trợ lọc theo Tag)
router.get('/', async (req, res) => {
  try {
    const { userId, tag } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp userId để lấy ghi chú.'
      });
    }

    const filter = { userId };
    if (tag && tag !== 'ALL') {
      filter.tag = tag;
    }

    const notes = await Note.find(filter).sort({ isPinned: -1, noteDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách ghi chú:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi lấy ghi chú.'
    });
  }
});

// 2. Tạo một ghi chú mới (đầy đủ Tag, Ngày, Tiêu đề, Nội dung, Màu sắc, Trạng thái ghim)
router.post('/', async (req, res) => {
  try {
    const { userId, tag, noteDate, title, content, color, isPinned } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin userId.' });
    }
    if (!tag) {
      return res.status(400).json({ success: false, error: 'Vui lòng chọn loại Tag cho ghi chú.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập tiêu đề ghi chú.' });
    }

    const newNote = await Note.create({
      userId,
      tag: tag.trim(),
      noteDate: noteDate || new Date().toISOString().split('T')[0],
      title: title.trim(),
      content: content || '',
      color: color || '#fef08a',
      isPinned: Boolean(isPinned)
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo ghi chú mới thành công!',
      data: newNote
    });
  } catch (error) {
    console.error('Lỗi tạo ghi chú:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi tạo ghi chú.'
    });
  }
});

// 3. Chỉnh sửa một ghi chú
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tag, noteDate, title, content, color, isPinned } = req.body;

    const updatedNote = await Note.findByIdAndUpdate(
      id,
      {
        ...(tag && { tag: tag.trim() }),
        ...(noteDate && { noteDate }),
        ...(title && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(color && { color }),
        ...(typeof isPinned === 'boolean' && { isPinned })
      },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy ghi chú để sửa.' });
    }

    return res.json({
      success: true,
      message: 'Cập nhật ghi chú thành công!',
      data: updatedNote
    });
  } catch (error) {
    console.error('Lỗi cập nhật ghi chú:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi cập nhật ghi chú.'
    });
  }
});

// 4. Ghim / Bỏ ghim ghi chú nhanh
router.patch('/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy ghi chú để ghim.' });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    return res.json({
      success: true,
      message: note.isPinned ? 'Đã ghim ghi chú lên đầu!' : 'Đã bỏ ghim ghi chú!',
      data: note
    });
  } catch (error) {
    console.error('Lỗi khi ghim/bỏ ghim ghi chú:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi ghim ghi chú.'
    });
  }
});

// 5. Xóa một ghi chú
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);

    if (!deletedNote) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy ghi chú để xóa.' });
    }

    return res.json({
      success: true,
      message: 'Đã xóa ghi chú thành công!'
    });
  } catch (error) {
    console.error('Lỗi xóa ghi chú:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi server khi xóa ghi chú.'
    });
  }
});

export default router;
