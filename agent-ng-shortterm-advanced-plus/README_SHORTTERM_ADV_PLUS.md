# Advanced-Plus Addon (drop-in for gateway-nest)

Adds:
- **Role-based Guard** (`@Roles('admin','viewer')`) + `RolesGuard`
- **Redis token blacklist + logout** (`POST /auth/logout`) and token check
- **Cache policy**: body-hash keys for forecast; `/probe` short TTL
- **GraphQL**: `planOptimize` mutation, `Nudge` type with create/confirm
- **Observability**: OpenTelemetry init (OTLP gRPC), Prometheus `/metrics`, request/response logging
- **K8s**: Namespace, Secrets, ConfigMap, Deployment, Service, HPA for gateway & Redis

> Copy `gateway-nest/*` and `infra/k8s/*` into your repo, replacing existing ones from the advanced package.
