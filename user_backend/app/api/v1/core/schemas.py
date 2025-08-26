# user_backend/app/api/v1/core/schemas.py

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
import re


# ----- Base Schemas -----


class BaseResponseSchema(BaseModel):
    """Base response schema with success indicator"""

    success: bool = True
    message: Optional[str] = None


class ErrorResponseSchema(BaseModel):
    """Error response schema"""

    success: bool = False
    error: Dict[str, Any]
    data: Optional[Any] = None
    timestamp: str
    request_id: Optional[str] = None


class MessageResponseSchema(BaseResponseSchema):
    """Simple message response"""

    message: str


# ----- Auth Token Schemas -----


class TokenResponseSchema(BaseModel):
    """Token response for login"""

    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
            }
        }
    )


class RefreshTokenSchema(BaseModel):
    """Refresh token request"""

    refresh_token: str


# ----- User Schemas -----


class UserBaseSchema(BaseModel):
    """Base user schema with common fields"""

    first_name: str = Field(
        ..., min_length=1, max_length=100, description="User's first name"
    )
    last_name: str = Field(
        ..., min_length=1, max_length=100, description="User's last name"
    )
    email: EmailStr = Field(..., description="User's email address")

    @validator("first_name", "last_name")
    def validate_names(cls, v):
        """Validate name fields"""
        if not v or not v.strip():
            raise ValueError("Name cannot be empty or just whitespace")

        # Remove extra whitespace and validate characters
        cleaned = v.strip()
        if len(cleaned) < 1:
            raise ValueError("Name must be at least 1 character after trimming")

        # Allow letters, spaces, hyphens, and apostrophes
        if not re.match(r"^[a-zA-Z\s\-']+$", cleaned):
            raise ValueError(
                "Name can only contain letters, spaces, hyphens, and apostrophes"
            )

        return cleaned

    @validator("email")
    def validate_email(cls, v):
        """Additional email validation"""
        email_str = str(v).lower().strip()

        # Check for reasonable length
        if len(email_str) > 254:
            raise ValueError("Email address is too long")

        return email_str


class UserRegisterSchema(UserBaseSchema):
    """Schema for user registration"""

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password must be 8-128 characters with uppercase, lowercase, and number",
    )
    confirm_password: str = Field(..., description="Password confirmation")
    user_type_id: Optional[int] = Field(
        default=1, description="User type ID (default: 1 for regular user)"
    )

    @validator("password")
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if len(v) > 128:
            raise ValueError("Password must be less than 128 characters")

        # Check for at least one uppercase, lowercase, and digit
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not has_upper:
            raise ValueError("Password must contain at least one uppercase letter")
        if not has_lower:
            raise ValueError("Password must contain at least one lowercase letter")
        if not has_digit:
            raise ValueError("Password must contain at least one number")

        # Check for common weak passwords
        weak_passwords = ["password123", "12345678", "qwerty123", "admin123"]
        if v.lower() in weak_passwords:
            raise ValueError(
                "Password is too common, please choose a stronger password"
            )

        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        """Validate that passwords match"""
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v

    @validator("user_type_id")
    def validate_user_type(cls, v):
        """Validate user type ID"""
        if v is not None and v not in [1, 2, 3]:  # 1=regular, 2=admin, 3=guest
            raise ValueError("Invalid user type ID")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "password": "SecurePass123",
                "confirm_password": "SecurePass123",
                "user_type_id": 1,
            }
        }
    )


class UserUpdateSchema(BaseModel):
    """Schema for updating user profile"""

    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None

    @validator("first_name", "last_name")
    def validate_names(cls, v):
        """Validate name fields"""
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Name cannot be empty or just whitespace")

            cleaned = v.strip()
            if len(cleaned) < 1:
                raise ValueError("Name must be at least 1 character after trimming")

            if not re.match(r"^[a-zA-Z\s\-']+$", cleaned):
                raise ValueError(
                    "Name can only contain letters, spaces, hyphens, and apostrophes"
                )

            return cleaned
        return v

    @validator("email")
    def validate_email(cls, v):
        """Additional email validation"""
        if v is not None:
            email_str = str(v).lower().strip()
            if len(email_str) > 254:
                raise ValueError("Email address is too long")
            return email_str
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "first_name": "John",
                "last_name": "Smith",
                "email": "john.smith@example.com",
            }
        }
    )


class UserOutSchema(BaseModel):
    """Schema for user output (public info)"""

    id: int
    first_name: str
    last_name: str
    email: str
    user_type_id: int
    created_at: datetime

    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "user_type_id": 1,
                "created_at": "2024-01-15T10:30:00Z",
            }
        },
    )


class UserDetailSchema(UserOutSchema):
    """Extended user schema with additional details"""

    last_login: Optional[datetime] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


# ----- Password Schemas -----


