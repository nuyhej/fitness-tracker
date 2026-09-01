import { useState } from 'react';
import { api } from '../../services/api';

interface InBodyFormProps {
  date: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InBodyForm({ date, onClose, onSuccess }: InBodyFormProps) {
  const [weight, setWeight] = useState('');
  const [muscle, setMuscle] = useState('');
  const [fat, setFat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    try {
      setIsSubmitting(true);
      
      const payload = {
        measured_at: `${date}T09:00:00Z`, // Default to 9am UTC
        weight: parseFloat(weight),
        skeletal_muscle: muscle ? parseFloat(muscle) : undefined,
        body_fat_mass: fat ? parseFloat(fat) : undefined,
      };

      await api.post('/inbody', payload);
      onSuccess();
    } catch (err: any) {
      alert(err.message || '체중 기록 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          ⚖️ 체중 수동 기록
        </h2>
        
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {date}의 체중과 체성분을 기록합니다.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label>체중 (kg) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="number"
              className="input"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="예: 75.5"
              step="0.1"
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>골격근량 (kg) <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(선택)</span></label>
              <input
                type="number"
                className="input"
                value={muscle}
                onChange={e => setMuscle(e.target.value)}
                placeholder="예: 33.2"
                step="0.1"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>체지방량 (kg) <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(선택)</span></label>
              <input
                type="number"
                className="input"
                value={fat}
                onChange={e => setFat(e.target.value)}
                placeholder="예: 15.4"
                step="0.1"
              />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={!weight || isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
