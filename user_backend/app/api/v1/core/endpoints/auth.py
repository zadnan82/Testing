from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import ValidationError

from user_backend.app.db_setup import get_db
from user_backend.app.api.v1.core.models import Token, User
from user_backend.app.api.v1.core.schemas import (
    TokenSchema,
    UserOutSchema,
    UserRegisterSchema,
)
from user_backend.app.security import (
    create_database_token,
    get_current_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(tags=["authentication"], prefix="/auth")


# Get current user
@router.get("/user/me", response_model=UserOutSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No user found"
        )

    return current_user


# Login
@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenSchema:
    # Keep in mind that without the response model or return schema
    # we would expose the hashed password, which absolutely cannot happen
    # Perhaps better to use .only or select the columns explicitly
    user = (
        db.execute(
            select(User).where(User.email == form_data.username),
        )
        .scalars()
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Passwords do not match",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_database_token(user_id=user.id, db=db)
    return {"access_token": access_token.token, "token_type": "bearer"}


# Logout from current device only
@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_current_device(
    current_token: Token = Depends(get_current_token),
    db: Session = Depends(get_db),
):
    """Logout from current device only"""
    db.execute(delete(Token).where(Token.token == current_token.token))
    db.commit()

    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie("access_token", httponly=True, secure=True)
    return response


# Logout from all devices
@router.delete("/logout/all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Logout from all devices"""
    db.execute(delete(Token).where(Token.user_id == current_user.id))
    db.commit()

    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie("access_token", httponly=True, secure=True)
    return response


# Create user
@router.post("/user/create", status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserRegisterSchema, db: Session = Depends(get_db)
) -> UserOutSchema:
    # Check if user already exists
    existing_user = db.execute(select(User).where(User.email == user.email)).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    try:
        # Create new user
        hashed_password = hash_password(user.password)

        new_user = User(
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            hashed_password=hashed_password,
            user_type_id=user.user_type_id or 1,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )
