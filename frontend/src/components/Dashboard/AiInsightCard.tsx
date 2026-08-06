import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './AiInsightCard.css';

interface AiAnalysisResult {
  date: string;
  status_badge: string;
  status_code: 'warning' | 'excellent' | 'info' | 'stable';
  title: string;
  summary: string;
  recommendations: string[];
  metrics: {
    latest_weight: number | null;
    weight_diff: number;
    fat_diff: number;
    analyzed_meals_count: number;
    analyzed_exercises_count: number;
  };
}

interface Props {
  selectedDate?: string;
  refreshTrigger?: number;
}

export default function AiInsightCard({ selectedDate, refreshTrigger = 0 }: Props) {
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    try {
      setIsLoading(true);
      const query = selectedDate ? `?date=${selectedDate}` : '';
      const data = await api.get<AiAnalysisResult>(`/analysis/daily${query}`);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to fetch AI diagnosis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [selectedDate, refreshTrigger]);

  const handleQuickSync = async () => {
    try {
      setIsSyncing(true);
      setSyncMsg('Google Health & 삼성헬스 데이터 동기화 진행 중...');
      await api.post('/inbody/sync', {});
      setSyncMsg('✓ 30일치 인바디 및 기기 체성분 이력 동기화 완료!');
      fetchAnalysis();
      setTimeout(() => setSyncMsg(null), 5000);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncMsg('동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading && !analysis) {
    return (
      <div className="ai-insight-card glass-card skeleton">
        <div className="skeleton-pulse">⚡ 찐fit AI 스마트 상태 분석 엔진 가동 중...</div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className={`ai-insight-card glass-card status-${analysis.status_code}`}>
      <div className="ai-header">
        <div className="ai-badge-group">
          <span className="ai-robot-icon">⚡</span>
          <span className="ai-engine-tag">🏠 홈 — 찐fit AI 실황 분석</span>
        </div>
        <div className="ai-actions-row">
          {analysis.status_code === 'info' && (
            <button
              className="btn-quick-sync"
              onClick={handleQuickSync}
              disabled={isSyncing}
            >
              {isSyncing ? '🔄 동기화 중...' : '📥 30일 인바디·삼성헬스 일과 동기화'}
            </button>
          )}
          <span className={`status-pill pill-${analysis.status_code}`}>
            {analysis.status_badge}
          </span>
        </div>
      </div>

      {syncMsg && (
        <div className="ai-sync-toast">
          {syncMsg}
        </div>
      )}

      <h3 className="ai-title">{analysis.title}</h3>
      <p className="ai-summary">{analysis.summary}</p>

      <div className="ai-recommendations-box">
        <h4 className="rec-title">📋 찐fit 맞춤 솔루션 & 실천 가이드</h4>
        <ul className="rec-list">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="rec-item">{rec}</li>
          ))}
        </ul>
      </div>

      <div className="ai-metrics-footer">
        <span className="metric-tag">
          ⚖️ 최근 체중: {analysis.metrics.latest_weight ? `${analysis.metrics.latest_weight}kg` : '데이터 없음'}
        </span>
        <span className="metric-tag">
          📈 전회 대비 변동: {analysis.metrics.weight_diff > 0 ? `+${analysis.metrics.weight_diff}kg` : `${analysis.metrics.weight_diff}kg`}
        </span>
        <span className="metric-tag">
          🍽️ 분석 식단: {analysis.metrics.analyzed_meals_count}건
        </span>
        <span className="metric-tag">
          💪 분석 운동: {analysis.metrics.analyzed_exercises_count}건
        </span>
      </div>
    </div>
  );
}
