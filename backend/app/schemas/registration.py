from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class RegistrationCreate(BaseModel):
    custom_responses: dict[str, Any] = Field(default_factory=dict)


class RegistrationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    custom_responses: dict[str, Any] = Field(default_factory=dict)
    registered_at: datetime

    class Config:
        from_attributes = True


class MyRegistrationDetailResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    custom_responses: dict[str, Any] = Field(default_factory=dict)
    registered_at: datetime
    event_title: str
    event_type: str
    venue: str
    event_date: datetime
    registration_deadline: datetime
    is_closed: bool = False


class EventParticipantResponse(BaseModel):
    registration_id: int
    user_id: int
    student_name: str
    student_email: str
    usn: str | None = None
    department: str | None = None
    phone: str | None = None
    custom_responses: dict[str, Any] = Field(default_factory=dict)
    registered_at: datetime
