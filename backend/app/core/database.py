from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

import socket
from urllib.parse import urlparse

connect_args = {}
if "sqlite" in db_url:
    connect_args["check_same_thread"] = False
else:
    connect_args["prepared_statement_cache_size"] = 0
    connect_args["statement_cache_size"] = 0
    connect_args["ssl"] = "require"
    
    if "?" in db_url:
        db_url = db_url.split("?")[0]
        
    # CRITICAL FIX for Render's IPv4-only environment:
    # asyncpg crashes if it tries IPv6 first and fails. Force IPv4 resolution.
    if "supabase.com" in db_url:
        try:
            parsed = urlparse(db_url)
            if parsed.hostname:
                ipv4 = socket.gethostbyname(parsed.hostname)
                db_url = db_url.replace(parsed.hostname, ipv4)
        except Exception:
            pass

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    import logging
    logger = logging.getLogger("jjinfit.db")
    
    try:
        async with engine.begin() as conn:
            logger.info("[init_db] Creating all tables...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("[init_db] Tables created successfully!")
            
            # Migrate existing columns that may be too small for PostgreSQL
            from sqlalchemy import text
            migrations = [
                "ALTER TABLE exercises ALTER COLUMN source TYPE VARCHAR(50);",
                "ALTER TABLE inbody_records ALTER COLUMN skeletal_muscle DROP NOT NULL;",
                "ALTER TABLE inbody_records ALTER COLUMN body_fat_mass DROP NOT NULL;",
            ]
            for sql in migrations:
                try:
                    await conn.execute(text(sql))
                except Exception:
                    pass  # Column already correct size or table doesn't exist yet
    except Exception as e:
        logger.error(f"[init_db] CRITICAL - Table creation FAILED: {e}")
        raise
