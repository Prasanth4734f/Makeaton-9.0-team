from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import get_current_user
from app.database.models import User
from app.schemas.auth_schema import UserSignupRequest, UserLoginRequest, UserResponse, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(request: UserSignupRequest, db: Session = Depends(get_db)):
    user = AuthService.register_user(db, request)
    return {
        "success": True,
        "data": UserResponse.model_validate(user).model_dump()
    }

@router.post("/login")
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    token, user = AuthService.authenticate_user(db, request)
    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user).model_dump()
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": UserResponse.model_validate(current_user).model_dump()
    }
