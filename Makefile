.PHONY: up down test lint seed logs backup
up:
	docker compose up --build -d
down:
	docker compose down
test:
	python -m pytest --cov=backend/app --cov-fail-under=85
	npm --prefix frontend test
lint:
	python -m ruff check backend
	python -m black --check backend api
	python -m mypy backend/app
	npm --prefix frontend run lint
	npm --prefix frontend run typecheck
seed:
	python -m scripts.seed
logs:
	docker compose logs -f --tail=100
backup:
	python -m scripts.backup backup --file private/backups/latest.json.gz
