import { useState } from 'react';
import { api } from '../../services/api';
import { FastingOut } from '../../types';

interface FastingEditFormProps {
  fastingData: FastingOut;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FastingEditForm({ fastingData, onClose, onSuccess }: FastingEditFormProps) {
  // Convert UTC datetime strings to local datetime-local input format (YYYY-MM-DDThh:mm)
  const formatForInput = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [startTime, setStartTime] = useState(formatForInput(fastingData.start_time));
  const [endTime, setEndTime] = useState(fastingData.end_time ? formatForInput(fastingData.end_time) : '');
  const [goalHours, setGoalHours] = useState(fastingData.goal_hours || 16);
  const [note, setNote] = useState(fastingData.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime) return;

    try {
      setIsSubmitting(true);
      
      const payload = {
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
        goal_hours: goalHours,
        note: note || undefined
      };

      await api.put(`/fasting/${fastingData.id}`, payload);
      onSuccess();
    } catch (err: any) {
      alert(err.message || '단식 기록 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          ⏱️ 단식 기록 수정
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label>단식 시작 시간 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="datetime-local"
              className="input"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>단식 종료 시간</label>
            <input
              type="datetime-local"
              className="input"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
              비워두면 아직 '진행중'인 단식으로 처리됩니다.
            </span>
          </div>

          <div className="form-group">
            <label>목표 시간 (시간)</label>
            <input
              type="number"
              className="input"
              value={goalHours}
              onChange={e => setGoalHours(parseInt(e.target.value, 10) || 16)}
              min="1"
              max="72"
              step="1"
              required
            />
          </div>

          <div className="form-group">
            <label>메모 <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(선택)</span></label>
            <input
              type="text"
              className="input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="예: 물만 마시면서 버팀"
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={!startTime || isSubmitting}>
              {isSubmitting ? '저장 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
