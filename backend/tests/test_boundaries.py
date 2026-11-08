import asyncio
from datetime import timedelta
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlparse

import aiosmtplib
import httpx
import pytest
from pymongo.errors import AutoReconnect

from backend.app.core.config import Settings
from backend.app.core.exceptions import AppError
from backend.app.core.security import now, token_hash
from backend.app.main import create_app
from backend.app.services.mail import Mailer

P = "/api/v1"


async def test_refresh_replay_cannot_resurrect_family(user):
    c, app, _ = user
    old_token = c.cookies["refresh_token"]
    ready, resume = asyncio.Event(), asyncio.Event()
    original = app.state.repo.create

    async def paused(collection, values):
        if collection == "refresh_tokens":
            ready.set()
            await resume.wait()
        return await original(collection, values)

    app.state.repo.create = paused
    pending = asyncio.create_task(app.state.auth.refresh(old_token))
    await asyncio.wait_for(ready.wait(), timeout=5)
    with pytest.raises(AppError):
        await app.state.auth.refresh(old_token)
    resume.set()
    with pytest.raises(AppError):
        await pending
    assert (await c.get(P + "/auth/me")).status_code == 401
    assert await app.state.repo.count("refresh_tokens", {"revoked": False}) == 0


async def test_concurrent_sos_is_idempotent(user):
    c, _, _ = user
    payload = {"message": "Concurrent test", "idempotency_key": "concurrent-alert-key-123"}
    responses = await asyncio.gather(*(c.post(P + "/alerts", json=payload) for _ in range(4)))
    assert all(r.status_code == 201 for r in responses)
    assert len({r.json()["id"] for r in responses}) == 1


async def test_email_verification_and_email_password_reset(user):
    c, app, _ = user
    app.state.auth.mailer.send_link = AsyncMock()
    assert (await c.post(P + "/auth/resend-verification")).status_code == 200
    link = app.state.auth.mailer.send_link.call_args.args[2]
    token = parse_qs(urlparse(link).query)["token"][0]
    assert (await c.post(P + "/auth/verify-email", json={"token": token})).status_code == 200
    assert (await c.get(P + "/auth/me")).json()["is_verified"] is True
    assert (await c.post(P + "/auth/verify-email", json={"token": token})).status_code == 400
    app.state.settings.smtp_host = "mail.example.com"
    app.state.settings.email_from = "no-reply@example.com"
    assert (
        await c.post(P + "/auth/forgot-password", json={"email": "test@example.com"})
    ).status_code == 200
    link = app.state.auth.mailer.send_link.call_args.args[2]
    token = parse_qs(urlparse(link).query)["token"][0]
    payload = {"email": "test@example.com", "token": token, "new_password": "AnotherPass945!"}
    assert (await c.post(P + "/auth/reset-password", json=payload)).status_code == 200
    assert (await c.post(P + "/auth/reset-password", json=payload)).status_code == 400


async def test_mail_failure_does_not_enumerate_and_unknown_recovery(user):
    c, app, _ = user
    app.state.settings.smtp_host = "mail.example.com"
    app.state.settings.email_from = "no-reply@example.com"
    app.state.auth.mailer.send_link = AsyncMock(
        side_effect=AppError(503, "EMAIL_UNAVAILABLE", "Unavailable")
    )
    assert (
        await c.post(P + "/auth/forgot-password", json={"email": "test@example.com"})
    ).status_code == 200
    assert (
        await c.post(
            P + "/auth/reset-password",
            json={
                "email": "unknown@example.com",
                "token": "invalid-token-value",
                "new_password": "AnotherPass945!",
            },
        )
    ).status_code == 400


async def test_expired_revoked_and_absent_refresh(user):
    c, app, _ = user
    token = c.cookies["refresh_token"]
    row = await app.state.repo.find("refresh_tokens", {"token_hash": token_hash(token)})
    await app.state.repo.update(
        "refresh_tokens", row["id"], {"expires_at": now() - timedelta(seconds=5)}
    )
    assert (await c.post(P + "/auth/refresh")).status_code == 401
    c.cookies.set("refresh_token", "unknown-refresh", domain="testserver.local", path="/")
    assert (await c.post(P + "/auth/refresh")).status_code == 401


async def test_inactive_account_and_version_revocation(user):
    c, app, data = user
    await app.state.repo.update("users", data["user"]["id"], {"is_active": False})
    assert (await c.get(P + "/auth/me")).status_code == 401
    assert (await c.post(P + "/auth/refresh")).status_code == 401


async def test_refresh_atomic_claim_failure_is_reuse(user):
    c, app, _ = user
    original = app.state.repo.update_where

    async def claim(collection, *args, **kwargs):
        if collection == "refresh_tokens":
            return None
        return await original(collection, *args, **kwargs)

    app.state.repo.update_where = claim
    assert (await c.post(P + "/auth/refresh")).status_code == 401
    assert (await c.get(P + "/auth/me")).status_code == 401


async def test_admin_success_and_share_listing_hides_capability(user):
    c, app, data = user
    await app.state.repo.update("users", data["user"]["id"], {"role": "admin"})
    assert (await c.get(P + "/admin/summary")).json()["users"] == 1
    share = (await c.post(P + "/location-shares", json={"latitude": 0, "longitude": 0})).json()
    rows = (await c.get(P + "/location-shares")).json()["items"]
    assert len(rows) == 1
    assert "token" not in rows[0] and "token_hash" not in rows[0]
    assert (await c.delete(P + "/location-shares/000000000000000000000000")).status_code == 404
    assert (
        await c.patch(
            P + "/location-shares/000000000000000000000000", json={"latitude": 0, "longitude": 0}
        )
    ).status_code == 404
    assert (await c.get(P + "/location-shares/public/" + "x" * 101)).status_code == 404
    assert (await c.delete(P + "/location-shares/" + share["id"])).status_code == 200


