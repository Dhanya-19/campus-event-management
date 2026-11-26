from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(20), default="student", nullable=False)
    is_approved = Column(Boolean, default=True, nullable=False)
    organization_name = Column(String(150), nullable=True)
    department = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    usn = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
