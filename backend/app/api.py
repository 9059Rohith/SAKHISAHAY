from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Request, Response

from . import schemas as s
from .core.exceptions import AppError
from .core.security import verify_password

router = APIRouter()


async def current_user(request: Request):
    return await request.app.state.auth.current_user(request.cookies.get("access_token"))


User = Annotated[dict, Depends(current_user)]
PageNumber = Annotated[int, Query(ge=1, le=100000)]
PageSize = Annotated[int, Query(ge=1, le=100)]
Search = Annotated[str, Query(max_length=100)]


def require_role(role):
    async def dependency(user: User):
        if user["role"] != role:
            raise AppError(403, "FORBIDDEN", "You do not have access to this area")
        return user

    return dependency


def set_session(response, tokens, settings):
    access, refresh, csrf = tokens
    options = {"secure": settings.secure_cookies, "samesite": "lax", "path": "/"}
    response.set_cookie(
        "access_token",
        access,
        httponly=True,
        max_age=settings.access_token_expire_minutes * 60,
        **options,
    )
    response.set_cookie(
        "refresh_token",
        refresh,
        httponly=True,
        max_age=settings.refresh_token_expire_days * 86400,
        **options,
    )
    response.set_cookie(
        "csrf_token",
        csrf,
        httponly=False,
        max_age=settings.refresh_token_expire_days * 86400,
        **options,
    )


@router.post("/auth/signup", response_model=s.SessionOut, status_code=201, tags=["Accounts"])
async def signup(data: s.Signup, request: Request, response: Response):
    user, recovery = await request.app.state.auth.signup(data)
    set_session(response, await request.app.state.auth.session(user), request.app.state.settings)
    return {"user": user, "recovery_code": recovery}


@router.post("/auth/login", response_model=s.SessionOut, tags=["Accounts"])
async def login(data: s.Login, request: Request, response: Response):
    user = await request.app.state.auth.login(data)
    set_session(response, await request.app.state.auth.session(user), request.app.state.settings)
    return {"user": user}


@router.get("/auth/me", response_model=s.UserOut, tags=["Accounts"])
async def me(user: User):
    return user


@router.post("/auth/refresh", response_model=s.SessionOut, tags=["Accounts"])
async def refresh(request: Request, response: Response):
    user, tokens = await request.app.state.auth.refresh(request.cookies.get("refresh_token"))
    set_session(response, tokens, request.app.state.settings)
    return {"user": user}


@router.post("/auth/logout", response_model=s.Message, tags=["Accounts"])
async def logout(request: Request, response: Response):
    await request.app.state.auth.logout(request.cookies.get("refresh_token"))
    for name in ("access_token", "refresh_token", "csrf_token"):
        response.delete_cookie(
            name, path="/", secure=request.app.state.settings.secure_cookies, samesite="lax"
        )
    return {"message": "Signed out"}


@router.post("/auth/forgot-password", response_model=s.Message, tags=["Accounts"])
async def forgot_password(data: s.EmailInput, request: Request):
    await request.app.state.auth.forgot(data.email)
    return {
        "message": "If that address is registered and email delivery is configured, a recovery link will be sent. You can also use your saved recovery code."
    }


@router.post("/auth/reset-password", response_model=s.Message, tags=["Accounts"])
async def reset_password(data: s.Reset, request: Request):
    await request.app.state.auth.reset(data)
    return {
        "message": "Password reset. Sign in with your new password. Your recovery code has been consumed if you used it."
    }


@router.post("/auth/change-password", response_model=s.Message, tags=["Accounts"])
async def change_password(data: s.ChangePassword, request: Request, user: User):
    if not verify_password(data.current_password, user["password_hash"]):
        raise AppError(400, "INVALID_PASSWORD", "Your current password is incorrect")
    await request.app.state.auth.change_secret(user, data.new_password)
    await request.app.state.repo.audit(user["id"], "password_changed", "users")
    return {"message": "Password changed. Please sign in again on all devices."}


@router.post("/auth/resend-verification", response_model=s.Message, tags=["Accounts"])
async def resend_verification(request: Request, user: User):
    await request.app.state.auth.email_token(user, "verify")
    return {"message": "Verification link sent. Check your email."}


@router.post("/auth/verify-email", response_model=s.Message, tags=["Accounts"])
async def verify_email(data: s.Verify, request: Request):
    await request.app.state.auth.verify_email(data.token)
    return {"message": "Email verified"}


@router.patch("/users/me", response_model=s.UserOut, tags=["Accounts"])
async def profile(data: s.Profile, request: Request, user: User):
    return await request.app.state.repo.update("users", user["id"], data.model_dump())


@router.get("/contacts", response_model=s.Page[s.ContactOut], tags=["Contacts"])
async def contacts(
    request: Request, user: User, page: PageNumber = 1, page_size: PageSize = 20, q: Search = ""
):
    return await request.app.state.repo.list("contacts", user["id"], page, page_size, q)


