"""Custom orders router — buyer-artisan custom request management."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.models import User, Artisan, CustomOrderRequest
from schemas.schemas import (
    CustomOrderCreateRequest, CustomOrderUpdateRequest, CustomOrderResponse,
)
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/custom-orders", tags=["Custom Orders"])


@router.post("", response_model=CustomOrderResponse, status_code=201)
async def create_custom_order(
    body: CustomOrderCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Buyer submits a custom order request to an artisan."""
    # Verify artisan exists
    artisan_result = await db.execute(
        select(Artisan).where(Artisan.artisan_id == body.artisan_id)
    )
    if not artisan_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Artisan not found")

    request = CustomOrderRequest(
        buyer_id=user.id,
        artisan_id=body.artisan_id,
        product_id=body.product_id,
        message=body.message,
        budget=body.budget,
    )
    db.add(request)
    await db.flush()
    await db.refresh(request)
    return request


@router.get("", response_model=list[CustomOrderResponse])
async def list_custom_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List custom order requests filtered by role."""
    if user.role == "artisan":
        artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
        artisan = artisan_result.scalar_one_or_none()
        if not artisan:
            return []
        result = await db.execute(
            select(CustomOrderRequest)
            .where(CustomOrderRequest.artisan_id == artisan.artisan_id)
            .order_by(CustomOrderRequest.created_at.desc())
        )
    elif user.role == "admin":
        result = await db.execute(
            select(CustomOrderRequest).order_by(CustomOrderRequest.created_at.desc())
        )
    else:
        result = await db.execute(
            select(CustomOrderRequest)
            .where(CustomOrderRequest.buyer_id == user.id)
            .order_by(CustomOrderRequest.created_at.desc())
        )

    return result.scalars().all()


@router.put("/{request_id}", response_model=CustomOrderResponse)
async def update_custom_order(
    request_id: str,
    body: CustomOrderUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Artisan accepts/rejects a custom order request."""
    result = await db.execute(
        select(CustomOrderRequest).where(CustomOrderRequest.request_id == request_id)
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="Custom order not found")

    # Only the artisan or admin can update
    artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    artisan = artisan_result.scalar_one_or_none()
    if user.role != "admin" and (not artisan or artisan.artisan_id != request.artisan_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    request.status = body.status
    await db.flush()
    await db.refresh(request)
    return request
