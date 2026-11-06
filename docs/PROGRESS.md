# Slotly Development Progress

## Phase 0: Scaffolding, Monorepo Setup, Planning & Architecture

### What Was Built
1. **Repository & Workspace Structure:**
   - Initialized a `pnpm` monorepo containing `client` (Next.js 16 App Router, TypeScript, Tailwind v4), `server` (NestJS 11, TypeScript), and `packages/contracts` (TypeScript package built with `tsup`).
   - Root workspace file `pnpm-workspace.yaml` with dependency approvals for native build scripts.
2. **Contracts Library (`@slotly/contracts`):**
   - Implemented foundational Zod schemas and TypeScript types:
     - Reason codes: `PARENT_MISSING`, `PARENT_INCOMPLETE`, `PARENT_TYPE_NOT_ALLOWED`, `DUPLICATE_NAME`, `CAPACITY_EXCEEDED`, `CYCLE`, `ENDPOINT_INCOMPLETE`, `NOT_QUALIFIED`, `PROJECT_LOCKED`, `PERMISSION_DENIED`.
     - Hierarchy types and node statuses (`empty`, `incomplete`, `complete`, `blocked`).
     - Fix hint and gate failure schemas.
     - User roles (`SUPER_ADMIN`, `ADMIN`, `DESIGNER`, `FACULTY`, `STUDENT`).
     - Project lifecycle statuses (`draft`, `building`, `ready`, `pending_approval`, `published`, `archived`).
     - Socket event constant definitions according to `docs/ROUTES.md`.
     - Health contract schema for server monitoring.
3. **Infrastructure & Tooling:**
   - Configured `docker-compose.yml` with MongoDB 7.0 (with replica set `rs0` enabled via automated healthcheck initiation for multi-document transaction support) and Redis 7 (with append-only file persistence enabled).
   - Created `.env.example` and local `.env` configurations for client and server.
   - Set up root commands: `dev`, `build`, `lint`, `typecheck`, `test`, `format`, `docker:up`, `docker:down`.
   - Shared strict `tsconfig.base.json` extended across all workspace packages.
   - Shared Prettier and ESLint (flat config) setups.
4. **Bootstrapping Baseline Apps (Zero Features):**
   - Server: NestJS baseline app with `GET /health` implementing `HealthResponse` contract. Unit tests verified with Jest.
   - Client: Next.js clean entry page adhering to strict black and white design system tokens (`#0A0A0A`, `#111111`, `#232323`, `#FAFAFA`, `#8A8A8A`, `#22C55E`).
5. **Architecture Documentation (`docs/ARCHITECTURE.md`):**
   - Feature coverage matrix mapping all sections of `docs/FEATURES.md` to Phases 1-14.
   - Target folder trees for client (features-sliced) and server (NestJS modular).
   - Socket contract for `/blueprint` namespace.
   - MongoDB collections schema, relations, and indexes.
   - Redis keys, TTLs, invalidation tags, BullMQ queues, and jobs.
   - Critical vs Non-critical operation classification table.
   - RBAC matrix across 6 roles and resources.
   - Risk assessment and architectural decisions.

### Decisions Made
- **Package Manager:** Configured `pnpm` v12 with `onlyBuiltDependencies` in `pnpm-workspace.yaml` to ensure deterministic builds.
- **Contracts Build:** Used `tsup` for `@slotly/contracts` generating ESM, CJS, and TypeScript declaration maps.
- **MongoDB Transactions:** Configured Docker MongoDB container with `--replSet rs0` and automated single-node replica set initiation in healthcheck to support multi-document transactional writes required by critical operations.
- **Design Tokens:** Initialized CSS variables in `client/src/app/globals.css` matching strict B&W rules with under 5% accent color usage.
- **ESLint in Next.js 16:** Utilized native ESLint flat config with Next.js core web vitals and typescript configs.

### What Was Skipped
- Features implementation intentionally deferred to Phase 1+ per Phase 0 instructions.

---

## Phase 1: Foundation (Contracts, Server Infrastructure, Client UI & Layouts)

### What Was Built
1. **Contracts Package (`@slotly/contracts`):**
   - Base error response schema (`ApiErrorResponseSchema`) with `{ code, message, details? }`.
   - Pagination schemas and interfaces (`PaginationQuerySchema`, `PaginatedResult<T>`).
   - Revision conflict contract (`RevisionConflictSchema`).
   - RBAC permissions enum (`PermissionSchema`) with 22 granular permissions and `RolePermissions` mapping registry.
