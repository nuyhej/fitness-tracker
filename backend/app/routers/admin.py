from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct

from app.core.database import get_db
from app.models.user import User
from app.models.meal import Meal
from app.models.inbody import InBodyRecord
from app.models.fasting import FastingRecord

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users")
async def get_all_users_stats(
    pin: str = Query(..., description="Super admin secret password"),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    # 🔒 철저한 보안: 비밀번호가 틀리면 즉시 접근 차단
    if pin != "94598313":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다 (Invalid PIN)")

    # 유저 목록과 각 유저별 식단, 인바디, 단식 기록 횟수를 한 번에 집계하는 강력한 쿼리
    stmt = (
        select(
            User.id,
            User.email,
            User.nickname,
            User.created_at,
            func.count(distinct(Meal.id)).label("meal_count"),
            func.count(distinct(InBodyRecord.id)).label("inbody_count"),
            func.count(distinct(FastingRecord.id)).label("fasting_count")
        )
        .outerjoin(Meal, User.id == Meal.user_id)
        .outerjoin(InBodyRecord, User.id == InBodyRecord.user_id)
        .outerjoin(FastingRecord, User.id == FastingRecord.user_id)
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    # 프론트엔드가 쓰기 편하도록 딕셔너리로 변환하여 반환
    stats = []
    for row in rows:
        stats.append({
            "id": row.id,
            "email": row.email,
            "nickname": row.nickname,
            "created_at": row.created_at,
            "meal_count": row.meal_count,
            "inbody_count": row.inbody_count,
            "fasting_count": row.fasting_count
        })

    return stats
