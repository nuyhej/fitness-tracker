import { useState } from 'react';
import { api } from '../../services/api';
import { MEAL_TYPE_LABELS, MealRecord } from '../../types';

interface MealFormProps {
  date: string;
  mealType: string;
  initialData?: MealRecord;
  onSave: () => void;
  onCancel: () => void;
}

const QUICK_TAGS = ['단백질 쉐이크', '저탄수화물식', '현미밥 2/3', '닭가슴살', '샐러드', '그릭요거트', '방탄커피', '단식'];

export default function MealForm({ date, mealType, initialData, onSave, onCancel }: MealFormProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [mealTime, setMealTime] = useState(initialData?.meal_time ? String(initialData.meal_time).slice(0, 5) : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!initialData;

  const handleTagClick = (tag: string) => {
    if (!description) {
      setDescription(tag);
    } else {
      setDescription(`${description}, ${tag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('식단 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEditMode && initialData) {
        await api.put(`/meals/${initialData.id}`, {
          description: description.trim(),
          meal_time: mealTime || null,
        });
      } else {
        await api.post('/meals', {
          date,
          meal_type: mealType,
          description: description.trim(),
          meal_time: mealTime || null,
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
    if (!initialData || !window.confirm('이 식단 기록을 정말 삭제하시겠습니까?')) return;
    setIsLoading(true);
    try {
      await api.delete(`/meals/${initialData.id}`);
      onSave();
    } catch (err: any) {
      setError(err.message || '삭제 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        날짜: {date} | 끼니: <strong>{MEAL_TYPE_LABELS[mealType] || mealType}</strong>
        {isEditMode && <span style={{ color: 'var(--color-accent-400)', marginLeft: '8px' }}>[수정 모드]</span>}
      </div>

      {error && (
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
          ⚠️ {error}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
          빠른 태그
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: 'var(--text-xs)', padding: '2px var(--space-2)' }}
              onClick={() => handleTagClick(tag)}
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
          식단 내용 *
        </label>
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="예: 단백질 쉐이크 1잔, 아몬드 10알"
          required
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
          섭취 시간 (단식 계산용, 선택)
        </label>
        <input
          type="time"
          className="input"
          value={mealTime}
          onChange={(e) => setMealTime(e.target.value)}
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
