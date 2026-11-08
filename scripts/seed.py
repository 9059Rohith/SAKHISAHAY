"""Provision an administrator from private environment values; never seed sample records."""
import argparse
import asyncio

from backend.app.core.config import Settings
from backend.app.repositories import Repository
from backend.app.schemas import Signup
from backend.app.services.auth import AuthService


async def main(force):
    settings = Settings()
    if settings.app_env == "production" and not force:
        raise SystemExit("Production seeding requires --force")
    if not settings.first_admin_email or not settings.first_admin_password:
        raise SystemExit("Set FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD privately")
    repo = Repository(settings)
    try:
        await repo.ensure_indexes()
        email = settings.first_admin_email.lower()
        existing = await repo.find("users", {"email": email})
        if existing:
            if existing.get("role") != "admin":
                raise SystemExit("Existing account is not admin; refusing to elevate it implicitly")
            print("Administrator already provisioned")
            return
        user, recovery = await AuthService(repo, settings).signup(Signup(full_name="SakhiSahay Administrator", email=email, password=settings.first_admin_password))
        await repo.update("users", user["id"], {"role": "admin"})
        print("Administrator provisioned. Save this one-time recovery code securely:")
        print(recovery)
    finally:
        repo.client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    asyncio.run(main(parser.parse_args().force))
