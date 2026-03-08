"""
Order routes — prototype order placement (no payment).
"""

from fastapi import APIRouter, HTTPException
import uuid
from app.models.order import OrderCreate, OrderResponse
from app.database import get_db

router = APIRouter()


@router.post("/", response_model=dict)
async def place_order(order: OrderCreate):
    """Place a prototype order (no real payment)."""
    db = get_db()

    # Look up product price using correct PK column
    product_res = (
        db.table("products")
        .select("price, artisan_id")
        .eq("product_id", order.product_id)
        .execute()
    )
    if not product_res.data:
        raise HTTPException(status_code=404, detail="Product not found")

    price = product_res.data[0]["price"]

    # Build the order record matching the DB schema
    order_id = str(uuid.uuid4())
    order_data = {
        "order_id": order_id,
        "total_amount": price,
        "currency": "INR",
        "payment_status": "pending",
        "shipping_status": "not_shipped",
        "buyer_name": order.buyer_name,
        "buyer_email": order.buyer_email,
        "buyer_phone": order.buyer_phone or "",
        "message": order.message or "",
        "shipping_address": {
            "name": order.buyer_name,
            "email": order.buyer_email,
            "phone": order.buyer_phone or "",
            "message": order.message or "",
        }
    }

    # Add buyer_id if provided (from authenticated user)
    if order.buyer_id:
        order_data["buyer_id"] = order.buyer_id

    response = db.table("orders").insert(order_data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to place order")

    # Insert into order_items
    order_item_data = {
        "item_id": str(uuid.uuid4()),
        "order_id": order_id,
        "product_id": order.product_id,
        "artisan_id": product_res.data[0]["artisan_id"],
        "quantity": 1,
        "unit_price": price
    }
    db.table("order_items").insert(order_item_data).execute()

    return {
        "message": "Order placed (prototype)",
        "order_id": response.data[0]["order_id"],
        "payment_status": "prototype",
    }


@router.get("/{order_id}", response_model=dict)
async def get_order(order_id: str):
    """Get order details / receipt."""
    db = get_db()
    response = (
        db.table("orders")
        .select("*, order_items!inner(*, products(title, image_url, price))")
        .eq("order_id", order_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"order": response.data[0]}


@router.get("/artisan/{artisan_id}", response_model=dict)
async def get_artisan_orders(artisan_id: str):
    """Get all orders where the product belongs to the given artisan."""
    db = get_db()
    
    # Check if artisan_id passed is actually a user_id
    actual_artisan_id = artisan_id
    try:
        artisan_res = db.table("artisans").select("artisan_id").eq("artisan_id", artisan_id).execute()
        if not artisan_res.data:
            # Check by user_id
            user_res = db.table("artisans").select("artisan_id").eq("user_id", artisan_id).execute()
            if user_res.data:
                actual_artisan_id = user_res.data[0]["artisan_id"]
    except Exception as e:
        print(f"Error resolving artisan_id: {e}")

    response = (
        db.table("orders")
        .select("*, order_items!inner(*, products!inner(title, image_url, price, artisan_id))")
        .eq("order_items.artisan_id", actual_artisan_id)
        .order("created_at", desc=True)
        .execute()
    )
    
    orders = response.data or []
    return {"orders": orders}


@router.get("/buyer/{buyer_id}", response_model=dict)
async def get_buyer_orders(buyer_id: str):
    """Get all orders placed by the given buyer."""
    db = get_db()
    
    response = (
        db.table("orders")
        .select("*, order_items(*, products(title, image_url, price, artisan_id))")
        .eq("buyer_id", buyer_id)
        .order("created_at", desc=True)
        .execute()
    )
    
    orders = response.data or []
    return {"orders": orders}
