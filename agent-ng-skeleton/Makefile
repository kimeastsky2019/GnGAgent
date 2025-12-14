.PHONY: format lint test up down

format:
	rufflehog --version >/dev/null 2>&1 || true
	python -m pip install -U black isort
	black services libs gateway
	isort services libs gateway

lint:
	python -m pip install -U ruff mypy
	ruff check services libs gateway
	mypy services libs gateway --ignore-missing-imports

test:
	pytest -q

up:
	docker compose up --build -d

down:
	docker compose down
