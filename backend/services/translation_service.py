"""Translation service — LLM-based translation into Indian regional languages."""

import json
import logging
from typing import List
from core.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "mr": "Marathi",
}

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = bool(settings.GOOGLE_API_KEY)
except ImportError:
    GEMINI_AVAILABLE = False


async def translate_text(
    title: str,
    description: str,
    cultural_story: str | None,
    target_languages: List[str] = None,
) -> dict:
    """Translate product content into multiple Indian languages.

    Returns dict keyed by language code, each containing title, description, cultural_story.
    """
    if target_languages is None:
        target_languages = list(SUPPORTED_LANGUAGES.keys())

    # Filter to supported languages only
    target_languages = [lang for lang in target_languages if lang in SUPPORTED_LANGUAGES]
    
    if not target_languages:
        return {}

    lang_names = ", ".join([f"{code} ({SUPPORTED_LANGUAGES[code]})" for code in target_languages])

    prompt = f"""Translate the following Indian handicraft product listing into these languages: {lang_names}

Title: {title}
Description: {description}
Cultural Story: {cultural_story or 'N/A'}

Return a JSON object where each key is the language code and the value contains:
{{
  "title": "translated title",
  "description": "translated description",
  "cultural_story": "translated cultural story or null"
}}

Return ONLY valid JSON. Ensure translations are culturally appropriate and natural-sounding."""

    if GEMINI_AVAILABLE:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception as e:
            logger.error(f"Translation failed: {e}")

    # Mock translations for development
    translations = {}
    for lang in target_languages:
        lang_name = SUPPORTED_LANGUAGES[lang]
        translations[lang] = {
            "title": f"[{lang_name}] {title}",
            "description": f"[{lang_name} translation] {description[:100]}...",
            "cultural_story": f"[{lang_name} translation] {cultural_story[:100]}..." if cultural_story else None,
        }
    return translations
