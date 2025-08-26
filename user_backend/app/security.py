import base64
from datetime import UTC, datetime, timedelta, timezone
from random import SystemRandom
from typing import Annotated
from uuid import UUID, uuid4
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from user_backend.app.api.v1.core.models import Token, User, UserType
from user_backend.app.db_setup import get_db
from user_backend.app.settings import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_ENTROPY = 32  # number of bytes to return by default
_sysrand = SystemRandom()


# PASSWORD
def hash_password(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# TOKEN
def token_bytes(nbytes=None):
    """Return a random byte string containing *nbytes* bytes.

    If *nbytes* is ``None`` or not supplied, a reasonable
    default is used.

    >>> token_bytes(16)  #doctest:+SKIP
    b'\\xebr\\x17D*t\\xae\\xd4\\xe3S\\xb6\\xe2\\xebP1\\x8b'

    """
    if nbytes is None:
        nbytes = DEFAULT_ENTROPY
    return _sysrand.randbytes(nbytes)


def token_urlsafe(nbytes=None):
    """Return a random URL-safe text string, in Base64 encoding.

    The string has *nbytes* random bytes.  If *nbytes* is ``None``
    or not supplied, a reasonable default is used.

    >>> token_urlsafe(16)  #doctest:+SKIP
    'Drmhze6EPcv0fN_81Bj-nA'

    """
    tok = token_bytes(nbytes)
    return base64.urlsafe_b64encode(tok).rstrip(b"=").decode("ascii")


def create_database_token(user_id: UUID, db: Session):
    randomized_token = token_urlsafe()

    expire_date = datetime.now(timezone.utc) + timedelta(
        minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    new_token = Token(token=randomized_token, user_id=user_id, expire_date=expire_date)
    db.add(new_token)
    db.commit()
    return new_token


def verify_token_access(token_str: str, db: Session) -> Token:
    current_time = datetime.now(UTC)

    token = db.execute(select(Token).where(Token.token == token_str)).scalars().first()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert expire_date to UTC if it's not already
    expire_date = (
        token.expire_date.replace(tzinfo=UTC)
        if token.expire_date.tzinfo is None
        else token.expire_date
    )

    if expire_date <= current_time:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token


# USER
# has user valid token - return user
def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    """Get the current user from token"""
    token_obj = verify_token_access(token_str=token, db=db)
    user = token_obj.user

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# has user valid token - return nothing
def authenticate_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    """
    oauth2_scheme automatically extracts the token from the authentication header
    Below, we get the current user based on that token
    """
    token = verify_token_access(token_str=token, db=db)
    return True


# is user an admin - return user
def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> User:
    """Check if current user is admin"""
    # Get admin user type
    admin_type = db.execute(
        select(UserType).where(UserType.name == "Admin")
    ).scalar_one_or_none()

    if not admin_type:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin user type not configured",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if current_user.user_type_id != admin_type.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Admin privileges required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return current_user


#  check if token is valid - return token
#  save in database
def get_current_token(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    """
    oauth2_scheme automatically extracts the token from the authentication header
    Used when we simply want to return the token, instead of returning a user. E.g for logout
    """
    token = verify_token_access(token_str=token, db=db)
    return token
