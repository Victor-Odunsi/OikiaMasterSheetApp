"""
Configuration settings for the Church Usher App
Handles environment variables and app settings
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "OikiaCC Yaba Members Management System"
    DEBUG: bool = False
    
    # Security
    JWT_SECRET_KEY: str = "CHANGE_THIS_TO_RANDOM_SECRET_KEY_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 8
    
    # Password Reset
    RESET_TOKEN_EXPIRATION_HOURS: int = 1  # Reset link expires after 1 hour
    
    # Database
    SQLITE_DATABASE_URL: str = "sqlite:///./users.db"
    
    # Google Sheets
    GOOGLE_SHEETS_ID: str = ""  # Set via environment variable
    GOOGLE_CREDENTIALS_FILE: str = "credentials.json"
    SHEET_NAME: str = "Sheet1"
    
    # Cache settings
    CACHE_TTL_MINUTES: int = 5
    
    # Email Settings (SMTP)
    SMTP_SERVER: str = "smtp.gmail.com"  # Gmail SMTP server
    SMTP_PORT: int = 587  # TLS port
    SMTP_USERNAME: str = ""  # Your email address
    SMTP_PASSWORD: str = ""  # App password (not your regular password!)
    FROM_EMAIL: str = ""  # Email to send from (usually same as SMTP_USERNAME)
    FROM_NAME: str = "Church Usher System"
    
    # Frontend URL (for reset links)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://oikiacc-yaba-mastersheet.vercel.app"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
