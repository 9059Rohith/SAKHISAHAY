import asyncio
import re
from datetime import timedelta
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlparse

import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from backend.app.core.config import Settings
from backend.app.core.exceptions import AppError
from backend.app.core.security import now, token_hash
from backend.app.main import create_app
from backend.tests.smtp_capture import SMTPCapture

P = "/api/v1"


async def test_slow_signup_mail_does_not_lose_account_or_recovery_code(setup, monkeypatch):
    from backend.app import api as api_routes

    client, app = setup
    app.state.settings.smtp_host = "smtp.example.com"
    app.state.settings.email_from = "no-reply@example.com"
    monkeypatch.setattr(api_routes, "SIGNUP_EMAIL_TIMEOUT_SECONDS", 0.01, raising=False)

    async def slow(*args):
        await asyncio.sleep(30)

    app.state.auth.mailer.send_link = slow
    response = await asyncio.wait_for(
        client.post(
            P + "/auth/signup",
            json={
                "email": "slow@example.com",
                "full_name": "Slow Mail",
                "password": "SecurePass912!",
            },
        ),
        timeout=3,
    )
    assert response.status_code == 201
    assert response.json()["verification_email_sent"] is False
    assert response.json()["recovery_code"].startswith("SAKHI-")
    assert (await client.get(P + "/auth/me")).status_code == 200
    assert await app.state.repo.count("password_resets", {"used": False}) == 0


def email_link(message):
    return re.search(r"https?://\S+", message.get_body(preferencelist=("plain",)).get_content())[0]


async def test_signup_verification_and_reset_through_real_smtp_socket():
    async with SMTPCapture() as inbox:
        settings = Settings(
            _env_file=None,
            app_env="test",
            rate_limit_enabled=False,
            smtp_host="127.0.0.1",
            smtp_port=inbox.port,
            smtp_security="none",
            email_from="SakhiSahay <no-reply@example.com>",
            frontend_url="http://127.0.0.1:5173",
        )
        app = create_app(settings, AsyncMongoMockClient(tz_aware=True).email_test)
        await app.state.repo.ensure_indexes()
        async with AsyncClient(
            transport=ASGITransport(app), base_url="http://testserver"
        ) as client:
            signup = await client.post(
                P + "/auth/signup",
                json={
                    "email": "mail-test@example.com",
                    "full_name": "Email Test",
                    "password": "InitialPass912!",
                },
            )
            assert signup.status_code == 201
            assert signup.json()["verification_email_sent"] is True
            assert len(inbox.messages) == 1
            message = inbox.messages[-1]
            assert message["Date"] and message["Message-ID"]
            assert message.is_multipart()
            link = email_link(message)
            assert link.startswith(settings.frontend_url + "/verify-email?")
            token = parse_qs(urlparse(link).query)["token"][0]
            assert (
                await client.post(P + "/auth/verify-email", json={"token": token})
            ).status_code == 200
            assert (await client.get(P + "/auth/me")).json()["is_verified"] is True
            assert (
                await client.post(P + "/auth/verify-email", json={"token": token})
            ).status_code == 400
            client.headers["X-CSRF-Token"] = client.cookies["csrf_token"]
            assert (await client.post(P + "/auth/resend-verification")).json()[
                "message"
            ] == "Your email is already verified."
            assert len(inbox.messages) == 1
            for _ in range(2):
                assert (
                    await client.post(
                        P + "/auth/forgot-password", json={"email": "mail-test@example.com"}
                    )
                ).status_code == 200
            assert len(inbox.messages) == 3
            reset_link = email_link(inbox.messages[-1])
            query = parse_qs(urlparse(reset_link).query)
            assert query["email"] == ["mail-test@example.com"]
            reset_token = query["token"][0]
            old_access = client.cookies["access_token"]
            payload = {
                "email": "mail-test@example.com",
                "token": reset_token,
                "new_password": "ChangedPass945!",
            }
            assert (await client.post(P + "/auth/reset-password", json=payload)).status_code == 200
            assert (await client.post(P + "/auth/reset-password", json=payload)).status_code == 400
            older = parse_qs(urlparse(email_link(inbox.messages[-2])).query)["token"][0]
            payload["token"] = older
            assert (await client.post(P + "/auth/reset-password", json=payload)).status_code == 400
            client.cookies.set("access_token", old_access, domain="testserver.local", path="/")
            assert (await client.get(P + "/auth/me")).status_code == 401
            client.cookies.clear()
            assert (
                await client.post(
                    P + "/auth/login",
                    json={"email": "mail-test@example.com", "password": "InitialPass912!"},
                )
            ).status_code == 401
            assert (
                await client.post(
                    P + "/auth/login",
                    json={"email": "mail-test@example.com", "password": "ChangedPass945!"},
                )
            ).status_code == 200


