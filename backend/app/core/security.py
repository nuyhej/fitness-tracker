from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User

from app.core.config import get_settings

settings = get_settings()
security_scheme = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db)
) -> int:
    if x_api_key:
        result = await db.execute(select(User.id).where(User.api_token == x_api_key))
        user_id = result.scalar_one_or_none()
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API Key",
            )
        return user_id

    if credentials is not None:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return int(user_id)
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
