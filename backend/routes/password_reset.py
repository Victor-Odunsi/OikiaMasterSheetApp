"""
Password reset routes
Handles forgot password and reset password functionality
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models import get_db, User, schemas
from utils.password import hash_password
from utils.reset_token import generate_reset_token, get_reset_token_expiration, is_token_expired
from utils.email_service import email_service

router = APIRouter(prefix="/password", tags=["Password Reset"])


@router.post("/forgot", response_model=schemas.ForgotPasswordResponse)
def forgot_password(
    request: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset process
    Sends reset email to user if email exists
    
    Args:
        request: Email address to send reset link to
        db: Database session
        
    Returns:
        Success message (always returns success for security)
        
    Note:
        For security reasons, we always return success even if email doesn't exist
        This prevents email enumeration attacks
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success message (security best practice)
    # Don't reveal whether email exists or not
    response_message = (
        "If an account with that email exists, "
        "we've sent password reset instructions to it."
    )
    
    if not user:
        # Email doesn't exist, but don't tell the user
        return schemas.ForgotPasswordResponse(
            message=response_message,
            email=request.email
        )
    
    # Check if user is active
    if not user.is_active:
        # Account is deactivated, but don't reveal this
        return schemas.ForgotPasswordResponse(
            message=response_message,
            email=request.email
        )
    
    # Generate reset token
    reset_token = generate_reset_token()
    reset_token_expires = get_reset_token_expiration()
    
    # Save token to database
    user.reset_token = reset_token
    user.reset_token_expires = reset_token_expires
    db.commit()
    
    # Send reset email
    email_sent = email_service.send_password_reset_email(
        to_email=user.email,
        reset_token=reset_token,
        user_role=user.role
    )
    
    if not email_sent:
        print(f"[Warning] Failed to send reset email to {user.email}")
        # Still return success to user (don't reveal email service issues)
    
    return schemas.ForgotPasswordResponse(
        message=response_message,
        email=request.email
    )


@router.post("/reset", response_model=schemas.ResetPasswordResponse)
def reset_password(
    request: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using reset token
    
    Args:
        request: Reset token and new password
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    # Find user by reset token
    user = db.query(User).filter(User.reset_token == request.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token has expired
    if not user.reset_token_expires or is_token_expired(user.reset_token_expires):
        # Clear expired token
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact administrator."
        )
    
    # Update password
    user.hashed_password = hash_password(request.new_password)
    
    # Clear reset token (one-time use)
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    
    # Send confirmation email
    email_service.send_password_changed_notification(user.email)
    
    return schemas.ResetPasswordResponse(
        message="Password has been reset successfully. You can now login with your new password."
    )


@router.get("/verify-token/{token}")
def verify_reset_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify if a reset token is valid and not expired
    Useful for frontend to check token before showing reset form
    
    Args:
        token: Reset token to verify
        db: Database session
        
    Returns:
        Token validity status and user email
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    # Find user by reset token
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    # Check if token has expired
    if not user.reset_token_expires or is_token_expired(user.reset_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    return {
        "valid": True,
        "email": user.email,
        "expires_at": user.reset_token_expires.isoformat()
    }
