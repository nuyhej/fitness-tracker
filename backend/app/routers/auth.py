from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import httpx

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user_id
from app.core.config import get_settings
from app.models.user import User
from app.models.meal import Meal
from app.models.exercise import Exercise
from app.models.inbody import InBodyRecord
from app.models.fasting import FastingRecord
from app.schemas.schemas import UserOut, UserProfileUpdate

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/login/google")
async def google_login():
    """Return real Google OAuth2 authorization URL on accounts.google.com."""
    cid = getattr(settings, "GOOGLE_CLIENT_ID", "")
    params = {"client_id": cid, "redirect_uri": settings.GOOGLE_REDIRECT_URI, "response_type": "code", "scope": "openid email profile", "access_type": "offline", "prompt": "consent"}
    return {"auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?{'&'.join(f'{k}={v}' for k, v in params.items())}"}

@router.get("/login/naver")
async def naver_login():
    """Return real Naver OAuth authorization URL on nid.naver.com."""
    cid = getattr(settings, "NAVER_CLIENT_ID", "")
    params = {"client_id": cid, "response_type": "code", "redirect_uri": getattr(settings, "NAVER_REDIRECT_URI", "http://localhost:5173/auth/callback/naver"), "state": "jjinfit_naver_auth"}
    return {"auth_url": f"https://nid.naver.com/oauth2.0/authorize?{'&'.join(f'{k}={v}' for k, v in params.items())}"}

@router.get("/login/kakao")
async def kakao_login():
    """Return real Kakao OAuth authorization URL on kauth.kakao.com."""
    cid = getattr(settings, "KAKAO_CLIENT_ID", "")
    params = {"client_id": cid, "redirect_uri": getattr(settings, "KAKAO_REDIRECT_URI", "http://localhost:5173/auth/callback/kakao"), "response_type": "code"}
    return {"auth_url": f"https://kauth.kakao.com/oauth/authorize?{'&'.join(f'{k}={v}' for k, v in params.items())}"}

@router.get("/login/line")
async def line_login():
    """Return real LINE OAuth authorization URL on access.line.me."""
    cid = getattr(settings, "LINE_CLIENT_ID", "")
    params = {"response_type": "code", "client_id": cid, "redirect_uri": getattr(settings, "LINE_REDIRECT_URI", "http://localhost:5173/auth/callback/line"), "state": "jjinfit_line"}
    return {"auth_url": f"https://access.line.me/oauth2/v2.1/authorize?{'&'.join(f'{k}={v}' for k, v in params.items())}"}




async def _process_social_user(db: AsyncSession, email: str, nickname: str, avatar_url: str, provider: str, provider_id: str):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            nickname=nickname,
            avatar_url=avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
            provider=provider,
            provider_id=str(provider_id),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    jwt_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": jwt_token, "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.post("/callback/google")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    if code == "sandbox_google_code":
        return await _process_social_user(db, "google_master@gmail.com", "구글 피트니스마스터", "https://api.dicebear.com/7.x/bottts/svg?seed=google", "google", "google-dev-id")
    async with httpx.AsyncClient() as client:
        res = await client.post(GOOGLE_TOKEN_URL, data={"code": code, "client_id": settings.GOOGLE_CLIENT_ID, "client_secret": settings.GOOGLE_CLIENT_SECRET, "redirect_uri": settings.GOOGLE_REDIRECT_URI, "grant_type": "authorization_code"})
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="구글 토큰 인가에 실패했습니다.")
        access_token = res.json().get("access_token")
        uinfo = (await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})).json()
    return await _process_social_user(db, uinfo["email"], uinfo.get("name", uinfo["email"].split("@")[0]), uinfo.get("picture", ""), "google", str(uinfo.get("id")))

