import { useState } from 'react';
import { api } from '../../services/api';
import { InBodyRecord } from '../../types';

interface InBodyFormProps {
  date: string;
  initialData?: InBodyRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InBodyForm({ date, initialData, onClose, onSuccess }: InBodyFormProps) {
  const isEditMode = !!initialData;
  const [weight, setWeight] = useState(initialData ? String(initialData.weight) : '');
  const [muscle, setMuscle] = useState(initialData?.skeletal_muscle ? String(initialData.skeletal_muscle) : '');
  const [fat, setFat] = useState(initialData?.body_fat_mass ? String(initialData.body_fat_mass) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    try {
      setIsSubmitting(true);
      
      const payload = {
        measured_at: `${date}T09:00:00Z`,
        weight: parseFloat(weight),
        skeletal_muscle: muscle ? parseFloat(muscle) : undefined,
        body_fat_mass: fat ? parseFloat(fat) : undefined,
      };

      if (isEditMode && initialData) {
        await api.put(`/inbody/${initialData.id}`, payload);
      } else {
        await api.post('/inbody', payload);
      }
      onSuccess();
    } catch (err: any) {
      alert(err.message || '체중 기록 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !window.confirm('이 체중 기록을 정말 삭제하시겠습니까?')) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/inbody/${initialData.id}`);
      onSuccess();
    } catch (err: any) {
      alert(err.message || '삭제에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          ⚖️ 체중 {isEditMode ? '수정 / 삭제' : '수동 기록'}
        </h2>
        
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {date}의 체중과 체성분을 {isEditMode ? '수정' : '기록'}합니다.
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            {isEditMode ? (
              <button
                type="button"
                className="btn"
                style={{ background: 'rgba(235, 77, 75, 0.2)', color: '#eb4d4b', border: '1px solid #eb4d4b' }}
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                🗑️ 삭제
              </button>
            ) : <div />}
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
              <button type="submit" className="btn btn-primary" disabled={!weight || isSubmitting}>
                {isSubmitting ? '저장 중...' : isEditMode ? '수정 저장' : '저장하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
