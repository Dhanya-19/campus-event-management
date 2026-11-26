from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    require_admin_or_approved_organiser,
)
from app.database.database import get_db
from app.models.event import Event
from app.models.registration import EventRegistration
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.schemas.registration import (
    EventParticipantResponse,
    MyRegistrationDetailResponse,
    RegistrationCreate,
    RegistrationResponse,
)

router = APIRouter(prefix="/api/events", tags=["Events"])


def _to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _serialize_event(event: Event, registered_count: int) -> EventResponse:
    now = datetime.now(timezone.utc)
    deadline_utc = _to_utc(event.registration_deadline)
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        venue=event.venue,
        event_date=event.event_date,
        registration_deadline=event.registration_deadline,
        max_participants=event.max_participants,
        custom_fields=event.custom_fields or [],
        created_by=event.created_by,
        registered_count=registered_count,
        is_closed=deadline_utc < now,
    )


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_approved_organiser),
):
    payload = event_data.model_dump()
    payload["custom_fields"] = [
        f.model_dump() if hasattr(f, "model_dump") else f
        for f in event_data.custom_fields
    ]

    new_event = Event(**payload, created_by=current_user.id)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return _serialize_event(new_event, registered_count=0)


@router.get("", response_model=list[EventResponse])
@router.get("/", response_model=list[EventResponse], include_in_schema=False)
def get_all_events(
    q: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    date: str | None = Query(default=None),
    include_closed: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = db.query(Event)

    if not include_closed:
        now = datetime.now(timezone.utc)
        query = query.filter(Event.registration_deadline >= now)

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Event.title.ilike(pattern),
                Event.description.ilike(pattern),
                Event.venue.ilike(pattern),
            )
        )

    if event_type and event_type.strip() and event_type.strip().lower() != "all":
        query = query.filter(func.lower(Event.event_type) == event_type.strip().lower())

    if date and date.strip():
        query = query.filter(func.date(Event.event_date) == date.strip())

    events = query.order_by(Event.event_date.asc()).all()

    counts_rows = (
        db.query(EventRegistration.event_id, func.count(EventRegistration.id))
        .group_by(EventRegistration.event_id)
        .all()
    )
    counts_map = {event_id: count for event_id, count in counts_rows}

    return [_serialize_event(ev, registered_count=counts_map.get(ev.id, 0)) for ev in events]


# Static routes MUST come before /{event_id}
@router.get("/managed", response_model=list[EventResponse])
def get_managed_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_approved_organiser),
):
    query = db.query(Event)
    if current_user.role != "admin":
        query = query.filter(Event.created_by == current_user.id)

    events = query.order_by(Event.event_date.desc()).all()
    counts_rows = (
        db.query(EventRegistration.event_id, func.count(EventRegistration.id))
        .group_by(EventRegistration.event_id)
        .all()
    )
    counts_map = {event_id: count for event_id, count in counts_rows}

    return [_serialize_event(ev, registered_count=counts_map.get(ev.id, 0)) for ev in events]


@router.get("/my-registrations", response_model=list[MyRegistrationDetailResponse])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(EventRegistration, Event)
        .join(Event, EventRegistration.event_id == Event.id)
        .filter(EventRegistration.user_id == current_user.id)
        .order_by(Event.event_date.asc())
        .all()
    )

    now = datetime.now(timezone.utc)
    return [
        MyRegistrationDetailResponse(
            id=reg.id,
            user_id=reg.user_id,
            event_id=reg.event_id,
            custom_responses=reg.custom_responses or {},
            registered_at=reg.registered_at,
            event_title=ev.title,
            event_type=ev.event_type,
            venue=ev.venue,
            event_date=ev.event_date,
            registration_deadline=ev.registration_deadline,
            is_closed=_to_utc(ev.registration_deadline) < now,
        )
        for reg, ev in rows
    ]


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).count()
    return _serialize_event(event, registered_count=reg_count)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_approved_organiser),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if current_user.role != "admin" and event.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit events you created")

    updates = event_data.model_dump(exclude_unset=True)
    if "custom_fields" in updates and updates["custom_fields"] is not None:
        updates["custom_fields"] = [
            f.model_dump() if hasattr(f, "model_dump") else f
            for f in updates["custom_fields"]
        ]

    for key, value in updates.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)

    reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).count()
    return _serialize_event(event, registered_count=reg_count)


@router.get("/{event_id}/registrations", response_model=list[EventParticipantResponse])
def get_event_registrations(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_approved_organiser),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if current_user.role != "admin" and event.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view registrations for events you created")

    rows = (
        db.query(EventRegistration, User)
        .join(User, EventRegistration.user_id == User.id)
        .filter(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.registered_at.asc())
        .all()
    )

    return [
        EventParticipantResponse(
            registration_id=reg.id,
            user_id=user.id,
            student_name=user.name,
            student_email=user.email,
            usn=user.usn,
            department=user.department,
            phone=user.phone,
            custom_responses=reg.custom_responses or {},
            registered_at=reg.registered_at,
        )
        for reg, user in rows
    ]


@router.post("/{event_id}/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: int,
    payload: RegistrationCreate | None = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if _to_utc(event.registration_deadline) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration deadline has passed")

    existing_registration = db.query(EventRegistration).filter(
        EventRegistration.user_id == current_user.id,
        EventRegistration.event_id == event_id,
    ).first()
    if existing_registration:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already registered for this event")

    total_registrations = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).count()
    if total_registrations >= event.max_participants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is full")

    responses = payload.custom_responses if payload else {}
    for field in (event.custom_fields or []):
        if field.get("required"):
            val = responses.get(field.get("name"))
            if val is None or str(val).strip() == "":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Missing required field: {field.get('label', field.get('name'))}",
                )

    registration = EventRegistration(
        user_id=current_user.id,
        event_id=event_id,
        custom_responses=responses,
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


@router.delete("/{event_id}/register", status_code=status.HTTP_200_OK)
def unregister_from_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if _to_utc(event.registration_deadline) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot unregister after the registration deadline has passed")

    registration = db.query(EventRegistration).filter(
        EventRegistration.user_id == current_user.id,
        EventRegistration.event_id == event_id,
    ).first()
    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You are not registered for this event")

    db.delete(registration)
    db.commit()
    return {"message": "Unregistered from event successfully"}
