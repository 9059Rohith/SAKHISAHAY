# Architecture

React 19 / Vite 8 / React Router 7 serves the existing JSX application. FastAPI on Python 3.12 serves /api/v1 on the same origin. MongoDB Atlas persists accounts, durable session families, hashed rotating refresh tokens, contacts, reports, chat messages, expiring location shares, alerts, audit logs and shared rate limits. The Python server alone calls OpenAI. All Mongo queries are centralized in repositories.py; services hold account and feature behavior; api.py validates HTTP and serializes explicit response schemas.

Authentication: signup/login → Argon2 password verification → short-lived signed access cookie + random hashed refresh token → CSRF-protected mutations. Access checks the active user and durable session family. Refresh atomically claims a token. Replay revokes the durable family before its tokens, preventing a pending issuance from resurrecting access. Web Locks coordinate browser tabs; an in-flight promise coordinates requests within a tab. Password reset invalidates every session. Roles and ownership are checked on the server; the UI also guards protected screens.

Live sharing: explicit browser consent → create one-hour random capability → watchPosition updates at most every ten seconds → viewer polls every ten seconds. Only the hash is stored. Stop revokes immediately; closing a sender tab stops updates but the last position remains until expiry/revocation. Interrupted creation cannot leave an orphan position watcher.

SOS stores an idempotent alert and exposes native call/SMS/share controls. It does not dispatch responders. Incident records are private records, not official complaints. AI is an information assistant; failures produce explicit errors rather than canned replacement answers.

Vercel serves frontend build output under the monorepo prefix and rewrites public asset/SPA paths to it. A Python function serves API/operations routes. Docker/nginx is an alternative. Explicit migrations provision production indexes before deployment; production cold starts do not repeat index DDL.
