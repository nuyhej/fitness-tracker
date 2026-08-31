from datetime import datetime, date, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default="google")
    provider_id: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    diet_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    fasting_goal_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=16)
    theme_preference: Mapped[str] = mapped_column(String(10), nullable=False, default="system")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    google_token_json: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    garmin_token_json: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    api_token: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="Asia/Seoul")
