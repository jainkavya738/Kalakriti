"""Artisan router — profile management and public listing."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from core.database import get_db
from models.models import User, Artisan, Product
from schemas.schemas import (
    ArtisanRegisterRequest, ArtisanUpdateRequest,
    ArtisanResponse, ArtisanPublicResponse, ProductResponse,
)
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/artisans", tags=["Artisans"])


@router.get("/me", response_model=ArtisanPublicResponse)
async def get_my_artisan_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's artisan profile."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Artisan).options(selectinload(Artisan.user)).where(Artisan.user_id == user.id)
    )
    artisan = result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=404, detail="Not registered as artisan")
    response = ArtisanPublicResponse.model_validate(artisan)
    response.user_name = artisan.user.name if artisan.user else None
    return response


@router.get("/me/products", response_model=list[ProductResponse])
async def get_my_products(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all products for the current artisan, including drafts."""
    result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    artisan = result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=404, detail="Not registered as artisan")
    products_result = await db.execute(
        select(Product)
        .where(Product.artisan_id == artisan.artisan_id, Product.is_available == True)
        .order_by(Product.created_at.desc())
    )
    return products_result.scalars().all()


@router.post("/register", response_model=ArtisanResponse, status_code=201)
async def register_artisan(
    body: ArtisanRegisterRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create artisan profile linked to the current user."""
    # Check if already registered
    result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Artisan profile already exists")

    # Update user role to artisan
    user.role = "artisan"

    artisan = Artisan(
        user_id=user.id,
        craft_type=body.craft_type,
        bio=body.bio,
        profile_image_url=body.profile_image_url,
        state=body.state,
        city=body.city,
    )
    db.add(artisan)
    await db.flush()
    await db.refresh(artisan)
    return artisan


@router.get("/{artisan_id}", response_model=ArtisanPublicResponse)
async def get_artisan(artisan_id: str, db: AsyncSession = Depends(get_db)):
    """Get public artisan profile."""
    result = await db.execute(
        select(Artisan).options(selectinload(Artisan.user)).where(Artisan.artisan_id == artisan_id)
    )
    artisan = result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=404, detail="Artisan not found")

    response = ArtisanPublicResponse.model_validate(artisan)
    response.user_name = artisan.user.name if artisan.user else None
    return response


@router.put("/{artisan_id}", response_model=ArtisanResponse)
async def update_artisan(
    artisan_id: str,
    body: ArtisanUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update artisan profile (owner only)."""
    result = await db.execute(select(Artisan).where(Artisan.artisan_id == artisan_id))
    artisan = result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=404, detail="Artisan not found")
    if artisan.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(artisan, field, value)

    await db.flush()
    await db.refresh(artisan)
    return artisan


@router.get("/{artisan_id}/products", response_model=list[ProductResponse])
async def get_artisan_products(artisan_id: str, db: AsyncSession = Depends(get_db)):
    """Get all published products by an artisan."""
    result = await db.execute(
        select(Product)
        .where(Product.artisan_id == artisan_id, Product.is_published == True, Product.is_available == True)
        .order_by(Product.created_at.desc())
    )
    return result.scalars().all()
