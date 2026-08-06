import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.ai_analyzer import generate_daily_analysis

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/daily")
async def get_daily_analysis(
    date_str: str = Query(default=None, alias="date"),
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not date_str:
        date_str = datetime.date.today().isoformat()
    return await generate_daily_analysis(db, user_id, date_str)
