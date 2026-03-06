"""Orders router — buyer order management and artisan shipping updates."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from core.database import get_db
from models.models import User, Order, OrderItem, Artisan
from schemas.schemas import OrderResponse, ShippingUpdateRequest
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/artisan", response_model=list[OrderResponse])
async def list_artisan_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List orders containing items sold by the current artisan."""
    artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    artisan = artisan_result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=403, detail="Not an artisan")
    from models.models import OrderItem as OI
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .join(OI, OI.order_id == Order.order_id)
        .where(OI.artisan_id == artisan.artisan_id)
        .distinct()
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List orders for the current buyer."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.buyer_id == user.id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get order detail with items."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Buyers can view their own orders; artisans can view orders containing their items
    if order.buyer_id != user.id and user.role != "admin":
        # Check if artisan has items in this order
        artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
        artisan = artisan_result.scalar_one_or_none()
        if not artisan or not any(item.artisan_id == artisan.artisan_id for item in order.items):
            raise HTTPException(status_code=403, detail="Not authorized")

    return order


@router.put("/{order_id}/shipping", response_model=OrderResponse)
async def update_shipping(
    order_id: str,
    body: ShippingUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Artisan or admin updates order shipping status."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check authorization
    if user.role == "admin":
        pass
    elif user.role == "artisan":
        artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
        artisan = artisan_result.scalar_one_or_none()
        if not artisan or not any(item.artisan_id == artisan.artisan_id for item in order.items):
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        raise HTTPException(status_code=403, detail="Only artisans and admins can update shipping")

    order.shipping_status = body.shipping_status
    await db.flush()
    await db.refresh(order)
    return order
