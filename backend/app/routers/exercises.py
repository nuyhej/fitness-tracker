from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.exercise import Exercise
from app.schemas.schemas import ExerciseCreate, ExerciseUpdate, ExerciseOut
from app.services.garmin_service import sync_garmin_activities

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


@router.post("/garmin-sync", status_code=200)
async def sync_garmin(
    credentials: dict = Body(default={}),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    email = credentials.get("email") or credentials.get("garmin_email")
    password = credentials.get("password") or credentials.get("garmin_password")
    mfa_code = credentials.get("mfa_code") or credentials.get("code")
    result_data = await sync_garmin_activities(db, user_id=user_id, garmin_email=email, garmin_password=password, mfa_code=mfa_code)
    return result_data




@router.post("", response_model=ExerciseOut, status_code=201)
async def create_exercise(

    exercise_in: ExerciseCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    exercise = Exercise(
        user_id=user_id,
        date=exercise_in.date,
        exercise_type=exercise_in.exercise_type,
        duration_minutes=exercise_in.duration_minutes,
        description=exercise_in.description,
    )
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise


@router.get("", response_model=list[ExerciseOut])
async def get_exercises(
    date_filter: Optional[date] = Query(None, alias="date"),
    start: Optional[date] = None,
    end: Optional[date] = None,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Exercise).where(Exercise.user_id == user_id)

    if date_filter:
        query = query.where(Exercise.date == date_filter)
    elif start and end:
        query = query.where(and_(Exercise.date >= start, Exercise.date <= end))

    query = query.order_by(Exercise.date)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{exercise_id}", response_model=ExerciseOut)
async def update_exercise(
    exercise_id: int,
    updates: ExerciseUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Exercise).where(and_(Exercise.id == exercise_id, Exercise.user_id == user_id))
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(exercise, key, value)

    await db.commit()
    await db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=204)
async def delete_exercise(
    exercise_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Exercise).where(and_(Exercise.id == exercise_id, Exercise.user_id == user_id))
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    await db.delete(exercise)
    await db.commit()