class PasswordChangeSchema(BaseModel):
    """Schema for password change"""

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password with strength requirements",
    )
    confirm_new_password: str = Field(..., description="Confirm new password")

    @validator("new_password")
    def validate_new_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long")

        if len(v) > 128:
            raise ValueError("New password must be less than 128 characters")

        # Check for at least one uppercase, lowercase, and digit
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not (has_upper and has_lower and has_digit):
            raise ValueError(
                "New password must contain at least one uppercase letter, "
                "one lowercase letter, and one number"
            )

        return v

    @validator("confirm_new_password")
    def passwords_match(cls, v, values):
        """Validate that new passwords match"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("New passwords do not match")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "current_password": "CurrentPass123",
                "new_password": "NewSecurePass456",
                "confirm_new_password": "NewSecurePass456",
            }
        }
    )


class PasswordResetRequestSchema(BaseModel):
    """Schema for password reset request"""

    email: EmailStr = Field(..., description="Email address to send reset link")

    model_config = ConfigDict(
        json_schema_extra={"example": {"email": "user@example.com"}}
    )


class PasswordResetSchema(BaseModel):
    """Schema for password reset confirmation"""

    token: str = Field(..., description="Password reset token")
    new_password: str = Field(
        ..., min_length=8, max_length=128, description="New password"
    )
    confirm_password: str = Field(..., description="Confirm new password")

    @validator("new_password")
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if len(v) > 128:
            raise ValueError("Password must be less than 128 characters")

        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not (has_upper and has_lower and has_digit):
            raise ValueError(
                "Password must contain at least one uppercase letter, "
                "one lowercase letter, and one number"
            )

        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        """Validate that passwords match"""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v


# ----- Session/Token Schemas -----


class SessionSchema(BaseModel):
    """Schema for user session information"""

    id: int
    token_preview: str
    created_at: datetime
    expires_at: datetime
    is_current: bool = False

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 123,
                "token_preview": "abc12345...",
                "created_at": "2024-01-15T10:30:00Z",
                "expires_at": "2024-01-15T11:30:00Z",
                "is_current": True,
            }
        },
    )


# ----- Admin Schemas -----


class UserListSchema(BaseModel):
    """Schema for paginated user list"""

    users: list[UserOutSchema]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreateSchema(UserBaseSchema):
    """Schema for admin user creation"""

    password: str = Field(..., min_length=8, max_length=128)
    user_type_id: int = Field(..., description="User type ID")
    is_active: bool = Field(default=True, description="User active status")

    @validator("password")
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)

        if not (has_upper and has_lower and has_digit):
            raise ValueError(
                "Password must contain at least one uppercase letter, "
                "one lowercase letter, and one number"
            )

        return v


class AdminUserUpdateSchema(BaseModel):
    """Schema for admin user updates"""

    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    user_type_id: Optional[int] = None
    is_active: Optional[bool] = None

    @validator("first_name", "last_name")
    def validate_names(cls, v):
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Name cannot be empty")
            return cleaned
        return v


# ----- Validation Schemas -----


class EmailValidationSchema(BaseModel):
    """Schema for email validation"""

    email: EmailStr

    @validator("email")
    def validate_email_format(cls, v):
        email_str = str(v).lower().strip()
        if len(email_str) > 254:
            raise ValueError("Email address is too long")
        return email_str


class PaginationSchema(BaseModel):
    """Schema for pagination parameters"""

    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    per_page: int = Field(
        default=20, ge=1, le=100, description="Items per page (1-100)"
    )

    @validator("per_page")
    def validate_per_page(cls, v):
        if v > 100:
            raise ValueError("Maximum 100 items per page")
        return v


# ----- Health Check Schema -----


class HealthCheckSchema(BaseModel):
    """Schema for health check response"""

    status: str
    environment: str
    version: str
    database: str
    timestamp: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "environment": "development",
                "version": "2.0.0",
                "database": "connected",
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }
    )


# ----- Metrics Schema -----


class MetricsSchema(BaseModel):
    """Schema for application metrics"""

    users_total: int
    active_sessions: int
    environment: str
    uptime_seconds: Optional[float] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "users_total": 1250,
                "active_sessions": 45,
                "environment": "production",
                "uptime_seconds": 3600.5,
            }
        }
    )


# ----- Request/Response Wrappers -----


class APIResponse(BaseModel):
    """Generic API response wrapper"""

    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None
    errors: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "data": {"id": 1, "name": "example"},
                "message": "Operation completed successfully",
                "errors": None,
                "meta": {"total": 1, "page": 1},
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }
    )


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""

    data: list
    pagination: Dict[str, Any]
    success: bool = True

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "data": [{"id": 1, "name": "item1"}],
                "pagination": {
                    "page": 1,
                    "per_page": 20,
                    "total": 1,
                    "has_next": False,
                    "has_prev": False,
                },
                "success": True,
            }
        }
    )
