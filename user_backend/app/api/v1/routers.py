from fastapi import APIRouter

from user_backend.app.api.v1.core.endpoints.auth import router as auth_router

router = APIRouter()

router.include_router(auth_router)
