
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse
from app.core.dependencies import require_admin, get_current_user
from app.models.user import User


from datetime import datetime, timezone
from app.models.registration import EventRegistration
from app.schemas.registration import RegistrationResponse


router = APIRouter(prefix="/api/events", tags=["Events"])


# Admin: Create a new event
@router.post(
    "/",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED
)
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    new_event = Event(
        **event_data.model_dump(),
        created_by=current_user.id
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


# Public: View all events
@router.get("/", response_model=list[EventResponse])
def get_all_events(db: Session = Depends(get_db)):
    return db.query(Event).all()


# Public: View a specific event
@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return event


# Student: Register for an event
@router.post(
    "/{event_id}/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED
)
def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    now = datetime.now(timezone.utc)

    if event.registration_deadline.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline has passed"
        )

    existing_registration = db.query(EventRegistration).filter(
        EventRegistration.user_id == current_user.id,
        EventRegistration.event_id == event_id
    ).first()

    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already registered for this event"
        )

    total_registrations = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id
    ).count()

    if total_registrations >= event.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is full"
        )

    registration = EventRegistration(
        user_id=current_user.id,
        event_id=event_id
    )

    db.add(registration)
    db.commit()
    db.refresh(registration)

    return registration
