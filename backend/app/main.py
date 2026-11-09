import json
import logging
import secrets
import time
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError, PyMongoError
from starlette.exceptions import HTTPException

from . import schemas as s
from .api import router
from .core.config import Settings
from .core.exceptions import AppError
from .repositories import Repository
from .services.auth import AuthService
from .services.features import FeatureService

logger = logging.getLogger("sakhisahay")
logging.basicConfig(level=logging.INFO, format="%(message)s")


def error_response(request, status, code, message, details=None):
    return JSONResponse(
        status_code=status,
        headers=(
            {"Retry-After": "900" if code == "ACCOUNT_LOCKED" else "60"} if status == 429 else None
        ),
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or [],
                "request_id": getattr(request.state, "request_id", ""),
            }
        },
    )


def create_app(settings=None, database=None):
    """Construct the API; test databases can be injected without production fallbacks."""
    settings = settings or Settings()
    repo = Repository(settings, database)
    # Production indexes are provisioned by scripts.migrate before deployment.
    # Reissuing every DDL command on every serverless cold start adds seconds.
    if settings.app_env == "production":
        repo.indexes_ready = True

    @asynccontextmanager
    async def lifespan(app):
        try:
            await repo.ping()
            await repo.ensure_indexes()
        except PyMongoError:
            logger.error(json.dumps({"event": "database_unavailable_at_startup"}))
        yield
        if repo.client:
            repo.client.close()

    production = settings.app_env == "production"
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None if production else "/docs",
        redoc_url=None,
        openapi_url=None if production else "/openapi.json",
    )
    app.state.settings = settings
    app.state.repo = repo
    app.state.auth = AuthService(repo, settings)
    app.state.features = FeatureService(repo, settings)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-ID"],
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts.split(","))

    @app.exception_handler(AppError)
    async def app_error(request, exc):
        return error_response(request, exc.status, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        details = [
            {"field": ".".join(str(v) for v in e["loc"]), "message": e["msg"]} for e in exc.errors()
        ]
        return error_response(
            request, 422, "VALIDATION_ERROR", "Check the highlighted fields and try again", details
        )

    @app.exception_handler(DuplicateKeyError)
    async def conflict(request, exc):
        return error_response(
            request,
            409,
            "DUPLICATE",
            (
                "An account already exists for this email address. Sign in instead."
                if request.url.path.endswith("/auth/signup")
                else "This email, phone number or request already exists"
            ),
        )

    @app.exception_handler(PyMongoError)
    async def database_error(request, exc):
        return error_response(
            request,
            503,
            "DATABASE_UNAVAILABLE",
            "The database is temporarily unavailable. Please try again shortly.",
        )

    @app.exception_handler(HTTPException)
    async def http_error(request, exc):
        return error_response(
            request,
            exc.status_code,
            "HTTP_ERROR",
            "Request not found" if exc.status_code == 404 else "Request could not be completed",
        )

    @app.middleware("http")
    async def controls(request: Request, call_next):
        started = time.perf_counter()
        supplied_id = request.headers.get("x-request-id", "")
        request.state.request_id = (
            supplied_id
            if supplied_id
            and len(supplied_id) <= 80
            and all(c.isalnum() or c in "-_" for c in supplied_id)
            else uuid4().hex
        )
        response = None
        try:
            if request.method not in ("GET", "HEAD", "OPTIONS"):
                origin = request.headers.get("origin")
                same_origin = str(request.base_url).rstrip("/")
                if origin and origin not in settings.origins and origin != same_origin:
                    raise AppError(403, "INVALID_ORIGIN", "This origin is not allowed")
                exempt = (
                    "/auth/signup",
                    "/auth/login",
                    "/auth/forgot-password",
                    "/auth/reset-password",
                    "/auth/verify-email",
                )
                if not any(request.url.path.endswith(x) for x in exempt):
                    cookie = request.cookies.get("csrf_token", "")
                    header = request.headers.get("x-csrf-token", "")
                    if not cookie or not header or not secrets.compare_digest(cookie, header):
                        # Anonymous mutations get 401; authenticated cookie requests require CSRF.
                        if request.cookies.get("access_token") or request.cookies.get(
                            "refresh_token"
                        ):
                            raise AppError(
                                403,
                                "CSRF_INVALID",
                                "Your security token expired. Reload the page and try again.",
                            )
                        raise AppError(401, "UNAUTHENTICATED", "Please sign in to continue")
                if len(await request.body()) > 65536:
                    raise AppError(413, "BODY_TOO_LARGE", "Request body is too large")
            if request.url.path.startswith(settings.api_v1_prefix):
                await repo.ensure_indexes()
                if settings.rate_limit_enabled and request.method != "OPTIONS":
                    ip = request.client.host if request.client else "unknown"
                    auth_action = next(
                        (
                            x.rsplit("/", 1)[-1]
                            for x in (
                                "/auth/login",
                                "/auth/signup",
                                "/auth/forgot-password",
                                "/auth/reset-password",
                                "/auth/resend-verification",
                            )
                            if request.url.path.endswith(x)
                        ),
                        None,
                    )
                    await repo.rate_limit(
                        f"auth:{auth_action}:{ip}" if auth_action else "api:" + ip,
                        5 if auth_action else 120,
                    )
            response = await call_next(request)
        except AppError as exc:
            response = error_response(request, exc.status, exc.code, exc.message)
        except PyMongoError:
            response = error_response(
                request,
                503,
                "DATABASE_UNAVAILABLE",
                "The database is temporarily unavailable. Please try again shortly.",
            )
        except Exception as exc:  # noqa: BLE001
            logger.error(
                json.dumps(
                    {
                        "event": "request_failed",
                        "request_id": request.state.request_id,
                        "type": type(exc).__name__,
                    }
                )
            )
            response = error_response(
                request, 500, "INTERNAL_ERROR", "Something went wrong. Please try again."
            )
        response.headers.update(
            {
                "X-Request-ID": request.state.request_id,
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Referrer-Policy": "no-referrer",
                "Permissions-Policy": "geolocation=(self), camera=(), microphone=()",
                "Cache-Control": "no-store",
                "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
            }
        )
        if production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        route = request.scope.get("route")
        logger.info(
            json.dumps(
                {
                    "event": "request",
                    "request_id": request.state.request_id,
                    "method": request.method,
                    "path": getattr(route, "path", "/unmatched"),
                    "status": response.status_code,
                    "latency_ms": round((time.perf_counter() - started) * 1000, 2),
                }
            )
        )
        return response

    @app.get("/health", response_model=s.Health, tags=["Operations"])
    async def health():
        return {"status": "ok"}

    @app.get("/ready", response_model=s.Health, tags=["Operations"])
    async def ready():
        await repo.ping()
        return {"status": "ready"}

    @app.get("/version", response_model=s.Version, tags=["Operations"])
    async def version():
        return {"version": "1.0.0", "git_sha": settings.git_sha, "build_time": settings.build_time}

    app.include_router(router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