@router.post("/contacts", response_model=s.ContactOut, status_code=201, tags=["Contacts"])
async def create_contact(data: s.ContactIn, request: Request, user: User):
    return await request.app.state.features.create("contacts", user["id"], data)


@router.patch("/contacts/{id}", response_model=s.ContactOut, tags=["Contacts"])
async def update_contact(id: str, data: s.ContactIn, request: Request, user: User):
    return await request.app.state.features.update("contacts", id, user["id"], data)


@router.delete("/contacts/{id}", response_model=s.Message, tags=["Contacts"])
async def delete_contact(id: str, request: Request, user: User):
    return await request.app.state.features.delete("contacts", id, user["id"])


@router.get("/reports", response_model=s.Page[s.ReportOut], tags=["Private incidents"])
async def reports(
    request: Request,
    user: User,
    page: PageNumber = 1,
    page_size: PageSize = 20,
    q: Search = "",
    status: Literal["draft", "recorded", "closed"] | None = None,
):
    return await request.app.state.repo.list("reports", user["id"], page, page_size, q, status)


@router.post("/reports", response_model=s.ReportOut, status_code=201, tags=["Private incidents"])
async def create_report(data: s.ReportIn, request: Request, user: User):
    return await request.app.state.features.create("reports", user["id"], data)


@router.patch("/reports/{id}", response_model=s.ReportOut, tags=["Private incidents"])
async def update_report(id: str, data: s.ReportUpdate, request: Request, user: User):
    return await request.app.state.features.update("reports", id, user["id"], data)


@router.delete("/reports/{id}", response_model=s.Message, tags=["Private incidents"])
async def delete_report(id: str, request: Request, user: User):
    return await request.app.state.features.delete("reports", id, user["id"])


@router.get(
    "/location-shares",
    response_model=s.Page[s.ShareOut],
    response_model_exclude_none=True,
    tags=["Location"],
)
async def list_shares(request: Request, user: User, page: PageNumber = 1, page_size: PageSize = 20):
    return await request.app.state.repo.list("location_shares", user["id"], page, page_size)


@router.post(
    "/location-shares",
    response_model=s.ShareOut,
    response_model_exclude_none=True,
    status_code=201,
    tags=["Location"],
)
async def new_share(data: s.Coordinates, request: Request, user: User):
    return await request.app.state.features.new_share(user["id"], data)


@router.patch("/location-shares/{id}", response_model=s.ShareOut, tags=["Location"])
async def update_share(id: str, data: s.Coordinates, request: Request, user: User):
    return await request.app.state.features.update_share(id, user["id"], data)


@router.delete("/location-shares/{id}", response_model=s.Message, tags=["Location"])
async def revoke_share(id: str, request: Request, user: User):
    return await request.app.state.features.revoke_share(id, user["id"])


@router.get("/location-shares/public/{token}", response_model=s.PublicShare, tags=["Location"])
async def public_share(token: str, request: Request):
    return await request.app.state.features.public_share(token)


@router.get("/chat/messages", response_model=s.Page[s.ChatOut], tags=["AI chat"])
async def chat_history(
    request: Request, user: User, page: PageNumber = 1, page_size: PageSize = 100
):
    return await request.app.state.repo.list("chat_messages", user["id"], page, page_size)


@router.post("/chat/messages", response_model=s.ChatPair, status_code=201, tags=["AI chat"])
async def chat(data: s.ChatIn, request: Request, user: User):
    if request.app.state.settings.rate_limit_enabled:
        await request.app.state.repo.rate_limit("chat:" + user["id"], 10)
        await request.app.state.repo.rate_limit("chat-daily:" + user["id"], 100, 86400)
    return await request.app.state.features.chat(user["id"], data)


@router.delete("/chat/messages", response_model=s.Message, tags=["AI chat"])
async def clear_chat(request: Request, user: User):
    await request.app.state.repo.delete_many("chat_messages", {"user_id": user["id"]})
    return {"message": "Chat history deleted"}


@router.get("/alerts", response_model=s.Page[s.AlertOut], tags=["SOS"])
async def alerts(request: Request, user: User, page: PageNumber = 1, page_size: PageSize = 20):
    return await request.app.state.repo.list("alerts", user["id"], page, page_size)


@router.post("/alerts", response_model=s.AlertOut, status_code=201, tags=["SOS"])
async def create_alert(data: s.AlertIn, request: Request, user: User):
    return await request.app.state.features.alert(user["id"], data)


@router.patch("/alerts/{id}/resolve", response_model=s.AlertOut, tags=["SOS"])
async def resolve_alert(id: str, request: Request, user: User):
    return await request.app.state.features.resolve(user["id"], id)


@router.get("/admin/summary", response_model=s.AdminSummary, tags=["Administration"])
async def summary(request: Request, user: Annotated[dict, Depends(require_role("admin"))]):
    return {
        name: await request.app.state.repo.count(name)
        for name in ("users", "contacts", "reports", "alerts")
    }
