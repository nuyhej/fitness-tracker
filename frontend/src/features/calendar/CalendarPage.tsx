import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WeeklyDashboard, MonthlyDashboard } from '../../types';
import WeeklyGrid from '../../components/Calendar/WeeklyGrid';
import MonthlyGrid from '../../components/Calendar/MonthlyGrid';
import './CalendarPage.css';

type ViewMode = 'weekly' | 'monthly';

function formatDateParam(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weeklyData, setWeeklyData] = useState<WeeklyDashboard | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [viewMode, currentDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (viewMode === 'weekly') {
        const data = await api.get<WeeklyDashboard>(
          `/dashboard/weekly?date=${formatDateParam(currentDate)}`
        );
        setWeeklyData(data);
      } else {
        const data = await api.get<MonthlyDashboard>(
          `/dashboard/monthly?year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`
        );
        setMonthlyData(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'weekly') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      }
      return newDate;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const getHeaderTitle = () => {
    if (viewMode === 'weekly' && weeklyData) {
      const start = new Date(weeklyData.week_start);
      const end = new Date(weeklyData.week_end);
      return `${start.getMonth() + 1}/${start.getDate()} — ${end.getMonth() + 1}/${end.getDate()}`;
    }
    return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn btn-secondary" onClick={() => navigateDate('prev')}>
            ← 이전
          </button>
          <h2 className="calendar-title">{getHeaderTitle()}</h2>
          <button className="btn btn-secondary" onClick={() => navigateDate('next')}>
            다음 →
          </button>
        </div>

        <div className="calendar-controls">
          <button className="btn btn-secondary" onClick={goToToday}>오늘</button>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`}
              onClick={() => setViewMode('weekly')}
            >
              주간
            </button>
            <button
              className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setViewMode('monthly')}
            >
              월간
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-body">

        {isLoading ? (
          <div className="loading-state">
            <span className="gradient-text">데이터 로딩 중...</span>
          </div>
        ) : viewMode === 'weekly' && weeklyData ? (
          <WeeklyGrid data={weeklyData} onDataChange={loadData} />
        ) : viewMode === 'monthly' && monthlyData ? (
          <MonthlyGrid data={monthlyData} onDateClick={(date) => {
            setCurrentDate(new Date(date));
            setViewMode('weekly');
          }} />
        ) : null}
      </div>
    </div>
  );
}
