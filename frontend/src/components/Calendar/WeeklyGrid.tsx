import { useState, Fragment } from 'react';
import { WeeklyDashboard, DayData, MEAL_TYPE_LABELS, EXERCISE_TYPE_LABELS, MealRecord, ExerciseRecord, FastingOut, InBodyRecord } from '../../types';
import MealForm from '../Forms/MealForm';
import ExerciseForm from '../Forms/ExerciseForm';
import InBodyForm from '../Forms/InBodyForm';
import FastingEditForm from '../Forms/FastingEditForm';
import './WeeklyGrid.css';

const DAYS_KR = ['월', '화', '수', '목', '금', '토', '일'];
const CATEGORIES = ['inbody', 'breakfast', 'lunch', 'snack', 'dinner', 'exercise', 'fasting'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  inbody: '📊 인바디',
  breakfast: '🌅 아침',
  lunch: '☀️ 점심',
  snack: '🍪 간식',
  dinner: '🌙 저녁',
  exercise: '🏋️ 운동',
  fasting: '⏱️ 단식',
};

interface WeeklyGridProps {
  data: WeeklyDashboard;
  onDataChange: () => void;
}

export default function WeeklyGrid({ data, onDataChange }: WeeklyGridProps) {
  const [showMealForm, setShowMealForm] = useState<{ date: string; type: string; initialData?: MealRecord } | null>(null);
  const [showExerciseForm, setShowExerciseForm] = useState<{ date: string; initialData?: ExerciseRecord } | null>(null);
  const [showInBodyForm, setShowInBodyForm] = useState<{ date: string; initialData?: InBodyRecord } | null>(null);
  const [showFastingEditForm, setShowFastingEditForm] = useState<{ fastingData?: FastingOut, date?: string } | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const isToday = (dateStr: string) => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr === today;
  };

  const renderCellContent = (day: DayData, category: string) => {
    switch (category) {
      case 'inbody':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', justifyContent: 'space-between', minHeight: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {day.inbody && (
                <div 
                  className="cell-inbody"
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onClick={() => setShowInBodyForm({ date: day.date, initialData: day.inbody! })}
                  title="체중 기록 수정 / 삭제"
                >
                  <span className="inbody-value">{day.inbody.weight}kg</span>
                  {day.inbody.skeletal_muscle && <span className="inbody-detail">근 {day.inbody.skeletal_muscle}</span>}
                  {day.inbody.body_fat_mass && <span className="inbody-detail">지 {day.inbody.body_fat_mass}</span>}
                </div>
              )}
            </div>
            {!day.inbody && (
              <button
                className="cell-add-btn"
                style={{ marginTop: '4px', padding: '3px 0', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.2)' }}
                onClick={() => setShowInBodyForm({ date: day.date })}
                title="체중 수동 기록 추가"
              >
                + 체중
              </button>
            )}
          </div>
        );

      case 'breakfast':
      case 'lunch':
      case 'snack':
      case 'dinner': {
        const meals = day.meals.filter(m => m.meal_type === category);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', justifyContent: 'space-between', minHeight: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {meals.map(m => (
                <div 
                  key={m.id} 
                  className={`cell-meal meal-${category}`}
                  style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.15s' }}
                  onClick={() => setShowMealForm({ date: day.date, type: category, initialData: m })}
                  title="클릭하여 수정 또는 삭제"
                >
                  <span className="meal-desc">{m.description}</span>
                  {m.meal_time && <span className="meal-time">{String(m.meal_time).slice(0, 5)}</span>}
                </div>
              ))}
            </div>
            <button
              className="cell-add-btn"
              style={{ marginTop: '4px', opacity: meals.length > 0 ? 0.7 : 1, padding: '3px 0', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.2)' }}
              onClick={() => setShowMealForm({ date: day.date, type: category })}
              title={`${MEAL_TYPE_LABELS[category]} 기록 추가`}
            >
              + {meals.length > 0 ? '추가' : ''}
            </button>
          </div>
        );
      }

      case 'exercise': {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', justifyContent: 'space-between', minHeight: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {day.exercises.map(e => (
                <div 
                  key={e.id} 
                  className={`cell-exercise type-${e.exercise_type}`}
                  style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.15s' }}
                  onClick={() => setShowExerciseForm({ date: day.date, initialData: e })}
                  title="클릭하여 수정 또는 삭제"
                >
                  <span className="exercise-type">{EXERCISE_TYPE_LABELS[e.exercise_type] || e.exercise_type}</span>
                  {e.duration_minutes && <span className="exercise-duration">{e.duration_minutes}분</span>}
                  {e.description && <span className="exercise-desc" style={{ display: 'block', fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>{e.description}</span>}
                </div>
              ))}
            </div>
            <button
              className="cell-add-btn"
              style={{ marginTop: '4px', opacity: day.exercises.length > 0 ? 0.7 : 1, padding: '3px 0', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.2)' }}
              onClick={() => setShowExerciseForm({ date: day.date })}
              title="운동 기록 추가"
            >
              + {day.exercises.length > 0 ? '추가' : ''}
            </button>
          </div>
        );
      }

      case 'fasting': {
        if (day.fasting) {
          const f = day.fasting;
          return (
            <div 
              className={`cell-fasting ${f.is_completed ? 'completed' : ''}`}
              style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
              onClick={() => setShowFastingEditForm({ fastingData: f })}
              title="단식 기록 수정"
            >
              {f.actual_hours ? (
                <span className="fasting-hours">{f.actual_hours.toFixed(1)}h</span>
              ) : (
                <span className="fasting-active">진행중 🔥</span>
              )}
              <span className="fasting-goal">목표 {f.goal_hours}h</span>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <button
              className="cell-add-btn"
              style={{ padding: '3px 0', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.2)' }}
              onClick={() => setShowFastingEditForm({ date: day.date })}
              title="과거 단식 수동 기록 추가"
            >
              + 단식
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <div className="weekly-grid">
        {/* Header row */}
        <div className="grid-header-cell category-label" />
        {data.days.map((day, i) => (
          <div key={day.date} className={`grid-header-cell ${isToday(day.date) ? 'today' : ''}`}>
            <span className="day-name">{DAYS_KR[i]}</span>
            <span className="day-date">{formatDate(day.date)}</span>
          </div>
        ))}

        {/* Data rows */}
        {CATEGORIES.map(category => (
          <Fragment key={category}>
            <div className="grid-cell category-label">
              {CATEGORY_LABELS[category]}
            </div>
            {data.days.map(day => (
              <div
                key={`${day.date}-${category}`}
                className={`grid-cell ${isToday(day.date) ? 'today-col' : ''}`}
              >
                {renderCellContent(day, category)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      {/* Meal Form Modal */}
      {showMealForm && (
        <div className="modal-backdrop" onClick={() => setShowMealForm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              {MEAL_TYPE_LABELS[showMealForm.type]} {showMealForm.initialData ? '기록 수정 / 삭제' : '기록 추가'}
            </h3>
            <MealForm
              date={showMealForm.date}
              mealType={showMealForm.type}
              initialData={showMealForm.initialData}
              onSave={() => { setShowMealForm(null); onDataChange(); }}
              onCancel={() => setShowMealForm(null)}
            />
          </div>
        </div>
      )}

      {/* Exercise Form Modal */}
      {showExerciseForm && (
        <div className="modal-backdrop" onClick={() => setShowExerciseForm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              운동 {showExerciseForm.initialData ? '기록 수정 / 삭제' : '기록 추가'}
            </h3>
            <ExerciseForm
              date={showExerciseForm.date}
              initialData={showExerciseForm.initialData}
              onSave={() => { setShowExerciseForm(null); onDataChange(); }}
              onCancel={() => setShowExerciseForm(null)}
            />
          </div>
        </div>
      )}

      {/* InBody / Weight Form Modal */}
      {showInBodyForm && (
        <InBodyForm 
          date={showInBodyForm.date}
          initialData={showInBodyForm.initialData}
          onClose={() => setShowInBodyForm(null)}
          onSuccess={() => { setShowInBodyForm(null); onDataChange(); }} 
        />
      )}

      {/* Fasting Edit Form Modal */}
      {showFastingEditForm && (
        <FastingEditForm 
          fastingData={showFastingEditForm.fastingData}
          date={showFastingEditForm.date}
          onClose={() => setShowFastingEditForm(null)}
          onSuccess={() => { setShowFastingEditForm(null); onDataChange(); }}
        />
      )}
    </>
  );
}
