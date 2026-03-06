"""Kala-Kriti Backend — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import create_tables
from core.firebase import init_firebase
from routers import auth, artisans, products, orders, payments, reviews, custom_orders, admin, ai, storage
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager — runs on startup and shutdown."""
    logger.info("🎨 Starting Kala-Kriti Backend...")

    # Initialize Firebase
    init_firebase()

    # Create database tables
    try:
        await create_tables()
        logger.info("✅ Database tables created / verified")
    except Exception as e:
        logger.error(f"⚠️ Could not create/verify database tables: {e}")
        logger.error("The app will start, but database operations may fail.")

    logger.info("✅ Kala-Kriti Backend is ready!")
    yield
    logger.info("👋 Shutting down Kala-Kriti Backend...")


app = FastAPI(
    title="Kala-Kriti API",
    description="AI-Driven Digital Marketplace for Indian Artisans",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware — must be added FIRST so it handles OPTIONS preflight
if settings.APP_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers
app.include_router(auth.router)
app.include_router(artisans.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(reviews.router)
app.include_router(custom_orders.router)
app.include_router(admin.router)
app.include_router(ai.router)
app.include_router(storage.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "Kala-Kriti API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
