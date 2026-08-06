import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { useTheme } from './hooks/useTheme';
import LoginPage from './features/auth/LoginPage';
import AuthCallbackPage from './features/auth/AuthCallbackPage';
import AuthPopupPage from './features/auth/AuthPopupPage';
import OverviewPage from './features/overview/OverviewPage';
import CalendarPage from './features/calendar/CalendarPage';
import TimerPage from './features/timer/TimerPage';
import SettingsPage from './features/settings/SettingsPage';
import Layout from './components/Layout/Layout';
import './styles/index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          ⚡ 찐fit 로딩 중...
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const defaultLanding = localStorage.getItem('default_landing') || '/overview';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px' }}>
          ⚡ 찐fit
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth/popup/:provider"
        element={<AuthPopupPage />}
      />
      <Route
        path="/auth/callback/:provider"
        element={<AuthCallbackPage />}
      />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={defaultLanding} replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={<Navigate to={defaultLanding} replace />}
      />
      <Route
        path="/overview"
        element={
          <ProtectedRoute>
            <Layout>
              <OverviewPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <CalendarPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/timer"
        element={
          <ProtectedRoute>
            <Layout>
              <TimerPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={defaultLanding} replace />} />
    </Routes>
  );
}

export default function App() {
  useTheme(); // Initialize theme on mount

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
