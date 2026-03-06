"""SQLAlchemy ORM models for all Kala-Kriti database tables."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Numeric, DateTime,
    ForeignKey, CheckConstraint, UniqueConstraint, JSON, func
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from core.database import Base
from core.config import settings


def utcnow():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Helper: pick the right column type depending on the database backend
# ---------------------------------------------------------------------------
_is_postgres = not settings.DATABASE_URL.startswith("sqlite")

# UUID column type: native PostgreSQL UUID or String(36) for SQLite
UUIDType = PG_UUID(as_uuid=False) if _is_postgres else String(36)

# JSON column type: JSONB for PostgreSQL or plain JSON for SQLite
JSONType = JSONB if _is_postgres else JSON


def new_uuid():
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType, primary_key=True, default=new_uuid)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=True)
    role = Column(String(20), nullable=False)  # buyer, artisan, admin
    location = Column(String(255), nullable=True)
    firebase_uid = Column(String(128), unique=True, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    artisan_profile = relationship("Artisan", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="buyer")
    reviews = relationship("Review", back_populates="buyer")
    custom_order_requests_sent = relationship(
        "CustomOrderRequest", back_populates="buyer", foreign_keys="CustomOrderRequest.buyer_id"
    )

    __table_args__ = (
        CheckConstraint("role IN ('buyer', 'artisan', 'admin')", name="chk_user_role"),
        CheckConstraint("email IS NOT NULL OR phone IS NOT NULL", name="chk_contact"),
    )


# ---------------------------------------------------------------------------
# Artisans
# ---------------------------------------------------------------------------
class Artisan(Base):
    __tablename__ = "artisans"

    artisan_id = Column(UUIDType, primary_key=True, default=new_uuid)
    user_id = Column(UUIDType, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    craft_type = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    profile_image_url = Column(Text, nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    rating = Column(Numeric(3, 2), default=0.00)
    total_reviews = Column(Integer, nullable=False, default=0)
    verification_status = Column(String(20), nullable=False, default="pending")
    stripe_account_id = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("User", back_populates="artisan_profile")
    products = relationship("Product", back_populates="artisan", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="artisan")
    reviews = relationship("Review", back_populates="artisan")
    custom_order_requests_received = relationship("CustomOrderRequest", back_populates="artisan")

    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 5", name="chk_artisan_rating"),
        CheckConstraint("total_reviews >= 0", name="chk_total_reviews"),
        CheckConstraint(
            "verification_status IN ('pending', 'verified', 'rejected')",
            name="chk_verification_status",
        ),
    )


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class Product(Base):
    __tablename__ = "products"

    product_id = Column(UUIDType, primary_key=True, default=new_uuid)
    artisan_id = Column(UUIDType, ForeignKey("artisans.artisan_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    raw_voice_text = Column(Text, nullable=True)
    description = Column(Text, nullable=False, default="")
    cultural_story = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(5), nullable=False, default="INR")
    category = Column(String(100), nullable=False, default="General")
    tags = Column(JSONType, default=list)  # JSONB on PostgreSQL, JSON on SQLite
    image_url = Column(Text, nullable=False, default="")
    audio_url = Column(Text, nullable=True)
    is_published = Column(Boolean, nullable=False, default=False)
    is_available = Column(Boolean, nullable=False, default=True)
    is_flagged = Column(Boolean, nullable=False, default=False)
    stock_quantity = Column(Integer, nullable=False, default=1)
    language = Column(String(10), nullable=False, default="en")
    seo_keywords = Column(JSONType, default=list)
    ai_generated = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    artisan = relationship("Artisan", back_populates="products")
    translations = relationship("ProductTranslation", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")
    ai_jobs = relationship("AIProcessingJob", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("price > 0", name="chk_product_price"),
        CheckConstraint("stock_quantity >= 0", name="chk_stock_quantity"),
    )


# ---------------------------------------------------------------------------
# Product Translations
# ---------------------------------------------------------------------------
class ProductTranslation(Base):
    __tablename__ = "product_translations"

    id = Column(UUIDType, primary_key=True, default=new_uuid)
    product_id = Column(UUIDType, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    language = Column(String(10), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    cultural_story = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    product = relationship("Product", back_populates="translations")

    __table_args__ = (
        UniqueConstraint("product_id", "language", name="uq_product_language"),
    )


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
class Order(Base):
    __tablename__ = "orders"

    order_id = Column(UUIDType, primary_key=True, default=new_uuid)
    buyer_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    stripe_payment_intent = Column(String(255), unique=True, nullable=True)
    stripe_session_id = Column(String(255), unique=True, nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(5), nullable=False, default="INR")
    payment_status = Column(String(20), nullable=False, default="pending")
    shipping_status = Column(String(20), nullable=False, default="not_shipped")
    shipping_address = Column(JSONType, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    buyer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("total_amount > 0", name="chk_order_total"),
        CheckConstraint(
            "payment_status IN ('pending', 'paid', 'failed', 'refunded')",
            name="chk_payment_status",
        ),
        CheckConstraint(
            "shipping_status IN ('not_shipped', 'processing', 'shipped', 'delivered', 'returned')",
            name="chk_shipping_status",
        ),
    )


# ---------------------------------------------------------------------------
# Order Items
# ---------------------------------------------------------------------------
class OrderItem(Base):
    __tablename__ = "order_items"

    item_id = Column(UUIDType, primary_key=True, default=new_uuid)
    order_id = Column(UUIDType, ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUIDType, ForeignKey("products.product_id"), nullable=False)
    artisan_id = Column(UUIDType, ForeignKey("artisans.artisan_id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)

    # Computed property (cannot use GENERATED ALWAYS AS in SQLite)
    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    artisan = relationship("Artisan", back_populates="order_items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_item_quantity"),
        CheckConstraint("unit_price > 0", name="chk_item_price"),
    )


# ---------------------------------------------------------------------------
# Custom Order Requests
# ---------------------------------------------------------------------------
class CustomOrderRequest(Base):
    __tablename__ = "custom_order_requests"

    request_id = Column(UUIDType, primary_key=True, default=new_uuid)
    buyer_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    artisan_id = Column(UUIDType, ForeignKey("artisans.artisan_id"), nullable=False)
    product_id = Column(UUIDType, ForeignKey("products.product_id"), nullable=True)
    message = Column(Text, nullable=False)
    budget = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), nullable=False, default="open")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    buyer = relationship("User", back_populates="custom_order_requests_sent")
    artisan = relationship("Artisan", back_populates="custom_order_requests_received")

    __table_args__ = (
        CheckConstraint(
            "status IN ('open', 'accepted', 'rejected', 'completed')",
            name="chk_custom_order_status",
        ),
    )


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(UUIDType, primary_key=True, default=new_uuid)
    buyer_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    product_id = Column(UUIDType, ForeignKey("products.product_id"), nullable=False)
    artisan_id = Column(UUIDType, ForeignKey("artisans.artisan_id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    buyer = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")
    artisan = relationship("Artisan", back_populates="reviews")

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating"),
        UniqueConstraint("buyer_id", "product_id", name="uq_buyer_product_review"),
    )


# ---------------------------------------------------------------------------
# AI Processing Jobs
# ---------------------------------------------------------------------------
class AIProcessingJob(Base):
    __tablename__ = "ai_processing_jobs"

    job_id = Column(UUIDType, primary_key=True, default=new_uuid)
    product_id = Column(UUIDType, ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="queued")
    result = Column(JSONType, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    product = relationship("Product", back_populates="ai_jobs")

    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'processing', 'completed', 'failed')",
            name="chk_job_status",
        ),
    )
