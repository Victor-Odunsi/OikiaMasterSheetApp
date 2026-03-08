"""
User management routes (Admin only)
Handles CRUD operations for ushers/admins
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from models import get_db, User, schemas
from utils import hash_password, get_current_admin

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("/", response_model=List[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin)
):
    """
    Get all users (Admin only)
    
    Args:
        db: Database session
        _: Current admin user (for authorization)
        
    Returns:
        List of all users
    """
    users = db.query(User).all()
    return users


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin)
):
    """
    Get a specific user by ID (Admin only)
    
    Args:
        user_id: User ID
        db: Database session
        _: Current admin user
        
    Returns:
        User object
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin)
):
    """
    Create a new user (Admin only)
    
    Args:
        user_data: User creation data
        db: Database session
        _: Current admin user
        
    Returns:
        Created user object
        
    Raises:
        HTTPException: If email already exists
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_admin)
):
    """
    Update a user (Admin only)
    
    Args:
        user_id: User ID to update
        user_data: Updated user data
        db: Database session
        _: Current admin user
        
    Returns:
        Updated user object
        
    Raises:
        HTTPException: If user not found or email already exists
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if email is being changed and if it already exists
    if user_data.email is not None and user_data.email != user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        user.email = user_data.email
    
    # Update fields if provided
    if user_data.password is not None:
        user.hashed_password = hash_password(user_data.password)
    
    if user_data.role is not None:
        user.role = user_data.role
    
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin)
):
    """
    Delete a user (Admin only)
    
    Args:
        user_id: User ID to delete
        db: Database session
        current_admin: Current admin user
        
    Raises:
        HTTPException: If user not found or trying to delete self
    """
    # Prevent admin from deleting themselves
    if user_id == current_admin.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return None
