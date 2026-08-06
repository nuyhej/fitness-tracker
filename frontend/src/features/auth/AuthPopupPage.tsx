import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface ProviderTheme {
  title: string;
  badge: string;
  bg: string;
  textColor: string;
  borderColor?: string;
  placeholder: string;
}

const THEME_MAP: Record<string, ProviderTheme> = {
  naver: {
    title: 'Naver (네이버) 개인 계정 간편인증',
    badge: 'N',
    bg: '#03C75A',
    textColor: '#ffffff',
    placeholder: '예: myname@naver.com'
  },
  kakao: {
    title: 'Kakao (카카오) 본인 계정 로그인',
    badge: '💬',
    bg: '#FEE500',
    textColor: '#191919',
    placeholder: '예: my_katalk@kakao.com 또는 이메일'
  },
  line: {
    title: 'LINE (라인) 메신저 개인 계정 접속',
    badge: 'L',
    bg: '#00C300',
    textColor: '#ffffff',
    placeholder: '예: my_line@line.me'
  },
  google: {
    title: 'Google (구글) 개인 이메일 로그인',
    badge: '🇬',
    bg: '#ffffff',
    textColor: '#202124',
    borderColor: '#cccccc',
    placeholder: '예: my_name@gmail.com'
  }
};

export default function AuthPopupPage() {
  const { provider = 'custom' } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const theme = THEME_MAP[provider.toLowerCase()] || {
    title: '소셜 실계정 통합 간편로그인',
    badge: '⚡',
    bg: '#3b82f6',
    textColor: '#ffffff',
    placeholder: '이메일 주소 입력'
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('❌ 이메일과 본인 보안 PIN(비밀번호)을 꼭 입력해 주세요!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.post<{ access_token: string; user: any }>('/auth/login/social-personal', {
        email: email.trim(),
        password: password.trim(),
        nickname: nickname.trim(),
        provider: provider.toLowerCase()
      });

      localStorage.setItem('token', data.access_token);
      
      // Notify parent window and close popup!
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'JJINFIT_LOGIN_SUCCESS', token: data.access_token, user: data.user }, '*');
        window.close();
      } else {
        // Fallback if accessed in standalone tab
        navigate('/overview', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || '❌ 인증 실패: 이메일 또는 비밀번호(보안 PIN)를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '30px 28px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: theme.bg,
          color: theme.textColor,
          border: theme.borderColor ? `1px solid ${theme.borderColor}` : 'none',
          borderRadius: '14px',
          marginBottom: '20px',
          fontWeight: 800,
          fontSize: '18px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '24px', fontWeight: 900 }}>{theme.badge}</span>
          <span>{theme.title}</span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px', backgroundColor: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
          🛡️ <strong>본인 개인 계정 동기화 모드</strong>: 타인의 무단 침입을 100% 원천 봉쇄하기 위해 <strong>본인 이메일과 비밀번호(보안 PIN)</strong> 검증을 거칩니다. 입력하신 실사용 메일 프로필로 식단·인바디·스마트워치 데이터가 실시간 1대1 귀속됩니다.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              ✉️ {provider.toUpperCase()} 개인 이메일 주소 / 아이디 *
            </label>
            <input
              type="email"
              required
              className="input"
              placeholder={theme.placeholder}
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#3b82f6', marginBottom: '6px' }}>
              🔒 비밀번호 또는 보안 PIN (숫자·영문 자유) *
            </label>
            <input
              type="password"
              required
              className="input"
              placeholder="타인이 못 보게 본인 전용 비밀번호/PIN 입력"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '10px', border: '1px solid #3b82f6' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              👤 닉네임 (선택 / 비울 경우 메일ID 사용)
            </label>
            <input
              type="text"
              className="input"
              placeholder="예: 찐핏맨"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: '14px', borderRadius: '10px' }}
            />
          </div>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', fontSize: '13px', fontWeight: 700, borderRadius: '8px', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: '1', padding: '14px', fontWeight: 700, borderRadius: '12px' }}
              onClick={() => window.close()}
            >
              창 닫기
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: '2', padding: '14px', fontWeight: 800, borderRadius: '12px', background: theme.bg === '#ffffff' ? '#3b82f6' : theme.bg, color: theme.bg === '#ffffff' ? '#fff' : theme.textColor, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
            >
              {loading ? '본인 계정 검증 중...' : `🚀 ${provider.toUpperCase()} 계정으로 승인 및 접속`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
