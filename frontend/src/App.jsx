import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import AuthModal from './components/AuthModal';
import TagSetupModal from './components/TagSetupModal';
import NoteModal from './components/NoteModal';
import NoteCard from './components/NoteCard';

export default function App() {
  // 1. Trạng thái người dùng
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('notes_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Trạng thái danh sách ghi chú
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // 3. Trạng thái các Modals
  const [showTagModal, setShowTagModal] = useState(false);
  const [isFirstTimeOnboarding, setIsFirstTimeOnboarding] = useState(false);
  const [noteModal, setNoteModal] = useState({ isOpen: false, noteToEdit: null });

  // Kiểm tra lần đầu sử dụng (user chưa có tag nào)
  useEffect(() => {
    if (user) {
      if (!user.tags || user.tags.length === 0) {
        setIsFirstTimeOnboarding(true);
        setShowTagModal(true);
      } else {
        fetchNotes();
      }
    }
  }, [user]);

  // Phím tắt bàn phím: Ctrl + K để focus vào ô tìm kiếm, Escape để xóa tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hàm sắp xếp ghi chú: Ghim lên đầu -> Ngày ghi chú mới nhất -> Ngày tạo mới nhất
  const sortNotes = (items) => {
    return [...items].sort((a, b) => {
      const aPinned = Boolean(a.isPinned);
      const bPinned = Boolean(b.isPinned);
      if (aPinned !== bPinned) return bPinned ? 1 : -1;
      if (a.noteDate !== b.noteDate) return (b.noteDate || '').localeCompare(a.noteDate || '');
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  };

  // Lấy danh sách ghi chú từ Backend
  const fetchNotes = async () => {
    if (!user) return;
    setLoadingNotes(true);
    try {
      const userId = user.id || user._id;
      const res = await fetch(`/api/notes?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setNotes(sortNotes(data.data || []));
      }
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Đăng nhập / Đăng ký thành công
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('notes_user', JSON.stringify(userData));

    if (!userData.tags || userData.tags.length === 0) {
      setIsFirstTimeOnboarding(true);
      setShowTagModal(true);
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('notes_user');
    setUser(null);
    setNotes([]);
    setSelectedTag('ALL');
  };

  // Khi lưu xong Tag (trong modal)
  const handleTagsSaved = (newTags) => {
    const updatedUser = { ...user, tags: newTags };
    setUser(updatedUser);
    localStorage.setItem('notes_user', JSON.stringify(updatedUser));
    setShowTagModal(false);
    setIsFirstTimeOnboarding(false);
    fetchNotes();
  };

  // Khi tạo mới hoặc sửa xong 1 ghi chú
  const handleNoteSaved = (savedNote, isEditing) => {
    if (isEditing) {
      setNotes((prev) => sortNotes(prev.map((n) => (n._id === savedNote._id ? savedNote : n))));
    } else {
      setNotes((prev) => sortNotes([savedNote, ...prev]));
    }
    setNoteModal({ isOpen: false, noteToEdit: null });
  };

  // Ghim hoặc Bỏ ghim ghi chú
  const handleTogglePin = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/${noteId}/pin`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) =>
          sortNotes(prev.map((n) => (n._id === noteId ? data.data : n)))
        );
      }
    } catch (err) {
      console.error('Lỗi khi ghim ghi chú:', err);
    }
  };

  // Đánh dấu hoàn thành / chưa hoàn thành Checklist trực tiếp trên thẻ ghi chú
  const handleToggleTask = async (noteId, lineIndex) => {
    const targetNote = notes.find((n) => n._id === noteId);
    if (!targetNote || !targetNote.content) return;

    const lines = targetNote.content.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const currentLine = lines[lineIndex];
    let newLine = currentLine;

    if (currentLine.trim().startsWith('- [ ]')) {
      newLine = currentLine.replace('- [ ]', '- [x]');
    } else if (currentLine.trim().startsWith('[ ]')) {
      newLine = currentLine.replace('[ ]', '[x]');
    } else if (currentLine.trim().startsWith('- [x]')) {
      newLine = currentLine.replace('- [x]', '- [ ]');
    } else if (currentLine.trim().startsWith('[x]')) {
      newLine = currentLine.replace('[x]', '[ ]');
    } else {
      return;
    }

    lines[lineIndex] = newLine;
    const updatedContent = lines.join('\n');

    // Cập nhật Optimistic UI ngay lập tức
    const updatedNote = { ...targetNote, content: updatedContent };
    setNotes((prev) => prev.map((n) => (n._id === noteId ? updatedNote : n)));

    // Lưu vào database ngầm
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent })
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật checklist:', err);
    }
  };

  // Xóa ghi chú
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) return;

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter((n) => n._id !== noteId));
      }
    } catch (err) {
      alert('Không thể xóa ghi chú: ' + err.message);
    }
  };

  // Thống kê nhanh dữ liệu ghi chú
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    notes.forEach((n) => {
      if (n.content) {
        n.content.split('\n').forEach((l) => {
          const t = l.trim();
          if (t.startsWith('- [ ]') || t.startsWith('[ ]')) totalTasks++;
          if (t.startsWith('- [x]') || t.startsWith('[x]')) {
            totalTasks++;
            completedTasks++;
          }
        });
      }
    });

    return {
      totalNotes: notes.length,
      pinnedNotes: notes.filter((n) => n.isPinned).length,
      totalTasks,
      completedTasks,
      tagCount: user?.tags?.length || 0
    };
  }, [notes, user]);

  // Lọc ghi chú theo Tag và Từ khóa tìm kiếm
  const filteredNotes = notes.filter((n) => {
    const matchTag = selectedTag === 'ALL' || n.tag === selectedTag;
    const matchQuery =
      searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTag && matchQuery;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  // Nếu chưa đăng nhập -> Hiện Modal Đăng nhập / Đăng ký
  if (!user) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-wrapper">
      {/* Ambient background glow layers */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {/* 1. Thanh điều hướng trên cùng (Glassmorphism Navbar) */}
      <header className="app-navbar">
        <div className="nav-brand">
          <div className="brand-logo-glow">
            <span className="brand-icon">✨</span>
          </div>
          <div>
            <h1 className="brand-title">Sổ Tay Thông Minh</h1>
            <span className="brand-badge-ai">In-house ML Engine</span>
          </div>
        </div>

        <div className="nav-user-actions">
          <div className="user-profile-badge">
            <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
            <span className="user-greeting">
              @{user.username}
            </span>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setIsFirstTimeOnboarding(false);
              setShowTagModal(true);
            }}
          >
            🏷️ Thẻ Tag <span className="chip-counter">{user.tags?.length || 0}</span>
          </button>

          <button type="button" className="btn-logout" onClick={handleLogout} title="Đăng xuất khỏi tài khoản">
            Đăng Xuất
          </button>
        </div>
      </header>

      {/* 2. Nội dung chính */}
      <main className="main-container">
        {/* Quick Productivity Statistics Bar */}
        <section className="stats-strip">
          <div className="stat-card">
            <div className="stat-icon-wrap note-icon">📒</div>
            <div className="stat-details">
              <span className="stat-num">{stats.totalNotes}</span>
              <span className="stat-label">Tổng ghi chú</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap pin-icon">📌</div>
            <div className="stat-details">
              <span className="stat-num">{stats.pinnedNotes}</span>
              <span className="stat-label">Đã ghim</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap task-icon">✅</div>
            <div className="stat-details">
              <span className="stat-num">
                {stats.completedTasks} / {stats.totalTasks}
              </span>
              <span className="stat-label">Checklist hoàn thành</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap tag-icon">🏷️</div>
            <div className="stat-details">
              <span className="stat-num">{stats.tagCount}</span>
              <span className="stat-label">Danh mục Tag</span>
            </div>
          </div>
        </section>

        {/* Thanh công cụ: Tìm kiếm & Nút Tạo ghi chú mới */}
        <div className="control-bar">
          <div className="search-input-box">
            <span className="search-prefix-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm ghi chú theo tiêu đề, nội dung, thẻ tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            ) : (
              <span className="kbd-shortcut-hint" title="Bấm Ctrl + K để tìm nhanh">Ctrl K</span>
            )}
          </div>

          <button
            type="button"
            className="btn-new-note"
            onClick={() => setNoteModal({ isOpen: true, noteToEdit: null })}
          >
            <span className="plus-icon">+</span> Thêm Ghi Chú Mới
          </button>
        </div>

        {/* Thanh lọc theo Tag */}
        <div className="tags-filter-bar">
          <button
            type="button"
            className={`tag-filter-pill ${selectedTag === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedTag('ALL')}
          >
            Tất cả <span className="pill-count">{notes.length}</span>
          </button>

          {user.tags &&
            user.tags.map((t) => {
              const count = notes.filter((n) => n.tag === t).length;
              return (
                <button
                  key={t}
                  type="button"
                  className={`tag-filter-pill ${selectedTag === t ? 'active' : ''}`}
                  onClick={() => setSelectedTag(t)}
                >
                  #{t} <span className="pill-count">{count}</span>
                </button>
              );
            })}
        </div>

        {/* Danh sách các thẻ ghi chú (Notes Grid) */}
        {loadingNotes ? (
          <div className="empty-notes-view loading-view">
            <div className="loading-spinner" />
            <p>Đang tải ghi chú từ Database...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="empty-notes-view">
            <div className="empty-notes-icon-wrapper">
              <span className="empty-notes-icon">✍️</span>
            </div>
            <div className="empty-notes-text">
              <h3>Chưa có ghi chú nào phù hợp</h3>
              <p>
                {selectedTag !== 'ALL'
                  ? `Chưa có ghi chú nào thuộc tag #${selectedTag}.`
                  : 'Hãy bấm "+ Thêm Ghi Chú Mới" để trải nghiệm công nghệ AI tự động chuẩn hóa ghi chú cá nhân!'}
              </p>
            </div>
            <button
              type="button"
              className="btn-new-note empty-action-btn"
              onClick={() => setNoteModal({ isOpen: true, noteToEdit: null })}
            >
              + Tạo Ghi Chú Đầu Tiên
            </button>
          </div>
        ) : pinnedNotes.length > 0 ? (
          <div className="notes-sections-container">
            {/* Mục ghi chú đã ghim */}
            <div className="notes-section">
              <div className="notes-section-header">
                <span className="section-pin-icon">📌</span>
                <h2 className="notes-section-title">GHI CHÚ ĐÃ GHIM</h2>
                <span className="section-count-badge">{pinnedNotes.length}</span>
              </div>
              <div className="notes-grid">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onEdit={(n) => setNoteModal({ isOpen: true, noteToEdit: n })}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onToggleTask={handleToggleTask}
                  />
                ))}
              </div>
            </div>

            {/* Mục ghi chú khác nếu có */}
            {otherNotes.length > 0 && (
              <div className="notes-section">
                <div className="notes-section-header">
                  <span className="section-note-icon">📝</span>
                  <h2 className="notes-section-title">GHI CHÚ KHÁC</h2>
                  <span className="section-count-badge">{otherNotes.length}</span>
                </div>
                <div className="notes-grid">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onEdit={(n) => setNoteModal({ isOpen: true, noteToEdit: n })}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      onToggleTask={handleToggleTask}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onEdit={(n) => setNoteModal({ isOpen: true, noteToEdit: n })}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleTask={handleToggleTask}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3. Modal Thiết Lập Tag (Lần đầu hoặc Quản lý tag) */}
      {showTagModal && (
        <TagSetupModal
          user={user}
          isFirstTime={isFirstTimeOnboarding}
          onTagsSaved={handleTagsSaved}
          onClose={() => setShowTagModal(false)}
        />
      )}

      {/* 4. Modal Thêm / Chỉnh Sửa Ghi Chú */}
      {noteModal.isOpen && (
        <NoteModal
          user={user}
          existingNote={noteModal.noteToEdit}
          onSaveSuccess={handleNoteSaved}
          onClose={() => setNoteModal({ isOpen: false, noteToEdit: null })}
        />
      )}
    </div>
  );
}
