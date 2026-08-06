import { useState } from 'react';
import { api } from '../../services/api';
import { EXERCISE_TYPE_LABELS, ExerciseRecord } from '../../types';

interface ExerciseFormProps {
  date: string;
  initialData?: ExerciseRecord;
  onSave: () => void;
  onCancel: () => void;
}

const EXERCISE_TYPES = ['fasted_cardio', 'weight', 'treadmill', 'outdoor_run', 'other'] as const;

export default function ExerciseForm({ date, initialData, onSave, onCancel }: ExerciseFormProps) {
  const [exerciseType, setExerciseType] = useState<string>(initialData?.exercise_type || 'fasted_cardio');
  const [duration, setDuration] = useState<string>(initialData?.duration_minutes ? String(initialData.duration_minutes) : '40');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isEditMode && initialData) {
        await api.put(`/exercises/${initialData.id}`, {
          exercise_type: exerciseType,
          duration_minutes: duration ? parseInt(duration, 10) : null,
          description: description.trim() || null,
        });
      } else {
        await api.post('/exercises', {
          date,
          exercise_type: exerciseType,
          duration_minutes: duration ? parseInt(duration, 10) : null,
          description: description.trim() || null,
        });
      }
      onSave();
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !window.confirm('이 운동 기록을 정말 삭제하시겠습니까?')) return;
    setIsLoading(true);
    try {
      await api.delete(`/exercises/${initialData.id}`);
      onSave();
    } catch (err: any) {
      setError(err.message || '삭제 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        날짜: {date}
        {isEditMode && <span style={{ color: 'var(--color-accent-400)', marginLeft: '8px' }}>[운동 수정 모드]</span>}
      </div>

      {error && (
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
          ⚠️ {error}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
          운동 종목 *
        </label>
        <select
          className="input"
          value={exerciseType}
          onChange={(e) => setExerciseType(e.target.value)}
          style={{ background: 'var(--bg-input)' }}
        >
          {EXERCISE_TYPES.map((type) => (
            <option key={type} value={type} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              {EXERCISE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
          운동 시간 (분, 선택)
        </label>
        <input
          type="number"
          className="input"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="예: 40"
          min="1"
          max="1440"
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
          메모 (강도, 무게, 심박수 등 선택)
        </label>
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="예: 인터벌 러닝 속도 8~12km/h, 땀 많이 남"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
        {isEditMode ? (
          <button
            type="button"
            className="btn"
            style={{ background: 'rgba(235, 77, 75, 0.2)', color: '#eb4d4b', border: '1px solid #eb4d4b' }}
            onClick={handleDelete}
            disabled={isLoading}
          >
            🗑️ 삭제
          </button>
        ) : <div />}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? '저장 중...' : isEditMode ? '수정 내용 저장' : '저장하기'}
          </button>
        </div>
      </div>
    </form>
  );
}
