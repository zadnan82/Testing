# user_backend/app/api/v1/core/endpoints/auth.py

from typing import Annotated
from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from user_backend.app.core import security
from user_backend.app.db_setup import get_db
from user_backend.app.api.v1.core.models import Token, User
from user_backend.app.api.v1.core.schemas import (
    TokenResponseSchema,
    UserOutSchema,
    UserRegisterSchema,
    UserUpdateSchema,
    PasswordChangeSchema,
    MessageResponseSchema,
)
from user_backend.app.core.security import (
    get_current_active_user,
    get_current_token,
    hash_password,
    security_service,
)
from user_backend.app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    DatabaseError,
    ValidationError,
)
from user_backend.app.core.logging_config import StructuredLogger, security_logger

router = APIRouter(tags=["authentication"], prefix="/auth")
logger = StructuredLogger(__name__)


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    return getattr(request.client, "host", "unknown")


@router.post("/token", response_model=TokenResponseSchema)
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    """
    User login endpoint

    Authenticates user credentials and returns access token.
    Includes brute force protection and security logging.
    """
    try:
        client_ip = get_client_ip(request)
        user_agent = request.headers.get("user-agent", "unknown")

        logger.info(
            f"Login attempt for email: {form_data.username}",
            email=form_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
        )

        # Authenticate user
        user = security_service.authenticate_user(
            email=form_data.username,
            password=form_data.password,
            db=db,
            ip_address=client_ip,
        )

        # Create access token
        token = security_service.create_database_token(
            user_id=user.id, db=db, token_type="access"
        )

        logger.info(
            f"Successful login for user: {user.email}",
            user_id=user.id,
            email=user.email,
            ip_address=client_ip,
        )

        return TokenResponseSchema(
            access_token=token.token,
            token_type="bearer",
            expires_in=security.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except Exception as e:
        logger.error(
            f"Login failed for email: {form_data.username}",
            email=form_data.username,
            ip_address=get_client_ip(request),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise


@router.post(
    "/register", response_model=UserOutSchema, status_code=status.HTTP_201_CREATED
)
async def register(
    request: Request,
    user_data: UserRegisterSchema,
    db: Session = Depends(get_db),
):
    """
    User registration endpoint

    Creates a new user account with validation and security checks.
    """
    try:
        client_ip = get_client_ip(request)

        logger.info(
            f"Registration attempt for email: {user_data.email}",
            email=user_data.email,
            ip_address=client_ip,
        )

        # Check if user already exists
        existing_user = (
            db.execute(select(User).where(User.email == user_data.email))
            .scalars()
            .first()
        )

        if existing_user:
            logger.warning(
                f"Registration failed - user already exists: {user_data.email}",
                email=user_data.email,
                ip_address=client_ip,
            )
            raise UserAlreadyExistsError(email=user_data.email)

        # Validate password strength
        security_service.validate_password_strength(user_data.password)

        # Create new user
        hashed_password = hash_password(user_data.password)

        new_user = User(
            first_name=user_data.first_name.strip(),
            last_name=user_data.last_name.strip(),
            email=user_data.email.lower().strip(),
            hashed_password=hashed_password,
            user_type_id=user_data.user_type_id or 1,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(
            f"User registered successfully: {new_user.email}",
            user_id=new_user.id,
            email=new_user.email,
            ip_address=client_ip,
        )

        return UserOutSchema.model_validate(new_user)

    except (UserAlreadyExistsError, ValidationError):
        raise
    except Exception as e:
        db.rollback()
        logger.error(
            f"Registration failed for email: {user_data.email}",
            email=user_data.email,
            ip_address=get_client_ip(request),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise DatabaseError("User registration failed")


@router.get("/me", response_model=UserOutSchema)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user profile

    Returns the authenticated user's profile information.
    """
    try:
        logger.info(
            f"Profile access for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
        )

        return UserOutSchema.model_validate(current_user)

    except Exception as e:
        logger.error(
            f"Failed to get user profile: {str(e)}",
            user_id=current_user.id,
            error=str(e),
            error_type=type(e).__name__,
        )
        raise


@router.put("/me", response_model=UserOutSchema)
async def update_current_user_profile(
    request: Request,
    user_data: UserUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update current user profile

    Allows users to update their profile information.
    """
    try:
        client_ip = get_client_ip(request)

        logger.info(
            f"Profile update attempt for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
            ip_address=client_ip,
        )

        # Check if email is being changed and if new email already exists
        if user_data.email and user_data.email != current_user.email:
            existing_user = (
                db.execute(
                    select(User).where(
                        User.email == user_data.email, User.id != current_user.id
                    )
                )
                .scalars()
                .first()
            )

            if existing_user:
                raise UserAlreadyExistsError(email=user_data.email)

        # Update user fields
        if user_data.first_name is not None:
            current_user.first_name = user_data.first_name.strip()
        if user_data.last_name is not None:
            current_user.last_name = user_data.last_name.strip()
        if user_data.email is not None:
            current_user.email = user_data.email.lower().strip()

        db.commit()
        db.refresh(current_user)

        logger.info(
            f"Profile updated successfully for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
            ip_address=client_ip,
        )

        return UserOutSchema.model_validate(current_user)

    except UserAlreadyExistsError:
        raise
    except Exception as e:
        db.rollback()
        logger.error(
            f"Profile update failed for user: {current_user.email}",
            user_id=current_user.id,
            ip_address=get_client_ip(request),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise DatabaseError("Profile update failed")


@router.post("/change-password", response_model=MessageResponseSchema)
async def change_password(
    request: Request,
    password_data: PasswordChangeSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Change user password

    Allows users to change their password with current password verification.
    """
    try:
        client_ip = get_client_ip(request)

        logger.info(
            f"Password change attempt for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
            ip_address=client_ip,
        )

        # Verify current password
        if not security_service.verify_password(
            password_data.current_password, current_user.hashed_password
        ):
            security_logger.log_suspicious_activity(
                "Invalid current password during password change attempt",
                user_id=current_user.id,
                ip_address=client_ip,
            )
            raise InvalidCredentialsError("Current password is incorrect")

        # Validate new password strength
        security_service.validate_password_strength(password_data.new_password)

        # Hash and update password
        current_user.hashed_password = hash_password(password_data.new_password)
        db.commit()

        # Log security event
        security_logger.log_password_change(
            current_user.id, current_user.email, client_ip
        )

        logger.info(
            f"Password changed successfully for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
            ip_address=client_ip,
        )

        return MessageResponseSchema(message="Password changed successfully")

    except (InvalidCredentialsError, ValidationError):
        raise
    except Exception as e:
        db.rollback()
        logger.error(
            f"Password change failed for user: {current_user.email}",
            user_id=current_user.id,
            ip_address=get_client_ip(request),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise DatabaseError("Password change failed")


@router.delete(
    "/logout", response_model=MessageResponseSchema, status_code=status.HTTP_200_OK
)
async def logout(
    request: Request,
    current_token: Token = Depends(get_current_token),
    db: Session = Depends(get_db),
):
    """
    Logout from current session

    Invalidates the current access token.
    """
    try:
        client_ip = get_client_ip(request)

        logger.info(
            f"Logout attempt for token: {current_token.token[:8]}...",
            user_id=current_token.user_id,
            ip_address=client_ip,
        )

        # Delete current token
        db.delete(current_token)
        db.commit()

        logger.info(
            "User logged out successfully",
            user_id=current_token.user_id,
            ip_address=client_ip,
        )

        return MessageResponseSchema(message="Logged out successfully")

    except Exception as e:
        db.rollback()
        logger.error(
            f"Logout failed for token: {current_token.token[:8]}...",
            user_id=current_token.user_id,
            ip_address=get_client_ip(request),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise DatabaseError("Logout failed")


@router.delete(
    "/logout/all", response_model=MessageResponseSchema, status_code=status.HTTP_200_OK
)
async def logout_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Logout from all sessions

    Invalidates all access tokens for the current user.
    """
    try:
        client_ip = get_client_ip(request)

        logger.info(
            f"Logout all sessions attempt for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
            ip_address=client_ip,
        )

        # Delete all tokens for the user
        result = db.execute(delete(Token).where(Token.user_id == current_user.id))
        db.commit()

        sessions_count = result.rowcount

        logger.info(
            f"All sessions logged out successfully for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
            sessions_revoked=sessions_count,
            ip_address=client_ip,
        )

        return MessageResponseSchema(
            message=f"Logged out from all sessions ({sessions_count} sessions revoked)"
        )

    except Exception as e:
        db.rollback()
        logger.error(
            f"Logout all sessions failed for user: {current_user.email}",
            user_id=current_user.id,
            ip_address=get_client_ip(request),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise DatabaseError("Logout from all sessions failed")


@router.get("/sessions", response_model=list)
async def get_user_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all active sessions for current user

    Returns list of active tokens/sessions.
    """
    try:
        logger.info(
            f"Sessions list request for user: {current_user.email}",
            user_id=current_user.id,
            email=current_user.email,
        )

        sessions = (
            db.execute(select(Token).where(Token.user_id == current_user.id))
            .scalars()
            .all()
        )

        session_list = [
            {
                "id": session.id,
                "token_preview": session.token[:8] + "...",
                "created_at": session.created_at,
                "expires_at": session.expire_date,
                "is_current": session.token
                == getattr(current_user, "_current_token", None),
            }
            for session in sessions
        ]

        return session_list

    except Exception as e:
        logger.error(
            f"Failed to get sessions for user: {current_user.email}",
            user_id=current_user.id,
            error=str(e),
            error_type=type(e).__name__,
        )
        raise DatabaseError("Failed to retrieve sessions")


@router.delete("/sessions/{session_id}", response_model=MessageResponseSchema)
async def revoke_session(
    session_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Revoke specific session

    Allows users to revoke a specific session/token.
    """
    try:
        client_ip = get_client_ip(request)

        logger.info(
            f"Session revocation attempt for session {session_id}",
            user_id=current_user.id,
            session_id=session_id,
            ip_address=client_ip,
        )

        # Find and delete the session
        session = (
            db.execute(
                select(Token).where(
                    Token.id == session_id, Token.user_id == current_user.id
                )
            )
            .scalars()
            .first()
        )

        if not session:
            raise ValidationError(
                "Session not found or does not belong to current user"
            )

        db.delete(session)
        db.commit()

        logger.info(
            f"Session {session_id} revoked successfully",
            user_id=current_user.id,
            session_id=session_id,
            ip_address=client_ip,
        )

        return MessageResponseSchema(message="Session revoked successfully")

    except ValidationError:
        raise
    except Exception as e:
        db.rollback()
        logger.error(
            f"Session revocation failed for session {session_id}",
            user_id=current_user.id,
            session_id=session_id,
            ip_address=get_client_ip(request),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise DatabaseError("Session revocation failed")
