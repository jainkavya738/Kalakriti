"""Payments router — Stripe Checkout and Webhook handling."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.models import User, Product, Artisan, Order, OrderItem
from schemas.schemas import CheckoutRequest, OrderResponse
from middleware.auth_middleware import get_current_user
from services import stripe_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/create-checkout-session")
async def create_checkout_session(
    body: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout Session for cart items."""
    line_items = []
    total_amount = 0

    for cart_item in body.items:
        result = await db.execute(
            select(Product).where(Product.product_id == cart_item.product_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {cart_item.product_id} not found")
        if not product.is_available or not product.is_published:
            raise HTTPException(status_code=400, detail=f"Product {product.title} is not available")
        if product.stock_quantity < cart_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.title}",
            )

        line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {
                    "name": product.title,
                    "description": product.description[:500] if product.description else "",
                    "images": [product.image_url] if product.image_url else [],
                },
                "unit_amount": int(float(product.price) * 100),  # Stripe uses paisa
            },
            "quantity": cart_item.quantity,
        })
        total_amount += float(product.price) * cart_item.quantity

    # Create order in pending state
    order = Order(
        buyer_id=user.id,
        total_amount=total_amount,
        currency="INR",
        shipping_address=body.shipping_address,
    )
    db.add(order)
    await db.flush()

    # Add order items
    for cart_item in body.items:
        product_result = await db.execute(
            select(Product).where(Product.product_id == cart_item.product_id)
        )
        product = product_result.scalar_one()
        item = OrderItem(
            order_id=order.order_id,
            product_id=cart_item.product_id,
            artisan_id=product.artisan_id,
            quantity=cart_item.quantity,
            unit_price=float(product.price),
        )
        db.add(item)

    # Create Stripe session
    session = await stripe_service.create_checkout_session(
        line_items=line_items,
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        metadata={
            "buyer_id": user.id,
            "order_id": order.order_id,
        },
    )

    order.stripe_session_id = session["id"]
    order.stripe_payment_intent = session.get("payment_intent")
    await db.flush()

    return {"checkout_url": session["url"], "order_id": order.order_id}


@router.post("/webhook")
async def handle_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events. This endpoint is NOT authenticated."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe_service.verify_webhook_signature(payload, sig_header)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        order_id = data.get("metadata", {}).get("order_id")
        if order_id:
            result = await db.execute(select(Order).where(Order.order_id == order_id))
            order = result.scalar_one_or_none()
            if order:
                order.payment_status = "paid"
                order.stripe_payment_intent = data.get("payment_intent")

                # Decrement stock
                items_result = await db.execute(
                    select(OrderItem).where(OrderItem.order_id == order_id)
                )
                for item in items_result.scalars():
                    product_result = await db.execute(
                        select(Product).where(Product.product_id == item.product_id)
                    )
                    product = product_result.scalar_one_or_none()
                    if product:
                        product.stock_quantity = max(0, product.stock_quantity - item.quantity)

                await db.flush()
                logger.info(f"Order {order_id} payment completed")

    elif event_type == "payment_intent.payment_failed":
        payment_intent = data.get("id")
        if payment_intent:
            result = await db.execute(
                select(Order).where(Order.stripe_payment_intent == payment_intent)
            )
            order = result.scalar_one_or_none()
            if order:
                order.payment_status = "failed"
                await db.flush()

    elif event_type == "charge.refunded":
        payment_intent = data.get("payment_intent")
        if payment_intent:
            result = await db.execute(
                select(Order).where(Order.stripe_payment_intent == payment_intent)
            )
            order = result.scalar_one_or_none()
            if order:
                order.payment_status = "refunded"
                # Restock items
                items_result = await db.execute(
                    select(OrderItem).where(OrderItem.order_id == order.order_id)
                )
                for item in items_result.scalars():
                    product_result = await db.execute(
                        select(Product).where(Product.product_id == item.product_id)
                    )
                    product = product_result.scalar_one_or_none()
                    if product:
                        product.stock_quantity += item.quantity
                await db.flush()

    return {"status": "ok"}
