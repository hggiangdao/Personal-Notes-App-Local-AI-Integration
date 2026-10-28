import React, { useState, useEffect } from 'react';

export const NOTE_COLORS = [
  { name: 'Vàng kem', value: '#fef08a', textDark: true },
  { name: 'Xanh mint', value: '#bbf7d0', textDark: true },
  { name: 'Xanh da trời', value: '#bae6fd', textDark: true },
  { name: 'Tím lavender', value: '#ddd6fe', textDark: true },
  { name: 'Hồng phấn', value: '#fbcfe8', textDark: true },
  { name: 'Cam đào', value: '#fed7aa', textDark: true },
  { name: 'Xám thanh lịch', value: '#334155', textDark: false },
];

export default function NoteModal({
  user,
  existingNote = null,
  onSaveSuccess,
  onClose
}) {
  const isEditing = Boolean(existingNote && existingNote._id);

  // Form states
  const [tag, setTag] = useState(
    existingNote?.tag || (user.tags && user.tags.length > 0 ? user.tags[0] : '')
  );
  const [noteDate, setNoteDate] = useState(
    existingNote?.noteDate || new Date().toISOString().split('T')[0]
  );
  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [color, setColor] = useState(existingNote?.color || NOTE_COLORS[0].value);
  const [isPinned, setIsPinned] = useState(existingNote?.isPinned || false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Trạng thái AI tự động phân tích
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Hàm gọi AI phân tích nội dung
  const handleAnalyzeWithAI = async (textToAnalyze, applyHighlight = false) => {
    const text = textToAnalyze || content;
    if (!text || text.trim().length < 8) return;

    setAiAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          title: title.trim(),
          availableTags: user.tags || []
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // 1. Tự động cập nhật Tag nếu có
        if (data.predictedTag) {
          setTag(data.predictedTag.replace('#', ''));
        }
        // 2. Tự động gợi ý màu sắc pastel
        if (data.suggestedColor) {
          setColor(data.suggestedColor);
        }
        // 3. Tự động gợi ý Tiêu đề tóm tắt chuẩn xác (khi tiêu đề đang trống hoặc khi bấm nút AI)
        if (data.suggestedTitle && (!title.trim() || applyHighlight)) {
          setTitle(data.suggestedTitle);
        }
        // 4. Tự động áp dụng tô đậm trong nội dung
        if (applyHighlight && data.highlightedText) {
          setContent(data.highlightedText);
        }

        setAiResult({
          tag: data.predictedTag,
          confidence: data.confidence,
          suggestedTitle: data.suggestedTitle,
          keyPointsCount: data.keyPoints?.length || 0,
          highlightedText: data.highlightedText
        });
      }
    } catch (err) {
      console.warn('AI Analysis warning:', err.message);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Tự động phân tích khi người dùng dừng gõ 800ms
  useEffect(() => {
    // Chỉ tự động phân tích nếu nội dung dài hơn 15 ký tự và chưa có kết quả AI cho chuỗi này
    if (!content || content.trim().length < 15) {
      setAiResult(null);
      return;
    }

    const timer = setTimeout(() => {
      // Phân tích ngầm để tự nhận diện Tag + Màu (không làm nhảy con trỏ khi đang gõ)
      handleAnalyzeWithAI(content, false);
    }, 800);

    return () => clearTimeout(timer);
  }, [content]);

  // Handle submit (Tạo mới hoặc Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tag) {
      setErrorMsg('Vui lòng chọn loại Tag cho ghi chú.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề ghi chú.');
      return;
    }

    setLoading(true);

    try {
      const url = isEditing ? `/api/notes/${existingNote._id}` : '/api/notes';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        userId: user.id || user._id,
        tag,
        noteDate,
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi lưu ghi chú.');
      }

      onSaveSuccess(data.data, isEditing);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content note-modal">
        <div className="modal-header">
          <div className="brand-icon">📝</div>
          <h2 className="modal-title">
            {isEditing ? 'Chỉnh Sửa Ghi Chú' : 'Thêm Ghi Chú Mới'}
          </h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="alert-box error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Hàng 1: Loại Tag & Ngày ghi chú */}
          <div className="form-row-2">
            <div className="form-group">
              <label>🏷️ Loại Tag:</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                required
              >
                {user.tags && user.tags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>📅 Ngày ghi chú:</label>
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Hàng 2: Tiêu đề */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>📝 Tiêu đề ghi chú:</label>
              {aiResult?.suggestedTitle && (
                <span style={{ fontSize: '0.78rem', color: '#a5b4fc', cursor: 'pointer' }} onClick={() => setTitle(aiResult.suggestedTitle)} title="Bấm để dùng tiêu đề tóm tắt này">
                  ✨ AI Tóm tắt: <strong>"{aiResult.suggestedTitle}"</strong>
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="VD: Kế hoạch tuần, Ý tưởng bài viết..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Hàng 3: Nội dung kèm Nút AI Chuẩn Hóa */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>📄 Nội dung ghi chú:</label>
              <button
                type="button"
                className="btn-ai-magic"
                onClick={() => handleAnalyzeWithAI(content, true)}
                disabled={aiAnalyzing || !content.trim()}
                title="Bấm để AI tự sửa lỗi gõ vội, tách các việc thành danh sách Checklist [ ] và đặt tiêu đề"
              >
                {aiAnalyzing ? '⏳ AI Đang chuẩn hóa...' : '🪄 AI Chuẩn Hóa & Tách Việc'}
              </button>
            </div>

            {/* AI Notification Badge */}
            {aiResult && (
              <div className="ai-detected-banner">
                <div className="ai-detected-info">
                  <span className="sparkle-anim">✨</span>
                  <span>
                    AI gợi ý: <strong>{aiResult.tag}</strong> ({aiResult.confidence}%)
                    {aiResult.keyPointsCount > 0 && ` • ${aiResult.keyPointsCount} việc cần làm`}
                  </span>
                </div>
                {aiResult.highlightedText && aiResult.highlightedText !== content && (
                  <button
                    type="button"
                    className="btn-apply-highlight-mini"
                    onClick={() => setContent(aiResult.highlightedText)}
                    title="Chuyển thành danh sách việc cần làm đã sửa lỗi gõ"
                  >
                    Áp dụng Checklist ✍️
                  </button>
                )}
              </div>
            )}

            <textarea
              rows={5}
              placeholder="VD: Sáng mai 9h họp khẩn với anh Tuấn phòng kỹ thuật để chốt phương án sửa lỗi giật lag server, nhớ hoàn thành trước 15h chiều..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* Live Formatted Preview khi có in đậm hoặc checklist */}
            {content && (content.includes('**') || content.includes('[ ]')) && (
              <div
                className="modal-live-preview"
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  backgroundColor: color || '#fef08a',
                  color: color === '#334155' ? '#f8fafc' : '#1e293b',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  fontSize: '0.88rem'
                }}
              >
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 750,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  opacity: 0.65,
                  marginBottom: '6px'
                }}>
                  👁️ Xem trước hiển thị trên thẻ (Đã tự động in đậm & tạo Checklist):
                </div>
                {content.split('\n').map((line, lIdx) => {
                  const trimmed = line.trim();
                  const isChecklist = trimmed.startsWith('- [ ]') || trimmed.startsWith('[ ]');
                  const isDone = trimmed.startsWith('- [x]') || trimmed.startsWith('[x]');
                  const isDark = color === '#334155';

                  if (isChecklist || isDone) {
                    const taskText = trimmed.replace(/^[-\s]*\[[ x]\]\s*/i, '');
                    return (
                      <div key={lIdx} style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '3px 0' }}>
                        <span>{isDone ? '☑️' : '◻️'}</span>
                        <span>
                          {taskText.split(/(\*\*.*?\*\*)/g).map((p, pIdx) => (
                            p.startsWith('**') && p.endsWith('**') ? (
                              <strong
                                key={pIdx}
                                style={{
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.1)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 750
                                }}
                              >
                                {p.slice(2, -2)}
                              </strong>
                            ) : p
                          ))}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <p key={lIdx} style={{ margin: '3px 0' }}>
                      {line.split(/(\*\*.*?\*\*)/g).map((p, pIdx) => (
                        p.startsWith('**') && p.endsWith('**') ? (
                          <strong
                            key={pIdx}
                            style={{
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.1)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 750
                            }}
                          >
                            {p.slice(2, -2)}
                          </strong>
                        ) : p
                      ))}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hàng 4: Chọn màu sắc */}
          <div className="form-group">
            <label>🎨 Màu sắc ghi chú:</label>
            <div className="color-palette">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-circle ${color === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                >
                  {color === c.value && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* Hàng 5: Tùy chọn Ghim lên đầu */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span>📌 <strong>Ghim ghi chú này lên đầu danh sách</strong></span>
            </label>
          </div>

          {/* Nút hành động */}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEditing ? 'Lưu Thay Đổi' : 'Tạo Ghi Chú'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
