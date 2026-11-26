
from fastapi import FastAPI

from app.database.database import engine, Base
from app.models import User, Event, EventRegistration
from app.routers.events import router as events_router
from app.routers.auth import router as auth_router
from sqlalchemy import text

import socket
from urllib.parse import urlparse
from app.core.config import DATABASE_URL

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Campus Event & Hackathon Management System",
    description="API for managing campus events, hackathons, registrations, and teams.",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://staging.d13a8mjnntyy6h.amplifyapp.com"
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
        "status": "healthy"
    }

@app.get("/dns-health")
def dns_health():
    import socket

    hosts = [
        "amazon.com",
        "campusconnect-db.cvkao2g4k13c.ap-southeast-2.rds.amazonaws.com"
    ]

    results = {}

    for host in hosts:
        try:
            addresses = socket.getaddrinfo(
                host, 443, type=socket.SOCK_STREAM
            )
            results[host] = {
                "resolved": True,
                "addresses": list(set(
                    item[4][0] for item in addresses
                ))
            }
        except Exception as e:
            results[host] = {
                "resolved": False,
                "error": repr(e)
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

from mangum import Mangum

handler = Mangum(app)
