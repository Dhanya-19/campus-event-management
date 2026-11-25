import os
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from sqlalchemy import text

STARTUP_ERRORS: list[str] = []

app = FastAPI(
    title="Campus Event & Hackathon Management System",
    description="API for managing campus events, hackathons, registrations, and teams.",
    version="1.1.0",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://staging.d13a8mjnntyy6h.amplifyapp.com",
        "https://dev.d13a8mjnntyy6h.amplifyapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from app.core.security import hash_password
    from app.database.database import Base, SessionLocal, engine
    from app.models import Event, EventRegistration, User
    from app.routers.auth import router as auth_router
    from app.routers.events import router as events_router

    Base.metadata.create_all(bind=engine)

    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_name VARCHAR(150);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS usn VARCHAR(50);",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS custom_responses JSONB DEFAULT '{}'::jsonb;",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    admin_email = os.getenv("ADMIN_EMAIL", "dhansuyalwar@gmail.com").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@1234")
    admin_name = os.getenv("ADMIN_NAME", "Dhanya S Yalwar")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == admin_email).first()
        if not existing:
            db.add(
                User(
                    name=admin_name,
                    email=admin_email,
                    hashed_password=hash_password(admin_password),
                    role="admin",
                    is_approved=True,
                )
            )
            db.commit()
        else:
            existing.role = "admin"
            existing.is_approved = True
            existing.hashed_password = hash_password(admin_password)
            db.commit()
    finally:
        db.close()

    app.include_router(auth_router)
    app.include_router(events_router)
except Exception:
    STARTUP_ERRORS.append(traceback.format_exc())


@app.get("/")
def home():
    return {
        "message": "Campus Event Management API is running!",
        "status": "healthy",
        "startup_errors": STARTUP_ERRORS,
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "startup_errors": STARTUP_ERRORS}


@app.get("/db-health")
def database_health():
    try:
        from app.database.database import engine
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"database": "connected", "startup_errors": STARTUP_ERRORS}
    except Exception as e:
        return {"database": "error", "detail": str(e), "startup_errors": STARTUP_ERRORS}


handler = Mangum(app)
