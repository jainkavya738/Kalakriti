"""Pydantic request/response schemas for all API endpoints."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class TokenVerifyRequest(BaseModel):
    id_token: str
    role: Optional[str] = "buyer"
    name: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    location: Optional[str] = None
    firebase_uid: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Artisans
# ---------------------------------------------------------------------------
class ArtisanRegisterRequest(BaseModel):
    craft_type: str
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None


class ArtisanUpdateRequest(BaseModel):
    craft_type: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None


class ArtisanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    artisan_id: str
    user_id: str
    craft_type: str
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: int
    verification_status: str
    created_at: datetime
    updated_at: datetime


class ArtisanPublicResponse(ArtisanResponse):
    """Artisan profile with user name for public display."""
    user_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class ProductCreateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cultural_story: Optional[str] = None
    price: Optional[float] = None
    currency: str = "INR"
    category: Optional[str] = None
    tags: List[str] = []
    image_url: str
    audio_url: Optional[str] = None
    language: str = "en"


class ProductUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cultural_story: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    seo_keywords: Optional[List[str]] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: str
    artisan_id: str
    title: str
    raw_voice_text: Optional[str] = None
    description: str
    cultural_story: Optional[str] = None
    price: float
    currency: str
    category: str
    tags: List[str] = []
    image_url: str
    audio_url: Optional[str] = None
    is_published: bool
    is_available: bool
    is_flagged: bool = False
    stock_quantity: int
    language: str
    seo_keywords: List[str] = []
    ai_generated: bool
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int


class ProductTranslationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str
    language: str
    title: str
    description: str
    cultural_story: Optional[str] = None


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
class CartItem(BaseModel):
    product_id: str
    quantity: int = 1


class CheckoutRequest(BaseModel):
    items: List[CartItem]
    shipping_address: dict
    success_url: str = "http://localhost:3000/buyer/orders"
    cancel_url: str = "http://localhost:3000/marketplace"


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    item_id: str
    order_id: str
    product_id: str
    artisan_id: str
    quantity: int
    unit_price: float


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    order_id: str
    buyer_id: str
    total_amount: float
    currency: str
    payment_status: str
    shipping_status: str
    shipping_address: dict
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []


class ShippingUpdateRequest(BaseModel):
    shipping_status: str = Field(
        ..., pattern="^(not_shipped|processing|shipped|delivered|returned)$"
    )


# ---------------------------------------------------------------------------
# Custom Orders
# ---------------------------------------------------------------------------
class CustomOrderCreateRequest(BaseModel):
    artisan_id: str
    product_id: Optional[str] = None
    message: str
    budget: Optional[float] = None


class CustomOrderUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(accepted|rejected|completed)$")


class CustomOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    request_id: str
    buyer_id: str
    artisan_id: str
    product_id: Optional[str] = None
    message: str
    budget: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class ReviewCreateRequest(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    review_id: str
    buyer_id: str
    product_id: str
    artisan_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    buyer_name: Optional[str] = None


# ---------------------------------------------------------------------------
# AI
# ---------------------------------------------------------------------------
class AIListingResult(BaseModel):
    title: str
    description: str
    cultural_story: str
    tags: List[str]
    seo_keywords: List[str]
    suggested_category: str
    suggested_price_inr: Optional[float] = None


class AIJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    job_id: str
    product_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ImageAnalysisResult(BaseModel):
    craft_type: str
    colors: List[str]
    materials: List[str]
    suggested_category: str
    confidence_score: float
    is_handcrafted: bool = True


class TranslationRequest(BaseModel):
    languages: List[str] = ["hi", "ta", "te", "bn", "mr"]


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
class VerifyArtisanRequest(BaseModel):
    verification_status: str = Field(
        ..., pattern="^(verified|rejected)$"
    )


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------
class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_url: str
    expires_in: int = 3600
