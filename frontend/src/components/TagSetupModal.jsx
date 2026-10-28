import React, { useState } from 'react';

const SUGGESTED_TAGS = [
  'Công việc',
  'Học tập',
  'Cá nhân',
  'Ý tưởng',
  'Tài chính',
  'Sức khỏe',
  'Mua sắm',
  'Dự án'
];

export default function TagSetupModal({ user, onTagsSaved, isFirstTime = false, onClose }) {
  const [tags, setTags] = useState(user.tags && user.tags.length > 0 ? user.tags : []);
  const [customTagInput, setCustomTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Thêm một tag vào danh sách
  const addTag = (tagToAdd) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
  };

  // Xóa một tag khỏi danh sách
  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    if (customTagInput.trim()) {
      addTag(customTagInput);
      setCustomTagInput('');
    }
  };

  const handleSave = async () => {
    if (tags.length === 0) {
      setErrorMsg('Vui lòng chọn hoặc thêm ít nhất 1 loại Tag để phân loại ghi chú.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id || user._id, tags })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi cập nhật danh sách tag.');
      }

      onTagsSaved(data.tags);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content tag-modal">
        <div className="modal-header">
          <div className="brand-icon">🏷️</div>
          <h2 className="modal-title">
            {isFirstTime ? 'Thiết Lập Các Loại Tag' : 'Quản Lý Danh Sách Tag'}
          </h2>
          <p className="modal-subtitle">
            {isFirstTime
              ? 'Lần đầu sử dụng: Hãy thêm các loại Tag mà bạn muốn dùng để phân loại ghi chú của mình.'
              : 'Thêm hoặc bớt các thẻ phân loại ghi chú của bạn.'}
          </p>
        </div>

        {errorMsg && <div className="alert-box error">{errorMsg}</div>}

        {/* Danh sách các tag hiện tại đã chọn */}
        <div className="tags-container">
          <label className="section-label">Danh sách Tag của bạn ({tags.length}):</label>
          {tags.length === 0 ? (
            <div className="empty-tags-hint">
              Chưa có Tag nào. Hãy bấm các gợi ý bên dưới hoặc tự gõ Tag mới!
            </div>
          ) : (
            <div className="tags-badge-list">
              {tags.map((t) => (
                <span key={t} className="tag-badge active">
                  #{t}
                  <button
                    type="button"
                    className="tag-remove-btn"
                    onClick={() => removeTag(t)}
                    title="Xóa tag này"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gợi ý các tag phổ biến */}
        <div className="suggestions-container">
          <label className="section-label">Gợi ý tag phổ biến (Bấm để thêm nhanh):</label>
          <div className="tags-badge-list">
            {SUGGESTED_TAGS.map((sug) => {
              const isSelected = tags.includes(sug);
              return (
                <button
                  key={sug}
                  type="button"
                  className={`tag-badge suggestion ${isSelected ? 'disabled' : ''}`}
                  onClick={() => addTag(sug)}
                  disabled={isSelected}
                >
                  + {sug}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ô tự gõ thêm tag riêng */}
        <form onSubmit={handleAddCustomTag} className="custom-tag-form">
          <input
            type="text"
            placeholder="Tự gõ thêm tag mới (VD: Du lịch, Nấu ăn...)"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
          />
          <button type="submit" className="btn-add-tag">
            + Thêm
          </button>
        </form>

        <div className="modal-actions">
          {!isFirstTime && onClose && (
            <button type="button" className="btn-cancel" onClick={onClose}>
              Đóng
            </button>
          )}
          <button
            type="button"
            className="btn-submit"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : isFirstTime ? 'Xác Nhận & Bắt Đầu Ghi Chú' : 'Lưu Danh Sách Tag'}
          </button>
        </div>
      </div>
    </div>
  );
}
