import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)
COMMON_PASSWORDS = {"password", "password123", "password123!", "qwerty123", "12345678"}


def now() -> datetime:
    """Return an aware UTC timestamp."""
    return datetime.now(UTC)


def token_hash(token: str) -> str:
    """Hash high-entropy bearer capabilities without storing their raw value."""
    return hashlib.sha256(token.encode()).hexdigest()


def random_token() -> str:
    return secrets.token_urlsafe(32)


def hash_password(password: str) -> str:
    return hasher.hash(password)


def verify_password(password: str, encoded: str) -> bool:
    try:
        return hasher.verify(encoded, password)
    except (VerificationError, InvalidHashError):
        return False


def valid_password(password: str) -> str:
    if (
        len(password) < 8
        or len(password) > 128
        or password.lower() in COMMON_PASSWORDS
        or not any(c.isalpha() for c in password)
        or not any(c.isdigit() for c in password)
    ):
        raise ValueError(
            "Use 8–128 characters including a letter and a number; avoid common passwords"
        )
    return password


def access_token(user: dict, family: str, settings) -> str:
    issued = now()
    return jwt.encode(
        {
            "sub": user["id"],
            "sid": family,
            "ver": user.get("auth_version", 1),
            "iat": issued,
            "exp": issued + timedelta(minutes=settings.access_token_expire_minutes),
            "iss": "sakhisahay",
            "aud": "sakhisahay-web",
        },
        settings.secret_key,
        algorithm="HS256",
    )


def decode_token(token: str, settings) -> dict:
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=["HS256"],
        issuer="sakhisahay",
        audience="sakhisahay-web",
        options={"require": ["sub", "sid", "ver", "exp", "iat"]},
    )
