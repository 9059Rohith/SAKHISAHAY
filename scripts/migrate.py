"""Apply idempotent schema/index migrations. Run explicitly before promotion."""
import asyncio

from backend.app.core.config import Settings
from backend.app.repositories import Repository


async def main():
    repo = Repository(Settings())
    try:
        await repo.ping()
        await repo.ensure_indexes()
        await repo.create_once("migrations", {"version": 1}, {"description": "Safety collections and durable session family revocation"})
        print("Schema version 1 indexes are ready")
    finally:
        repo.client.close()


if __name__ == "__main__":
    asyncio.run(main())
