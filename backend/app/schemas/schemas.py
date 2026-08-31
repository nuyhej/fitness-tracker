from datetime import datetime, date, time
from typing import Optional
from pydantic import BaseModel, EmailStr


# --- User ---
class UserOut(BaseModel):
    id: int
    email: str
    nickname: str
    avatar_url: Optional[str] = None
    provider: str
    diet_start_date: Optional[date] = None
    fasting_goal_hours: int = 16
    theme_preference: str = "system"
    timezone: str = "Asia/Seoul"
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    diet_start_date: Optional[date] = None
    fasting_goal_hours: Optional[int] = None
    theme_preference: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None


# --- Meal ---
class MealCreate(BaseModel):
    date: Optional[date] = None
    meal_type: str  # breakfast/lunch/snack/dinner
    description: str
    meal_time: Optional[str] = None  # HH:MM format
    tags: Optional[str] = None  # JSON array string


class MealUpdate(BaseModel):
    description: Optional[str] = None
    meal_time: Optional[str] = None
    tags: Optional[str] = None


class MealOut(BaseModel):
    id: int
    user_id: int
    date: date
    meal_type: str
    description: str
    meal_time: Optional[time] = None
    tags: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Exercise ---
class ExerciseCreate(BaseModel):
    date: Optional[date] = None
    exercise_type: str  # fasted_cardio/weight/treadmill/outdoor_run/other
    duration_minutes: Optional[int] = None
    description: Optional[str] = None


class ExerciseUpdate(BaseModel):
    exercise_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None


class ExerciseOut(BaseModel):
    id: int
    user_id: int
    date: date
    exercise_type: str
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    source: str = "manual"
    created_at: datetime

    model_config = {"from_attributes": True}


# --- InBody ---
class InBodyCreate(BaseModel):
    measured_at: Optional[datetime] = None
    weight: float
    skeletal_muscle: Optional[float] = None
    body_fat_mass: Optional[float] = None
    body_fat_pct: Optional[float] = None
    bmi: Optional[float] = None
    basal_metabolic_rate: Optional[int] = None
    visceral_fat_level: Optional[int] = None
    total_body_water: Optional[float] = None


class InBodyOut(BaseModel):
    id: int
    user_id: int
    measured_at: datetime
    weight: float
    skeletal_muscle: Optional[float] = None
    body_fat_mass: Optional[float] = None
    body_fat_pct: Optional[float] = None
    bmi: Optional[float] = None
    basal_metabolic_rate: Optional[int] = None
    visceral_fat_level: Optional[int] = None
    total_body_water: Optional[float] = None
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InBodyTrendPoint(BaseModel):
    measured_at: datetime
    weight: float
    skeletal_muscle: Optional[float] = None
    body_fat_mass: Optional[float] = None
    body_fat_pct: Optional[float] = None


# --- Fasting ---
class FastingStart(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    goal_hours: Optional[int] = None  # Uses user's default if not provided
    note: Optional[str] = None


class FastingEnd(BaseModel):
    end_time: Optional[datetime] = None


class FastingUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    goal_hours: Optional[int] = None
    note: Optional[str] = None


class FastingOut(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    goal_hours: int
    actual_hours: Optional[float] = None
    is_completed: bool = False
    note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Dashboard ---
class DayData(BaseModel):
    date: date
    meals: list[MealOut] = []
    exercises: list[ExerciseOut] = []
    inbody: Optional[InBodyOut] = None
    fasting: Optional[FastingOut] = None


class WeeklyDashboard(BaseModel):
    week_start: date
    week_end: date
    days: list[DayData]


class MonthlyDayBadge(BaseModel):
    date: date
    has_meals: bool = False
    has_exercise: bool = False
    has_inbody: bool = False
    has_fasting: bool = False
    weight: Optional[float] = None


class MonthlyDashboard(BaseModel):
    year: int
    month: int
    days: list[MonthlyDayBadge]
