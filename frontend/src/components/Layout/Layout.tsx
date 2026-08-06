import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import './Layout.css';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🖥️';

  return (
    <div className="app-layout">
      <header className="app-header glass-card">
        <div className="header-left">
          <button className="header-logo" onClick={() => navigate('/')}>
            ⚡ <span className="gradient-text" style={{ fontWeight: 900, letterSpacing: '-0.5px' }}>찐fit</span>
          </button>
        </div>

        <nav className="header-nav">
          <button
            id="nav-overview-btn"
            className={`nav-btn ${location.pathname === '/overview' || location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/overview')}
          >
            🏠 홈
          </button>
          <button
            className={`nav-btn ${location.pathname === '/calendar' ? 'active' : ''}`}
            onClick={() => navigate('/calendar')}
          >
            📅 캘린더
          </button>
          <button
            className={`nav-btn ${location.pathname === '/timer' ? 'active' : ''}`}
            onClick={() => navigate('/timer')}
          >
            ⏱️ 단식 타이머
          </button>
          <button
            className={`nav-btn ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={() => navigate('/settings')}
          >
            ⚙️ 설정
          </button>
        </nav>


        <div className="header-right">
          <button
            className="theme-toggle-btn"
            onClick={() => {
              const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
              setTheme(next);
            }}
            title={`테마: ${theme}`}
          >
            {themeIcon}
          </button>

          <div className="user-menu">
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="" className="user-avatar" />
            )}
            <span className="user-name">{user?.nickname}</span>
            <button className="logout-btn" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="app-content">
        {children}
      </main>

      {/* Mobile Smartphone Bottom Navigation Bar (PWA Thumb-Friendly Dock) */}
      <nav className="mobile-bottom-nav">
        <button
          className={`bottom-tab-btn ${location.pathname === '/overview' || location.pathname === '/' ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15); // Haptic feedback on touch
            navigate('/overview');
          }}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-label">홈</span>
        </button>

        <button
          className={`bottom-tab-btn ${location.pathname === '/calendar' ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            navigate('/calendar');
          }}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">캘린더</span>
        </button>

        <button
          className={`bottom-tab-btn ${location.pathname === '/timer' ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            navigate('/timer');
          }}
        >
          <span className="tab-icon">⏱️</span>
          <span className="tab-label">단식타이머</span>
        </button>

        <button
          className={`bottom-tab-btn ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            navigate('/settings');
          }}
        >
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">설정</span>
        </button>
      </nav>
    </div>
  );
}

