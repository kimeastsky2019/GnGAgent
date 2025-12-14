# Short-term Advanced: NestJS Gateway with Auth, GraphQL, Throttling, Redis Cache

This package upgrades the NestJS gateway to include:
- **JWT & API Key guards**
- **GraphQL** endpoint (alongside REST)
- **Rate limiting** via `@nestjs/throttler`
- **Caching** (Redis, `cache-manager` + `ioredis` store)
- **DTO validation** (class-validator/transformer)

> Assumes Python services (`services/*`) and `libs/common` are already present or copied from the base skeleton.
