from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.fasting import FastingRecord
from app.models.user import User
from app.schemas.schemas import FastingStart, FastingEnd, FastingOut

router = APIRouter(prefix="/api/fasting", tags=["fasting"])


@router.post("/start", response_model=FastingOut, status_code=201)
async def start_fasting(
    fasting_in: FastingStart,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Get user's default fasting goal if not provided
    goal_hours = fasting_in.goal_hours
    if goal_hours is None:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        goal_hours = user.fasting_goal_hours

    record = FastingRecord(
        user_id=user_id,
        start_time=fasting_in.start_time,
        goal_hours=goal_hours,
        note=fasting_in.note,
    )
    db.add(record)
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
