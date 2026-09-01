from datetime import date, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.timezone import resolve_request_tz, today_in_tz
from app.models.meal import Meal
from app.models.user import User
from app.schemas.schemas import MealCreate, MealUpdate, MealOut

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.post("", response_model=MealOut, status_code=201)
async def create_meal(
    meal_in: MealCreate,
    x_timezone: Optional[str] = Header(None, alias="X-Timezone"),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    tz = resolve_request_tz(x_timezone, getattr(user, "timezone", "Asia/Seoul") if user else "Asia/Seoul")

    meal_date = meal_in.date if meal_in.date else today_in_tz(tz)

    meal_time = None
    if meal_in.meal_time:
        parts = meal_in.meal_time.split(":")
        if len(parts) >= 2:
            meal_time = time(int(parts[0]), int(parts[1]))

    meal = Meal(
        user_id=user_id,
        date=meal_date,
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
