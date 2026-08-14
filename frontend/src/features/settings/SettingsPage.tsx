import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../services/api';
import { soundEngine, requestNotificationPermission, sendMobileNotification } from '../../utils/notifications';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [fastingGoal, setFastingGoal] = useState(user?.fasting_goal_hours || 16);
  const [dietStart, setDietStart] = useState(user?.diet_start_date || '');
  const [landingPage, setLandingPage] = useState(localStorage.getItem('default_landing') || '/overview');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  
  // Google Fit Token State
  const [googleFitToken, setGoogleFitToken] = useState('');
  const [isGoogleTokenSaving, setIsGoogleTokenSaving] = useState(false);
  const [googleTokenMsg, setGoogleTokenMsg] = useState<string | null>(null);

  const handleSaveGoogleToken = async () => {
    if (!googleFitToken.trim()) return;
    try {
      setIsGoogleTokenSaving(true);
      setGoogleTokenMsg(null);
      // Calls the same /inbody/sync endpoint with the new token
      const res = await api.post<{ status: string; message?: string }>('/inbody/sync', { access_token: googleFitToken.trim() });
      if (res.status === 'success') {
        setGoogleTokenMsg(`✅ 토큰이 성공적으로 검증 및 저장되었습니다! (${res.message || '완료'})`);
        setGoogleFitToken('');
        soundEngine.playSyncSuccessChime();
      } else {
        setGoogleTokenMsg(`❌ 실패: ${res.message || '토큰이 유효하지 않거나 만료되었습니다.'}`);
      }
    } catch (err: any) {
      setGoogleTokenMsg(`❌ 서버 통신 오류가 발생했습니다.`);
    } finally {
      setIsGoogleTokenSaving(false);
    }
  };

  // Account merge state
  const [mergeEmail, setMergeEmail] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<string | null>(null);

  const handleMergeAccount = async () => {
    if (!mergeEmail.trim()) {
      alert('병합할 과거 계정의 이메일 주소를 입력해주세요. (예: demo@fitness-tracker.local)');
      return;
    }
    if (!window.confirm(`[계정 병합 안내] '${mergeEmail.trim()}' 계정의 모든 식단, 운동, 인바디 기록을 현재 접속 중인 계정(${user?.email})으로 가져와 통합하시겠습니까?`)) {
      return;
    }
    try {
      setIsMerging(true);
      setMergeResult(null);
      const res = await api.post<{ status: string; message: string }>('/auth/merge-account', {
        source_email: mergeEmail.trim()
      });
      soundEngine.playSyncSuccessChime();
      setMergeResult(`✅ ${res.message}`);
      setMergeEmail('');
      alert(`✨ [계정 통합 성공]\n${res.message}\n\n'🏠 홈' 및 '📅 캘린더'로 가시면 두 계정의 데이터가 하나로 완벽히 합쳐진 것을 확인하실 수 있습니다!`);
    } catch (err: any) {
      alert(err.message || '계정 병합 중 오류가 발생했습니다.');
      setMergeResult(`❌ 실패: ${err.message || '계정을 찾을 수 없거나 병합에 실패했습니다.'}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await updateProfile({
        nickname: nickname.trim(),
        fasting_goal_hours: fastingGoal,
        diet_start_date: dietStart || undefined,
        theme_preference: theme,
      });
      localStorage.setItem('default_landing', landingPage);
      setSuccessMsg('설정이 성공적으로 저장되었습니다!');
    } catch (err: any) {
      alert(err.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const [isGarminSyncing, setIsGarminSyncing] = useState(false);

  const handleManualSyncAll = async () => {
    if (!window.confirm('Google Health Connect 및 삼성헬스의 과거 전체 인바디 데이터를 일괄 동기화하시겠습니까?')) return;
    try {
      setIsSyncing(true);
      await requestNotificationPermission();
      const res = await api.post<{ status: string; synced_days: number; new_records: number }>('/inbody/sync', {});
      soundEngine.playSyncSuccessChime();
      sendMobileNotification('📊 인바디 데이터 연동 완료!', `총 ${res.synced_days}일치의 기기 체성분 계측 이력이 수집되었습니다.`);
      alert(`✨ [동기화 완료] 총 ${res.synced_days}일치의 기기 계측 이력이 성공적으로 연동되었습니다! (신규 등록: ${res.new_records}건)\n'🏠 홈' 탭으로 이동하시면 AI 정밀 분석 보고서가 즉각 반영되어 있습니다.`);
    } catch (err: any) {
      alert(err.message || '동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGarminSyncAll = async () => {
    if (!window.confirm('가민 커넥트(Garmin Connect) 및 스마트 스포츠 워치의 트레이닝 기록을 동기화하시겠습니까?')) return;
    try {
      setIsGarminSyncing(true);
      await requestNotificationPermission();
      const res = await api.post<{ status: string; synced_workouts: number }>('/exercises/garmin-sync', {});
      soundEngine.playSyncSuccessChime();
      sendMobileNotification('⌚ 가민 스포츠 워치 동기화 완료!', `총 ${res.synced_workouts}건의 존2 러닝 및 HIIT 고강도 운동 데이터가 연동되었습니다.`);
      alert(`⌚ [가민 동기화 완료] 총 ${res.synced_workouts}건의 고강도 유산소 러닝 및 HIIT 운동 세션이 동기화되었습니다!\n'🏠 홈' 탭의 찐fit AI 분석 보고서에서 심박수 존2 및 VO2 Max 진단을 확인하세요.`);
    } catch (err: any) {
      alert(err.message || '가민 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsGarminSyncing(false);
    }
  };

  const handleTestSoundAndNotification = async () => {
    try {
      const granted = await requestNotificationPermission();
      soundEngine.playFastingVictorySound();
      if (granted) {
        sendMobileNotification('⚡ 찐fit 사운드 & 알림 테스트!', '축하합니다! 모바일 팝업 알림과 웅장한 사운드 멜로디가 정상적으로 작동 중입니다.');
        setTestStatus('✅ 웅장한 달성 사운드 및 상단 푸시 알림 전송 완료!');
      } else {
        setTestStatus('🔊 달성 사운드가 출력되었습니다! (푸시 알림은 브라우저 설정에서 허용해 주세요)');
      }
      setTimeout(() => setTestStatus(null), 6000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="settings-page">
      <h2 className="settings-header">⚙️ 찐fit 환경 설정</h2>

      <form onSubmit={handleSaveProfile} className="settings-grid">
        {/* Profile Section */}
        <div className="card settings-section">
          <h3 className="section-title">👤 사용자 프로필 & 초기 화면 설정</h3>
          
          <div className="form-group">
            <label>계정 이메일 (소셜 로그인)</label>
            <input type="text" className="input disabled-input" value={user?.email || ''} disabled />
            <span className="help-text">연동 제공자: {user?.provider.toUpperCase()}</span>
          </div>

          <div className="form-group">
            <label>🏠 로그인 시 기본 시작 화면 (첫 페이지 지정)</label>
            <select
              className="input"
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              style={{ background: 'var(--bg-input)', fontWeight: 'bold' }}
            >
              <option value="/overview" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🏠 홈 (AI 실황 상태 분석 리포트)</option>
              <option value="/calendar" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>📅 캘린더 (식단 & 운동 다이어리)</option>
              <option value="/timer" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>⏱️ 단식 타이머 (16:8 공복 트래커)</option>
              <option value="/settings" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>⚙️ 환경 설정</option>
            </select>
            <span className="help-text">로그인하거나 앱을 실행할 때 가장 먼저 표시될 메인 탭을 지정합니다.</span>
          </div>

          <div className="form-group">
            <label>닉네임 *</label>
            <input
              type="text"
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>


          <div className="form-group">
            <label>다이어트 및 트레이닝 시작 기준일</label>
            <input
              type="date"
              className="input"
              value={dietStart}
              onChange={(e) => setDietStart(e.target.value)}
            />
            <span className="help-text">이 날짜를 기준으로 체중 및 체성분 변화 추이 그래프가 그려집니다.</span>
          </div>
        </div>

        {/* Diet & Fasting Settings */}
        <div className="card settings-section">
          <h3 className="section-title">⏱️ 단식 및 식단 설정</h3>
          
          <div className="form-group">
            <label>기본 단식 목표 시간 (시간 단위)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <input
                type="number"
                className="input"
                value={fastingGoal}
                onChange={(e) => setFastingGoal(parseInt(e.target.value, 10) || 16)}
                min="1"
                max="72"
                step="1"
                style={{ background: 'var(--bg-input)', width: '120px', fontWeight: 'bold', fontSize: '16px' }}
              />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>시간</span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {[12, 14, 16, 18, 20, 24].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFastingGoal(preset)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: fastingGoal === preset ? 'var(--color-primary)' : 'var(--border-secondary)',
                    background: fastingGoal === preset ? 'rgba(45, 212, 168, 0.15)' : 'transparent',
                    color: fastingGoal === preset ? 'var(--color-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {preset}시간
                </button>
              ))}
            </div>
            <span className="help-text">타이머 가동 시 기본 목표 시간으로 자동 지정됩니다. (소수점 입력 가능)</span>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card settings-section">
          <h3 className="section-title">🎨 테마 및 디자인</h3>
          
          <div className="form-group">
            <label>화면 테마 모드</label>
            <div className="theme-toggle-group">
              <button
                type="button"
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                ☀️ 라이트 모드
              </button>
              <button
                type="button"
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                🌙 다크 모드 (추천)
              </button>
              <button
                type="button"
                className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                onClick={() => setTheme('system')}
              >
                🖥️ 시스템 설정 동기화
              </button>
            </div>
          </div>
        </div>

        {/* External Sync Section */}
        <div className="card settings-section">
          <h3 className="section-title">📡 외부 기기 및 스마트 워치 연동 관리</h3>
          
          <div className="sync-item">
            <div className="sync-info">
              <strong>📊 인바디 (Google Health API / 삼성헬스)</strong>
              <p>인바디 → 삼성헬스/헬스커넥트 → Google Fitness 경유 체성분 자동 연동</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary sync-btn"
              onClick={handleManualSyncAll}
              disabled={isSyncing}
            >
              {isSyncing ? '동기화 중...' : '🔄 전체 인바디 데이터 재동기화'}
            </button>
          </div>

          <div className="sync-item">
            <div className="sync-info">
              <strong>⌚ 스마트워치 활동량 (가민 커넥트 · 애플워치 · 갤럭시워치)</strong>
              <p>가민, 애플워치, 갤럭시워치 등 웨어러블 기기의 존2 러닝, VO2 Max, HIIT 운동 활동량 자동 연계</p>
            </div>
            <button
              type="button"
              className="btn btn-primary sync-btn"
              style={{ background: 'linear-gradient(135deg, #00B4D8, #0077B6)', border: 'none' }}
              onClick={handleGarminSyncAll}
              disabled={isGarminSyncing}
            >
              {isGarminSyncing ? '스마트워치 통신 중...' : '🔄 스마트워치 트레이닝 활동량 재동기화'}
            </button>
          </div>
        </div>

        {/* Google Fit Token Management Section */}
        <div className="card settings-section" style={{ borderLeft: '4px solid #10B981', marginTop: '24px' }}>
          <h3 className="section-title">🔑 구글 헬스 커넥트 (Google Fit) 토큰 관리</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.6, margin: '0 0 16px' }}>
            인바디 체성분 자동 연동을 위한 <strong>구글 피트니스 토큰(Refresh Token)</strong>을 직접 교체할 수 있습니다.<br />
            토큰이 만료되어 팝업이 뜨거나 연동이 끊어졌을 때 아래에서 새 토큰을 발급받아 붙여넣어 주세요!
          </p>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={googleFitToken}
              onChange={(e) => setGoogleFitToken(e.target.value)}
              placeholder="1//... 로 시작하는 새 토큰을 여기에 붙여넣으세요"
              style={{
                flex: 1, padding: '12px 14px', borderRadius: '10px',
                border: '2px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href="https://developers.google.com/oauthplayground/?step=1&scopes=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Ffitness.body.read"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '10px 16px', borderRadius: '8px', background: '#10B981', color: '#fff',
                fontWeight: 700, textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center'
              }}
            >
              🔗 새 토큰 발급소 열기
            </a>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!googleFitToken.trim() || isGoogleTokenSaving}
              onClick={handleSaveGoogleToken}
              style={{
                padding: '10px 16px', borderRadius: '8px',
                background: googleFitToken.trim() ? 'linear-gradient(135deg, #10B981, #059669)' : '#666',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: googleFitToken.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {isGoogleTokenSaving ? '토큰 검증 중...' : '💾 새 토큰 저장 및 즉시 연동'}
            </button>
          </div>

          {googleTokenMsg && (
            <div style={{ 
              marginTop: '12px', padding: '10px 14px', borderRadius: '8px', 
              background: googleTokenMsg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', 
              color: googleTokenMsg.startsWith('✅') ? '#10B981' : '#EF4444',
              fontSize: '13.5px', fontWeight: 600 
            }}>
              {googleTokenMsg}
            </div>
          )}
        </div>


        {/* PWA & Notification Test Section */}
        <div className="card settings-section" style={{ borderLeft: '4px solid var(--color-accent-500)' }}>
          <h3 className="section-title">📱 모바일 스마트폰 앱(PWA) 설치 & 🔔 알림 사운드 테스트</h3>
          
          <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 10px' }}>
              <strong>⚡ 찐fit을 스마트폰 홈 화면에 진짜 앱처럼 설치하세요!</strong> (주소창 숨김 및 1초 실행 지원)
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>🍏 <strong>아이폰 (iOS Safari)</strong>: 하단 중앙의 <strong>[공유 버튼 ⎋]</strong> 클릭 ➔ <strong>[홈 화면에 추가 ➕]</strong> 선택!</li>
              <li>🤖 <strong>갤럭시 (Android Chrome/삼성인터넷)</strong>: 상단 메뉴(፧) 또는 하단 안내의 <strong>[홈 화면에 추가] / [앱 설치]</strong> 선택!</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>🔔 사운드 & 모바일 푸시 알림 가동 테스트</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>단식 완료 및 동기화 시 재생되는 사운드 효과와 상단 팝업 알림을 시험합니다.</span>
            </div>
            <button
              type="button"
              onClick={handleTestSoundAndNotification}
              className="btn btn-primary"
              style={{ background: 'var(--color-accent-500)', color: '#0f172a', fontWeight: 'bold' }}
            >
              🔊 사운드 & 알림 팝업 전송 테스트
            </button>
          </div>

          {testStatus && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(45, 212, 168, 0.15)', color: '#2dd4a8', fontWeight: 700, borderRadius: 'var(--radius-md)', fontSize: '14px' }}>
              {testStatus}
            </div>
          )}
        </div>

        {/* Account & Data Merge Section */}
        <div className="card settings-section" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3 className="section-title">🔗 멀티 계정 통합 및 기록 합체 (Google ↔ Naver ↔ 이메일)</h3>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '14px' }}>
            <strong>동일인의 다른 소셜/메일 계정 데이터를 하나로 영구 병합합니다!</strong><br />
            이전에 '테스트 간편 계정(<code>demo@fitness-tracker.local</code>)'이나 구글/다른 이메일로 기록했던 식단·인바디·가민 운동 이력을 <strong>현재 접속 중인 본인 계정으로 100% 흡수 합체</strong>시킵니다.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="email"
              placeholder="병합할 이전 계정 이메일 (예: demo@fitness-tracker.local)"
              value={mergeEmail}
              onChange={(e) => setMergeEmail(e.target.value)}
              disabled={isMerging}
              className="input"
              style={{ flex: 1, minWidth: '260px', padding: '12px' }}
            />
            <button
              type="button"
              onClick={handleMergeAccount}
              disabled={isMerging}
              className="btn btn-primary"
              style={{ background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {isMerging ? '데이터 융합 중...' : '📥 과거 계정 데이터 흡수 병합하기'}
            </button>
          </div>

          {mergeResult && (
            <div style={{ marginTop: '12px', padding: '12px', background: mergeResult.startsWith('✅') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: mergeResult.startsWith('✅') ? '#3b82f6' : 'var(--color-danger)', fontWeight: 700, borderRadius: 'var(--radius-md)', fontSize: '14px', whiteSpace: 'pre-line' }}>
              {mergeResult}
            </div>
          )}
        </div>


        <div className="settings-footer">
          {successMsg && <div className="save-success">✨ {successMsg}</div>}
          <button type="submit" className="btn btn-primary save-btn" disabled={isSaving}>
            {isSaving ? '저장 중...' : '변경 사항 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
