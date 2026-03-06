"""AI router — transcription, listing generation, image analysis, translation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.models import User, Artisan, Product, ProductTranslation, AIProcessingJob
from schemas.schemas import (
    AIListingResult, AIJobResponse, ImageAnalysisResult, TranslationRequest,
)
from middleware.auth_middleware import get_current_user
from services import ai_service, translation_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Processing"])


@router.post("/transcribe")
async def transcribe_audio(
    audio_url: str,
    user: User = Depends(get_current_user),
):
    """Transcribe uploaded audio to text using Whisper."""
    text = await ai_service.transcribe_audio(audio_url)
    return {"transcript": text}


@router.post("/generate-listing", response_model=AIListingResult)
async def generate_listing(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate title, description, cultural story, tags, and SEO keywords for a product."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get artisan info
    artisan_result = await db.execute(
        select(Artisan).where(Artisan.artisan_id == product.artisan_id)
    )
    artisan = artisan_result.scalar_one_or_none()
    if not artisan:
        raise HTTPException(status_code=404, detail="Artisan not found")

    # Create AI job
    job = AIProcessingJob(product_id=product_id, status="processing")
    db.add(job)
    await db.flush()

    try:
        # Step 1: Image analysis
        image_analysis = await ai_service.analyze_image(product.image_url)

        # Step 2: Transcription (if audio exists)
        raw_text = product.raw_voice_text
        if product.audio_url and not raw_text:
            raw_text = await ai_service.transcribe_audio(product.audio_url)
            product.raw_voice_text = raw_text

        # Step 3: Generate listing
        listing = await ai_service.generate_listing(
            raw_voice_text=raw_text or "Handcrafted product",
            image_analysis=image_analysis,
            craft_type=artisan.craft_type,
            state=artisan.state or "India",
        )

        # Update product with generated content
        product.title = listing["title"]
        product.description = listing["description"]
        product.cultural_story = listing.get("cultural_story")
        product.tags = listing.get("tags", [])
        product.seo_keywords = listing.get("seo_keywords", [])
        product.category = listing.get("suggested_category", product.category)
        if listing.get("suggested_price_inr") and float(product.price) <= 100:
            product.price = listing["suggested_price_inr"]

        # Check authenticity
        auth_check = await ai_service.check_authenticity(product.image_url)
        if not auth_check.get("is_handcrafted", True):
            product.is_flagged = True

        # Update job status
        job.status = "completed"
        job.result = {
            "listing": listing,
            "image_analysis": image_analysis,
            "authenticity": auth_check,
        }

        await db.flush()
        return AIListingResult(**listing)

    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        await db.flush()
        logger.error(f"AI listing generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")


@router.post("/analyze-image", response_model=ImageAnalysisResult)
async def analyze_image(
    image_url: str,
    user: User = Depends(get_current_user),
):
    """Analyze a product image using Vision API."""
    result = await ai_service.analyze_image(image_url)
    return ImageAnalysisResult(**result)


@router.post("/translate/{product_id}")
async def translate_product(
    product_id: str,
    body: TranslationRequest = TranslationRequest(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Translate a product listing into regional languages."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    translations = await translation_service.translate_text(
        title=product.title,
        description=product.description,
        cultural_story=product.cultural_story,
        target_languages=body.languages,
    )

    saved_translations = []
    for lang, content in translations.items():
        # Upsert translation
        existing = await db.execute(
            select(ProductTranslation).where(
                ProductTranslation.product_id == product_id,
                ProductTranslation.language == lang,
            )
        )
        translation = existing.scalar_one_or_none()
        if translation:
            translation.title = content["title"]
            translation.description = content["description"]
            translation.cultural_story = content.get("cultural_story")
        else:
            translation = ProductTranslation(
                product_id=product_id,
                language=lang,
                title=content["title"],
                description=content["description"],
                cultural_story=content.get("cultural_story"),
            )
            db.add(translation)

        saved_translations.append({
            "language": lang,
            "title": content["title"],
            "description": content["description"][:100] + "...",
        })

    await db.flush()
    return {"translations": saved_translations}


@router.get("/jobs/{job_id}", response_model=AIJobResponse)
async def get_job_status(job_id: str, db: AsyncSession = Depends(get_db)):
    """Poll AI processing job status."""
    result = await db.execute(
        select(AIProcessingJob).where(AIProcessingJob.job_id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/generate-caption/{product_id}")
async def generate_caption(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate social media captions for a product."""
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    artisan_result = await db.execute(
        select(Artisan).where(Artisan.artisan_id == product.artisan_id)
    )
    artisan = artisan_result.scalar_one_or_none()

    captions = await ai_service.generate_social_caption(
        title=product.title,
        description=product.description,
        craft_type=artisan.craft_type if artisan else "Handicraft",
        state=artisan.state if artisan else "India",
    )
    return captions
