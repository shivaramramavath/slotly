# Slotly

Slotly is an academic timetable platform for schools and colleges that generates, validates, edits, versions, and publishes conflict-free academic schedules.

---

## 1. Monorepo Overview

This repository is structured as a `pnpm` workspace:

- **`client/`**: Next.js App Router (React 19, Tailwind CSS v4, `@xyflow/react`, Zustand, TanStack Query, `@dnd-kit/core`).
- **`server/`**: NestJS backend (Mongoose on MongoDB with Replica Set, Redis via ioredis, BullMQ queues, Socket.IO gateways, Joi configuration validation, Argon2).
- **`packages/contracts/`**: Shared Zod schemas, TypeScript DTOs, socket event constants, permission registries, and error reason codes.
- **`docs/`**: Complete architecture specifications, codemaps, route tables, and progress logs.
- **`scripts/`**: Automation scripts including `env:migrate` and codemap generators.

---

## 2. Prerequisites

- **Node.js**: v22+ (tested on Node v24)
- **pnpm**: v10+ (v12 supported)
- **Docker & Docker Compose**: Required for running MongoDB (with replica set `rs0` for multi-document ACID transactions) and Redis.

---

## 3. Environment Configuration

Server configuration is organized into 11 strictly typed namespaces loaded via NestJS `registerAs` and validated at bootstrap with Joi:

| Namespace | Key Variables | Description |
| :--- | :--- | :--- |
| **App** | `PORT`, `NODE_ENV`, `CLIENT_URL`, `CORS_ORIGINS` | Core HTTP/WebSocket listener settings |
| **Database** | `DATABASE_URL`, `DATABASE_TIMEOUT_MS`, `DATABASE_MAX_POOL_SIZE` | MongoDB connection URI (**Must support replica set `rs0`**) |
| **Redis** | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_TLS` | Redis client credentials and options |
| **JWT** | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | Token signing secrets (min 16 chars) and TTLs |
| **Session** | `SESSION_TTL`, `SESSION_MAX_LIFETIME`, `SESSION_COOKIE_*` | Redis session policies & cookie settings |
| **Auth** | `ARGON2_*`, `OTP_*`, `STEP_UP_WINDOW`, `THROTTLE_*` | Password hashing costs and rate limiting |
| **OAuth** | `OAUTH_CALLBACK_BASE_URL`, `GOOGLE_*`, `GITHUB_*` | Social authentication credentials |
| **Email** | `EMAIL_DRIVER`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Email driver (`log` or `brevo`) |
| **Cache** | `CACHE_DEFAULT_TTL`, `CACHE_*_TTL` | Cache-aside TTLs across entities |
| **Queue** | `QUEUE_PREFIX`, `QUEUE_ATTEMPTS`, `QUEUE_CONCURRENCY_*` | BullMQ worker settings |
| **Groq** | `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_MAX_TOKENS` | AI assistant LLM settings |

### Quickstart Setup

1. Copy the example configuration template:
   ```bash
   cp server/.env.example server/.env
   ```
2. Adjust `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` as needed.
3. If upgrading from legacy environment configurations, run the automated migration utility:
   ```bash
   pnpm env:migrate
   ```
   *(This tool maps legacy keys such as `MONGODB_URI` to `DATABASE_URL` and `JWT_ACCESS_EXPIRATION` to `JWT_ACCESS_EXPIRES_IN` without ever leaking secret values).*

---

## 4. Local Development

Start the backing databases (MongoDB replica set and Redis):
```bash
pnpm docker:up
```

Run both backend and frontend applications concurrently:
```bash
pnpm dev:apps
```
- Client application: `http://localhost:3000`
- Server application: `http://localhost:4000`

---

## 5. Testing & Verification

- **Typecheck**: `pnpm typecheck`
- **Lint**: `pnpm lint`
- **Unit & Integration Tests**: `pnpm test`
- **Build**: `pnpm build`
- **Code Map Generation & Check**:
  ```bash
  pnpm codemap
  pnpm codemap:check
  ```
