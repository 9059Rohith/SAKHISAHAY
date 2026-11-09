P = "/api/v1"


async def test_login_retries_do_not_block_a_new_registration(setup):
    client, app = setup
    app.state.settings.rate_limit_enabled = True
    for _ in range(5):
        response = await client.post(
            P + "/auth/login", json={"email": "missing@example.com", "password": "incorrect"}
        )
        assert response.status_code == 401
    response = await client.post(
        P + "/auth/signup",
        json={
            "email": "fresh-account@example.com",
            "full_name": "Fresh Account",
            "password": "SecurePass912!",
        },
    )
    assert response.status_code == 201


async def test_signup_limit_still_applies_and_includes_retry_guidance(setup):
    client, app = setup
    app.state.settings.rate_limit_enabled = True
    for _ in range(5):
        assert (await client.post(P + "/auth/signup", json={})).status_code == 422
    response = await client.post(P + "/auth/signup", json={})
    assert response.status_code == 429
    assert 1 <= int(response.headers["Retry-After"]) <= 60
