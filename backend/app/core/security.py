import json
import os
import time
import urllib.request
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "campusconnect-auth-15af9")

_GOOGLE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)
_cached_certs: dict[str, str] = {}
_certs_expires_at: float = 0.0


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def _get_google_public_certs() -> dict[str, str]:
    global _cached_certs, _certs_expires_at
    now = time.time()
    if _cached_certs and now < _certs_expires_at:
        return _cached_certs

    with urllib.request.urlopen(_GOOGLE_CERTS_URL, timeout=5) as resp:
        certs = json.loads(resp.read().decode("utf-8"))
        cache_control = resp.headers.get("Cache-Control", "")
        max_age = 3600
        for part in cache_control.split(","):
            part = part.strip()
            if part.startswith("max-age="):
                try:
                    max_age = int(part.split("=", 1)[1])
                except ValueError:
                    pass
        _cached_certs = certs
        _certs_expires_at = now + max_age
        return certs


def verify_firebase_id_token(id_token: str) -> dict | None:
    if not FIREBASE_PROJECT_ID:
        return None
    try:
        header = jwt.get_unverified_header(id_token)
        kid = header.get("kid")
        if not kid:
            return None

        certs = _get_google_public_certs()
        cert = certs.get(kid)
        if not cert:
            global _certs_expires_at
            _certs_expires_at = 0.0
            certs = _get_google_public_certs()
            cert = certs.get(kid)
            if not cert:
                return None

        issuer = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
        payload = jwt.decode(
            id_token,
            cert,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=issuer,
        )
        if not payload.get("sub"):
            return None
        return payload
    except Exception:
        return None
