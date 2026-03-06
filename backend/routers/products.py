"""Products router — full product lifecycle management."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from core.database import get_db
from models.models import User, Artisan, Product, ProductTranslation
from schemas.schemas import (
    ProductCreateRequest, ProductUpdateRequest, ProductResponse,
    ProductListResponse, ProductTranslationResponse,
)
from middleware.auth_middleware import get_current_user, get_optional_user

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/upload", response_model=ProductResponse, status_code=201)
async def upload_product(
    body: ProductCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a new product (artisan only). Triggers AI pipeline."""
    result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    artisan = result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=403, detail="Only artisans can upload products")

    product = Product(
        artisan_id=artisan.artisan_id,
        title=body.title or "Untitled Product",
        description=body.description or "",
        cultural_story=body.cultural_story,
        price=body.price or 100.00,
        currency=body.currency,
        category=body.category or "General",
        tags=body.tags,
        image_url=body.image_url,
        audio_url=body.audio_url,
        language=body.language,
        is_published=False,
        ai_generated=True,
    )
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.get("", response_model=ProductListResponse)
async def browse_products(
    category: str = Query(None),
    state: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Browse marketplace with filters."""
    query = select(Product).where(
        Product.is_published == True,
        Product.is_available == True,
    )

    if category:
        query = query.where(Product.category == category)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    if search:
        query = query.where(
            Product.title.ilike(f"%{search}%") | Product.description.ilike(f"%{search}%")
        )
    if state:
        query = query.join(Artisan).where(Artisan.state == state)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Get full product detail."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_id}/translations", response_model=list[ProductTranslationResponse])
async def get_product_translations(product_id: str, db: AsyncSession = Depends(get_db)):
    """Get all translations for a product."""
    result = await db.execute(
        select(ProductTranslation).where(ProductTranslation.product_id == product_id)
    )
    return result.scalars().all()


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    body: ProductUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Artisan edits a product (draft or published)."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Verify ownership
    artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    artisan = artisan_result.scalar_one_or_none()
    if not artisan or artisan.artisan_id != product.artisan_id:
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    if update_data:
        product.ai_generated = False  # Mark as manually edited

    await db.flush()
    await db.refresh(product)
    return product


@router.post("/{product_id}/publish", response_model=ProductResponse)
async def publish_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Artisan confirms and publishes a listing."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    artisan = artisan_result.scalar_one_or_none()
    if not artisan or artisan.artisan_id != product.artisan_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if artisan.verification_status != "verified":
        raise HTTPException(
            status_code=403,
            detail="Only verified artisans can publish products",
        )

    if not product.image_url:
        raise HTTPException(status_code=400, detail="Product must have an image to publish")

    product.is_published = True
    await db.flush()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", response_model=ProductResponse)
async def delete_product(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a product (sets is_available = false)."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    artisan_result = await db.execute(select(Artisan).where(Artisan.user_id == user.id))
    artisan = artisan_result.scalar_one_or_none()
    if not artisan or artisan.artisan_id != product.artisan_id:
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    product.is_available = False
    product.is_published = False
    await db.flush()
    await db.refresh(product)
    return product