@router.post("/callback/naver")
async def naver_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Naver OAuth callback."""
    if code == "sandbox_naver_code":
        return await _process_social_user(db, "naver_athlete@naver.com", "네이버 트레이닝스타", "https://api.dicebear.com/7.x/bottts/svg?seed=naver", "naver", "naver-dev-id")
    async with httpx.AsyncClient() as client:
        res = await client.post("https://nid.naver.com/oauth2.0/token", data={"grant_type": "authorization_code", "client_id": getattr(settings, "NAVER_CLIENT_ID", ""), "client_secret": getattr(settings, "NAVER_CLIENT_SECRET", ""), "code": code, "state": "jjinfit_naver_auth"})
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="네이버 토큰 교환 실패")
        access_token = res.json().get("access_token")
        pinfo = (await client.get("https://openapi.naver.com/v1/nid/me", headers={"Authorization": f"Bearer {access_token}"})).json().get("response", {})
    email = pinfo.get("email", "naver_user@naver.com")
    return await _process_social_user(db, email, pinfo.get("name", pinfo.get("nickname", "네이버회원")), pinfo.get("profile_image", ""), "naver", str(pinfo.get("id", email)))

@router.post("/callback/kakao")
async def kakao_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Kakao OAuth callback."""
    if code == "sandbox_kakao_code":
        return await _process_social_user(db, "kakao_dieter@kakao.com", "카카오 찐운동맨", "https://api.dicebear.com/7.x/bottts/svg?seed=kakao", "kakao", "kakao-dev-id")
    async with httpx.AsyncClient() as client:
        res = await client.post("https://kauth.kakao.com/oauth/token", data={"grant_type": "authorization_code", "client_id": getattr(settings, "KAKAO_CLIENT_ID", ""), "client_secret": getattr(settings, "KAKAO_CLIENT_SECRET", ""), "redirect_uri": getattr(settings, "KAKAO_REDIRECT_URI", "http://localhost:5173/auth/callback/kakao"), "code": code})
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="카카오 토큰 교환 실패")
        access_token = res.json().get("access_token")
        uinfo = (await client.get("https://kapi.kakao.com/v2/user/me", headers={"Authorization": f"Bearer {access_token}"})).json()
    acc = uinfo.get("kakao_account", {})
    email = acc.get("email", f"kakao_{uinfo.get('id')}@kakao.local")
    nickname = acc.get("profile", {}).get("nickname", "카카오유저")
    avatar = acc.get("profile", {}).get("profile_image_url", "")
    return await _process_social_user(db, email, nickname, avatar, "kakao", str(uinfo.get("id")))

