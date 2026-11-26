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
_FALLBACK_GOOGLE_CERTS: dict[str, str] = json.loads(r'''{
  "904b0f91be6eb0867dabbaab587dfc2e33f00a24": "-----BEGIN CERTIFICATE-----\nMIIDHTCCAgWgAwIBAgIJAPQVm4IqLvDqMA0GCSqGSIb3DQEBBQUAMDExLzAtBgNV\nBAMMJnNlY3VyZXRva2VuLnN5c3RlbS5nc2VydmljZWFjY291bnQuY29tMB4XDTI2\nMDUwNDE3NDcyN1oXDTI3MDUwNDE3NDcyN1owMTEvMC0GA1UEAwwmc2VjdXJldG9r\nZW4uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wggEiMA0GCSqGSIb3DQEBAQUA\nA4IBDwAwggEKAoIBAQDbarTg+wH+qOjVtOp2l9eZ/dQ44/QYWK9jw1NfcHxxMzWB\nXEcvhuknDbQuuXZrl8m147XNsozHdQpKFgpCUHmWAiBK0OH1BK4u23m9UJYUUgh0\ndbWyybvrbYXmpFP3vf4kbFUss8+QmU6OipuBrBDtDQwolkzwIHCh6nCgK/iWgwGe\nVCGtCobowe/kvWLUPn/LWd44guhtsU8J+jF07ReDW8Yqp5TSiF1xTtXchPU5njle\nTOewIR99UKb3VbCaNa5GtmHXEndmzLl64efQQ8Hrw+xR7XVKlmw0yzN8HVYJvuW4\nNp17eL+7wrZrNrF/CcRSqbV5LTut70JBA6cpjvDHAgMBAAGjODA2MAwGA1UdEwEB\n/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMCMA0G\nCSqGSIb3DQEBBQUAA4IBAQA8NOsYc/660OW3xD6OtitVuJFAMzH2s0v+NBQtTDJR\nkCo6b5k8KcmTYlg5bAL633rHEa9a/H/IhCqPqcv/sGItxerKLFlj6L+snVO7KEPl\nWEf/uue+VCrdnoMJVxMBaWwq+vNYKxStmfz7shCVYHMdCzJe1qaQZg30k4jzlQsZ\nsUNb/wTL8QX6x3BrtOGcIuOS9HktjH2DRAVj6rGdppsMjLlm7OSj4TgDOa6CTDFf\nhkk19L0pJisQ7CNr08Uln/REr4o2BQyivMFMtn3ILdIo7+XglfCYU+3XkiwfxHAC\nWBhhKkORTkkH0OooaINjnBhGmDEJXGFIhNuuFmm+VbQ3\n-----END CERTIFICATE-----\n",
  "81805e76fd5fa2fd91c2bb39e4b7ef05469bddce": "-----BEGIN CERTIFICATE-----\nMIIDHTCCAgWgAwIBAgIJAOBUKWdekOLLMA0GCSqGSIb3DQEBBQUAMDExLzAtBgNV\nBAMMJnNlY3VyZXRva2VuLnN5c3RlbS5nc2VydmljZWFjY291bnQuY29tMB4XDTI2\nMDUwNDE3NDcyN1oXDTI3MDUwNDE3NDcyN1owMTEvMC0GA1UEAwwmc2VjdXJldG9r\nZW4uc3lzdGVtLmdzZXJ2aWNlYWNjb3VudC5jb20wggEiMA0GCSqGSIb3DQEBAQUA\nA4IBDwAwggEKAoIBAQDsTTVcwu+zIgditu6L+jPxmIJjxCCpC5tiArtNpHCMZjAt\nhIcaUW3QT9lbYM8MLxqsaS8bDBBxikoGpdJzasIABXxaIWwG1lGQVIs7UtOdJvQl\n1RdLX0XXf6wdxwfC4efi5wiLnTkvjHc4qA6rigwSNKsFuwNU9iVwIDdkjEWfRImj\nBwCXMwlTck9yEvT03R5mQ97+GvL8EWEH0I4jqgR5NOEvXMBEf4TRLgyaua1GWXhu\nlZ07CU5JOa4mLLbp9U6h12y4GFZ50+ed8WXWUm7pC7Uat0nXC6cN56esJDn21U3c\nDqwJVl15pup/PwLZs/+zmWofQi+wsi1UVg17S1VnAgMBAAGjODA2MAwGA1UdEwEB\n/wQCMAAwDgYDVR0PAQH/BAQDAgeAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMCMA0G\nCSqGSIb3DQEBBQUAA4IBAQCx2J3AH3TBtGy99Rn1yqS6TNTEL4t5GSM3HCv0gm9b\nDL9OXTHWxwFLHuXHXMaAhJdF9/x8BH8F+QehEeBG7qJNpocvyOekl71SInVQGcmL\nhwDJ8YXCDUqXLYhcrSr18IOFCq4yX9lxHtISaOpTncgS9xnG9nDNpVmTJX+eAxiF\nVTAjLDmzutNIZ+IqEwA4aHYjXxie+sZSIjxDKsF+S6QL6fmGvQabX/w68ZdPtvhA\njIGMAF3D3KNWAkFMsw0rpXkWnb+auvmq17onuOH3nkWvR6ocIn8ofBVrXOA3FZ0d\n+3reNfFzsxQO5F1q/omny5cOfc4GAfYWsQ9e8YImP31c\n-----END CERTIFICATE-----\n"
}
''')

_cached_certs: dict[str, str] = dict(_FALLBACK_GOOGLE_CERTS)
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


def _get_google_public_certs(force_refresh: bool = False) -> dict[str, str]:
    global _cached_certs, _certs_expires_at
    now = time.time()
    if not force_refresh and _cached_certs and now < _certs_expires_at:
        return _cached_certs

    try:
        with urllib.request.urlopen(_GOOGLE_CERTS_URL, timeout=1.5) as resp:
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
    except Exception:
        # In a VPC without outbound NAT, fall back immediately to bundled certs
        _certs_expires_at = now + 300
        return _cached_certs or _FALLBACK_GOOGLE_CERTS


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
            certs = _get_google_public_certs(force_refresh=True)
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
