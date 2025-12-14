# NanoGrid Agent (EOP × DT) — Monorepo Skeleton

This is a production-ready skeleton to implement your system across **Design → Plan → Monitor → Predict → Engage**,
built around **DT Core (`/dt`)** and **EOP Planner (`/eop`)**. Each service is a small FastAPI app with typed schemas,
dockerized, and wired through Kafka-ready envs.

## Services
- `dt` — Digital Twin (assets/topology/constraints)
- `eop` — Planning/Optimization (day-ahead & intra-day)
- `forecast` — Load/PV/price forecasting API
- `monitoring` — Telemetry ingest, KPIs
- `engagement` — Nudge cards & user actions
- `gateway` — API Gateway (FastAPI) aggregates above

## Quick start (local)
```bash
docker compose up --build
# Then visit: http://localhost:8080/docs (Gateway), and /health on each service.
```

## Deploy (Kubernetes)
See `infra/k8s/` for manifests (namespace, deployments, services, configmaps).

## CI
GitHub Actions runs lint & unit tests on PRs (`.github/workflows/ci.yml`).

---

> This is intentionally minimal: clean code, clear contracts, and room for your models.
