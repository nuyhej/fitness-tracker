from datetime import date, datetime
from typing import Optional
import zoneinfo

def _convert_to_naive_local(dt: datetime, tz_str: str) -> datetime:
    if dt.tzinfo is not None:
        try:
            tz = zoneinfo.ZoneInfo(tz_str)
            dt = dt.astimezone(tz)
        except Exception:
            pass
        dt = dt.replace(tzinfo=None)
    return dt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.fasting import FastingRecord
from app.models.user import User
from app.schemas.schemas import FastingStart, FastingEnd, FastingUpdate, FastingOut

router = APIRouter(prefix="/api/fasting", tags=["fasting"])


@router.post("/start", response_model=FastingOut, status_code=201)
async def start_fasting(
    fasting_in: FastingStart,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Auto-close any existing active fasting to prevent duplicates
    active_fasting_res = await db.execute(
        select(FastingRecord)
        .where(and_(FastingRecord.user_id == user_id, FastingRecord.end_time.is_(None)))
    )
    active_fasting = active_fasting_res.scalar_one_or_none()
    
    # Process timezone logic
    tz_str = fasting_in.timezone or "Asia/Seoul"
    start_time = _convert_to_naive_local(fasting_in.start_time, tz_str)
    
    if active_fasting:
        active_fasting.end_time = start_time
        delta = active_fasting.end_time - active_fasting.start_time
        active_fasting.actual_hours = round(delta.total_seconds() / 3600, 2)
        active_fasting.is_completed = active_fasting.actual_hours >= active_fasting.goal_hours
        db.add(active_fasting)

    # Get user's default fasting goal if not provided
    goal_hours = fasting_in.goal_hours
    if goal_hours is None:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        goal_hours = user.fasting_goal_hours

    end_time = _convert_to_naive_local(fasting_in.end_time, tz_str) if fasting_in.end_time else None

    record = FastingRecord(
        user_id=user_id,
        start_time=start_time,
        end_time=end_time,
        goal_hours=goal_hours,
        note=fasting_in.note,
    )
    
    if record.end_time:
        delta = record.end_time - record.start_time
        record.actual_hours = round(delta.total_seconds() / 3600, 2)
        record.is_completed = record.actual_hours >= record.goal_hours
    
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

@router.post("/end-active", response_model=FastingOut)
async def end_active_fasting(
    fasting_end: FastingEnd,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """End the currently active fasting record. Useful for iOS Shortcuts."""
    result = await db.execute(
        select(FastingRecord)
        .where(and_(FastingRecord.user_id == user_id, FastingRecord.end_time.is_(None)))
        .order_by(FastingRecord.start_time.desc())
    )
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="진행 중인 단식이 없습니다.")

    tz_str = fasting_end.timezone or "Asia/Seoul"
    record.end_time = _convert_to_naive_local(fasting_end.end_time, tz_str)
    delta = fasting_end.end_time - record.start_time
    record.actual_hours = round(delta.total_seconds() / 3600, 2)
    record.is_completed = record.actual_hours >= record.goal_hours

    await db.commit()
    await db.refresh(record)
    return record


@router.post("/{fasting_id}/end", response_model=FastingOut)
async def end_fasting(
    fasting_id: int,
    fasting_end: FastingEnd,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FastingRecord).where(
            and_(FastingRecord.id == fasting_id, FastingRecord.user_id == user_id)
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Fasting record not found")

    record.end_time = fasting_end.end_time
    delta = fasting_end.end_time - record.start_time
    record.actual_hours = round(delta.total_seconds() / 3600, 2)
    record.is_completed = record.actual_hours >= record.goal_hours

    await db.commit()
    await db.refresh(record)
    return record


@router.put("/{fasting_id}", response_model=FastingOut)
async def update_fasting(
    fasting_id: int,
    fasting_update: FastingUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FastingRecord).where(
            and_(FastingRecord.id == fasting_id, FastingRecord.user_id == user_id)
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Fasting record not found")

    if fasting_update.start_time is not None:
        record.start_time = fasting_update.start_time
    if fasting_update.end_time is not None:
        record.end_time = fasting_update.end_time
    if fasting_update.goal_hours is not None:
        record.goal_hours = fasting_update.goal_hours
    if fasting_update.note is not None:
        record.note = fasting_update.note

    # Recalculate actual_hours and completion status if end_time exists
    if record.end_time:
        delta = record.end_time - record.start_time
        record.actual_hours = round(delta.total_seconds() / 3600, 2)
        record.is_completed = record.actual_hours >= record.goal_hours
    else:
        record.actual_hours = None
        record.is_completed = False

    await db.commit()
    await db.refresh(record)
    return record


@router.get("/active", response_model=Optional[FastingOut])
async def get_active_fasting(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FastingRecord)
        .where(and_(FastingRecord.user_id == user_id, FastingRecord.end_time.is_(None)))
        .order_by(FastingRecord.start_time.desc())
    )
    record = result.scalar_one_or_none()
    return record


@router.get("", response_model=list[FastingOut])
async def get_fasting_records(
    date_filter: Optional[date] = Query(None, alias="date"),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(FastingRecord).where(FastingRecord.user_id == user_id)

    if date_filter:
        start_dt = datetime.combine(date_filter, datetime.min.time())
        end_dt = datetime.combine(date_filter, datetime.max.time())
        query = query.where(
            and_(FastingRecord.start_time >= start_dt, FastingRecord.start_time <= end_dt)
        )

    query = query.order_by(FastingRecord.start_time.desc())
    result = await db.execute(query)
    return result.scalars().all()
