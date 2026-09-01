from datetime import date, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.meal import Meal
from app.schemas.schemas import MealCreate, MealUpdate, MealOut

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.post("", response_model=MealOut, status_code=201)
async def create_meal(
    meal_in: MealCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    meal_time = None
    if meal_in.meal_time:
        parts = meal_in.meal_time.split(":")
        meal_time = time(int(parts[0]), int(parts[1]))

    meal = Meal(
        user_id=user_id,
        date=meal_in.date,
        meal_type=meal_in.meal_type,
        description=meal_in.description,
        meal_time=meal_time,
        tags=meal_in.tags,
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    return meal


@router.get("", response_model=list[MealOut])
async def get_meals(
    date_filter: Optional[date] = Query(None, alias="date"),
    start: Optional[date] = None,
    end: Optional[date] = None,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Meal).where(Meal.user_id == user_id)

    if date_filter:
        query = query.where(Meal.date == date_filter)
    elif start and end:
        query = query.where(and_(Meal.date >= start, Meal.date <= end))

    query = query.order_by(Meal.date, Meal.meal_type)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{meal_id}", response_model=MealOut)
async def update_meal(
    meal_id: int,
    updates: MealUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Meal).where(and_(Meal.id == meal_id, Meal.user_id == user_id))
    )
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    update_data = updates.model_dump(exclude_unset=True)
    if "meal_time" in update_data and update_data["meal_time"]:
        parts = update_data["meal_time"].split(":")
        update_data["meal_time"] = time(int(parts[0]), int(parts[1]))

    for key, value in update_data.items():
        setattr(meal, key, value)

    await db.commit()
    await db.refresh(meal)
    return meal


@router.delete("/{meal_id}", status_code=204)
async def delete_meal(
    meal_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Meal).where(and_(Meal.id == meal_id, Meal.user_id == user_id))
    )
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    await db.delete(meal)
    await db.commit()
