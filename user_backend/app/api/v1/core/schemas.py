from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict


# ----- Base schemas (for common fields) -----


class BaseSchema(BaseModel):
    id: int


class TimestampMixin(BaseModel):
    created_at: datetime


# ----- Token Schemas -----


class TokenSchema(BaseModel):
    access_token: str
    token_type: str


# ----- Password Schemas -----


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str


# ----- User Schemas -----


class UserSchema(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    user_type_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserUpdateSchema(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    model_config = ConfigDict(from_attributes=True)


class UserRegisterSchema(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=64)
    user_type_id: int | None = Field(default=1)

    model_config = ConfigDict(
        from_attributes=True,
    )


class UserOutSchema(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    user_type_id: int
    model_config = ConfigDict(from_attributes=True)
