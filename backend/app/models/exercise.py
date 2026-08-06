from datetime import datetime, date, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Date, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    exercise_type: Mapped[str] = mapped_column(String(30), nullable=False)  # fasted_cardio/weight/treadmill/outdoor_run/other
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    garmin_activity_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    garmin_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    source: Mapped[str] = mapped_column(String(10), nullable=False, default="manual")  # manual/garmin
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
