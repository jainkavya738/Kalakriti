"""AI service — Gemini-powered LLM, transcription, vision, and content generation."""

import json
import logging
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Google Gemini (free tier) — handles text, vision, AND audio
# ---------------------------------------------------------------------------
GEMINI_AVAILABLE = False

try:
    import google.generativeai as genai
    if settings.GOOGLE_API_KEY:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        GEMINI_AVAILABLE = True
        logger.info("Gemini AI configured successfully.")
    else:
        logger.warning("GOOGLE_API_KEY not set — AI features will return mock data.")
except ImportError:
    logger.warning("google-generativeai not installed — AI features will return mock data.")


def _parse_json_response(text: str) -> dict:
    """Strip markdown fences and parse JSON from an LLM response."""
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence (optionally with language tag)
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        # Remove closing fence if present
        if "```" in text:
            text = text.rsplit("```", 1)[0]
    return json.loads(text.strip())


# ---------------------------------------------------------------------------
# 1. Transcribe Audio — Gemini 1.5 Flash (supports audio natively)
# ---------------------------------------------------------------------------
async def transcribe_audio(audio_url: str) -> str:
    """Transcribe audio using Gemini or return mock transcript."""
    if GEMINI_AVAILABLE:
        try:
            import httpx
            import tempfile
            import os

            # Download the audio file
            async with httpx.AsyncClient() as client:
                response = await client.get(audio_url)
                audio_data = response.content

            # Determine MIME type from URL
            ext = audio_url.rsplit(".", 1)[-1].lower() if "." in audio_url else "mp3"
            mime_map = {"mp3": "audio/mp3", "wav": "audio/wav", "m4a": "audio/mp4",
                        "ogg": "audio/ogg", "flac": "audio/flac", "webm": "audio/webm"}
            mime_type = mime_map.get(ext, "audio/mp3")

            # Upload to Gemini as inline data
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([
                "Transcribe the following audio recording accurately. "
                "The speaker is an Indian artisan describing their handcrafted product. "
                "Return ONLY the transcription text, nothing else.",
                {"mime_type": mime_type, "data": audio_data},
            ])
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini audio transcription failed: {e}")

    # Mock transcript for development
    return (
        "This is a beautiful handmade pottery piece. I made it using traditional techniques "
        "passed down through my family for generations. The clay is sourced locally from "
        "the riverbanks near my village. Each piece takes about two days to complete."
    )


# ---------------------------------------------------------------------------
# 2. Analyze Image — Gemini 1.5 Flash (vision)
# ---------------------------------------------------------------------------
async def analyze_image(image_url: str) -> dict:
    """Analyze product image using Gemini Vision or return mock analysis."""
    if GEMINI_AVAILABLE:
        try:
            import httpx

            # Download the image
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                image_data = response.content

            # Determine MIME type
            ext = image_url.rsplit(".", 1)[-1].lower() if "." in image_url else "jpg"
            mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                        "webp": "image/webp", "gif": "image/gif"}
            mime_type = mime_map.get(ext, "image/jpeg")

            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([
                "Analyze this handicraft product image. Return JSON with: "
                "craft_type, colors (array), materials (array), "
                "suggested_category, confidence_score (0-1), "
                "is_handcrafted (boolean). Return ONLY valid JSON.",
                {"mime_type": mime_type, "data": image_data},
            ])
            return _parse_json_response(response.text)
        except Exception as e:
            logger.error(f"Gemini vision analysis failed: {e}")

    # Mock analysis for development
    return {
        "craft_type": "Pottery",
        "colors": ["terracotta", "brown", "cream"],
        "materials": ["clay", "natural pigments"],
        "suggested_category": "Pottery & Ceramics",
        "confidence_score": 0.85,
        "is_handcrafted": True,
    }


