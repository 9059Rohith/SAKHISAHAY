import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from backend.app.core.config import Settings
from backend.app.main import create_app


@pytest.fixture
async def setup():
    db = AsyncMongoMockClient(tz_aware=True).test_sakhi
    settings = Settings(
        _env_file=None,
        app_env="test",
        secret_key="t" * 64,
        rate_limit_enabled=False,
        openai_api_key="",
        smtp_host="",
    )
    app = create_app(settings=settings, database=db)
    await app.state.repo.ensure_indexes()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        yield client, app


@pytest.fixture
async def user(setup):
    client, app = setup
    r = await client.post(
        "/api/v1/auth/signup",
        json={
            "full_name": "Test Person",
            "email": "test@example.com",
            "password": "SecurePass912!",
        },
    )
    assert r.status_code == 201, r.text
    client.headers["X-CSRF-Token"] = client.cookies["csrf_token"]
    return client, app, r.json()
