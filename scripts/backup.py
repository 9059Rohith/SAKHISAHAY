"""Portable BSON-preserving logical backup/restore. Restore refuses nonempty targets."""
import argparse
import asyncio
import gzip
from pathlib import Path

from bson import json_util
from motor.motor_asyncio import AsyncIOMotorClient

from backend.app.core.config import Settings


async def main(args):
    settings = Settings()
    client = AsyncIOMotorClient(settings.mongodb_uri, tz_aware=True)
    try:
        if args.action == "backup":
            db = client[args.database or settings.mongodb_db_name]
            snapshot = {name: await db[name].find({}).to_list(None) for name in await db.list_collection_names() if not name.startswith("system.")}
            path = Path(args.file)
            path.parent.mkdir(parents=True, exist_ok=True)
            with gzip.open(path, "wt", encoding="utf-8") as out:
                out.write(json_util.dumps(snapshot))
            print(f"Backed up {len(snapshot)} collections. Keep this file private and encrypted at rest.")
        else:
            if not args.database or not args.confirm_restore:
                raise SystemExit("Restore requires --database NEW_EMPTY_DATABASE --confirm-restore")
            db = client[args.database]
            if await db.list_collection_names():
                raise SystemExit("Restore target is not empty; refusing to overwrite data")
            with gzip.open(args.file, "rt", encoding="utf-8") as source:
                snapshot = json_util.loads(source.read())
            for name, rows in snapshot.items():
                if rows:
                    await db[name].insert_many(rows)
            print(f"Restored {sum(len(rows) for rows in snapshot.values())} documents into empty database {args.database}")
    finally:
        client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["backup", "restore"])
    parser.add_argument("--file", required=True)
    parser.add_argument("--database")
    parser.add_argument("--confirm-restore", action="store_true")
    asyncio.run(main(parser.parse_args()))
