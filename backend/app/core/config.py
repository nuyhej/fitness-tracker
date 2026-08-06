from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/health.db"

    # Google OAuth2
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/callback/google"

    # Naver OAuth2
    NAVER_CLIENT_ID: str = ""
    NAVER_CLIENT_SECRET: str = ""
    NAVER_REDIRECT_URI: str = "http://localhost:5173/auth/callback/naver"

    # Kakao OAuth2
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""
    KAKAO_REDIRECT_URI: str = "http://localhost:5173/auth/callback/kakao"

    # LINE OAuth2
    LINE_CLIENT_ID: str = ""
    LINE_CLIENT_SECRET: str = ""
    LINE_REDIRECT_URI: str = "http://localhost:5173/auth/callback/line"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"


    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