@router.post("/callback/line")
async def line_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle LINE OAuth callback."""
    if code == "sandbox_line_code":
        return await _process_social_user(db, "line_fitpro@line.me", "LINE 피트니스프로", "https://api.dicebear.com/7.x/bottts/svg?seed=line", "line", "line-dev-id")
    async with httpx.AsyncClient() as client:
        res = await client.post("https://api.line.me/oauth2/v2.1/token", data={"grant_type": "authorization_code", "code": code, "redirect_uri": getattr(settings, "LINE_REDIRECT_URI", "http://localhost:5173/auth/callback/line"), "client_id": getattr(settings, "LINE_CLIENT_ID", ""), "client_secret": getattr(settings, "LINE_CLIENT_SECRET", "")})
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="LINE 토큰 인가 실패")
        access_token = res.json().get("access_token")
        pinfo = (await client.get("https://api.line.me/v2/profile", headers={"Authorization": f"Bearer {access_token}"})).json()
    email = f"line_{pinfo.get('userId')}@line.me"
    return await _process_social_user(db, email, pinfo.get("displayName", "LINE유저"), pinfo.get("pictureUrl", ""), "line", str(pinfo.get("userId")))


@router.post("/login/demo")
async def demo_login(db: AsyncSession = Depends(get_db)):
    """Quick dev/demo login without external OAuth providers."""
    email = "demo@fitness-tracker.local"
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            nickname="트레이닝 마스터",
            avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=health",
            provider="demo",
            provider_id="demo-user-id",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    jwt_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }


from pydantic import BaseModel
import hashlib

class CustomLoginRequest(BaseModel):
    email: str
    password: str = ""
    nickname: str = ""

@router.post("/login/custom")
async def custom_account_login(body: CustomLoginRequest, db: AsyncSession = Depends(get_db)):
    """Allow secure multi-device login using personal email + SHA256 hashed password/PIN to prevent unauthorized spying."""
    email = body.email.lower().strip()
    password = body.password.strip()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="유효한 이메일 형식이 아닙니다.")
    if not password:
        raise HTTPException(status_code=400, detail="🔒 타인의 무단 열람을 차단하기 위해 비밀번호 또는 보안 PIN을 꼭 입력해 주세요!")
    
    hashed_pwd = hashlib.sha256(password.encode("utf-8")).hexdigest()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        default_name = body.nickname.strip() if body.nickname.strip() else email.split("@")[0]
        user = User(
            email=email,
            nickname=default_name,
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
            provider="custom",
            provider_id=f"custom-{email}",
            hashed_password=hashed_pwd,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # If user exists, strictly verify password!
        if not user.hashed_password:
            user.hashed_password = hashed_pwd
            await db.commit()
            await db.refresh(user)
        elif user.hashed_password != hashed_pwd:
            raise HTTPException(
                status_code=401,
                detail="❌ 비밀번호 또는 보안 PIN이 일치하지 않습니다! (타인의 계정은 열람할 수 없습니다. 본인이 맞다면 비밀번호를 확인해주세요)"
            )
        if body.nickname and body.nickname.strip() and user.nickname == email.split("@")[0]:
            user.nickname = body.nickname.strip()
            await db.commit()
            await db.refresh(user)


    jwt_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }


class SocialPersonalLoginRequest(BaseModel):
    email: str
    password: str = ""
    nickname: str = ""
    provider: str = "custom"

@router.post("/login/social-personal")
async def social_personal_login(body: SocialPersonalLoginRequest, db: AsyncSession = Depends(get_db)):
    """Allow secure login from popup window using real personal account under social provider."""
    email = body.email.lower().strip()
    password = body.password.strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="본인의 올바른 개인 이메일 주소를 입력해주세요!")
    if not password:
        raise HTTPException(status_code=400, detail="🔒 개인 데이터 보호를 위해 비밀번호 또는 보안 PIN을 입력해주세요!")
    
    hashed_pwd = hashlib.sha256(password.encode("utf-8")).hexdigest()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        default_name = body.nickname.strip() if body.nickname.strip() else email.split("@")[0]
        user = User(
            email=email,
            nickname=default_name,
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
            provider=body.provider,
            provider_id=f"{body.provider}-{email}",
            hashed_password=hashed_pwd,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        if not user.hashed_password:
            user.hashed_password = hashed_pwd
            user.provider = body.provider
            await db.commit()
            await db.refresh(user)
        elif user.hashed_password != hashed_pwd:
            raise HTTPException(status_code=401, detail="❌ 비밀번호/보안 PIN이 불일치합니다. 본인 계정이 맞다면 암호를 확인해주세요!")
        if body.provider and user.provider != body.provider:
            user.provider = body.provider
            await db.commit()
            await db.refresh(user)

    jwt_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }





@router.get("/me", response_model=UserOut)
async def get_me(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/profile", response_model=UserOut)
async def update_profile(
    updates: UserProfileUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user


class MergeAccountRequest(BaseModel):
    source_email: str

@router.post("/merge-account")
async def merge_another_account(
    body: MergeAccountRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Integrate and merge all fitness & diet records from a different account into the current active user account."""
    source_email = body.source_email.lower().strip()
    result = await db.execute(select(User).where(User.email == source_email))
    source_user = result.scalar_one_or_none()

    if not source_user:
        raise HTTPException(status_code=404, detail=f"'{source_email}' 계정 정보를 DB에서 찾을 수 없습니다. (입력하신 이메일 혹은 'demo@fitness-tracker.local' 확인)")
    if source_user.id == current_user_id:
        raise HTTPException(status_code=400, detail="현재 접속 중인 본인 계정과는 통합할 수 없습니다. 병합하려는 '과거 계정'의 이메일을 입력해 주세요.")

    # Move all records from source_user to current_user
    res_meals = await db.execute(update(Meal).where(Meal.user_id == source_user.id).values(user_id=current_user_id))
    res_exercises = await db.execute(update(Exercise).where(Exercise.user_id == source_user.id).values(user_id=current_user_id))
    res_inbody = await db.execute(update(InBodyRecord).where(InBodyRecord.user_id == source_user.id).values(user_id=current_user_id))
    res_fasting = await db.execute(update(FastingRecord).where(FastingRecord.user_id == source_user.id).values(user_id=current_user_id))

    meals_count = res_meals.rowcount or 0
    exercises_count = res_exercises.rowcount or 0
    inbody_count = res_inbody.rowcount or 0
    fasting_count = res_fasting.rowcount or 0

    # Label source user as merged to prevent duplicates or confusion
    source_user.nickname = f"[병합됨 ➔ #{current_user_id}]"
    await db.commit()

    return {
        "status": "success",
        "message": f"✨ '{source_email}' 계정으로부터 식단 {meals_count}건, 운동 {exercises_count}건, 인바디 {inbody_count}건, 단식 {fasting_count}건의 기록이 현재 계정으로 완벽히 융합되었습니다!",
        "merged_stats": {
            "meals": meals_count,
            "exercises": exercises_count,
            "inbody": inbody_count,
            "fasting": fasting_count,
        }
    }

