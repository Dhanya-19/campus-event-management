
from fastapi import FastAPI

from app.database.database import engine, Base
from app.models import User, Event, EventRegistration
from app.routers.events import router as events_router
from app.routers.auth import router as auth_router

Base.metadata.create_all(bind=engine)
Base.metadata.create_all(bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Campus Event & Hackathon Management System",
    description="API for managing campus events, hackathons, registrations, and teams.",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(events_router)

@app.get("/")
def home():
    return {
        "message": "Campus Event Management API is running!",
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
