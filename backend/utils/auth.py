"""
Authentication dependencies for route protection
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.jwt_handler import verify_token
from typing import Optional

# HTTP Bearer security scheme
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency to get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        User payload from token (username, role, etc.)
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


def require_role(required_role: str):
    """
    Dependency factory to require specific role
    
    Args:
        required_role: Role required (e.g., "admin")
        
    Returns:
        Dependency function that checks role
        
    Example:
        @app.get("/admin/users", dependencies=[Depends(require_role("admin"))])
    """
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    
    return role_checker


def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require admin role
    
    Usage: admin: dict = Depends(get_current_admin)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Dependency to get user if authenticated, None otherwise
    Useful for endpoints that work with or without authentication
    
    Returns:
        User payload if authenticated, None otherwise
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    return verify_token(token)
