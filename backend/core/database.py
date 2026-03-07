"""SQLAlchemy async engine and session management."""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from core.config import settings

# Handle SQLite vs PostgreSQL engine creation
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.APP_ENV == "development",
    )
else:
    # PostgreSQL (Supabase) — with connection pooling best practices
    connect_args = {}
    if settings.DATABASE_URL.startswith("postgresql+asyncpg"):
        # Fix for Supabase transaction pooler (pgBouncer) disconnecting or failing with prepared statements
        connect_args = {
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0
        }
        
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.APP_ENV == "development",
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_pre_ping=True,         # reconnect on stale connections
        pool_recycle=300,            # recycle connections every 5 minutes
        connect_args=connect_args,
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Create all tables (for dev/testing — use Alembic in production)."""
    import models.models  # Ensure models are imported so Base.metadata is populated
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
