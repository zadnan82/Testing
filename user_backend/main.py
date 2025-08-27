# user_backend/app/main.py

from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from user_backend.app.core.logging_config import StructuredLogger
from user_backend.app.api.v1.router import api_router
from user_backend.app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    ValidationError,
    DatabaseError,
)
from user_backend.app.db_setup import init_db


# Initialize logger if available
try:
    from user_backend.app.core.logging_config import StructuredLogger

    logger = StructuredLogger(__name__)
except ImportError:
    import logging

    logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting SEVDO User Backend API v2.0.0")

    # Initialize database if needed
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")

    yield

    # Shutdown
    logger.info("Shutting down SEVDO User Backend API")


# Create FastAPI application
app = FastAPI(
    title="SEVDO User Backend API",
    description="Enhanced backend API for SEVDO platform with AI integration, real-time features, and comprehensive project management",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5000",
        "*",  # Remove in production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(UserAlreadyExistsError)
async def user_already_exists_handler(request: Request, exc: UserAlreadyExistsError):
    return JSONResponse(
        status_code=409,
        content={
            "success": False,
            "error": {
                "type": "UserAlreadyExistsError",
                "message": str(exc),
                "field": "email",
                "code": "USER_EXISTS",
            },
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url),
        },
    )


@app.exception_handler(InvalidCredentialsError)
async def invalid_credentials_handler(request: Request, exc: InvalidCredentialsError):
    return JSONResponse(
        status_code=401,
        content={
            "success": False,
            "error": {
                "type": "InvalidCredentialsError",
                "message": str(exc),
                "code": "INVALID_CREDENTIALS",
            },
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url),
        },
    )


@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "type": "ValidationError",
                "message": str(exc),
                "code": "VALIDATION_FAILED",
            },
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url),
        },
    )


@app.exception_handler(DatabaseError)
async def database_error_handler(request: Request, exc: DatabaseError):
    logger.error(f"Database error on {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "type": "DatabaseError",
                "message": "An internal server error occurred",
                "code": "DATABASE_ERROR",
            },
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url),
        },
    )


@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc):
    logger.error(f"Internal server error on {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "type": "InternalServerError",
                "message": "An unexpected error occurred",
                "code": "INTERNAL_ERROR",
            },
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url),
        },
    )


# Include API router with all endpoints
app.include_router(api_router, prefix="/api")


# Root endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "SEVDO User Backend API",
        "version": "2.0.0",
        "status": "operational",
        "description": "Enhanced backend for SEVDO platform with AI integration",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_base": "/api/v1",
        "features": [
            "User Authentication & Management",
            "Project Management",
            "Token System",
            "AI Integration",
            "Real-time WebSocket Updates",
            "File Management",
            "Analytics & Reporting",
            "System Monitoring",
            "Notification System",
            "User Preferences",
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "service": "sevdo-user-backend",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "operational",
    }


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "api_version": "v1",
        "base_url": "/api/v1",
        "available_endpoints": [
            "/auth - Authentication & user management",
            "/projects - Project management",
            "/tokens - Token system",
            "/templates - Project templates",
            "/ai - AI integration",
            "/analytics - Analytics & reporting",
            "/files - File management",
            "/system - System monitoring",
            "/notifications - Notification system",
            "/ws - WebSocket connections",
        ],
        "documentation": "/docs",
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    uvicorn.run(
        "user_backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True,
    )
