"""Auth router — verify Firebase tokens and manage user sessions."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.firebase import verify_firebase_token
from models.models import User
from schemas.schemas import TokenVerifyRequest, UserResponse
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/verify", response_model=UserResponse)
async def verify_token(
    body: TokenVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify Firebase ID token and create/return user record."""
    decoded = verify_firebase_token(body.id_token)
    if decoded is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    firebase_uid = decoded.get("uid")
    email = decoded.get("email")
    name = decoded.get("name") or body.name or "User"

    # Check if user exists
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            name=name,
            email=email,
            phone=body.phone,
            role=body.role or "buyer",
            firebase_uid=firebase_uid,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    return user


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Return the current authenticated user."""
    return user
