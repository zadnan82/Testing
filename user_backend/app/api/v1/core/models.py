from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Any, Dict
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Float,
    Text,
    UniqueConstraint,
    func,
    JSON,
)


# ----- Base (for common fields) -----


class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)


# ----- Token -----


class Token(Base):
    __tablename__ = "tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    expire_date: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationship
    user: Mapped["User"] = relationship(back_populates="tokens")


# ----- User -----


class UserType(Base):
    """User type model, e.g., admin, regular user, guest."""

    __tablename__ = "user_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Relationship
    users: Mapped[List["User"]] = relationship(back_populates="user_type")

    def __repr__(self) -> str:
        return f"<UserType {self.name}>"


class User(Base):
    """User model for the platform"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100), index=True)
    last_name: Mapped[str] = mapped_column(String(100), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user_type_id: Mapped[int] = mapped_column(
        ForeignKey("user_types.id", ondelete="SET NULL"),
        nullable=True,
        server_default="1",
    )

    # Relationships
    user_type: Mapped["UserType"] = relationship(back_populates="users")
    tokens: Mapped[List["Token"]] = relationship(back_populates="user")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.full_name})>"
