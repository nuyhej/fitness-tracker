from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.inbody import InBodyRecord
from app.models.user import User
from app.services.sync_service import sync_user_health_data, sync_samsung_health_data
from app.schemas.schemas import InBodyCreate, InBodyOut, InBodyTrendPoint
import os
import json

router = APIRouter(prefix="/api/inbody", tags=["inbody"])


@router.get("/google-status")
async def check_google_fit_status(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    connected = False
    token_type = None
    
    if user and user.google_token_json:
        try:
            data = json.loads(user.google_token_json)
            if data.get("access_token") or data.get("refresh_token"):
                connected = True
                token_type = data.get("token_type") or ("refresh_token" if str(data.get("refresh_token", "")).startswith("1//") else "access_token")
        except Exception:
            pass
            
    return {"connected": connected, "token_type": token_type}


@router.post("/sync")
async def sync_inbody_data(
    payload: dict = Body(default={}),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token_override = payload.get("access_token") or payload.get("token")
    return await sync_user_health_data(user, db, access_token=token_override)



@router.post("/samsung-sync")
async def sync_samsung_data(
    payload: dict = Body(default={}),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    raw_payload = payload.get("raw_data") or payload.get("data") or payload.get("text")
    return await sync_samsung_health_data(user, db, raw_payload=raw_payload)





@router.post("", response_model=InBodyOut, status_code=201)
async def create_inbody(
    record_in: InBodyCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    record = InBodyRecord(
        user_id=user_id,
        measured_at=record_in.measured_at,
        weight=record_in.weight,
        skeletal_muscle=record_in.skeletal_muscle,
        body_fat_mass=record_in.body_fat_mass,
        body_fat_pct=record_in.body_fat_pct,
        bmi=record_in.bmi,
        basal_metabolic_rate=record_in.basal_metabolic_rate,
        visceral_fat_level=record_in.visceral_fat_level,
        total_body_water=record_in.total_body_water,
        source="manual",
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("", response_model=list[InBodyOut])
async def get_inbody_records(
    start: Optional[date] = None,
    end: Optional[date] = None,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(InBodyRecord).where(InBodyRecord.user_id == user_id)

    if start and end:
        start_dt = datetime.combine(start, datetime.min.time())
        end_dt = datetime.combine(end, datetime.max.time())
        query = query.where(
            and_(InBodyRecord.measured_at >= start_dt, InBodyRecord.measured_at <= end_dt)
        )

    query = query.order_by(InBodyRecord.measured_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/trend", response_model=list[InBodyTrendPoint])
async def get_inbody_trend(
    from_date: Optional[date] = Query(None, alias="from"),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(InBodyRecord).where(InBodyRecord.user_id == user_id)

    if from_date:
        from_dt = datetime.combine(from_date, datetime.min.time())
        query = query.where(InBodyRecord.measured_at >= from_dt)

    query = query.order_by(InBodyRecord.measured_at.asc())
    result = await db.execute(query)
    records = result.scalars().all()

    return [
        InBodyTrendPoint(
            measured_at=r.measured_at,
            weight=r.weight,
            skeletal_muscle=r.skeletal_muscle,
            body_fat_mass=r.body_fat_mass,
            body_fat_pct=r.body_fat_pct,
        )
        for r in records
    ]


@router.delete("/{record_id}", status_code=204)
async def delete_inbody(
    record_id: int,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InBodyRecord).where(
            and_(InBodyRecord.id == record_id, InBodyRecord.user_id == user_id)
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="InBody record not found")

    await db.delete(record)
    await db.commit()