async def test_missing_smtp_is_explicit_without_account_enumeration(setup):
    client, _ = setup
    responses = [
        await client.post(P + "/auth/forgot-password", json={"email": email})
        for email in ("test@example.com", "unknown@example.com")
    ]
    assert all(response.status_code == 503 for response in responses)
    assert responses[0].json()["error"]["code"] == "EMAIL_UNAVAILABLE"
    assert responses[0].json()["error"]["message"] == responses[1].json()["error"]["message"]


def test_production_forbids_unencrypted_smtp():
    with pytest.raises(ValueError, match="SMTP"):
        Settings(
            _env_file=None,
            app_env="production",
            secret_key="s" * 64,
            frontend_url="https://example.com",
            smtp_host="mail.example.com",
            smtp_security="none",
        )


async def test_expired_email_tokens_and_failed_send_are_not_usable(user):
    client, app, _ = user
    app.state.auth.mailer.send_link = AsyncMock()
    await client.post(P + "/auth/resend-verification")
    token = parse_qs(urlparse(app.state.auth.mailer.send_link.call_args.args[2]).query)["token"][0]
    await app.state.repo.update_where(
        "password_resets",
        {"token_hash": token_hash(token)},
        {"expires_at": now() - timedelta(seconds=1)},
    )
    assert (await client.post(P + "/auth/verify-email", json={"token": token})).status_code == 400
    app.state.auth.mailer.send_link = AsyncMock(
        side_effect=AppError(503, "EMAIL_UNAVAILABLE", "Unavailable")
    )
    assert (await client.post(P + "/auth/resend-verification")).status_code == 503
    assert (
        await app.state.repo.count("password_resets", {"used": False, "expires_at": {"$gt": now()}})
        == 0
    )


async def test_signup_survives_provider_failure_and_email_status_is_admin_only(setup):
    client, app = setup
    app.state.settings.smtp_host = "smtp.example.com"
    app.state.settings.email_from = "no-reply@example.com"
    app.state.auth.mailer.send_link = AsyncMock(
        side_effect=AppError(503, "EMAIL_UNAVAILABLE", "Unavailable")
    )
    response = await client.post(
        P + "/auth/signup",
        json={
            "email": "outage-test@example.com",
            "full_name": "Outage Test",
            "password": "SecurePass912!",
        },
    )
    assert response.status_code == 201
    assert response.json()["verification_email_sent"] is False
    assert await app.state.repo.count("password_resets", {"used": False}) == 0
    assert (await client.get(P + "/admin/email-status")).status_code == 403
    await app.state.repo.update("users", response.json()["user"]["id"], {"role": "admin"})
    status = await client.get(P + "/admin/email-status")
    assert status.status_code == 200
    assert status.json() == {
        "configured": True,
        "transport": "starttls",
        "sender_configured": True,
        "authentication_configured": False,
    }


async def test_smtp_auth_failure_is_not_retried_or_logged_with_credentials(monkeypatch, caplog):
    import aiosmtplib

    from backend.app.services.mail import Mailer

    settings = Settings(
        _env_file=None,
        smtp_host="smtp.example.com",
        email_from="no-reply@example.com",
        smtp_user="private-user",
        smtp_password="private-password",
    )
    send = AsyncMock(side_effect=aiosmtplib.SMTPAuthenticationError(535, "private-password"))
    monkeypatch.setattr(aiosmtplib, "send", send)
    with pytest.raises(AppError):
        await Mailer(settings).send_link(
            "private-recipient@example.com",
            "Verify your email",
            "https://example.com/verify?token=private-token",
        )
    assert send.await_count == 1
    assert "email_delivery_failed" in caplog.text
    assert all(
        secret not in caplog.text
        for secret in ("private-password", "private-user", "private-recipient", "private-token")
    )
    assert send.call_args.kwargs["start_tls"] is True
    assert send.call_args.kwargs["use_tls"] is False
    assert send.call_args.kwargs["validate_certs"] is True
