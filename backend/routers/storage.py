"""Storage router — presigned upload URLs."""

from fastapi import APIRouter, Depends, Query
from middleware.auth_middleware import get_current_user
from models.models import User
from schemas.schemas import PresignedUrlResponse
from services import storage_service

router = APIRouter(prefix="/storage", tags=["Storage"])


@router.get("/presigned-url", response_model=PresignedUrlResponse)
async def get_presigned_url(
    file_type: str = Query("image", pattern="^(image|audio)$"),
    file_extension: str = Query("jpg", pattern="^(jpg|jpeg|png|webp|mp3|wav|ogg|m4a)$"),
    user: User = Depends(get_current_user),
):
    """Get a presigned URL for direct upload to S3."""
    result = await storage_service.get_presigned_upload_url(
        file_type=file_type,
        file_extension=file_extension,
    )
    return PresignedUrlResponse(**result)
