import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleSocialCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!provider || !code) {
      setError('❌ 올바른 소셜 로그인 인가 코드(Code) 또는 제공자 정보가 없습니다.');
      return;
    }

    const processLogin = async () => {
      try {
        await handleSocialCallback(provider, code);
        // Navigate cleanly to home overview
        navigate('/overview', { replace: true });
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(`⚠️ ${provider.toUpperCase()} 로그인 처리 중 문제가 발생했습니다. (API 키 불일치 또는 네트워크 문제)`);
      }
    };

    processLogin();
  }, [provider, searchParams, handleSocialCallback, navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '36px', textAlign: 'center', borderRadius: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        
        {!error ? (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
              🌐 <span className="gradient-text">{provider?.toUpperCase()}</span> 계정 동기화 중...
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              보안 JWT 인증 토큰을 발급하고 식단 및 인바디 데이터베이스에 접근 중입니다.<br/>
              잠시만 기다려 주세요! 🚀
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px', color: 'var(--color-danger)' }}>
              소셜 로그인 실패 알림
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {error}
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700 }}
              onClick={() => navigate('/login', { replace: true })}
            >
              🔄 로그인 화면으로 다시 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
