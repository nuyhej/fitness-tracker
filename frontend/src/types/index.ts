// === TypeScript Type Definitions ===

export interface User {
  id: number;
  email: string;
  nickname: string;
  avatar_url?: string;
  provider: string;
  diet_start_date?: string;
  fasting_goal_hours: number;
  theme_preference: 'light' | 'dark' | 'system';
  created_at: string;
}

export interface Meal {
  id: number;
  user_id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  description: string;
  meal_time?: string;
  tags?: string;
  created_at: string;
}
export type MealRecord = Meal;

export interface Exercise {
  id: number;
  user_id: number;
  date: string;
  exercise_type: 'fasted_cardio' | 'weight' | 'treadmill' | 'outdoor_run' | 'other';
  duration_minutes?: number;
  description?: string;
  source: string;
  created_at: string;
}
export type ExerciseRecord = Exercise;

export interface InBodyRecord {
  id: number;
  user_id: number;
  measured_at: string;
  weight: number;
  skeletal_muscle?: number | null;
  body_fat_mass?: number | null;
  body_fat_pct?: number;
  bmi?: number;
  basal_metabolic_rate?: number;
  visceral_fat_level?: number;
  total_body_water?: number;
  source: string;
  created_at: string;
}

export interface InBodyTrendPoint {
  measured_at: string;
  weight: number;
  skeletal_muscle?: number | null;
  body_fat_mass?: number | null;
  body_fat_pct?: number;
}

export interface FastingRecord {
  id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  goal_hours: number;
  actual_hours?: number;
  is_completed: boolean;
  note?: string;
  created_at: string;
}

export interface DayData {
  date: string;
  meals: Meal[];
  exercises: Exercise[];
  inbody?: InBodyRecord;
  fasting?: FastingRecord;
}

export interface WeeklyDashboard {
  week_start: string;
  week_end: string;
  days: DayData[];
}

export interface MonthlyDayBadge {
  date: string;
  has_meals: boolean;
  has_exercise: boolean;
  has_inbody: boolean;
  has_fasting: boolean;
  weight?: number;
}

export interface MonthlyDashboard {
  year: number;
  month: number;
  days: MonthlyDayBadge[];
}

// Meal type labels in Korean
export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '아침',
  lunch: '점심',
  snack: '간식',
  dinner: '저녁',
};

// Exercise type labels in Korean
export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  fasted_cardio: '공복유산소',
  weight: '웨이트',
  treadmill: '러닝(트레드밀)',
  outdoor_run: '러닝(야외)',
  other: '기타',
};

export type ThemeMode = 'light' | 'dark' | 'system';
