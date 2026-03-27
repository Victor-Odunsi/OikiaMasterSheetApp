"""
Main FastAPI application
Combines all routes and middleware
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin
from contextlib import asynccontextmanager

from config import settings
from models import init_db, engine, User
from routes import auth_router, users_router, members_router, attendance_router, password_reset_router, dashboard_router
from admin_panel import UserAdmin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    print("[Startup] Initializing database...")
    init_db()
    print("[Startup] Database initialized")
    
    yield
    
    # Shutdown
    print("[Shutdown] Application shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Church Ushering System API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(members_router)
app.include_router(attendance_router)
app.include_router(password_reset_router)
app.include_router(dashboard_router)

# Create SQLAdmin interface
admin = Admin(app, engine)
admin.add_view(UserAdmin)


# Health check endpoint
@app.get("/")
def root():
    """Root endpoint - health check"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )