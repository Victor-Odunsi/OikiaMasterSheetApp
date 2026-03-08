"""
Authentication routes
Handles login, token generation
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from models import get_db, User, schemas
from utils import verify_password, create_access_token

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
    user.last_login = datetime.utcnow()
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
