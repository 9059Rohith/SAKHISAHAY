from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

P = "/api/v1"
CONTACT = {"name": "Trusted Person", "phone": "9876543210", "relationship": "Family"}
REPORT = {
    "title": "Travel incident",
    "category": "stalking",
    "description": "Someone followed me near the station.",
    "incident_at": "2026-01-01T12:00:00Z",
    "location": "Station",
}
COORDS = {"latitude": 12.97, "longitude": 77.59, "accuracy": 20}


@pytest.mark.asyncio
async def test_health_and_error_envelope(setup):
    c, _app = setup
    assert (await c.get("/health")).json()["status"] == "ok"
    assert (await c.get("/ready")).status_code == 200
    assert (await c.get("/version")).json()["version"]
    r = await c.get(P + "/contacts")
    assert r.status_code == 401
    assert r.json()["error"]["request_id"]
    assert r.headers["x-content-type-options"] == "nosniff"


@pytest.mark.asyncio
async def test_signup_session_and_duplicate(user):
    c, _, data = user
    assert "recovery_code" in data and "password_hash" not in str(data)
    assert (await c.get(P + "/auth/me")).json()["email"] == "test@example.com"
    assert "HttpOnly" in str(c.cookies) or c.cookies.get("access_token")
    r = await c.post(
        P + "/auth/signup",
        json={"full_name": "Other", "email": "TEST@example.com", "password": "SecurePass912!"},
    )
    assert r.status_code == 409


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"full_name": "A", "email": "bad", "password": "123"},
        {"full_name": "Person", "email": {"$ne": None}, "password": "SecurePass912!"},
        {
            "full_name": "Person",
            "email": "x@example.com",
            "password": "SecurePass912!",
            "role": "admin",
        },
        {"full_name": "Person", "email": "x@example.com", "password": "password"},
    ],
)
async def test_signup_validation(setup, payload):
    assert (await setup[0].post(P + "/auth/signup", json=payload)).status_code == 422


@pytest.mark.asyncio
async def test_login_logout_and_csrf(user):
    c, _, _ = user
    old = c.headers.pop("X-CSRF-Token")
    assert (await c.post(P + "/contacts", json=CONTACT)).status_code == 403
    c.headers["X-CSRF-Token"] = old
    assert (await c.post(P + "/auth/logout")).status_code == 200
    assert (await c.get(P + "/auth/me")).status_code == 401
    assert (
        await c.post(P + "/auth/login", json={"email": "test@example.com", "password": "wrong"})
    ).status_code == 401
    assert (
        await c.post(
            P + "/auth/login", json={"email": "test@example.com", "password": "SecurePass912!"}
        )
    ).status_code == 200


@pytest.mark.asyncio
async def test_refresh_rotation_reuse_revokes_family(user):
    c, _, _ = user
    old = c.cookies["refresh_token"]
    r = await c.post(P + "/auth/refresh")
    assert r.status_code == 200
    assert c.cookies["refresh_token"] != old
    c.headers["X-CSRF-Token"] = c.cookies["csrf_token"]
    new_cookies = dict(c.cookies)
    r = await c.post(
        P + "/auth/refresh",
        headers={"Cookie": f"refresh_token={old}; csrf_token={c.cookies['csrf_token']}"},
    )
    assert r.status_code == 401
    c.cookies.clear()
    c.cookies.update(new_cookies)
    assert (await c.get(P + "/auth/me")).status_code == 401


@pytest.mark.asyncio
async def test_lockout(user):
    c, _, _ = user
    for _ in range(5):
        r = await c.post(P + "/auth/login", json={"email": "test@example.com", "password": "wrong"})
        assert r.status_code in (401, 429)
    assert (
        await c.post(
            P + "/auth/login", json={"email": "test@example.com", "password": "SecurePass912!"}
        )
    ).status_code == 429


@pytest.mark.asyncio
async def test_recovery_one_use_and_session_revocation(user):
    c, _, data = user
    payload = {
        "email": "test@example.com",
        "token": data["recovery_code"],
        "new_password": "AnotherPass927!",
    }
    assert (await c.post(P + "/auth/reset-password", json=payload)).status_code == 200
    assert (await c.get(P + "/auth/me")).status_code == 401
    assert (await c.post(P + "/auth/reset-password", json=payload)).status_code == 400
    assert (
        await c.post(
            P + "/auth/login", json={"email": "test@example.com", "password": "AnotherPass927!"}
        )
    ).status_code == 200


@pytest.mark.asyncio
async def test_contacts_crud_and_validation(user):
    c, _, _ = user
    r = await c.post(P + "/contacts", json=CONTACT)
    assert r.status_code == 201, r.text
    id = r.json()["id"]
    assert (await c.post(P + "/contacts", json=CONTACT)).status_code == 409
    assert (await c.get(P + "/contacts?q=Trusted")).json()["total"] == 1
    assert (await c.get(P + "/contacts?page_size=101")).status_code == 422
    assert (await c.patch(P + f"/contacts/{id}", json={**CONTACT, "name": "Updated Name"})).json()[
        "name"
    ] == "Updated Name"
    assert (await c.post(P + "/contacts", json={**CONTACT, "phone": "123"})).status_code == 422
    assert (await c.delete(P + f"/contacts/{id}")).status_code == 200
    assert (await c.get(P + "/contacts")).json()["total"] == 0
    assert (await c.delete(P + "/contacts/not-an-id")).status_code == 404


