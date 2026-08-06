import { useState } from 'react';
import { useAuth } from './AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { loginWithSocial, loginWithDemo, loginWithCustomAccount } = useAuth();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const handleSocialClick = async (provider: 'google' | 'naver' | 'kakao' | 'line') => {
    setSocialNotice(`🔄 ${provider.toUpperCase()} 서버와 보안 통신 연결 중...`);
    const errNotice = await loginWithSocial(provider);
    if (errNotice) {
      setSocialNotice(errNotice);
      setTimeout(() => setSocialNotice(null), 8000);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      alert('타인의 열람을 차단하기 위해 이메일과 비밀번호(보안 PIN)를 꼭 입력해 주세요!');
      return;
    }
    setLoading(true);
    try {
      await loginWithCustomAccount(emailInput, passwordInput, nameInput);
    } catch (err: any) {
      alert(err.message || '❌ 로그인 실패: 비밀번호 또는 보안 PIN이 불일치합니다. 본인 계정인지 암호를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      <div className="login-container" style={{ maxWidth: '440px' }}>
        <div className="login-card glass-card" style={{ padding: '32px 28px' }}>
          <div className="login-header">
            <div className="login-logo" style={{ fontSize: '48px', marginBottom: '8px' }}>⚡</div>
            <h1 className="login-title">
              <span className="gradient-text" style={{ fontWeight: 900, letterSpacing: '-1px', fontSize: '38px' }}>찐fit</span>
            </h1>
            <p className="login-subtitle">
              나만의 AI 스마트 건강 & 트레이닝 대시보드
            </p>
          </div>

          <div className="login-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              id="demo-login-btn"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
                boxShadow: '0 4px 16px rgba(45, 212, 168, 0.4)',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '12px'
              }}
              onClick={loginWithDemo}
            >
              <span>🚀</span>
              <span>1초 테스트 계정 간편 접속 (추천)</span>
            </button>

            <button
              id="custom-login-btn"
              className="btn"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(59, 130, 246, 0.18)',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
              onClick={() => setShowCustomModal(true)}
            >
              <span>🔒</span>
              <span>내 구글/메일 계정 로그인 (비밀번호 PIN 보호)</span>
            </button>

            <div style={{ textAlign: 'center', margin: '6px 0 2px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              — 4대 소셜 공식 API 연동 —
            </div>

            {/* Google OAuth Button */}
            <button
              className="btn"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 700,
                background: '#fff',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
              onClick={() => handleSocialClick('google')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google (구글) 계정으로 로그인
            </button>

            {/* Naver OAuth Button */}
            <button
              className="btn"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 800,
                background: '#03C75A',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => handleSocialClick('naver')}
            >
              <span style={{ fontSize: '15px', fontWeight: 900 }}>N</span>
              Naver (네이버) 계정으로 로그인
            </button>

            {/* Kakao OAuth Button */}
            <button
              className="btn"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 800,
                background: '#FEE500',
                color: '#000000',
                border: 'none',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => handleSocialClick('kakao')}
            >
              <span style={{ fontSize: '16px' }}>💬</span>
              Kakao (카카오) 계정으로 로그인
            </button>

            {/* LINE OAuth Button */}
            <button
              className="btn"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 800,
                background: '#00C300',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => handleSocialClick('line')}
            >
              <span style={{ fontSize: '16px', fontWeight: 900 }}>L</span>
              LINE (라인) 계정으로 로그인
            </button>
          </div>

          {socialNotice && (
            <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', fontSize: '13px', fontWeight: 700, borderRadius: '8px', lineHeight: 1.5, textAlign: 'center' }}>
              {socialNotice}
            </div>
          )}

          <p className="login-footer" style={{ marginTop: '20px' }}>
            로그인하시면 스마트폰과 PC 간 식단, 가민 운동, 인바디 기록을 실시간 공유하며 철저한 보안 암호로 보호받습니다.
          </p>
        </div>
      </div>

      {/* Custom Account Login Modal with Security PIN */}
      {showCustomModal && (
        <div className="modal-backdrop" onClick={() => setShowCustomModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              🔒 내 구글/실사용 메일 보안 로그인
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
              타인의 무단 열람 및 수정을 차단하기 위해 <strong>비밀번호(보안 PIN)</strong> 검증을 필수로 통과합니다. 처음 접속하시는 경우 입력하신 암호가 본인 전용 PIN으로 등록됩니다.
            </p>
            
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  이메일 (구글 메일 등) *
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="예: user@gmail.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#3b82f6', marginBottom: '6px' }}>
                  🔒 비밀번호 또는 보안 PIN (숫자·문자 자유) *
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="타인이 못 보게 본인만의 암호 PIN 입력"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #3b82f6' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  닉네임 (선택 입력 / 변경 시 반영)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="예: 다이어터마스터 (비워둘 시 메일ID 사용)"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  style={{ width: '100%', padding: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: '#3b82f6', color: '#fff', border: 'none' }}>
                  {loading ? '암호 검증 및 동기화 중...' : '🔒 암호 확인 & 보안 접속'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