# ---------------------------------------------------------------------------
# 3. Generate Listing — Gemini 1.5 Flash
# ---------------------------------------------------------------------------
async def generate_listing(
    raw_voice_text: str,
    image_analysis: dict,
    craft_type: str,
    state: str,
) -> dict:
    """Generate product listing using Gemini or return mock data."""
    prompt = f"""You are a product listing expert for an Indian handicrafts marketplace called Kala-Kriti.
Given:
- Artisan's raw description (transcribed): {raw_voice_text}
- Image analysis: {json.dumps(image_analysis)}
- Artisan's craft type: {craft_type}
- Artisan's state: {state}

Generate a JSON object with:
{{
  "title": "...",
  "description": "...",
  "cultural_story": "...",
  "tags": [...],
  "seo_keywords": [...],
  "suggested_category": "...",
  "suggested_price_inr": ...
}}

Rules:
- description: 100-200 words, professional and warm tone
- cultural_story: 150-250 words about historical and cultural context
- tags: 8-12 relevant tags
- seo_keywords: 5-8 SEO keywords
- suggested_price_inr: market-based suggestion in INR

Return ONLY valid JSON. No preamble."""

    if GEMINI_AVAILABLE:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return _parse_json_response(response.text)
        except Exception as e:
            logger.error(f"Gemini listing generation failed: {e}")

    # Mock listing for development
    return {
        "title": f"Handcrafted {craft_type} from {state}",
        "description": (
            f"This exquisite {craft_type.lower()} piece is a testament to the rich artistic traditions of {state}. "
            f"Crafted with meticulous attention to detail by a skilled artisan, each piece tells a story of heritage "
            f"and craftsmanship. Using locally sourced materials and traditional techniques passed down through "
            f"generations, the artisan has created a piece that is both functional and beautiful. "
            f"The natural textures and earthy tones reflect the artisan's deep connection to their craft and homeland."
        ),
        "cultural_story": (
            f"The art of {craft_type.lower()} in {state} has a history spanning centuries, deeply rooted in the "
            f"cultural fabric of the region. Traditionally, artisans would gather materials from the surrounding "
            f"landscape, maintaining a harmonious relationship with nature. The techniques used in creating this "
            f"piece have been preserved through oral tradition, with master craftspeople teaching their skills to "
            f"the next generation. This particular style is known for its distinctive characteristics that set it "
            f"apart from similar crafts in other regions of India. By purchasing this piece, you are not only "
            f"acquiring a beautiful handcrafted item but also supporting the continuation of an ancient art form."
        ),
        "tags": [
            craft_type.lower(), "handmade", "indian handicraft", state.lower(),
            "traditional", "artisanal", "handcrafted", "cultural heritage",
            "eco-friendly", "sustainable"
        ],
        "seo_keywords": [
            f"handmade {craft_type.lower()}", f"{state} handicraft",
            "indian artisan", "traditional craft", f"buy {craft_type.lower()} online",
            "authentic handcraft"
        ],
        "suggested_category": image_analysis.get("suggested_category", craft_type),
        "suggested_price_inr": 1500.00,
    }


# ---------------------------------------------------------------------------
# 4. Check Authenticity — Gemini 1.5 Flash (vision)
# ---------------------------------------------------------------------------
async def check_authenticity(image_url: str) -> dict:
    """Check if a product appears handcrafted or mass-produced."""
    if GEMINI_AVAILABLE:
        try:
            import httpx

            # Download the image
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                image_data = response.content

            ext = image_url.rsplit(".", 1)[-1].lower() if "." in image_url else "jpg"
            mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                        "webp": "image/webp", "gif": "image/gif"}
            mime_type = mime_map.get(ext, "image/jpeg")

            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([
                "Analyze this product image and determine if it appears to be "
                "genuinely handcrafted or mass-produced. Return JSON with: "
                "is_handcrafted (bool), confidence (0-1), reasons (array of strings). "
                "Return ONLY valid JSON.",
                {"mime_type": mime_type, "data": image_data},
            ])
            return _parse_json_response(response.text)
        except Exception as e:
            logger.error(f"Gemini authenticity check failed: {e}")

    return {
        "is_handcrafted": True,
        "confidence": 0.80,
        "reasons": ["Shows irregular handmade patterns", "Natural material variations visible"],
    }


# ---------------------------------------------------------------------------
# 5. Social Media Captions — Gemini 1.5 Flash
# ---------------------------------------------------------------------------
async def generate_social_caption(
    title: str, description: str, craft_type: str, state: str
) -> dict:
    """Generate social media captions for a product."""
    prompt = f"""Generate social media captions for an Indian handicraft product:
Title: {title}
Description: {description}
Craft Type: {craft_type}
State: {state}

Return JSON with:
{{
  "instagram_en": "...",
  "instagram_hi": "...",
  "whatsapp_en": "...",
  "whatsapp_hi": "..."
}}
Include relevant emojis and hashtags. Return ONLY valid JSON."""

    if GEMINI_AVAILABLE:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return _parse_json_response(response.text)
        except Exception as e:
            logger.error(f"Caption generation failed: {e}")

    return {
        "instagram_en": f"✨ Discover the beauty of {craft_type} from {state}! {title} — handcrafted with love by our talented artisans. 🎨\n\n#KalaKriti #IndianHandicraft #Handmade #ArtisanMade #{craft_type.replace(' ', '')} #MadeInIndia",
        "instagram_hi": f"✨ {state} की {craft_type} कला की सुंदरता को जानें! {title} — हमारे प्रतिभाशाली कारीगरों द्वारा प्यार से बनाया गया। 🎨\n\n#कलाकृति #भारतीयहस्तशिल्प #हस्तनिर्मित",
        "whatsapp_en": f"🎁 Check out this amazing {title}! Handcrafted {craft_type} from {state}. Support Indian artisans! 🇮🇳\n\nShop now at Kala-Kriti",
        "whatsapp_hi": f"🎁 यह अद्भुत {title} देखें! {state} से हस्तनिर्मित {craft_type}। भारतीय कारीगरों का समर्थन करें! 🇮🇳\n\nकला-कृति पर अभी खरीदें",
    }