@pytest.mark.asyncio
async def test_reports_crud_concurrency(user):
    c, _, _ = user
    r = await c.post(P + "/reports", json=REPORT)
    assert r.status_code == 201, r.text
    id = r.json()["id"]
    payload = {**REPORT, "status": "closed", "version": 1}
    assert (await c.patch(P + f"/reports/{id}", json=payload)).json()["version"] == 2
    assert (await c.patch(P + f"/reports/{id}", json=payload)).status_code == 409
    assert (await c.get(P + "/reports?status=closed&q=Travel")).json()["total"] == 1
    assert (await c.delete(P + f"/reports/{id}")).status_code == 200


@pytest.mark.asyncio
async def test_location_revocation_and_expiry(user):
    c, app, _ = user
    r = await c.post(P + "/location-shares", json=COORDS)
    assert r.status_code == 201, r.text
    share = r.json()
    url = P + "/location-shares/public/" + share["token"]
    assert (await c.get(url)).json()["latitude"] == COORDS["latitude"]
    assert (
        await c.patch(P + "/location-shares/" + share["id"], json={**COORDS, "latitude": 13})
    ).status_code == 200
    assert (await c.delete(P + "/location-shares/" + share["id"])).status_code == 200
    assert (await c.get(url)).status_code == 404
    r = await c.post(P + "/location-shares", json=COORDS)
    s = r.json()
    await app.state.repo.update(
        "location_shares", s["id"], {"expires_at": datetime.now(UTC) - timedelta(seconds=1)}
    )
    assert (await c.get(P + "/location-shares/public/" + s["token"])).status_code == 404


@pytest.mark.asyncio
async def test_alert_idempotency(user):
    c, _, _ = user
    await c.post(P + "/contacts", json=CONTACT)
    payload = {
        "message": "I need help",
        "coordinates": COORDS,
        "idempotency_key": "same-request-key-123",
    }
    r = await c.post(P + "/alerts", json=payload)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["contacts"][0]["phone"] == CONTACT["phone"]
    assert (await c.post(P + "/alerts", json=payload)).json()["id"] == data["id"]
    assert (await c.get(P + "/alerts")).json()["total"] == 1
    assert (await c.patch(P + "/alerts/" + data["id"] + "/resolve")).json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_all_owned_resources_deny_other_user(user):
    c, app, _ = user
    contact = (await c.post(P + "/contacts", json=CONTACT)).json()
    report = (await c.post(P + "/reports", json=REPORT)).json()
    share = (await c.post(P + "/location-shares", json=COORDS)).json()
    alert = (
        await c.post(
            P + "/alerts", json={"message": "Help", "idempotency_key": "owner-request-123"}
        )
    ).json()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as other:
        await other.post(
            P + "/auth/signup",
            json={
                "full_name": "Other Person",
                "email": "other@example.com",
                "password": "SecurePass912!",
            },
        )
        other.headers["X-CSRF-Token"] = other.cookies["csrf_token"]
        assert (await other.delete(P + "/contacts/" + contact["id"])).status_code == 404
        assert (await other.delete(P + "/reports/" + report["id"])).status_code == 404
        assert (await other.delete(P + "/location-shares/" + share["id"])).status_code == 404
        assert (await other.patch(P + "/alerts/" + alert["id"] + "/resolve")).status_code == 404
        assert (await other.get(P + "/contacts")).json()["total"] == 0
        assert (await other.get(P + "/admin/summary")).status_code == 403


@pytest.mark.asyncio
async def test_chat_real_adapter_boundary(user):
    c, app, _ = user
    app.state.features.generate_reply = AsyncMock(return_value="Move to a well-lit public place.")
    r = await c.post(
        P + "/chat/messages", json={"message": "Someone is following me", "language": "en"}
    )
    assert r.status_code == 201, r.text
    assert len((await c.get(P + "/chat/messages")).json()["items"]) == 2
    assert "well-lit" in r.json()["assistant"]["text"]
    assert (await c.delete(P + "/chat/messages")).status_code == 200
    assert (await c.get(P + "/chat/messages")).json()["total"] == 0


@pytest.mark.asyncio
async def test_missing_ai_and_mail_are_explicit(user):
    c, _, _ = user
    assert (
        await c.post(P + "/chat/messages", json={"message": "Hello", "language": "en"})
    ).status_code == 503
    assert (await c.post(P + "/auth/resend-verification")).status_code == 503
    a = (await c.post(P + "/auth/forgot-password", json={"email": "test@example.com"})).json()
    b = (await c.post(P + "/auth/forgot-password", json={"email": "unknown@example.com"})).json()
    assert a["error"]["message"] == b["error"]["message"]


@pytest.mark.asyncio
async def test_profile_and_change_password(user):
    c, _, _ = user
    assert (await c.patch(P + "/users/me", json={"full_name": "Changed Person"})).json()[
        "full_name"
    ] == "Changed Person"
    assert (await c.patch(P + "/users/me", json={"role": "admin"})).status_code == 422
    assert (
        await c.post(
            P + "/auth/change-password",
            json={"current_password": "wrong", "new_password": "NewPass912!"},
        )
    ).status_code == 400
    assert (
        await c.post(
            P + "/auth/change-password",
            json={"current_password": "SecurePass912!", "new_password": "NewPass912!"},
        )
    ).status_code == 200


def test_production_config_guards():
    from pydantic import ValidationError

    from backend.app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(app_env="production", secret_key="short", debug=True)
    with pytest.raises(ValidationError):
        Settings(app_env="production", secret_key="x" * 64, cors_origins="*")
