from datetime import timedelta

import httpx

from ..core.exceptions import AppError
from ..core.security import now, random_token, token_hash


class FeatureService:
    """Owner-scoped safety records and external AI adapter."""

    def __init__(self, repo, settings):
        self.repo = repo
        self.settings = settings

    async def create(self, collection, user_id, data):
        values = data.model_dump()
        if collection == "reports":
            values.update(status="recorded", version=1)
        result = await self.repo.create(collection, {**values, "user_id": user_id})
        await self.repo.audit(user_id, "create", collection, result["id"])
        return result

    async def update(self, collection, id, user_id, data):
        values = data.model_dump()
        version = values.pop("version", None)
        if version is not None:
            values["version"] = version + 1
        result = await self.repo.update(collection, id, values, user_id, version)
        if not result:
            existing = await self.repo.get(collection, id, user_id)
            if existing and version is not None:
                raise AppError(
                    409, "VERSION_CONFLICT", "This record changed. Reload it before saving."
                )
            raise AppError(404, "NOT_FOUND", "Record not found")
        await self.repo.audit(user_id, "update", collection, id)
        return result

    async def delete(self, collection, id, user_id):
        if not await self.repo.delete(collection, id, user_id):
            raise AppError(404, "NOT_FOUND", "Record not found")
        await self.repo.audit(user_id, "delete", collection, id)
        return {"message": "Record deleted"}

    async def new_share(self, user_id, data):
        token = random_token()
        result = await self.repo.create(
            "location_shares",
            {
                **data.model_dump(),
                "user_id": user_id,
                "token_hash": token_hash(token),
                "expires_at": now() + timedelta(hours=1),
                "revoked": False,
            },
        )
        return {**result, "token": token}

    async def update_share(self, id, user_id, data):
        share = await self.repo.get("location_shares", id, user_id)
        if not share or share["revoked"] or share["expires_at"] <= now():
            raise AppError(404, "SHARE_EXPIRED", "Sharing has stopped or expired")
        return await self.repo.update("location_shares", id, data.model_dump(), user_id)

    async def revoke_share(self, id, user_id):
        if not await self.repo.update("location_shares", id, {"revoked": True}, user_id):
            raise AppError(404, "NOT_FOUND", "Share not found")
        return {"message": "Location sharing stopped. The link no longer works."}

    async def public_share(self, token):
        if len(token) > 100:
            raise AppError(404, "NOT_FOUND", "Share not found or expired")
        share = await self.repo.find(
            "location_shares",
            {"token_hash": token_hash(token), "revoked": False, "expires_at": {"$gt": now()}},
        )
        if not share:
            raise AppError(404, "NOT_FOUND", "Share not found, stopped or expired")
        return share

    async def alert(self, user_id, data):
        result = await self.repo.create_once(
            "alerts",
            {"user_id": user_id, "idempotency_key": data.idempotency_key},
            {**data.model_dump(), "status": "active"},
        )
        contacts = await self.repo.list("contacts", user_id, page_size=100)
        await self.repo.audit(user_id, "sos_saved", "alerts", result["id"])
        return {**result, "contacts": contacts["items"]}

    async def resolve(self, user_id, id):
        result = await self.repo.update("alerts", id, {"status": "resolved"}, user_id)
        if not result:
            raise AppError(404, "NOT_FOUND", "Alert not found")
        return result

    async def generate_reply(self, message, language, history):
        if not self.settings.openai_api_key:
            raise AppError(
                503,
                "AI_UNAVAILABLE",
                "The AI assistant is not configured. You can still use contacts, reports and SOS.",
            )
        system = (
            "You are SAKHISAHAY, a calm, supportive safety information assistant for women in India. "
            "Give brief, practical, nonjudgmental guidance. In immediate danger suggest calling 112 and moving to a safer public place if possible. "
            "Never claim you contacted anyone, tracked location, filed a police report or dispatched assistance. "
            "Do not provide definitive legal or medical advice. Encourage professional support when appropriate. "
            "Do not ask for precise location, passwords or identifying information. "
            + ("Respond in Kannada." if language == "kn" else "Respond in English.")
        )
        messages = [{"role": "system", "content": system}]
        messages.extend({"role": m["role"], "content": m["text"]} for m in reversed(history))
        messages.append({"role": "user", "content": message})
        try:
            async with httpx.AsyncClient(timeout=35) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": "Bearer " + self.settings.openai_api_key},
                    json={
                        "model": self.settings.openai_model,
                        "messages": messages,
                        "max_completion_tokens": 650,
                        "store": False,
                    },
                )
            if response.status_code != 200:
                raise AppError(
                    503,
                    "AI_UNAVAILABLE",
                    "The AI provider is unavailable or its billing limit was reached. Please try again later.",
                )
            text = response.json()["choices"][0]["message"]["content"]
            if not text:
                raise ValueError("empty AI content")
            return text
        except (httpx.HTTPError, KeyError, IndexError, ValueError):
            raise AppError(
                503, "AI_UNAVAILABLE", "The AI assistant could not respond. Please try again."
            ) from None

    async def chat(self, user_id, data):
        history = await self.repo.list("chat_messages", user_id, page_size=12)
        reply = await self.generate_reply(data.message, data.language, history["items"])
        user_message = await self.repo.create(
            "chat_messages",
            {"user_id": user_id, "role": "user", "text": data.message, "language": data.language},
        )
        assistant_message = await self.repo.create(
            "chat_messages",
            {"user_id": user_id, "role": "assistant", "text": reply, "language": data.language},
        )
        return {"user": user_message, "assistant": assistant_message}
