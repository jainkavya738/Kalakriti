"""Firebase Admin SDK initialization."""

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from core.config import settings
import logging

logger = logging.getLogger(__name__)

_firebase_app = None


def init_firebase():
    """Initialize Firebase Admin SDK. Gracefully skips if credentials are not configured."""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    if not all([settings.FIREBASE_PROJECT_ID, settings.FIREBASE_CLIENT_EMAIL, settings.FIREBASE_PRIVATE_KEY]):
        logger.warning(
            "Firebase credentials not configured. Auth will run in development mode "
            "(accepting any token)."
        )
        return None

    try:
        private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": private_key,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully.")
        return _firebase_app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        return None


def verify_firebase_token(id_token: str) -> dict | None:
    """Verify a Firebase ID token and return decoded claims.

    In development mode (no Firebase configured), returns a mock user.
    """
    if _firebase_app is None:
        # Dev mode — return mock decoded token
        return {
            "uid": id_token if id_token else "dev-user-uid",
            "email": "dev@kalakriti.local",
            "name": "Dev User",
        }

    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        return None
