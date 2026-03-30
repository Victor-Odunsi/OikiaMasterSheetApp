"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============ USER SCHEMAS ============

class UserBase(BaseModel):
    """Base user schema"""
    email: str = Field(..., pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    role: str = Field(default="usher", pattern="^(admin|usher)$")


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema for updating user"""
    email: Optional[str] = Field(None, pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[str] = Field(None, pattern="^(admin|usher)$")
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for login request"""
    email: str = Field(..., pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str = ""
    user: dict 


# ============ PASSWORD RESET SCHEMAS ============

class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request"""
    email: str = Field(..., pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class ForgotPasswordResponse(BaseModel):
    """Schema for forgot password response"""
    message: str
    email: str


class ResetPasswordRequest(BaseModel):
    """Schema for reset password request"""
    token: str = Field(..., min_length=32)
    new_password: str = Field(..., min_length=6)


class ResetPasswordResponse(BaseModel):
    """Schema for reset password response"""
    message: str


# ============ PASSWORD CHANGE SCHEMAS ============

class ChangePasswordRequest(BaseModel):
    """Schema for change password request (logged in user)"""
    current_password: str
    new_password: str = Field(..., min_length=6)


class ChangePasswordResponse(BaseModel):
    """Schema for change password response"""
    message: str


# ============ MEMBER SCHEMAS ============

class MemberBase(BaseModel):
    """Base member schema"""
    surname: str
    first_name: str
    phone: str
    date: Optional[str] = ""
    role: str
    email: Optional[str] = ""
    address: Optional[str] = ""
    location: str
    unit: str
    sex: str


class MemberCreate(MemberBase):
    """Schema for creating a new member"""
    pass


class MemberUpdate(BaseModel):
    """Schema for updating member (all fields optional)"""
    surname: Optional[str] = None
    first_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    unit: Optional[str] = None
    sex: Optional[str] = None


class MemberResponse(MemberBase):
    """Schema for member response"""
    id: str  # S/N from sheet
    attendance: dict = {}  # {date: "P" or ""}
    
    class Config:
        from_attributes = True


# ============ ATTENDANCE SCHEMAS ============

class AttendanceMarkRequest(BaseModel):
    """Schema for marking attendance"""
    member_id: str
    date: str  # Format: "DD/MM/YYYY"
    present: bool


class AttendanceResponse(BaseModel):
    """Schema for attendance response"""
    current_sunday: str
    members: list[dict]

class BulkAttendanceMarkRequest(BaseModel):
    member_ids: list[str]
    date: str        # DD/MM/YYYY
    present: bool


# ============ CACHE SCHEMAS ============

class CacheRefreshResponse(BaseModel):
    """Schema for cache refresh response"""
    message: str
    member_count: int
