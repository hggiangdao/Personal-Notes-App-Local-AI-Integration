import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu.');
      return;
    }

    setLoading(true);
    const endpoint = `${API_BASE_URL}${isRegister ? '/api/auth/register' : '/api/auth/login'}`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đã có lỗi xảy ra.');
      }

      // Đăng nhập / Đăng ký thành công
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content auth-modal">
        <div className="modal-header">
          <div className="brand-icon">📒</div>
          <h2 className="modal-title">
            {isRegister ? 'Tạo Tài Khoản Mới' : 'Đăng Nhập Sổ Tay'}
          </h2>
          <p className="modal-subtitle">
            {isRegister
              ? 'Đăng ký tài khoản để bắt đầu lưu trữ ghi chú cá nhân'
              : 'Chào mừng bạn quay trở lại với cuốn sổ tay của mình'}
          </p>
        </div>

        {errorMsg && <div className="alert-box error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              placeholder="VD: minh_dev, ducnguyen..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu:</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu của bạn..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="modal-footer">
          {isRegister ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                }}
              >
                Đăng nhập ngay
              </button>
            </p>
          ) : (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                }}
              >
                Đăng ký tài khoản mới
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
