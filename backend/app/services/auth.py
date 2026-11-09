import asyncio
import secrets
from datetime import timedelta
from urllib.parse import urlencode

import jwt

from ..core.exceptions import AppError
from ..core.security import (
    access_token,
    decode_token,
    hash_password,
    now,
    random_token,
    token_hash,
    verify_password,
)
from .mail import Mailer


class AuthService:
    """Account lifecycle and rotating, revocable session families."""

    def __init__(self, repo, settings):
        self.repo = repo
        self.settings = settings
        self.mailer = Mailer(settings)
        self.dummy_hash = hash_password(random_token())

    async def signup(self, data):
        recovery = "SAKHI-" + secrets.token_hex(16)
        user = await self.repo.create(
            "users",
            {
                "email": str(data.email).lower(),
                "full_name": data.full_name,
                "password_hash": hash_password(data.password),
                "recovery_hash": hash_password(recovery),
                "role": "user",
                "is_active": True,
                "is_verified": False,
                "auth_version": 1,
                "failed_login_attempts": 0,
                "locked_until": None,
            },
        )
        await self.repo.audit(user["id"], "signup", "users", user["id"])
        return user, recovery

    async def login(self, data):
        user = await self.repo.find("users", {"email": str(data.email).lower()})
        if user and user.get("locked_until") and user["locked_until"] > now():
            raise AppError(
                429, "ACCOUNT_LOCKED", "Unable to sign in. Please try again in 15 minutes."
            )
        good = verify_password(data.password, user["password_hash"] if user else self.dummy_hash)
        if not user or not good or not user.get("is_active"):
            if user:
                failed = await self.repo.update_where(
                    "users", {"email": user["email"]}, {}, {"failed_login_attempts": 1}
                )
                if failed["failed_login_attempts"] >= 5:
                    await self.repo.update(
                        "users",
                        user["id"],
                        {"locked_until": now() + timedelta(minutes=15), "failed_login_attempts": 0},
                    )
            raise AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect")
        await self.repo.update(
            "users",
            user["id"],
            {"failed_login_attempts": 0, "locked_until": None, "last_login_at": now()},
        )
        await self.repo.audit(user["id"], "login", "users", user["id"])
        return user

    async def session(self, user, family=None):
        if family is None:
            family = random_token()
            await self.repo.create(
                "session_families",
                {
                    "family": family,
                    "user_id": user["id"],
                    "revoked": False,
                    "expires_at": now() + timedelta(days=self.settings.refresh_token_expire_days),
                },
            )
        elif not await self.active_family(family):
            raise AppError(401, "SESSION_EXPIRED", "Please sign in again")
        refresh = random_token()
        await self.repo.create(
            "refresh_tokens",
            {
                "user_id": user["id"],
                "token_hash": token_hash(refresh),
                "family": family,
                "expires_at": now() + timedelta(days=self.settings.refresh_token_expire_days),
                "revoked": False,
                "auth_version": user.get("auth_version", 1),
            },
        )
        if not await self.active_family(family):
            await self.repo.update_many("refresh_tokens", {"family": family}, {"revoked": True})
            raise AppError(401, "SESSION_EXPIRED", "Please sign in again")
        return access_token(user, family, self.settings), refresh, random_token()

    async def active_family(self, family):
        return await self.repo.find(
            "session_families", {"family": family, "revoked": False, "expires_at": {"$gt": now()}}
        )

    async def revoke_family(self, family):
        # The durable family tombstone closes the race with a successor token insert.
        await self.repo.update_many("session_families", {"family": family}, {"revoked": True})
        await self.repo.update_many("refresh_tokens", {"family": family}, {"revoked": True})

    async def current_user(self, token):
        try:
            claims = decode_token(token or "", self.settings)
        except jwt.InvalidTokenError:
            raise AppError(401, "UNAUTHENTICATED", "Please sign in to continue") from None
        user = await self.repo.get("users", claims["sub"])
        active = await self.active_family(claims["sid"])
        if (
            not user
            or not user.get("is_active")
            or user.get("auth_version") != claims["ver"]
            or not active
        ):
            raise AppError(
                401, "SESSION_EXPIRED", "Your session has expired. Please sign in again."
            )
        return user

    async def refresh(self, token):
        encoded = token_hash(token or "")
        record = await self.repo.find("refresh_tokens", {"token_hash": encoded})
        if not record:
            raise AppError(401, "SESSION_EXPIRED", "Please sign in again")
        if record["revoked"]:
            await self.revoke_family(record["family"])
            raise AppError(401, "TOKEN_REUSED", "Session reuse detected. Please sign in again.")
        user = await self.repo.get("users", record["user_id"])
        if (
            not user
            or not user.get("is_active")
            or record["expires_at"] <= now()
            or record["auth_version"] != user["auth_version"]
        ):
            raise AppError(401, "SESSION_EXPIRED", "Please sign in again")
        claimed = await self.repo.update_where(
            "refresh_tokens", {"token_hash": encoded, "revoked": False}, {"revoked": True}
        )
        if not claimed:
            await self.revoke_family(record["family"])
            raise AppError(401, "TOKEN_REUSED", "Please sign in again")
        return user, await self.session(user, record["family"])

    async def logout(self, refresh):
        record = await self.repo.find("refresh_tokens", {"token_hash": token_hash(refresh or "")})
        if record:
            await self.revoke_family(record["family"])
            await self.repo.audit(record["user_id"], "logout", "users")

    async def email_token(self, user, purpose):
        token = random_token()
        record = await self.repo.create(
            "password_resets",
            {
                "user_id": user["id"],
                "purpose": purpose,
                "token_hash": token_hash(token),
                "used": False,
                "expires_at": now() + timedelta(minutes=30),
            },
        )
        query = urlencode({"token": token, "email": user["email"]})
        route = "/verify-email" if purpose == "verify" else "/reset-password"
        try:
            await self.mailer.send_link(
                user["email"],
                "Verify your email" if purpose == "verify" else "Reset your password",
                self.settings.frontend_url.rstrip("/") + route + "?" + query,
            )
        except (AppError, asyncio.CancelledError):
            await self.repo.update("password_resets", record["id"], {"used": True})
            raise

    async def forgot(self, email):
        if not self.mailer.available:
            raise AppError(
                503,
                "EMAIL_UNAVAILABLE",
                "Email delivery is not configured yet. Use your saved recovery code, or try again later.",
            )
        user = await self.repo.find("users", {"email": str(email).lower()})
        if user and self.mailer.available:
            try:
                await self.email_token(user, "reset")
            except AppError:
                # Keep the public result identical for known and unknown addresses.
                return

    async def reset(self, data):
        user = await self.repo.find("users", {"email": str(data.email).lower()})
        if not user:
            verify_password(data.token, self.dummy_hash)
            raise AppError(
                400, "INVALID_RECOVERY", "The recovery code or link is invalid or expired"
            )
        recovery_valid = bool(user.get("recovery_hash")) and verify_password(
            data.token, user["recovery_hash"]
        )
        if recovery_valid:
            claimed = await self.repo.update_where(
                "users",
                {"email": user["email"], "recovery_hash": user["recovery_hash"]},
                {"recovery_hash": ""},
            )
        else:
            claimed = await self.repo.update_where(
                "password_resets",
                {
                    "token_hash": token_hash(data.token),
                    "user_id": user["id"],
                    "purpose": "reset",
                    "used": False,
                    "expires_at": {"$gt": now()},
                },
                {"used": True},
            )
        if not claimed:
            raise AppError(
                400, "INVALID_RECOVERY", "The recovery code or link is invalid or expired"
            )
        await self.change_secret(user, data.new_password)
        await self.repo.audit(user["id"], "password_reset", "users")

    async def change_secret(self, user, password):
        await self.repo.update_where(
            "users",
            {"email": user["email"]},
            {
                "password_hash": hash_password(password),
                "failed_login_attempts": 0,
                "locked_until": None,
            },
            {"auth_version": 1},
        )
        await self.repo.update_many("refresh_tokens", {"user_id": user["id"]}, {"revoked": True})
        await self.repo.update_many("session_families", {"user_id": user["id"]}, {"revoked": True})
        await self.repo.update_many(
            "password_resets",
            {"user_id": user["id"], "purpose": "reset", "used": False},
            {"used": True},
        )

    async def verify_email(self, token):
        record = await self.repo.update_where(
            "password_resets",
            {
                "token_hash": token_hash(token),
                "purpose": "verify",
                "used": False,
                "expires_at": {"$gt": now()},
            },
            {"used": True},
        )
        if not record:
            raise AppError(400, "INVALID_LINK", "The verification link is invalid or expired")
        await self.repo.update("users", record["user_id"], {"is_verified": True})