2. **Server Foundation:**
   - **Environment Validation:** `ConfigModule` with strict Zod validation schema covering port, environment, MongoDB URI, Redis parameters, JWT secrets, and mailer configs.
   - **Database & Mongoose:** Root Mongoose module with connection handling, `TransactionHelper` with `withTransaction` supporting replica set sessions.
   - **Repository Pattern & Decorators:** `BaseRepository<T>` interface, `MongoBaseRepository<T>`, and `CachedRepository<T>` decorator base providing cache-aside reads (`remember`) and tag invalidations on writes.
   - **Cache Infrastructure:** `CacheService` interface, `RedisCacheService` with ioredis, tag sets, single-flight stampede protection, and automated fallback to `InMemoryCacheService`.
   - **Queues & Write-Behind:** BullMQ root module, `WriteBehindService` with `jobId = ${entity}:${id}` rapid update coalescing, dead-letter preservation, per-project pending writes counter, and `flushOrAwaitPendingWrites` consistency barrier for solver builds.
   - **Domain Events & Audit:** Typed `EventBus` (Observer pattern) and `AuditService` with `AuditLog` schema delivering non-critical audit persistence via BullMQ queue.
   - **HTTP Pipeline & Security:** Helmet headers, CORS from environment, `ZodValidationPipe`, `GlobalExceptionFilter` returning `{ code, message, details }`, `RequestIdMiddleware` generating `X-Request-ID`, `LoggingInterceptor`, and `MetricsInterceptor` recording request timing.
   - **Concurrency & Concurrency Control:** `RevisionHelper` and `RevisionConflictException` throwing HTTP 409 with current document state when `If-Match` header mismatches.
   - **RBAC Decorators & Guard:** `@Roles(...)`, `@RequirePermissions(...)`, and `RolesGuard` enforcing permission registry checks.
3. **Client Foundation:**
   - **Design System & Tokens:** Tailwind v4 and CSS variables in `globals.css` adhering strictly to black and white rules with accents under 5% (`#FACC15` primary, `#22C55E` success, `#EF4444` destructive, `#3B82F6` links).
   - **Shared UI Components:** `Button` (primary yellow, white outline, red danger, ghost), `Input`, `Select`, `Combobox`, `Checkbox`, `Switch`, `Card`, `Badge` (green/yellow/red/neutral), `Dialog`, `ConfirmDialog`, `Sheet`, `Tabs`, `Table`, `Tooltip`, `Skeleton`, `Toast`, `EmptyState`, `Kbd`, and `Logo`.
   - **Layouts:** `PublicLayout`, `AuthLayout`, and `AppLayout` (top nav, notifications bell slot with unread accent, user dropdown, and primary Create Project button).
   - **Service Layer & Error Handling:** `apiClient` with in-memory Bearer token injection, automatic refresh-on-401 retry queue with request queuing, TanStack React Query provider, Zustand store for toasts with server error code mapping (`toast.fromErrorCode(code)`), and `ErrorBoundary`.
   - **Placeholder Pages:** Added thin route pages covering all routes defined in `docs/ROUTES.md` (`/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/mfa`, `/sessions`, `/users/me/security`, `/dashboard`, `/institutions`, `/blueprint-templates`, `/projects/new`, `/projects/:projectId/blueprint`, `/projects/:projectId/editor`, `/projects/:projectId/blueprint/readiness`, `/projects/:projectId/blueprint/history`, `/projects/:projectId/blueprint/export`, `/projects/:projectId/blueprint/import`, `/versions/:versionId/periods`).
4. **Unit Tests:**
   - `cache.service.spec.ts`: Validates caching, TTL expiration, single-flight stampede guard (5 concurrent callers trigger loader only once), and tag invalidation.
   - `write-behind.service.spec.ts`: Validates rapid edit coalescing (`jobId = ${entity}:${id}`), pending write counters per project, and consistency barrier resolution.
   - `app.controller.spec.ts`: Validates health status response.

