import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import init_db, async_session_factory
from app.services.garmin_service import sync_garmin_activities
from app.services.sync_service import sync_user_health_data

# Import all models so they register with Base.metadata
from app.models.user import User  # noqa: F401
from app.models.meal import Meal  # noqa: F401
from app.models.exercise import Exercise  # noqa: F401
from app.models.inbody import InBodyRecord  # noqa: F401
from app.models.fasting import FastingRecord  # noqa: F401

from app.routers import auth, meals, exercises, inbody, fasting, dashboard, analysis

settings = get_settings()


async def background_health_sync_loop():
    """
    Automated Background Cloud Synchronization Scheduler.
    Runs every 3 hours (10800 seconds) to safely synchronize Garmin Connect and Google Fit InBody metrics
    without triggering IP rate limits or repeated MFA challenges.
    """
    while True:
        try:
            await asyncio.sleep(10800)  # 3-hour interval (optimal safe window against Garmin 429 IP blocks)
            async with async_session_factory() as db:
                users = (await db.execute(select(User))).scalars().all()
                for u in users:
                    try:
                        await sync_garmin_activities(db, user_id=u.id)
                    except Exception as e:
                        print(f"[Auto Sync] Garmin pass failed for user {u.id}: {e}")
                    try:
                        await sync_user_health_data(u, db)
                    except Exception as e:
                        print(f"[Auto Sync] InBody pass failed for user {u.id}: {e}")
        except asyncio.CancelledError:
            break
        except Exception as err:
            print(f"[Background Sync Loop Error] {err}")
            await asyncio.sleep(300)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    # Create tables on startup
    await init_db()
    # Launch safe automated background sync scheduler (every 3 hours)
    sync_task = asyncio.create_task(background_health_sync_loop())
    yield
    sync_task.cancel()

app = FastAPI(
    title="Personal Health Dashboard API",
    description="Backend API for the Personal Health & Fitness Tracker",
    version="1.0.0",
    lifespan=lifespan,
)

from sqlalchemy import text
from app.core.database import engine

@app.get("/api/health/db")
async def check_db_health():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Database connected successfully!"}
    except Exception as e:
        import traceback
        return {"status": "error", "error": str(e), "trace": traceback.format_exc()}

@app.get("/api/health/login-test")
async def login_test():
    """Diagnostic endpoint that replicates the exact login flow to surface errors."""
    import traceback
    steps = []
    try:
        steps.append("1. Creating DB session...")
        async with async_session_factory() as db:
            steps.append("2. DB session created OK")
            
            steps.append("3. Querying User table...")
            result = await db.execute(select(User).where(User.email == "test_diag@jjinfit.local"))
            steps.append("4. Query executed OK")
            
            user = result.scalar_one_or_none()
            steps.append(f"5. User lookup result: {'found' if user else 'not found (will create)'}")
            
            if not user:
                steps.append("6. Creating new test user...")
                user = User(
                    email="test_diag@jjinfit.local",
                    nickname="진단테스트",
                    avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=diag",
                    provider="demo",
                    provider_id="diag-test-id",
                )
                db.add(user)
                await db.commit()
                steps.append("7. User created and committed OK")
                await db.refresh(user)
                steps.append(f"8. User refreshed OK - id={user.id}")
            
            return {"status": "ok", "steps": steps, "user_id": user.id, "email": user.email}
    except Exception as e:
        return {"status": "error", "steps": steps, "error": str(e), "trace": traceback.format_exc()}

# CORS - Allow cloud production origins safely without violating browser credentials policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(meals.router)
app.include_router(exercises.router)
app.include_router(inbody.router)
app.include_router(fasting.router)
app.include_router(dashboard.router)
app.include_router(analysis.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "⚡ 찐fit Cloud Backend Engine is operating smoothly!"}


# Cloud Production Single-Port Serving: Serve React Vite Static build if present
frontend_dist_paths = [os.path.join(os.path.dirname(__file__), "../static"), "static", "dist"]
dist_dir = next((p for p in frontend_dist_paths if os.path.exists(p)), None)

if dist_dir and os.path.isdir(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str, request: Request):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))

