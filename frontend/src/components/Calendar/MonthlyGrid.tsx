import { MonthlyDashboard, MonthlyDayBadge } from '../../types';
import './MonthlyGrid.css';

interface MonthlyGridProps {
  data: MonthlyDashboard;
  onDateClick: (date: string) => void;
}

const DAYS_KR = ['월', '화', '수', '목', '금', '토', '일'];

export default function MonthlyGrid({ data, onDateClick }: MonthlyGridProps) {
  // 이번 달 1일의 요일 인덱스 구하기 (월요일 = 0, 일요일 = 6)
  const getFirstDayOffset = () => {
    if (data.days.length === 0) return 0;
    const firstDayDate = new Date(data.days[0].date);
    const day = firstDayDate.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const offset = getFirstDayOffset();
  const emptyCells = Array.from({ length: offset }, (_, i) => i);

  const isToday = (dateStr: string) => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr === today;
  };

  return (
    <div className="monthly-grid-container">
      <div className="monthly-grid-header">
        {DAYS_KR.map((day) => (
          <div key={day} className="monthly-header-cell">
            {day}
          </div>
        ))}
      </div>

      <div className="monthly-grid-body">
        {emptyCells.map((i) => (
          <div key={`empty-${i}`} className="monthly-cell empty-cell" />
        ))}

        {data.days.map((day: MonthlyDayBadge) => {
          const dayNum = parseInt(day.date.split('-')[2], 10);
          const currentIsToday = isToday(day.date);

          return (
            <div
              key={day.date}
              className={`monthly-cell ${currentIsToday ? 'today-cell' : ''}`}
              onClick={() => onDateClick(day.date)}
            >
              <div className="cell-top">
                <span className={`day-number ${currentIsToday ? 'today-badge' : ''}`}>
                  {dayNum}
                </span>
                {day.weight && (
                  <span className="weight-badge">{day.weight}kg</span>
                )}
              </div>

              <div className="cell-indicators">
                {day.has_meals && <span className="indicator icon-meal" title="식단 기록">🍽️</span>}
                {day.has_exercise && <span className="indicator icon-exercise" title="운동 기록">🏋️</span>}
                {day.has_inbody && <span className="indicator icon-inbody" title="인바디 측정">📊</span>}
                {day.has_fasting && <span className="indicator icon-fasting" title="단식 기록">⏱️</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
