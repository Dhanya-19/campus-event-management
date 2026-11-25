from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.core.security import create_access_token, hash_password, verify_password
from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    normalized_email = user_data.email.strip().lower()
    existing_user = db.query(User).filter(
        User.email == normalized_email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    is_approved = user_data.role == "student"

    new_user = User(
        name=user_data.name.strip(),
        email=normalized_email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        is_approved=is_approved,
        organization_name=user_data.organization_name,
        department=user_data.department,
        phone=user_data.phone,
        usn=user_data.usn,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    normalized_email = form_data.username.strip().lower()
    user = db.query(User).filter(
        User.email == normalized_email
    ).first()

    if not user or not verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if user.role == "organiser" and not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organiser account is awaiting admin approval"
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    profile_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_data.name is not None:
        current_user.name = profile_data.name.strip()
    if profile_data.organization_name is not None:
        current_user.organization_name = profile_data.organization_name.strip() or None
    if profile_data.department is not None:
        current_user.department = profile_data.department.strip() or None
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone.strip() or None
    if profile_data.usn is not None:
        current_user.usn = profile_data.usn.strip() or None

    if profile_data.new_password:
        if not profile_data.current_password or not verify_password(
            profile_data.current_password, current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        current_user.hashed_password = hash_password(profile_data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/organisers", response_model=list[UserResponse])
def list_organisers(
    pending_only: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    query = db.query(User).filter(User.role == "organiser")
    if pending_only:
        query = query.filter(User.is_approved.is_(False))
    return query.order_by(User.created_at.desc()).all()


@router.patch("/organisers/{user_id}/approve", response_model=UserResponse)
def approve_organiser(
    user_id: int,
    approved: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    organiser = db.query(User).filter(
        User.id == user_id,
        User.role == "organiser"
    ).first()
    if not organiser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organiser account not found"
        )

    organiser.is_approved = approved
    db.commit()
    db.refresh(organiser)
    return organiser
