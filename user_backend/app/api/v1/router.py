# user_backend/app/api/v1/router.py

from fastapi import APIRouter
import logging

# Import existing core endpoints
from user_backend.app.api.v1.core.endpoints import (
    auth,
    projects,
    tokens,
    templates,
    ai,
    analytics,
    files,
    system,
    user_preferences,
    notifications,
    websockets,
    sevdo,
)

# Configure logger
logger = logging.getLogger(__name__)


# Create main API router
api_router = APIRouter(prefix="/v1")

# Include core endpoints (existing functionality)
api_router.include_router(
    auth.router,
    tags=["Authentication"],
)

api_router.include_router(
    projects.router,
    tags=["Projects"],
)

api_router.include_router(
    sevdo.router,
    tags=["Sevdo"],
)

api_router.include_router(
    tokens.router,
    tags=["Tokens"],
)

api_router.include_router(
    templates.router,
    tags=["Templates"],
)

api_router.include_router(
    ai.router,
    tags=["AI Integration"],
)

# Include enhanced endpoints (new functionality)
if analytics:
    api_router.include_router(
        analytics.router,
        tags=["Analytics"],
    )
    logger.info("Analytics routes registered")

if files:
    api_router.include_router(
        files.router,
        tags=["File Management"],
    )
    logger.info("File management routes registered")

if system:
    api_router.include_router(
        system.router,
        tags=["System Monitoring"],
    )
    logger.info("System monitoring routes registered")

if user_preferences:
    api_router.include_router(
        user_preferences.router,
        tags=["User Preferences"],
    )
    logger.info("User preferences routes registered")

if notifications:
    api_router.include_router(
        notifications.router,
        tags=["Notifications"],
    )
    logger.info("Notifications routes registered")

if websockets:
    api_router.include_router(
        websockets.router,
        tags=["Real-time Updates"],
    )
    logger.info("WebSocket routes registered")


# API status endpoint
@api_router.get("/status", tags=["API Info"])
async def api_status():
    """Get API status and available endpoints"""

    # Check which endpoints are available
    available_endpoints = {
        "core_endpoints": {
            "auth": True,
            "projects": True,
            "tokens": True,
            "templates": True,
            "ai": True,
            "sevdo": True,
        },
        "enhanced_endpoints": {
            "analytics": analytics is not None,
            "files": files is not None,
            "system": system is not None,
            "user_preferences": user_preferences is not None,
            "notifications": notifications is not None,
            "websockets": websockets is not None,
        },
    }

    # Count total available endpoints
    core_count = sum(available_endpoints["core_endpoints"].values())
    enhanced_count = sum(available_endpoints["enhanced_endpoints"].values())
    total_count = core_count + enhanced_count

    return {
        "api_version": "v1",
        "status": "operational",
        "total_endpoints": total_count,
        "core_endpoints_available": core_count,
        "enhanced_endpoints_available": enhanced_count,
        "available_endpoints": available_endpoints,
        "endpoint_details": {
            "/auth": "User authentication and session management",
            "/projects": "Project creation and management",
            "/tokens": "Token system and validation",
            "/templates": "Project templates and reusable configurations",
            "/ai": "AI-powered features and chat integration",
            "/analytics": "Usage analytics and reporting",
            "/sevdo": "Sevdo vuilder" if analytics else "Not available",
            "/files": "File upload and management" if files else "Not available",
            "/system": "System health and monitoring" if system else "Not available",
            "/notifications": "User notification system"
            if notifications
            else "Not available",
            "/ws": "WebSocket real-time connections" if websockets else "Not available",
        },
    }


# Endpoint discovery
@api_router.get("/endpoints", tags=["API Info"])
async def list_endpoints():
    """List all available API endpoints with descriptions"""

    endpoints = []

    # Core endpoints
    endpoints.extend(
        [
            {
                "path": "/api/v1/auth",
                "methods": ["POST", "GET", "PUT", "DELETE"],
                "description": "Authentication, registration, profile management",
                "status": "available",
            },
            {
                "path": "/api/v1/projects",
                "methods": ["GET", "POST", "PUT", "DELETE"],
                "description": "Project CRUD operations and code generation",
                "status": "available",
            },
            {
                "path": "/api/v1/sevdo",
                "methods": ["GET", "POST", "PUT", "DELETE"],
                "description": "Sevdo CRUD operations and code generation",
                "status": "available",
            },
            {
                "path": "/api/v1/tokens",
                "methods": ["GET", "POST"],
                "description": "Token definitions, validation, and suggestions",
                "status": "available",
            },
            {
                "path": "/api/v1/templates",
                "methods": ["GET", "POST"],
                "description": "Project templates and quick-start configurations",
                "status": "available",
            },
            {
                "path": "/api/v1/ai",
                "methods": ["POST"],
                "description": "AI-powered project generation and chat assistance",
                "status": "available",
            },
        ]
    )

    # Enhanced endpoints
    if analytics:
        endpoints.append(
            {
                "path": "/api/v1/analytics",
                "methods": ["GET"],
                "description": "User analytics, usage statistics, and performance metrics",
                "status": "available",
            }
        )

    if files:
        endpoints.append(
            {
                "path": "/api/v1/files",
                "methods": ["GET", "POST", "DELETE"],
                "description": "File upload, download, and management",
                "status": "available",
            }
        )

    if system:
        endpoints.append(
            {
                "path": "/api/v1/system",
                "methods": ["GET", "POST"],
                "description": "System health, metrics, and error reporting",
                "status": "available",
            }
        )

    if notifications:
        endpoints.append(
            {
                "path": "/api/v1/notifications",
                "methods": ["GET", "PUT", "DELETE"],
                "description": "User notifications and messaging system",
                "status": "available",
            }
        )

    if websockets:
        endpoints.append(
            {
                "path": "/api/v1/ws",
                "methods": ["WebSocket"],
                "description": "Real-time updates and live project generation tracking",
                "status": "available",
            }
        )

    return {"total_endpoints": len(endpoints), "endpoints": endpoints}
