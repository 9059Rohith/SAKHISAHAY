"""Vercel ASGI entry point. Secrets are provided by the hosting environment."""

from backend.app.main import app

__all__ = ["app"]
