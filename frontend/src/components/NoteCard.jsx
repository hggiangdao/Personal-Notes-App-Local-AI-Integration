import React from 'react';

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleTask }) {
  // Kiểm tra màu nền có phải màu tối không để điều chỉnh màu chữ
  const isDarkColor = note.color === '#334155';
  const textColor = isDarkColor ? '#f8fafc' : '#1e293b';
  const mutedTextColor = isDarkColor ? '#94a3b8' : '#475569';
  const tagBg = isDarkColor ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

  // Tính toán số lượng checklist task và tiến độ hoàn thành
  const lines = note.content ? note.content.split('\n') : [];
  const taskLines = lines.filter((l) => {
    const t = l.trim();
    return t.startsWith('- [ ]') || t.startsWith('[ ]') || t.startsWith('- [x]') || t.startsWith('[x]');
  });
  const totalTasks = taskLines.length;
  const doneTasks = taskLines.filter((l) => {
    const t = l.trim();
    return t.startsWith('- [x]') || t.startsWith('[x]');
  }).length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div
      className={`note-card ${note.isPinned ? 'is-pinned' : ''} ${isDarkColor ? 'dark-theme' : 'light-theme'}`}
      style={{
        backgroundColor: note.color || '#fef08a',
        color: textColor
      }}
    >
      {/* Top Header: Tag, Date & Action Buttons */}
      <div className="note-card-top">
        <div className="note-meta-badges">
          <span
            className="note-tag-pill"
            style={{ backgroundColor: tagBg, color: textColor }}
          >
            #{note.tag}
          </span>
          <span
            className="note-date-text"
            style={{ color: mutedTextColor }}
          >
            📅 {note.noteDate}
          </span>
          {note.isPinned && (
            <span className="note-pinned-badge" title="Ghi chú được ghim lên đầu">
              📌 Đã ghim
            </span>
          )}
        </div>

        <div className="note-actions">
          <button
            type="button"
            className={`card-action-btn pin-btn ${note.isPinned ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note._id);
            }}
            title={note.isPinned ? 'Bỏ ghim ghi chú này' : 'Ghim ghi chú lên đầu'}
            style={{ color: textColor }}
          >
            📌
          </button>
          <button
            type="button"
            className="card-action-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            title="Chỉnh sửa ghi chú"
            style={{ color: textColor }}
          >
            ✏️
          </button>
          <button
            type="button"
            className="card-action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note._id);
            }}
            title="Xóa ghi chú này"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Note Title */}
      <h3 className="note-card-title">{note.title}</h3>

      {/* Note Content with Interactive Checklist & Highlighter */}
      <div
        className="note-card-content"
        style={{ color: isDarkColor ? '#e2e8f0' : '#334155' }}
      >
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          const isChecklist = trimmed.startsWith('- [ ]') || trimmed.startsWith('[ ]');
          const isDone = trimmed.startsWith('- [x]') || trimmed.startsWith('[x]');

          // Dòng việc cần làm (Checklist tương tác trực tiếp)
          if (isChecklist || isDone) {
            const taskText = trimmed.replace(/^[-\s]*\[[ x]\]\s*/i, '');
            return (
              <div
                key={lIdx}
                className={`checklist-row ${isDone ? 'is-done' : ''}`}
                onClick={() => onToggleTask && onToggleTask(note._id, lIdx)}
                title={isDone ? 'Bấm để đánh dấu chưa xong' : 'Bấm để đánh dấu đã hoàn thành'}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleTask && onToggleTask(note._id, lIdx);
                  }
                }}
              >
                <span className={`checklist-check-icon ${isDone ? 'checked' : 'unchecked'}`}>
                  {isDone ? '☑️' : '◻️'}
                </span>
                <span
                  className="checklist-text"
                  style={{
                    textDecoration: isDone ? 'line-through' : 'none',
                    opacity: isDone ? 0.6 : 1
                  }}
                >
                  {taskText.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong
                          key={pIdx}
                          className="ai-highlight-text"
                          style={{
                            backgroundColor: isDarkColor ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.09)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 750
                          }}
                        >
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return part;
                  })}
                </span>
              </div>
            );
          }

          // Dòng văn bản thông thường (hỗ trợ **tô đậm**)
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={lIdx} className="note-text-line">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong
                      key={pIdx}
                      className="ai-highlight-text"
                      style={{
                        backgroundColor: isDarkColor ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.09)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 750
                      }}
                    >
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>

      {/* Progress Footer: Hiển thị thanh tiến độ khi ghi chú có checklist việc cần làm */}
      {totalTasks > 0 && (
        <div className="note-card-progress-footer">
          <div
            className="progress-track"
            style={{ backgroundColor: isDarkColor ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)' }}
          >
            <div
              className={`progress-fill ${progressPct === 100 ? 'complete' : ''}`}
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct === 100 ? '#10b981' : isDarkColor ? '#818cf8' : '#4f46e5'
              }}
            />
          </div>
          <div className="progress-labels" style={{ color: mutedTextColor }}>
            <span className="progress-task-count">
              {progressPct === 100 ? '🎉 Đã hoàn thành hết' : `${doneTasks}/${totalTasks} việc xong`}
            </span>
            <span className="progress-percent">{progressPct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
