# Deployment and updates

Live application: https://sakhisahay-9059.vercel.app
Source: https://github.com/9059Rohith/SAKHISAHAY
Vercel project: sakhisahay-9059, AJEYA's projects. Python 3.12, Node 24. Production uses the supplied Atlas connection and server-only OpenAI key stored as encrypted Vercel variables. Preview uses a separate sakhisahay_staging database.

## Local development

1. Clone the repository; create a Python 3.12 virtual environment.
2. Copy backend/.env.example to backend/.env and supply private values. Generate SECRET_KEY with secrets.token_hex(48).
3. Install `pip install -r backend/requirements-dev.txt` and `npm --prefix frontend ci`.
4. Run `python -m scripts.migrate` explicitly.
5. Start `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --no-access-log` and `npm --prefix frontend run dev`.
6. Open localhost:5173, register and save the one-time recovery code. Dev API documentation is /docs.

Docker alternative: copy the environment file, then `docker compose up --build`. Mongo is internal; the frontend is localhost:5173. For the production compose file, configure HTTPS at the external reverse proxy and explicit production hostname/origin variables before starting it. The container alternative uses Uvicorn's managed workers; Vercel uses its own Python function workers.

## Vercel release

Required encrypted variables are listed in backend/.env.example. Production requires APP_ENV=production, DEBUG=false, a random 64+ character SECRET_KEY, HTTPS FRONTEND_URL and explicit CORS_ORIGINS. ALLOWED_HOSTS must include the actual hostname. OPENAI_API_KEY and MONGODB_URI are never VITE variables.

Run quality checks, migrate production indexes, commit, push to main, then deploy that exact commit through the connected Vercel project or `vercel deploy --prod`. The repository's vercel.json defines both builders and all rewrites. Confirm deployment state READY and run `python -m scripts.healthcheck https://YOUR_HOST`. Test signup, contact persistence, AI, private share revocation, SOS and recovery against the actual deployment. Provision staging indexes before deploying preview.

GitHub rejected workflow publication because its local OAuth token lacks the workflow scope. Complete CI/CD definitions are preserved in docs/workflow-templates. To activate them, copy them to .github/workflows using a GitHub session/token with workflow permission. The CI OpenAI secret was configured encrypted. CD additionally requires VERCEL_TOKEN, VERCEL_ORG_ID and VERCEL_PROJECT_ID; configure a protected production GitHub Environment before enabling it. No green CI or automatic rollback claim is made without those runs.

## Rollback and troubleshooting

Use Vercel Deployments → select the previous verified deployment → Promote to Production. Run the health check and confirm its git SHA. Schema changes must remain backward compatible. Never restore a database automatically during a code rollback.

- Homepage 404 with API up: verify monorepo rewrites target /frontend/index.html and /frontend/assets.
- Function import failure: pyproject.toml must contain the Python dependencies; Vercel prioritizes it over requirements.txt.
- Readiness 503: check Atlas credentials, networking and service availability.
- Slow cold starts: run migrations separately; do not recreate all indexes per instance.
- AI unavailable: check the server key, accessible model and OpenAI billing/quota.
- Email unavailable: configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/EMAIL_FROM; test provider domain authentication.
