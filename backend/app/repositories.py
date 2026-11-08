import asyncio
import math
import re
import time
from datetime import timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument

from .core.exceptions import AppError
from .core.security import now, token_hash


def document(raw):
    if raw is None:
        return None
    return {"id": str(raw["_id"]), **{k: v for k, v in raw.items() if k != "_id"}}


def object_id(value):
    if not ObjectId.is_valid(value):
        raise AppError(404, "NOT_FOUND", "Record not found")
    return ObjectId(value)


class Repository:
    """The only application layer executing MongoDB queries."""

    def __init__(self, settings, database=None):
        self.client = None
        if database is None:
            self.client = AsyncIOMotorClient(
                settings.mongodb_uri,
                maxPoolSize=settings.mongodb_max_pool_size,
                minPoolSize=settings.mongodb_min_pool_size,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
                tz_aware=True,
            )
            database = self.client[settings.mongodb_db_name]
        self.db = database
        self.indexes_ready = False
        self.index_lock = asyncio.Lock()

    async def ping(self):
        await self.db.command("ping")

    async def ensure_indexes(self):
        async with self.index_lock:
            if self.indexes_ready:
                return
            await self.db.users.create_index("email", unique=True)
            await self.db.session_families.create_index("family", unique=True)
            await self.db.session_families.create_index("expires_at", expireAfterSeconds=0)
            await self.db.session_families.create_index("user_id")
            for name in ("refresh_tokens", "password_resets", "location_shares"):
                await self.db[name].create_index("token_hash", unique=True)
                await self.db[name].create_index("expires_at", expireAfterSeconds=0)
                await self.db[name].create_index("user_id")
            await self.db.refresh_tokens.create_index([("family", 1), ("revoked", 1)])
            for name in ("contacts", "reports", "chat_messages", "alerts"):
                await self.db[name].create_index([("user_id", 1), ("created_at", -1), ("_id", -1)])
            await self.db.contacts.create_index([("user_id", 1), ("phone", 1)], unique=True)
            await self.db.reports.create_index([("user_id", 1), ("status", 1), ("created_at", -1)])
            await self.db.reports.create_index([("title", "text"), ("description", "text")])
            await self.db.alerts.create_index([("user_id", 1), ("idempotency_key", 1)], unique=True)
            await self.db.audit_logs.create_index([("actor_id", 1), ("created_at", -1)])
            await self.db.audit_logs.create_index("created_at", expireAfterSeconds=90 * 86400)
            await self.db.rate_limits.create_index("expires_at", expireAfterSeconds=0)
            self.indexes_ready = True

    async def create(self, collection, data):
        stamp = now()
        raw = {**data, "created_at": stamp, "updated_at": stamp}
        result = await self.db[collection].insert_one(raw)
        raw["_id"] = result.inserted_id
        return document(raw)

    async def find(self, collection, query):
        return document(await self.db[collection].find_one(query))

    async def create_once(self, collection, key, values):
        stamp = now()
        raw = await self.db[collection].find_one_and_update(
            key,
            {"$setOnInsert": {**values, **key, "created_at": stamp, "updated_at": stamp}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return document(raw)

    async def get(self, collection, id, user_id=None):
        query = {"_id": object_id(id)}
        if user_id is not None:
            query["user_id"] = user_id
        return await self.find(collection, query)

    async def update(self, collection, id, values, user_id=None, version=None):
        query = {"_id": object_id(id)}
        if user_id is not None:
            query["user_id"] = user_id
        if version is not None:
            query["version"] = version
        return document(
            await self.db[collection].find_one_and_update(
                query,
                {"$set": {**values, "updated_at": now()}},
                return_document=ReturnDocument.AFTER,
            )
        )

    async def update_where(self, collection, query, values, increment=None):
        update = {"$set": {**values, "updated_at": now()}}
        if increment:
            update["$inc"] = increment
        return document(
            await self.db[collection].find_one_and_update(
                query, update, return_document=ReturnDocument.AFTER
            )
        )

    async def update_many(self, collection, query, values):
        await self.db[collection].update_many(query, {"$set": values})

    async def delete(self, collection, id, user_id):
        result = await self.db[collection].delete_one({"_id": object_id(id), "user_id": user_id})
        return result.deleted_count == 1

    async def delete_many(self, collection, query):
        return await self.db[collection].delete_many(query)

    async def count(self, collection, query=None):
        return await self.db[collection].count_documents(query or {})

    async def list(self, collection, user_id, page=1, page_size=20, q="", status=None):
        query = {"user_id": user_id}
        if q:
            fields = ["name", "phone"] if collection == "contacts" else ["title", "description"]
            query["$or"] = [{field: {"$regex": re.escape(q), "$options": "i"}} for field in fields]
        if status:
            query["status"] = status
        total = await self.count(collection, query)
        rows = (
            await self.db[collection]
            .find(query)
            .sort([("created_at", -1), ("_id", -1)])
            .skip((page - 1) * page_size)
            .limit(page_size)
            .to_list(page_size)
        )
        return {
            "items": [document(x) for x in rows],
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": math.ceil(total / page_size),
        }

    async def rate_limit(self, key, limit, seconds=60):
        window = int(time.time()) // seconds
        id = token_hash(f"{key}:{window}")
        raw = await self.db.rate_limits.find_one_and_update(
            {"_id": id},
            {
                "$inc": {"count": 1},
                "$setOnInsert": {"expires_at": now() + timedelta(seconds=seconds * 2)},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        if raw["count"] > limit:
            raise AppError(429, "RATE_LIMITED", "Too many requests. Please try again in a minute.")

    async def audit(self, actor_id, action, resource, resource_id=""):
        await self.create(
            "audit_logs",
            {
                "actor_id": actor_id,
                "action": action,
                "resource": resource,
                "resource_id": resource_id,
            },
        )
