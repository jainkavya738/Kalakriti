"""Stripe payment service — Checkout Sessions, Webhooks, and Connect transfers."""

import logging
from typing import List, Optional
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize Stripe
try:
    import stripe
    if settings.STRIPE_SECRET_KEY:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        STRIPE_AVAILABLE = True
    else:
        STRIPE_AVAILABLE = False
except ImportError:
    STRIPE_AVAILABLE = False


async def create_checkout_session(
    line_items: List[dict],
    success_url: str,
    cancel_url: str,
    metadata: dict = None,
) -> dict:
    """Create a Stripe Checkout Session."""
    if not STRIPE_AVAILABLE:
        # Mock response for development
        return {
            "id": "cs_mock_session_id",
            "url": f"{success_url}?session_id=cs_mock_session_id",
            "payment_intent": "pi_mock_payment_intent",
        }

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=cancel_url,
            currency="inr",
            metadata=metadata or {},
        )
        return {
            "id": session.id,
            "url": session.url,
            "payment_intent": session.payment_intent,
        }
    except Exception as e:
        logger.error(f"Stripe checkout session creation failed: {e}")
        raise


def verify_webhook_signature(payload: bytes, sig_header: str) -> dict:
    """Verify Stripe webhook signature and parse event."""
    if not STRIPE_AVAILABLE or not settings.STRIPE_WEBHOOK_SECRET:
        # Mock verification for development
        import json
        return json.loads(payload)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid webhook signature")


async def create_transfer(
    amount: int,
    destination_account: str,
    transfer_group: Optional[str] = None,
) -> dict:
    """Transfer funds to artisan's Stripe Connect account."""
    if not STRIPE_AVAILABLE:
        return {"id": "tr_mock_transfer", "amount": amount}

    try:
        transfer = stripe.Transfer.create(
            amount=amount,
            currency="inr",
            destination=destination_account,
            transfer_group=transfer_group,
        )
        return {"id": transfer.id, "amount": transfer.amount}
    except Exception as e:
        logger.error(f"Stripe transfer failed: {e}")
        raise


async def create_connect_account(email: str) -> dict:
    """Create a Stripe Connect Express account for an artisan."""
    if not STRIPE_AVAILABLE:
        return {"id": "acct_mock_connect", "url": "https://connect.stripe.com/mock"}

    try:
        account = stripe.Account.create(
            type="express",
            email=email,
            country="IN",
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
        )
        # Create onboarding link
        link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"{settings.FRONTEND_URL}/artisan/dashboard",
            return_url=f"{settings.FRONTEND_URL}/artisan/dashboard?stripe_connected=true",
            type="account_onboarding",
        )
        return {"id": account.id, "url": link.url}
    except Exception as e:
        logger.error(f"Stripe Connect account creation failed: {e}")
        raise
