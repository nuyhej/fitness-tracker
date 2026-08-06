from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InBodyRecord(Base):
    __tablename__ = "inbody_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Core metrics
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    skeletal_muscle: Mapped[float] = mapped_column(Float, nullable=False)
    body_fat_mass: Mapped[float] = mapped_column(Float, nullable=False)
    body_fat_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bmi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    basal_metabolic_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    visceral_fat_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_body_water: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Segmental muscle mass
    right_arm_muscle: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    left_arm_muscle: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trunk_muscle: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    right_leg_muscle: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    left_leg_muscle: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Segmental body fat
    right_arm_fat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    left_arm_fat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trunk_fat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    right_leg_fat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    left_leg_fat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Meta
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")  # manual/google_health/excel_import
    raw_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
