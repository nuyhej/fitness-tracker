import os
import asyncio
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.exercise import Exercise

try:
    from garminconnect import Garmin
except ImportError:
    Garmin = None


class MfaRequiredError(Exception):
    """Raised when Garmin Connect prompts for MFA OTP code but none was provided yet."""
    pass


async def sync_garmin_activities(db: AsyncSession, user_id: int, garmin_email: str | None = None, garmin_password: str | None = None, mfa_code: str | None = None) -> dict:
    """
    100% Real-time Garmin Connect Cloud Sync Engine for ⚡찐fit with Persistent 2FA / MFA Support.
    Uses TokenStore caching so users only need to enter email/password and SMS verification code ONCE.
    Subsequent synchronization requests automatically re-use secure OAuth session tokens.
    """
    token_dir = os.path.join(os.getcwd(), "data", "garmin_tokens", f"user_{user_id}")
    has_cached_tokens = os.path.exists(token_dir) and len(os.listdir(token_dir)) > 0 if os.path.exists(token_dir) else False

    email = garmin_email or os.environ.get("GARMIN_EMAIL")
    password = garmin_password or os.environ.get("GARMIN_PASSWORD")

    # If no cached tokens exist AND no email/password supplied, prompt the modal
    if not has_cached_tokens and not (email and password):
        return {
            "status": "unauthorized",
            "message": "⌚ 가민 커넥트(Garmin Connect) 본사 서버 라이브 동기화를 위해 본인의 가민 실계정(이메일/비밀번호) 입력이 필요합니다.",
            "synced_workouts": 0
        }

    if not Garmin:
        return {
            "status": "error",
            "message": "🚨 백엔드에 garminconnect 파이썬 라이브러리가 탑재되지 않았습니다.",
            "synced_workouts": 0
        }

    synced_count = 0
    try:
        os.makedirs(token_dir, exist_ok=True)

        def get_mfa_callback():
            if mfa_code and mfa_code.strip():
                return mfa_code.strip()
            raise MfaRequiredError("MFA code required from mobile or email.")

        # Run blocking Garmin login & network calls in thread pool
        def fetch_garmin_data():
            # 1. Try logging in silently with saved tokens ONLY (when no forced credentials/MFA override is present)
            if has_cached_tokens and not mfa_code and not (garmin_email and garmin_password):
                try:
                    client = Garmin()
                    client.login(tokenstore=token_dir)
                    return client.get_activities(0, 20)
                except Exception as cache_err:
                    print(f"[Garmin Sync] Cached token login failed or expired: {cache_err}")
                    if not (email and password):
                        raise ValueError("EXPIRED_CREDENTIALS")

            # 2. Otherwise, log in with credentials (+ dynamic MFA callback) and write session to tokenstore!
            client = Garmin(email, password, prompt_mfa=get_mfa_callback)
            client.login(tokenstore=token_dir)
            return client.get_activities(0, 20)

        activities = await asyncio.to_thread(fetch_garmin_data)


        for act in activities:
            act_id = str(act.get("activityId", ""))
            start_str = act.get("startTimeLocal", "")
            if not start_str:
                continue
                
            act_dt = datetime.fromisoformat(start_str.replace("Z", ""))
            act_date = act_dt.date()
            
            act_name = act.get("activityName") or "가민 워크아웃"
            act_type_key = act.get("activityType", {}).get("typeKey", "running")
            duration_secs = act.get("duration", 0)
            duration_mins = max(1, int(duration_secs / 60.0))
            
            calories = act.get("calories") or 0
            distance_meters = act.get("distance") or 0.0
            dist_km = round(distance_meters / 1000.0, 2)
            avg_hr = act.get("averageHR") or act.get("averageHeartRate", 0)

            # Map Garmin activity type to 찐fit categories
            if any(w in act_type_key.lower() for w in ["run", "running", "jog"]):
                ex_type = "outdoor_run" if dist_km > 0.5 else "treadmill"
            elif any(w in act_type_key.lower() for w in ["strength", "weight", "gym"]):
                ex_type = "weight"
            else:
                ex_type = "fasted_cardio"

            description_parts = [f"[⌚ Garmin Live] {act_name}"]
            if dist_km > 0:
                description_parts.append(f"{dist_km}km")
            if avg_hr and avg_hr > 0:
                description_parts.append(f"평균 심박 {int(avg_hr)}bpm")
            if calories > 0:
                description_parts.append(f"{int(calories)}kcal 소모")
            description_parts.append(f"(ID: {act_id})")

            desc_text = " | ".join(description_parts)

            # Prevent duplication by checking date and source/description ID
            res = await db.execute(
                select(Exercise).where(
                    and_(
                        Exercise.user_id == user_id,
                        Exercise.date == act_date,
                        Exercise.source == "garmin_connect"
                    )
                )
            )
            existing_list = res.scalars().all()
            
            if not any(act_id in (ex.description or "") for ex in existing_list):
                new_exercise = Exercise(
                    user_id=user_id,
                    date=act_date,
                    exercise_type=ex_type,
                    duration_minutes=duration_mins,
                    description=desc_text,
                    source="garmin_connect"
                )
                db.add(new_exercise)
                synced_count += 1

        await db.commit()
        return {
            "status": "success",
            "message": f"🏆 가민 커넥트 2단계 보안 승인 및 실전 통신 완료! {synced_count}건의 진짜 트레이닝 로그를 안전하게 수신했습니다!",
            "synced_workouts": synced_count
        }

    except (MfaRequiredError, Exception) as e:
        err_str = str(e)
        if "EXPIRED_CREDENTIALS" in err_str:
            return {
                "status": "unauthorized",
                "message": "⌚ 가민 세션이 만료되었습니다. 다시 한 번 실계정을 입력하여 토큰을 영구 갱신해 주세요!",
                "synced_workouts": 0
            }
        if "MfaRequiredError" in err_str or "mfa" in err_str.lower() or "MFA" in err_str or "2FA" in err_str or "Authentication" in err_str:
            if not mfa_code:
                return {
                    "status": "mfa_required",
                    "message": "📱 핸드폰으로 가민 본사의 6자리 보안 인증문자(MFA OTP)가 전송되었습니다! 화면 아래 입력칸에 보안코드를 적어 승인해 주십시오.",
                    "synced_workouts": 0
                }
        return {
            "status": "error",
            "message": f"🚨 가민 커넥트 서버 접속 또는 보안 승인 실패: {err_str}",
            "synced_workouts": 0
        }



