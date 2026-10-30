import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowServerWarning, setSlowServerWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cảnh báo nếu Render Free Tier đang khởi động máy chủ (cold-start) > 4 giây
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setSlowServerWarning(true);
      }, 4000);
    } else {
      setSlowServerWarning(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSlowServerWarning(false);

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMsg('Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu.');
      return;
    }

    if (isRegister) {
      if (cleanUser.length < 3) {
        setErrorMsg('Tên đăng nhập phải có ít nhất 3 ký tự.');
        return;
      }
      if (password.length < 4) {
        setErrorMsg('Mật khẩu phải có ít nhất 4 ký tự.');
        return;
      }
    }

    setLoading(true);
    const endpoint = `${API_BASE_URL}${isRegister ? '/api/auth/register' : '/api/auth/login'}`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đã có lỗi xảy ra trong quá trình xử lý.');
      }

      // Đăng nhập / Đăng ký thành công
      onLoginSuccess(data.user);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setErrorMsg(
          'Không thể kết nối tới Backend. Máy chủ Render có thể đang thức dậy sau thời gian nghỉ (mất khoảng 20-30s). Bạn bấm thử lại lần nữa nhé!'
        );
      } else {
        setErrorMsg(err.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content auth-card-container">
        {/* Header với Logo & Tiêu đề */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <span className="auth-logo-icon">📒</span>
            <div className="auth-logo-ring"></div>
          </div>
          <h2 className="auth-main-title">
            {isRegister ? 'Tạo Tài Khoản Mới' : 'Chào Mừng Trở Lại'}
          </h2>
          <p className="auth-sub-title">
            {isRegister
              ? 'Lưu trữ & phân loại ghi chú thông minh cùng AI cục bộ'
              : 'Đăng nhập để đồng bộ cuốn sổ tay ghi chú của bạn'}
          </p>
        </div>

        {/* Tab chuyển đổi Đăng Nhập / Đăng Ký mượt mà */}
        <div className="auth-tabs-pill">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
          >
            Đăng Ký Mới
          </button>
        </div>

        {/* Thông báo lỗi */}
        {errorMsg && (
          <div className="auth-alert-box error">
            <span className="auth-alert-icon">⚠️</span>
            <span className="auth-alert-text">{errorMsg}</span>
          </div>
        )}

        {/* Cảnh báo máy chủ khởi động chậm (Render free cold-start) */}
        {slowServerWarning && (
          <div className="auth-alert-box info">
            <span className="auth-alert-icon">⏳</span>
            <span className="auth-alert-text">
              Máy chủ đám mây miễn phí đang khởi động (mất ~20-30 giây). Xin bạn vui lòng chờ trong giây lát...
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Ô Tên đăng nhập */}
          <div className="auth-field-group">
            <label className="auth-label">
              <span>Tên đăng nhập</span>
              {isRegister && <span className="auth-label-hint">Tối thiểu 3 ký tự</span>}
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">👤</span>
              <input
                type="text"
                placeholder="VD: nguyenvana, dev123..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Ô Mật khẩu */}
          <div className="auth-field-group">
            <label className="auth-label">
              <span>Mật khẩu</span>
              {isRegister && <span className="auth-label-hint">Tối thiểu 4 ký tự</span>}
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="btn-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {/* Nút gửi form */}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-loading-state">
                <span className="auth-spinner"></span>
                <span>{isRegister ? 'Đang tạo tài khoản...' : 'Đang xác thực...'}</span>
              </span>
            ) : (
              <span>{isRegister ? 'Tạo Tài Khoản Ngay 🚀' : 'Đăng Nhập Vào Sổ Tay ✨'}</span>
            )}
          </button>
        </form>

        {/* Footer chuyển đổi */}
        <div className="auth-footer-note">
          <span className="auth-footer-text">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản trên hệ thống?'}
          </span>
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
          >
            {isRegister ? 'Đăng nhập tại đây' : 'Tạo tài khoản miễn phí'}
          </button>
        </div>
      </div>
    </div>
  );
}
