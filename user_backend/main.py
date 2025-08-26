# user_backend/main.py

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from datetime import datetime

# Core imports
from user_backend.app.db_setup import init_db, get_db
from user_backend.app.settings import settings
from user_backend.app.core.logging_config import setup_logging
from user_backend.app.core.error_handlers import register_exception_handlers
from user_backend.app.core.middleware import setup_middleware
from user_backend.app.core.exceptions import ConfigurationError

# API routes
from user_backend.app.api.v1.routers import router as v1_router

# Initialize logging first
setup_logging()
logger = logging.getLogger(__name__)

# Application start time for uptime calculation
app_start_time = datetime.utcnow()


def validate_settings():
    """Validate critical settings on startup"""
    required_settings = ["DB_URL", "ACCESS_TOKEN_EXPIRE_MINUTES"]

    for setting in required_settings:
        if not hasattr(settings, setting) or not getattr(settings, setting):
            raise ConfigurationError(f"Missing required setting: {setting}")

    logger.info("Settings validation passed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    try:
        logger.info("Starting up application...")

        # Validate settings
        validate_settings()

        # Initialize database
        init_db()

        # Additional startup tasks
        await startup_tasks()

        logger.info("Application startup completed successfully")

    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        raise

    yield

    # Shutdown
    try:
        logger.info("Shutting down application...")
        await shutdown_tasks()
        logger.info("Application shutdown completed")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")


async def startup_tasks():
    """Additional startup tasks"""
    try:
        from user_backend.app.core.security import security_service

        # Get database session
        db = next(get_db())
        try:
            # Clean up expired tokens on startup
            security_service.cleanup_expired_tokens(db)
            logger.info("Startup tasks completed")
        finally:
            db.close()

    except Exception as e:
        logger.warning(f"Startup tasks failed: {str(e)}")


async def shutdown_tasks():
    """Cleanup tasks on shutdown"""
    logger.info("Performing cleanup tasks...")
    # Add any cleanup logic here


def create_application() -> FastAPI:
    """Create and configure FastAPI application"""

    # Create FastAPI app
    app = FastAPI(
        title="SEVDO User API",
        description="Enhanced user management API with comprehensive error handling",
        version="2.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.SEVDO_ENV != "production" else None,
        redoc_url="/redoc" if settings.SEVDO_ENV != "production" else None,
        openapi_url="/openapi.json" if settings.SEVDO_ENV != "production" else None,
    )

    # CORS middleware (must be before other middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"]
        if settings.SEVDO_ENV == "development"
        else [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://yourdomain.com",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Setup other middleware
    setup_middleware(app)

    # Register exception handlers
    register_exception_handlers(app)

    # Include routers
    app.include_router(v1_router, prefix="/v1", tags=["v1"])

    # Health check endpoint (BEFORE auth requirement)
    @app.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint"""
        try:
            # Check database connection
            db = next(get_db())
            try:
                result = db.execute(text("SELECT 1 as health_check"))
                db_status = "connected" if result.fetchone() else "error"
            except Exception as db_error:
                logger.error(f"Database health check failed: {str(db_error)}")
                db_status = "error"
            finally:
                db.close()

            # Calculate uptime
            uptime_seconds = (datetime.utcnow() - app_start_time).total_seconds()

            health_data = {
                "status": "healthy" if db_status == "connected" else "unhealthy",
                "environment": settings.SEVDO_ENV,
                "version": "2.0.0",
                "database": db_status,
                "uptime_seconds": round(uptime_seconds, 2),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }

            if db_status != "connected":
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=health_data
                )

            return health_data

        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "unhealthy",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                },
            )

    # Metrics endpoint (basic)
    @app.get("/metrics", tags=["monitoring"])
    async def metrics():
        """Basic metrics endpoint"""
        try:
            from user_backend.app.api.v1.core.models import User, Token
            from sqlalchemy import func

            db = next(get_db())
            try:
                # Get basic counts
                user_count = db.query(func.count(User.id)).scalar() or 0
                active_tokens = (
                    db.query(func.count(Token.id))
                    .filter(Token.expire_date > func.now())
                    .scalar()
                    or 0
                )

                uptime_seconds = (datetime.utcnow() - app_start_time).total_seconds()

                return {
                    "users_total": user_count,
                    "active_sessions": active_tokens,
                    "environment": settings.SEVDO_ENV,
                    "uptime_seconds": round(uptime_seconds, 2),
                }
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Metrics collection failed: {str(e)}")
            return {"error": "Metrics unavailable"}

    # Root endpoint
    @app.get("/", tags=["root"])
    async def root():
        """Root endpoint"""
        return {
            "message": "SEVDO User API",
            "version": "2.0.0",
            "environment": settings.SEVDO_ENV,
            "docs_url": "/docs" if settings.SEVDO_ENV != "production" else None,
        }

    return app


# Create the app instance
app = create_application()

# For development
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "user_backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.SEVDO_ENV == "development",
        log_level="info",
        access_log=True,
    )
