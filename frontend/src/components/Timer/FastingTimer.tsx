import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FastingRecord } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { soundEngine, requestNotificationPermission, sendMobileNotification } from '../../utils/notifications';
import './FastingTimer.css';

interface FastingTimerProps {
  onFastingEnd?: () => void;
}

export default function FastingTimer({ onFastingEnd }: FastingTimerProps) {
  const { user } = useAuth();
  const [activeFasting, setActiveFasting] = useState<FastingRecord | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('');
  const [customGoalHours, setCustomGoalHours] = useState(user?.fasting_goal_hours || 16);

  useEffect(() => {
    fetchActiveFasting();
  }, []);

  useEffect(() => {
    if (user?.fasting_goal_hours) {
      setCustomGoalHours(user.fasting_goal_hours);
    }
  }, [user]);

  useEffect(() => {
    let interval: any = null;
    if (activeFasting && !activeFasting.end_time) {
      const start = new Date(activeFasting.start_time).getTime();
      const updateElapsed = () => {
        const now = new Date().getTime();
        setElapsedSec(Math.max(0, Math.floor((now - start) / 1000)));
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeFasting]);

  const fetchActiveFasting = async () => {
    try {
      const res = await api.get<FastingRecord | null>('/fasting/active');
      setActiveFasting(res || null);
    } catch (err) {
      console.error('Failed to fetch active fasting:', err);
    }
  };

  const handleStartFasting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await requestNotificationPermission();
      soundEngine.playSyncSuccessChime(); // Responsive audio feedback on mobile
      const startDt = startTimeInput ? new Date(startTimeInput).toISOString() : new Date().toISOString();
      await api.post('/fasting/start', {
        start_time: startDt,
        goal_hours: customGoalHours,
      });
      setShowStartModal(false);
      await fetchActiveFasting();
      sendMobileNotification('🔥 찐fit 단식 타이머 가동!', `${customGoalHours}시간 간헐적 단식 체지방 연소 모드가 시작되었습니다.`);
      if (onFastingEnd) onFastingEnd();
    } catch (err: any) {
      alert(err.message || '단식 시작에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndFasting = async () => {
    if (!activeFasting) return;
    if (!window.confirm('단식을 종료하시겠습니까? 기록이 캘린더에 저장됩니다.')) return;

    setIsLoading(true);
    try {
      await api.post(`/fasting/${activeFasting.id}/end`, {
        end_time: new Date().toISOString(),
      });
      soundEngine.playFastingVictorySound();
      sendMobileNotification('🎉 찐fit 간헐적 단식 완료!', `목표 공복 시간을 훌륭히 마쳤습니다! 캘린더 다이어리에 성공 기록이 적재되었습니다.`);
      setActiveFasting(null);
      if (onFastingEnd) onFastingEnd();
    } catch (err: any) {
      alert(err.message || '단식 종료에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };


  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goalSec = (activeFasting?.goal_hours || user?.fasting_goal_hours || 16) * 3600;
  const progressPct = Math.min(100, Math.floor((elapsedSec / goalSec) * 100));
  const isGoalReached = elapsedSec >= goalSec;

  // Circle animation parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="fasting-card glass-card">
      <div className="fasting-info">
        <div className="fasting-status-badge">
          {activeFasting ? (isGoalReached ? '🎉 목표 달성! 유지 중' : '🔥 공복 상태 유지 중') : '🟢 식사 가능 시간 / 휴식 중'}
        </div>

        <h3 className="fasting-title">
          {activeFasting ? (
            <span>현재 <strong className="gradient-text">{formatTime(elapsedSec)}</strong> 경과</span>
          ) : (
            <span>단식을 시작하여 체지방 연소를 촉진하세요</span>
          )}
        </h3>

        <p className="fasting-meta">
          목표 시간: <strong>{activeFasting?.goal_hours || user?.fasting_goal_hours || 16}시간</strong> 
          {activeFasting && ` (시작: ${new Date(activeFasting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
        </p>

        <div className="fasting-action-group">
          {activeFasting ? (
            <button className="btn btn-primary end-btn" onClick={handleEndFasting} disabled={isLoading}>
              ⏹️ 단식 종료 및 기록 저장
            </button>
          ) : (
            <button
              className="btn btn-primary start-btn"
              onClick={() => {
                const now = new Date();
                // string formatted for datetime-local (YYYY-MM-DDTHH:MM)
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                setStartTimeInput(now.toISOString().slice(0, 16));
                setShowStartModal(true);
              }}
            >
              ▶️ 단식 타이머 시작
            </button>
          )}
        </div>
      </div>

      <div className="fasting-progress">
        <svg width="140" height="140" viewBox="0 0 140 140" className="progress-svg">
          <circle
            cx="70" cy="70" r={radius}
            className="progress-bg"
            strokeWidth="10" fill="none"
          />
          <circle
            cx="70" cy="70" r={radius}
            className={`progress-bar ${isGoalReached ? 'goal-reached' : ''}`}
            strokeWidth="10" fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={activeFasting ? strokeDashoffset : circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="progress-label">
          <span className="progress-val">{activeFasting ? `${progressPct}%` : '0%'}</span>
          <span className="progress-sub">{isGoalReached ? '달성 완료' : '진행률'}</span>
        </div>
      </div>

      {/* Start Modal */}
      {showStartModal && (
        <div className="modal-backdrop" onClick={() => setShowStartModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>⏱️ 단식 시작 설정</h3>
            <form onSubmit={handleStartFasting} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
                  시작 시간 (마지막 식사 완료 시간) *
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={startTimeInput}
                  onChange={(e) => setStartTimeInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
                  단식 목표 시간 (시간 단위) *
                </label>
                <select
                  className="input"
                  value={customGoalHours}
                  onChange={(e) => setCustomGoalHours(parseInt(e.target.value, 10))}
                  style={{ background: 'var(--bg-input)' }}
                >
                  <option value={12}>12시간 (초급 / 12:12 간헐적 단식)</option>
                  <option value={16}>16시간 (추천 / 16:8 국민 간헐적 단식)</option>
                  <option value={18}>18시간 (심화 / 18:6 단식)</option>
                  <option value={20}>20시간 (전사 다이어트 / 20:4)</option>
                  <option value={24}>24시간 (하루 한 끼 단식)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStartModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? '시작 중...' : '타이머 시작'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
