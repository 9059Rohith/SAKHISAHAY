# MongoDB data model

All business documents use ObjectId `_id`, UTC created_at/updated_at and API string `id`. Referenced user_id separates unbounded private resources; each read/update/delete includes ownership. Deleted private content is permanently removed at the owner's request rather than retained invisibly.

| Collection | Fields in addition to timestamps | Indexes |
| --- | --- | --- |
| users | email:string required lowercase; full_name:string; password_hash:string; role:user/admin; is_active:bool; is_verified:bool; recovery_hash:string; failed_login_attempts:int; locked_until:date/null; auth_version:int | email unique |
| refresh_tokens | token_hash:string, user_id:string, family:string, auth_version:int, expires_at:date, revoked:bool | token_hash unique; expires_at TTL; user_id |
| password_resets | token_hash:string, user_id:string, purpose:reset/verify, expires_at:date, used:bool | token_hash unique; expires_at TTL; user_id |
| contacts | user_id:string,name:string,phone:string (10 digits),relationship:Family/Friend/Guardian/Other | user_id+phone unique; user_id+created_at |
| reports | user_id:string,title:string,category:string,description:string,incident_at:date,location:string,status:draft/recorded/closed,version:int | user_id+created_at; user_id+status+created_at; text title/description |
| chat_messages | user_id:string,role:user/assistant,text:string,language:en/kn | user_id+created_at |
| location_shares | user_id:string,token_hash:string,latitude:number,longitude:number,accuracy:number/null,expires_at:date,revoked:bool | token_hash unique; expires_at TTL; user_id |
| alerts | user_id:string,message:string,coordinates:bounded object/null,status:active/resolved,idempotency_key:string | user_id+idempotency_key unique; user_id+created_at |
| audit_logs | actor_id:string,action:string,resource:string,resource_id:string,metadata:bounded non-PII object | actor_id+created_at; created_at TTL (90 days) |
| rate_limits | key_hash:string, window:date,count:int,expires_at:date | key_hash unique; expires_at TTL |

No raw passwords, reset tokens, recovery codes, refresh tokens or share tokens are stored. Recovery codes are Argon2 hashes; random capabilities use SHA256. Money and uploads are outside the current application domain. Mongo single-document atomic updates protect refresh rotation, failed-login counters, rate limits and optimistic versions. Multi-document writes are ordered to fail safely; no transactions are required.

Example API contact: `{ "id":"507f1f77bcf86cd799439011", "name":"Trusted person", "phone":"9876543210", "relationship":"Family", "created_at":"2026-11-08T00:00:00Z", "updated_at":"2026-11-08T00:00:00Z" }`. Example report status is a private record status, never a police processing status.
