"""Reviews router — product reviews and ratings."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from core.database import get_db
from models.models import User, Review, Product, Artisan
from schemas.schemas import ReviewCreateRequest, ReviewResponse
from middleware.auth_middleware import get_current_user

router = APIRouter(tags=["Reviews"])


@router.post("/reviews", response_model=ReviewResponse, status_code=201)
async def create_review(
    body: ReviewCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Buyer submits a review for a purchased product."""
    # Get product and its artisan
    product_result = await db.execute(
        select(Product).where(Product.product_id == body.product_id)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check for existing review
    existing = await db.execute(
        select(Review).where(
            Review.buyer_id == user.id,
            Review.product_id == body.product_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    review = Review(
        buyer_id=user.id,
        product_id=body.product_id,
        artisan_id=product.artisan_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    await db.flush()

    # Recalculate artisan rating
    avg_result = await db.execute(
        select(
            func.avg(Review.rating),
            func.count(Review.review_id),
        ).where(Review.artisan_id == product.artisan_id)
    )
    avg_rating, total_reviews = avg_result.one()

    artisan_result = await db.execute(
        select(Artisan).where(Artisan.artisan_id == product.artisan_id)
    )
    artisan = artisan_result.scalar_one_or_none()
    if artisan:
        artisan.rating = round(float(avg_rating), 2) if avg_rating else 0
        artisan.total_reviews = total_reviews or 0

    await db.refresh(review)

    response = ReviewResponse.model_validate(review)
    response.buyer_name = user.name
    return response


@router.get("/products/{product_id}/reviews", response_model=list[ReviewResponse])
async def get_product_reviews(product_id: str, db: AsyncSession = Depends(get_db)):
    """Get all reviews for a product."""
    result = await db.execute(
        select(Review)
        .options(selectinload(Review.buyer))
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    response = []
    for r in reviews:
        rev = ReviewResponse.model_validate(r)
        rev.buyer_name = r.buyer.name if r.buyer else None
        response.append(rev)
    return response
