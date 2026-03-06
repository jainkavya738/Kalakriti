"""Admin router — artisan verification and flagged product management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.models import User, Artisan, Product
from schemas.schemas import ArtisanResponse, ProductResponse, VerifyArtisanRequest
from middleware.auth_middleware import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/artisans/pending", response_model=list[ArtisanResponse])
async def list_pending_artisans(
    user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """List artisans awaiting verification."""
    result = await db.execute(
        select(Artisan)
        .where(Artisan.verification_status == "pending")
        .order_by(Artisan.created_at.desc())
    )
    return result.scalars().all()


@router.put("/artisans/{artisan_id}/verify", response_model=ArtisanResponse)
async def verify_artisan(
    artisan_id: str,
    body: VerifyArtisanRequest,
    user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject an artisan."""
    result = await db.execute(
        select(Artisan).where(Artisan.artisan_id == artisan_id)
    )
    artisan = result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=404, detail="Artisan not found")

    artisan.verification_status = body.verification_status
    await db.flush()
    await db.refresh(artisan)
    return artisan


@router.get("/products/flagged", response_model=list[ProductResponse])
async def list_flagged_products(
    user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """List flagged / suspicious product listings."""
    result = await db.execute(
        select(Product)
        .where(Product.is_flagged == True)
        .order_by(Product.created_at.desc())
    )
    return result.scalars().all()
