"""
Authentication routes
Handles login, token generation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from models import get_db, User, schemas
from utils import verify_password, create_access_token, hash_password, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    credentials: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login endpoint - validates credentials and returns JWT token
    
    Args:
        credentials: Email and password
        db: Database session
        
    Returns:
        JWT token, role, and email
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact administrator."
        )
    
    # Update last login timestamp
    user.last_login = datetime.now()
    db.commit()
    
    # Create JWT token
    token_data = {
        "email": user.email,
        "role": user.role,
        "user_id": user.id
    }
    token = create_access_token(token_data)
    
    return schemas.TokenResponse(
        token=token,
        role=user.role,
        email=user.email
    )


@router.get("/verify")
def verify_token_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Verify if token is valid
    
    Args:
        current_user: Decoded user from JWT token
        
    Returns:
        User information from token
    """
    return {
        "valid": True,
        "email": current_user.get("email"),
        "role": current_user.get("role")
    }

@router.post("/change-password", response_model=schemas.ChangePasswordResponse)
def change_password(
    request: schemas.ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change password for logged-in user
    Requires current password for security
        
    Args:
        request: Current password and new password
        current_user: Decoded user from JWT token
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If current password is wrong
    """
    # Get user from database
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(request.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Check if new password is same as current
    if verify_password(request.new_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    user.hashed_password = hash_password(request.new_password)
    db.commit()
    
    # Optional: Send confirmation email
    # email_service.send_password_changed_notification(user.email)
    
    return schemas.ChangePasswordResponse(
        message="Password changed successfully"
    )
