import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isAuthenticated: false, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  loginWithGoogle: () => void;
  loginWithSocial: (provider: 'google' | 'naver' | 'kakao' | 'line') => Promise<string | null>;
  handleGoogleCallback: (code: string) => Promise<void>;
  handleSocialCallback: (provider: string, code: string) => Promise<void>;
  loginWithDemo: () => Promise<void>;
  loginWithCustomAccount: (email: string, password?: string, nickname?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in on mount and listen for popup login completion
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const user = await api.get<User>('/auth/me');
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
      }
    };
    checkAuth();

    const handlePopupMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'JJINFIT_LOGIN_SUCCESS' && event.data.token && event.data.user) {
        localStorage.setItem('token', event.data.token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: event.data.user, token: event.data.token } });
      }
    };
    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, []);

  const loginWithGoogle = async () => {
    try {
      const data = await api.get<{ auth_url: string; error_notice?: string }>('/auth/login/google');
      if (data.error_notice) {
        alert(data.error_notice);
        return;
      }
      if (data.auth_url) {
        const width = 520;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(data.auth_url, 'jjinfit_oauth_popup', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
        if (!popup) {
          alert('⚠️ 브라우저 팝업 차단으로 새 창이 열리지 않았습니다. 팝업 차단을 해제하고 다시 클릭해주세요!');
        }
      }
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
    }
  };

  const loginWithSocial = async (provider: 'google' | 'naver' | 'kakao' | 'line'): Promise<string | null> => {
    try {
      const data = await api.get<{ auth_url: string; error_notice?: string }>(`/auth/login/${provider}`);
      if (data.error_notice) {
        return data.error_notice;
      }
      if (data.auth_url) {
        const width = 520;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(data.auth_url, 'jjinfit_oauth_popup', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
        if (!popup) {
          return '⚠️ 브라우저 팝업 차단이 켜져 있습니다. 새 창 로그인을 위해 팝업 차단을 해제하고 다시 시도해주세요!';
        }
      }
      return null;
    } catch (err: any) {
      console.error(`Failed social login for ${provider}:`, err);
      return `❌ ${provider.toUpperCase()} 백엔드 서버와 통신할 수 없습니다. (서버 가동 상태를 확인해주세요)`;
    }
  };

  const loginWithDemo = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await api.post<{ access_token: string; user: User }>('/auth/login/demo', {});
      localStorage.setItem('token', data.access_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.access_token } });
    } catch (err) {
      console.error('Demo login failed:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loginWithCustomAccount = async (email: string, password?: string, nickname?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await api.post<{ access_token: string; user: User }>('/auth/login/custom', {
        email: email.trim(),
        password: password ? password.trim() : '',
        nickname: nickname ? nickname.trim() : '',
      });
      localStorage.setItem('token', data.access_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.access_token } });
    } catch (err: any) {
      console.error('Custom login failed:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw err;
    }
  };


  const handleGoogleCallback = async (code: string) => {
    try {
      const data = await api.post<{ access_token: string; user: User }>(
        `/auth/callback/google?code=${encodeURIComponent(code)}`
      );
      localStorage.setItem('token', data.access_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.access_token } });
    } catch (err) {
      console.error('Google callback failed:', err);
      throw err;
    }
  };

  const handleSocialCallback = async (provider: string, code: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await api.post<{ access_token: string; user: User }>(
        `/auth/callback/${provider}?code=${encodeURIComponent(code)}`
      );
      localStorage.setItem('token', data.access_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.access_token } });
    } catch (err) {
      console.error(`${provider} callback failed:`, err);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw err;
    }
  };


  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (updates: Partial<User>) => {
    const user = await api.put<User>('/auth/profile', updates);
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, loginWithGoogle, loginWithSocial, loginWithDemo, loginWithCustomAccount, handleGoogleCallback, handleSocialCallback, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
