
import os
from pathlib import Path
from dotenv import load_dotenv

# Identify the environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# Load local .env only during development.
# Production should receive configuration from the hosting platform.
if ENVIRONMENT == "development":
    BACKEND_DIR = Path(__file__).resolve().parents[2]
    load_dotenv(BACKEND_DIR / ".env")

# Application configuration
DEBUG = ENVIRONMENT == "development"

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

# Fail early if required configuration is missing
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not configured")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not configured")

if ENVIRONMENT not in ("development", "production"):
    raise ValueError(
        "ENVIRONMENT must be development or production"
    )
