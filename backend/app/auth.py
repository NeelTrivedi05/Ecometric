import json
import os
import time
from dataclasses import dataclass
from threading import Lock
from typing import Any, Dict, Optional
from urllib.request import urlopen

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_JWT_AUDIENCE = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")
JWKS_TTL_SECONDS = 300
_jwks_cache: Optional[Dict[str, Any]] = None
_jwks_cached_at = 0.0
_jwks_lock = Lock()


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: Optional[str]
    claims: Dict[str, Any]


def _jwks() -> Dict[str, Any]:
    global _jwks_cache, _jwks_cached_at
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="SUPABASE_URL is not configured")
    now = time.time()
    if _jwks_cache and now - _jwks_cached_at < JWKS_TTL_SECONDS:
        return _jwks_cache
    with _jwks_lock:
        if _jwks_cache and time.time() - _jwks_cached_at < JWKS_TTL_SECONDS:
            return _jwks_cache
        try:
            with urlopen(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=5) as response:
                _jwks_cache = json.loads(response.read().decode("utf-8"))
                _jwks_cached_at = time.time()
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Authentication provider unavailable") from exc
    return _jwks_cache


def authenticate_token(authorization: Optional[str]) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    token = authorization[7:].strip()
    try:
        header = jwt.get_unverified_header(token)
        key = next((item for item in _jwks().get("keys", []) if item.get("kid") == header.get("kid")), None)
        if not key:
            raise JWTError("Signing key not found")
        claims = jwt.decode(token, key, algorithms=[header.get("alg", "RS256")],
                            audience=SUPABASE_JWT_AUDIENCE, issuer=f"{SUPABASE_URL}/auth/v1")
        user_id = claims.get("sub")
        if not user_id:
            raise JWTError("Token subject missing")
        return AuthenticatedUser(id=user_id, email=claims.get("email"), claims=claims)
    except (JWTError, ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc


def get_current_user(authorization: Optional[str] = Header(default=None)) -> AuthenticatedUser:
    return authenticate_token(authorization)
