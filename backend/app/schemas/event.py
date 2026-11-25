from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class CustomFieldSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    label: str = Field(..., min_length=1, max_length=120)
    field_type: Literal["text", "number", "select", "textarea"] = "text"
    required: bool = False
    options: list[str] = Field(default_factory=list)


class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = None
    event_type: str = Field(..., min_length=3, max_length=50)
    venue: str = Field(..., min_length=2, max_length=200)
    event_date: datetime
    registration_deadline: datetime
    max_participants: int = Field(..., gt=0)
    custom_fields: list[CustomFieldSchema] = Field(default_factory=list)


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    event_type: str | None = Field(default=None, min_length=3, max_length=50)
    venue: str | None = Field(default=None, min_length=2, max_length=200)
    event_date: datetime | None = None
    registration_deadline: datetime | None = None
    max_participants: int | None = Field(default=None, gt=0)
    custom_fields: list[CustomFieldSchema] | None = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None
    event_type: str
    venue: str
    event_date: datetime
    registration_deadline: datetime
    max_participants: int
    custom_fields: list[dict[str, Any]] = Field(default_factory=list)
    created_by: int
    registered_count: int = 0
    is_closed: bool = False

    class Config:
        from_attributes = True