async def test_invalid_ownership_updates_and_missing_alert(user):
    c, _, _ = user
    assert (await c.patch(P + "/alerts/000000000000000000000000/resolve")).status_code == 404
    assert (
        await c.patch(
            P + "/contacts/000000000000000000000000",
            json={"name": "Person", "phone": "9876543210", "relationship": "Friend"},
        )
    ).status_code == 404
    assert (
        await c.post(
            P + "/reports",
            json={
                "title": "Incident",
                "category": "other",
                "description": "Description for a test incident",
                "incident_at": "2026-01-01T12:00:00",
            },
        )
    ).status_code == 422


async def test_csrf_origin_body_limit_404_and_correlation(user):
    c, _, _ = user
    assert (
        await c.post(
            P + "/auth/login",
            headers={"Origin": "https://attacker.example"},
            json={"email": "test@example.com", "password": "SecurePass912!"},
        )
    ).status_code == 403
    assert (await c.post(P + "/contacts", content="x" * 65537)).status_code == 413
    assert (await c.get(P + "/missing")).status_code == 404
    assert (await c.get("/health", headers={"X-Request-ID": "safe-test-123"})).headers[
        "x-request-id"
    ] == "safe-test-123"
    assert (await c.get("/health", headers={"X-Request-ID": "bad value"})).headers[
        "x-request-id"
    ] != "bad value"


async def test_database_outage_and_recovery(user):
    c, app, _ = user
    ping = app.state.repo.ping
    app.state.repo.ping = AsyncMock(side_effect=AutoReconnect("private database details"))
    r = await c.get("/ready")
    assert r.status_code == 503 and "private" not in r.text
    assert (await c.get("/health")).status_code == 200
    app.state.repo.ping = ping
    assert (await c.get("/ready")).status_code == 200
    original = app.state.repo.list
    app.state.repo.list = AsyncMock(side_effect=RuntimeError("private application details"))
    r = await c.get(P + "/contacts")
    assert r.status_code == 500 and "private" not in r.text
    app.state.repo.list = original


async def test_rate_limit_shared_storage(user):
    _, app, _ = user
    await app.state.repo.rate_limit("one-request", 1)
    with pytest.raises(AppError) as error:
        await app.state.repo.rate_limit("one-request", 1)
    assert error.value.status == 429


@pytest.mark.parametrize(
    "status,payload",
    [
        (429, {"error": {"code": "insufficient_quota"}}),
        (200, {"choices": []}),
        (200, {"choices": [{"message": {"content": ""}}]}),
    ],
)
async def test_ai_provider_failure_never_persists_fake_messages(user, monkeypatch, status, payload):
    c, app, _ = user
    real_client = httpx.AsyncClient
    app.state.settings.openai_api_key = "test-provider-key"
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **kwargs: real_client(
            transport=httpx.MockTransport(lambda req: httpx.Response(status, json=payload)),
            **kwargs,
        ),
    )
    assert (
        await c.post(P + "/chat/messages", json={"message": "Train safety tips", "language": "en"})
    ).status_code == 503
    assert (await c.get(P + "/chat/messages")).json()["total"] == 0


async def test_ai_adapter_message_context_and_network_failure(user, monkeypatch):
    _, app, _ = user
    real_client = httpx.AsyncClient
    app.state.settings.openai_api_key = "test-provider-key"

    def answer(req):
        import json

        body = json.loads(req.content)
        assert body["store"] is False and "Kannada" in body["messages"][0]["content"]
        return httpx.Response(
            200, json={"choices": [{"message": {"content": "A real adapter result"}}]}
        )

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs),
    )
    assert (
        await app.state.features.generate_reply(
            "Help", "kn", [{"role": "user", "text": "Earlier question"}]
        )
        == "A real adapter result"
    )

    def failure(req):
        raise httpx.ConnectError("private network details")

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda **kwargs: real_client(transport=httpx.MockTransport(failure), **kwargs),
    )
    with pytest.raises(AppError):
        await app.state.features.generate_reply("Help", "en", [])


async def test_smtp_retry_and_templates(monkeypatch):
    settings = Settings(
        _env_file=None, smtp_host="smtp.example.com", email_from="no-reply@example.com"
    )
    mail = Mailer(settings)
    send = AsyncMock(side_effect=[aiosmtplib.SMTPException("temporary"), None])
    monkeypatch.setattr(aiosmtplib, "send", send)
    await mail.send_link(
        "person@example.com", "Verify email", "https://example.com/verify?token=test"
    )
    assert send.await_count == 2
    assert send.call_args.args[0].is_multipart()
    monkeypatch.setattr(
        aiosmtplib, "send", AsyncMock(side_effect=aiosmtplib.SMTPException("unavailable"))
    )
    with pytest.raises(AppError):
        await mail.send_link("person@example.com", "Verify email", "https://example.com")


async def test_production_headers_and_lifespan(user):
    _c, old, _ = user
    settings = Settings(
        _env_file=None,
        app_env="production",
        secret_key="s" * 64,
        frontend_url="https://example.com",
        cors_origins="https://example.com",
        allowed_hosts="testserver",
        rate_limit_enabled=False,
    )
    app = create_app(settings, old.state.repo.db)
    async with app.router.lifespan_context(app):  # noqa: SIM117
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="https://testserver"
        ) as client:
            assert "max-age" in (await client.get("/health")).headers["strict-transport-security"]
            assert (await client.get("/docs")).status_code == 404
    with pytest.raises(ValueError):
        Settings(
            _env_file=None,
            app_env="production",
            secret_key="s" * 64,
            frontend_url="http://example.com",
        )
