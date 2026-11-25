import os
import socket

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from sqlalchemy import text

from app.core.security import hash_password
from app.database.database import Base, SessionLocal, engine
from app.models import Event, EventRegistration, User
from app.routers.auth import router as auth_router
from app.routers.events import router as events_router

Base.metadata.create_all(bind=engine)


def seed_default_admins():
    admin_email = os.getenv("ADMIN_EMAIL", "dhansuyalwar@gmail.com").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@1234")
    admin_name = os.getenv("ADMIN_NAME", "Dhanya S Yalwar")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == admin_email).first()
        if not existing:
            admin_user = User(
                name=admin_name,
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role="admin",
            )
            db.add(admin_user)
            db.commit()
        else:
            existing.role = "admin"
            existing.hashed_password = hash_password(admin_password)
            db.commit()
    finally:
        db.close()


seed_default_admins()

app = FastAPI(
    title="Campus Event & Hackathon Management System",
    description="API for managing campus events, hackathons, registrations, and teams.",
    version="1.0.0",
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

app.include_router(auth_router)
app.include_router(events_router)


@app.get("/")
def home():
    return {
        "message": "Campus Event Management API is running!",
        "status": "healthy",
    }


@app.get("/dns-health")
def dns_health():
    hosts = [
        "amazon.com",
        "campusconnect-db.cvkao2g4kl3c.ap-southeast-2.rds.amazonaws.com",
    ]

    results = {}

    for host in hosts:
        try:
            addresses = socket.getaddrinfo(
                host, 443, type=socket.SOCK_STREAM
            )
            results[host] = {
                "resolved": True,
                "addresses": list(set(item[4][0] for item in addresses)),
            }
        except Exception as e:
            results[host] = {
                "resolved": False,
                "error": repr(e),
            }

    return results


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-health")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"database": "connected"}
    except Exception as e:
        return {"database": "error", "detail": str(e)}


handler = Mangum(app)