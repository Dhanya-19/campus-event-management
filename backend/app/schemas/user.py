from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["student", "organiser"] = "student"
    organization_name: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    usn: str | None = Field(default=None, max_length=50)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    organization_name: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    usn: str | None = Field(default=None, max_length=50)
    current_password: str | None = None
    new_password: str | None = Field(default=None, min_length=8)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_approved: bool = True
    organization_name: str | None = None
    department: str | None = None
    phone: str | None = None
    usn: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str
