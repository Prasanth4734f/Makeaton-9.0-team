from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.database.models import User, UserRole
from app.schemas.auth_schema import UserSignupRequest, UserLoginRequest
from app.core.security import hash_password, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, request: UserSignupRequest, current_user: User = None) -> User:
        # Check if email is already taken
        existing_user = db.query(User).filter(User.email == request.email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        # Signup cannot be used to grant arbitrary ADMIN privileges.
        # Only existing ADMIN users can register new ADMINs or STAFF.
        # Public self-service signup defaults strictly to CUSTOMER.
        assigned_role = UserRole.CUSTOMER
        if request.role:
            if request.role in [UserRole.ADMIN, UserRole.STAFF]:
                if not current_user or current_user.role != UserRole.ADMIN:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Admin privileges required to create Staff or Admin accounts"
                    )
                assigned_role = request.role
            else:
                assigned_role = UserRole.CUSTOMER

        hashed = hash_password(request.password)
        new_user = User(
            name=request.name.strip(),
            email=request.email.lower().strip(),
            password_hash=hashed,
            role=assigned_role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, request: UserLoginRequest) -> tuple[str, User]:
        user = db.query(User).filter(User.email == request.email.lower().strip()).first()
        if not user or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = create_access_token(data={"sub": str(user.id), "role": user.role.value, "email": user.email})
        return token, user