### Decisions Made
- **Strict B&W Design Tokens:** Defined semantic variables in `globals.css` with dark mode enforcement.
- **Cache Single-Flight:** Implemented in-flight promise map per key in `CacheService` to prevent cache stampedes under high concurrency.
- **Write-Behind Coalescing:** Used BullMQ deterministic jobIds `${entity}:${id}` combined with in-memory coalescing so rapid node movements or autosaves emit only the latest state to the database.
- **Consistency Barrier:** Provided `flushOrAwaitPendingWrites` which polls `pending_writes:${projectId}` before a build job runs, ensuring no stale write-behind changes are omitted.
- **API Client Bearer Injection:** Implemented memory access token storage with automatic 401 interceptor that queues concurrent calls while requesting `/auth/refresh`.

### What Was Skipped
- Real business logic for authentication endpoints, graph nodes, and timetable solving (targeted for subsequent phases per roadmap).

---

## Phase 2: Identity & Access (Auth, Sessions, Users & Security)

### What Was Built
1. **Contracts Package (`@slotly/contracts`):**
   - Authentication DTOs with Zod validation schemas and TypeScript types:
     - `RegisterDtoSchema`, `LoginDtoSchema`, `AuthResponseSchema`, `VerifyEmailDtoSchema`, `ResendEmailDtoSchema`, `ForgotPasswordDtoSchema`, `ResetPasswordDtoSchema`, `ChangePasswordDtoSchema`.
     - `MfaEnrollResponseSchema`, `MfaVerifyDtoSchema`, `MfaRecoveryDtoSchema`, `StepUpDtoSchema`.
     - `SessionDtoSchema`, `DeviceDtoSchema`, `SecurityActivityDtoSchema`.
   - Exported and built to ESM, CJS, and DTS with `tsup`.

2. **Server Security Architecture:**
   - **Password Security:**
     - Argon2id hashing with length-based policy (min 12, max 128 chars, spaces allowed, no arbitrary symbol requirements).
     - `BreachedPasswordChecker` Adapter with `CommonListPasswordChecker` checking against known common passwords.
     - `StandardPasswordPolicy` checking password length, breach status, and preventing password reuse against user `passwordHistory`.
     - Automatic revocation of other sessions upon password change/reset and security email alert dispatch.
   - **Session Management:**
     - Server-side Redis sessions (`sessionId`, `userId`, `device`, `browser`, `ip`, `createdAt`, `lastActiveAt`, `expiresAt`, `status`, `mfaVerified`, `stepUpUntil`).
     - Inactivity timeout (7 days) and max lifetime (30 days).
     - Session validation on every request via `AuthGuard` (valid JWT alone is not enough; Redis session must be active).
     - Token families with rotation and automatic reuse detection: when a previously used refresh token is presented, the entire session family is revoked immediately and a security alert is logged.
     - Single session revocation, logout-all (revoking all sessions except current or all), and active sessions listing.
   - **Email OTP Verification:**
     - `RedisOtpService` with SHA-256 OTP hashes stored in Redis, 10-minute TTL, single-use invalidation, 60-second cooldown, max 5 attempts per window. Generic responses prevent account enumeration.
   - **Password Recovery:**
     - Expiring one-time reset tokens in Redis with rate-limiting and generic responses.
   - **Multi-Factor Authentication (TOTP MFA):**
     - RFC 6238 compliant HMAC-SHA1 TOTP implementation in `OtplibTotpAdapter` with native QR code data URL generation and secret creation.
     - 10 single-use emergency recovery codes generated and hashed with Argon2id.
     - Emergency recovery login endpoint (`/auth/mfa/recovery`) consuming one code per login.
   - **Step-Up Authentication:**
     - `StepUpGuard` protecting sensitive actions (enabling/disabling MFA, regenerating codes, changing passwords/emails/roles).
     - Re-authenticates recent credentials (password or TOTP code) granting a 10-minute validity window on the session (`stepUpUntil`).
   - **Rate Limiting & Throttling:**
     - `RedisThrottlerService` with sliding counter windows: login (5/min), OTP (3/15min), refresh (30/min), password reset (3/hour).
   - **RBAC & Authorization:**
     - Data-driven permissions registry with `RolePermissions` mapping for `SUPER_ADMIN`, `ADMIN`, `DESIGNER`, `FACULTY`, `STUDENT`.
     - `PermissionsGuard` and `StandardAccessPolicy` implementing resource-level isolation (institution, department, ownership).
     - First registered user of an institution is automatically assigned `ADMIN`.
   - **Audit Events & Security Alerts:**
     - Domain audit logging for all auth events: `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`, `AUTH_SESSION_CREATED`, `AUTH_SESSION_REVOKED`, `AUTH_TOKEN_REFRESHED`, `AUTH_PASSWORD_CHANGED`, `AUTH_PASSWORD_RESET`, `AUTH_MFA_ENABLED`, `AUTH_MFA_DISABLED`, `AUTH_RECOVERY_COMPLETED`, `AUTH_PERMISSION_DENIED`. Passwords, tokens, and OTPs are never logged.

