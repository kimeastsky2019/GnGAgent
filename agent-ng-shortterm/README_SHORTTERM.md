# Short-term Setup: NestJS Gateway (+ Python services)

This package adds a **NestJS gateway** that fronts the existing Python microservices (`dt`, `eop`, `forecast`, `monitoring`, `engagement`).
It replaces the previous FastAPI gateway for client access.

## Quick start
```bash
# build & run
docker compose up --build
# NestJS Gateway: http://localhost:8080/docs-json  (OpenAPI JSON)
# Health: http://localhost:8080/health
```

> Copy the `services/*` and `libs/common` from the previous skeleton into this repo root before running.
