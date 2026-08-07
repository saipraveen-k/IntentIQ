import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.models.domain import Base

logger = logging.getLogger("intent_iq.database")

from sqlalchemy.pool import NullPool

# Engine configuration
engine_args = {
    "poolclass": NullPool,
}
if "sqlite" in settings.DATABASE_URL:
    engine_args = {"connect_args": {"check_same_thread": False}}

async_engine = create_async_engine(settings.DATABASE_URL, echo=False, **engine_args)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def init_db():
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.warning(f"Initial DB connection notice ({e}). Retrying initialization...")
        import asyncio
        await asyncio.sleep(0.5)
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

