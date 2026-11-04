
from pydantic import BaseModel, Field
from datetime import datetime


class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = None
    event_type: str = Field(..., min_length=3, max_length=50)
    venue: str = Field(..., min_length=2, max_length=200)
    event_date: datetime
    registration_deadline: datetime
    max_participants: int = Field(..., gt=0)


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None
    event_type: str
    venue: str
    event_date: datetime
    registration_deadline: datetime
    max_participants: int
    created_by: int

    class Config:
        from_attributes = True
