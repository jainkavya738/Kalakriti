"""Storage service — AWS S3 presigned URL generation with Cloudinary fallback."""

import uuid
import logging
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize S3 client
try:
    import boto3
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_S3_BUCKET:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        S3_AVAILABLE = True
    else:
        s3_client = None
        S3_AVAILABLE = False
except ImportError:
    s3_client = None
    S3_AVAILABLE = False


async def get_presigned_upload_url(
    file_type: str = "image",
    file_extension: str = "jpg",
) -> dict:
    """Generate a presigned URL for direct upload to S3.

    Args:
        file_type: 'image' or 'audio'
        file_extension: file extension without dot

    Returns:
        dict with upload_url, file_url, and expires_in
    """
    file_key = f"{file_type}s/{uuid.uuid4()}.{file_extension}"

    if not S3_AVAILABLE:
        # Mock presigned URL for development
        return {
            "upload_url": f"https://mock-s3.example.com/upload/{file_key}",
            "file_url": f"https://mock-s3.example.com/{settings.AWS_S3_BUCKET or 'kalakriti-dev'}/{file_key}",
            "expires_in": 3600,
        }

    try:
        presigned = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_S3_BUCKET,
                "Key": file_key,
                "ContentType": _get_content_type(file_type, file_extension),
            },
            ExpiresIn=3600,
        )

        file_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"

        return {
            "upload_url": presigned,
            "file_url": file_url,
            "expires_in": 3600,
        }
    except Exception as e:
        logger.error(f"Presigned URL generation failed: {e}")
        raise


def _get_content_type(file_type: str, extension: str) -> str:
    """Map file type + extension to MIME type."""
    mime_map = {
        ("image", "jpg"): "image/jpeg",
        ("image", "jpeg"): "image/jpeg",
        ("image", "png"): "image/png",
        ("image", "webp"): "image/webp",
        ("audio", "mp3"): "audio/mpeg",
        ("audio", "wav"): "audio/wav",
        ("audio", "ogg"): "audio/ogg",
        ("audio", "m4a"): "audio/mp4",
    }
    return mime_map.get((file_type, extension), "application/octet-stream")