3. **Client Auth Features & Pages:**
   - `client/src/features/auth/services/auth.api.ts`: Typed API client methods for all auth and security endpoints.
   - `client/src/features/auth/store/auth.store.ts`: Zustand store managing in-memory access token, user profile, auth status, MFA pending state, and step-up modal triggers.
   - `client/src/features/auth/components/auth-provider.tsx`: Root-level silent session restoration via `/auth/refresh` on page reload.
   - `client/src/features/auth/hooks/use-permission.ts`: Custom hook checking permissions against `RolePermissions`.
   - `client/src/features/auth/components/can.tsx`: Declarative RBAC `<Can>` component.
   - `client/src/features/auth/components/step-up-dialog.tsx`: Global modal prompting for password or 6-digit TOTP code when server throws `STEP_UP_REQUIRED`.
   - Pages:
     - `/login`: Email/password form, redirects to `/mfa` if 2FA is required, sets store and routes to `/dashboard`.
     - `/register`: Registration form (name, email, password min 12 chars, institution), redirects to `/verify-email`.
     - `/verify-email`: 6-digit OTP code entry, 60-second cooldown timer for resend.
     - `/forgot-password`: Email entry with generic confirmation dispatch notice.
     - `/reset-password`: Token and new password entry with confirmation.
     - `/mfa`: Challenge page supporting both 6-digit TOTP codes and 10-character emergency recovery codes.
     - `/users/me`: Profile overview with role, status, navigation to security settings, and sign-out.
     - `/users/me/security`: Full security center with MFA enrollment (QR code dialog, manual key copy, recovery code backup), password change, active sessions with termination and logout-all, registered devices list, and security audit log.
     - `/sessions`: Dedicated active sessions overview and revocation interface.

4. **Unit Tests (26 tests passing):**
   - `src/modules/auth/tests/otp.spec.ts`: Generation, verification, single-use, max attempts, and cooldown.
   - `src/modules/auth/tests/token-rotation.spec.ts`: Token family rotation, concurrent refresh handling, and token reuse detection revoking family.
   - `src/modules/auth/tests/session.spec.ts`: Inactivity timeout, max lifetime, touching, single revocation, and revoke-all.
   - `src/modules/auth/tests/mfa.spec.ts`: RFC 6238 TOTP verification, secret generation, QR URL generation, and recovery codes.
   - `src/modules/auth/tests/throttling.spec.ts`: Rate limit sliding window, progressive throttling, and lockout prevention.
   - `src/modules/auth/tests/rbac.spec.ts`: Permission registry across all roles and multi-tenant resource isolation.

### Decisions Made
- **Native RFC 6238 TOTP:** Built RFC 6238 HMAC-SHA1 TOTP using Node.js `crypto` to avoid ESM-bundling issues in Jest tests with `otplib`/`@scure/base`.
- **Zero-Dependency UUID & Random Bytes:** Used Node `crypto.randomUUID()` and `crypto.randomBytes()` instead of external `uuid` v14 to maintain ESM/CJS compatibility across Jest and NestJS runtime.
- **In-Memory Access Token + Redis Session Verification:** Kept access token in memory with short lifetime (15 mins), refresh token in httpOnly cookie with rotation. Every API request validates the server-side Redis session, ensuring immediate session revocation without waiting for access token expiration.
- **Exact Optional Property Types:** Adhered strictly to `exactOptionalPropertyTypes: true` in tsconfig across contracts, server schemas, and client state.
- **Generic Responses on Auth Failures:** Forgot password, login, and registration use generic responses to prevent user enumeration attacks.

### What Was Skipped
- Institution and Blueprint creation (scheduled for Phase 3: Institution & Blueprint Graph Foundation).

---

## Next Steps
- **Phase 3:** Institution & Blueprint Graph Foundation (Institution CRUD, completion rules, DAG structure, node creation gates, completion gating).
