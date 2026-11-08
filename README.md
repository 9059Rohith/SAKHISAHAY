# SakhiSahay

A personal safety companion built with React, FastAPI, MongoDB Atlas and server-side OpenAI.

**Live:** https://sakhisahay-9059.vercel.app

**Source:** https://github.com/9059Rohith/SAKHISAHAY

Six illustrated homepage sections, fourteen WebP images, independent parallax, word reveals, scrolling typography and responsive layouts. The original frontend framework is retained.

## Features

- Secure cookie accounts, rotating/revocable sessions, account lockout and one-time recovery codes.
- Persistent trusted-contact CRUD and private incident records with export.
- Real OpenAI safety guidance in English and Kannada, with saved/deletable history.
- Consent-based one-hour live location links, viewer updates and immediate revocation.
- Saved SOS alerts with native call/SMS/share actions and resolution history.
- Profile management, aggregate admin view and public safety resources.

SOS does not automatically dispatch responders or send SMS. The user confirms sending on their device. Incident records are personal records, not official complaints. Email verification and email recovery require an SMTP provider; saved recovery codes work independently.

## Run locally

Use Python 3.12 and Node 24. Create a virtual environment, copy backend/.env.example to backend/.env and supply private values, then run:

```sh
pip install -r backend/requirements-dev.txt
npm --prefix frontend ci
python -m scripts.migrate
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

In another terminal run `npm --prefix frontend run dev` and open localhost:5173. Register and save the recovery code. Alternatively use `docker compose up --build` after configuring the environment file.

## Verify

```sh
python -m pytest --cov=backend/app --cov-fail-under=85
python -m ruff check backend
python -m black --check backend api
python -m mypy backend/app
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix frontend run test:e2e
```

Playwright uses the real running backend; E2E_BASE_URL selects a public deployment. A configured OpenAI key is needed for its real-AI flow. Do not run synthetic tests in a database containing real sensitive data without understanding the test-created records.

## Deployment and operations

See [deployment](docs/DEPLOYMENT.md), [architecture](docs/ARCHITECTURE.md), [API contract](docs/API_CONTRACT.md), [OpenAPI](docs/openapi.json), [Postman](docs/postman.json), [security](docs/SECURITY.md), [runbook](docs/RUNBOOK.md) and [delivery report](docs/FINAL_REPORT.md).

Production credentials are encrypted hosting variables. Never put secrets into VITE variables or commit environment files. Run migrations before deployment; production startup does not recreate every index on each serverless instance. Read the delivery report for unprovisioned external services and checks not claimed complete.

Original frontend: Bhavanakn-06/SAKHISAHAY. Generated illustrations follow the user-supplied visual reference. No new license grant is inferred for original material.
