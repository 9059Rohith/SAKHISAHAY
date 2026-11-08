# SAKHISAHAY full-stack implementation plan

> Execute inline with superpowers:executing-plans. User opted out of questions. Specification: attached master prompt; audit and assumptions in docs/.

**Goal:** Complete the existing safety application with real persistent private data, secure accounts, OpenAI chat and an actually verified deployment.

**Architecture:** Preserve React/Vite UI. FastAPI routers validate HTTP, services implement behavior, repositories own all Mongo queries. Same-origin secure cookies avoid exposing tokens to JavaScript. Mongo Atlas stores private owner-scoped records. Vercel serves static assets and the Python API.

**Constraints:** Never commit credentials; no fabricated emergency delivery, AI responses, tests or infrastructure claims. Python 3.12. Keep changes in a new clone/feature branch and publish to a new 9059Rohith repository.

**Review focus:** IDOR on every resource, concurrent refresh rotation, database outage handling, absent geolocation permission, provider quota/network failures.

- [ ] Task 1 — Audit documents and isolated branch. Verify every existing route and form; commit docs.
- [ ] Task 2 — Add test suite before application implementation: signup/login/refresh/reuse/logout/CSRF, contacts/reports CRUD ownership, locations expiry/revocation, AI failure/persistence, alerts idempotency, admin denial. Observe failing suite.
- [ ] Task 3 — Implement config/security/db indexes/repositories/services/FastAPI and email adapter. Pin installed dependencies, run security and integration tests; exercise actual Atlas and OpenAI without logging secrets.
- [ ] Task 4 — Add central API client/provider/protected routes and integrate all existing pages. Add profile/recovery/share viewer/admin; real loading/error states and confirm destructive actions.
- [ ] Task 5 — Run frontend build/lint/unit checks and Playwright real browser desktop/mobile workflows. Fix regressions and repeat affected tests.
- [ ] Task 6 — Add containers, compose/nginx, CI/CD, backup/migration/health scripts, API export and operating docs. Run available checks and explicitly list any unavailable external infrastructure.
- [ ] Task 7 — Create new GitHub repo, publish sanitized commits, configure encrypted Vercel environment, deploy preview/production, inspect build logs and verify public live API, account, persistence and AI. Record exact evidence, URLs and remaining limitations.
