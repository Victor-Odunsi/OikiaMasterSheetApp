"""
Password reset token utilities
Generates secure random tokens for password reset
"""
import secrets
from datetime import datetime, timedelta
from config.settings import settings


def generate_reset_token() -> str:
    """
    Generate a secure random token for password reset
    
    Returns:
        64-character hexadecimal token
    """
    return secrets.token_urlsafe(32)


def get_reset_token_expiration() -> datetime:
    """
    Get the expiration datetime for a reset token
    
    Returns:
        Datetime object set to RESET_TOKEN_EXPIRATION_HOURS from now
    """
    return datetime.utcnow() + timedelta(hours=settings.RESET_TOKEN_EXPIRATION_HOURS)


def is_token_expired(expires_at: datetime) -> bool:
    """
    Check if a reset token has expired
    
    Args:
        expires_at: Token expiration datetime
        
    Returns:
        True if token has expired, False otherwise
    """
    return datetime.utcnow() > expires_at
