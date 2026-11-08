# Slotly Comprehensive Integration Audit Report (Phases 0 - 9)

**Date**: 2026-11-08  
**Branch**: `audit/integration-a`  
**Baseline Git Tag**: `pre-audit-baseline`  
**Test Suite Status**: 37 test suites passed, 193 tests passed, 5 todo bug demonstrations  

---

## Executive Summary

An exhaustive integration audit was conducted across the Slotly codebase following the completion of Phases 0 through 9 and stabilization passes. The audit examined contracts (`@slotly/contracts`), backend server (`server`), frontend client (`client`), persistence models (MongoDB replica set `rs0`), in-memory cache/queues (Redis, BullMQ), WebSocket namespaces (`/blueprint`, `/builds`), and system documentation.

### Findings Summary by Severity and Module

| Module | S1 (Critical) | S2 (Major) | S3 (Quality / Tests) | S4 (Nit) | Total |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Database & Persistence** | 1 | 0 | 0 | 0 | **1** |
| **Engine & Constraints** | 1 | 0 | 0 | 0 | **1** |
| **Builds & Queues** | 0 | 2 | 0 | 0 | **2** |
| **WebSockets & Contracts** | 0 | 1 | 1 | 0 | **2** |
| **Server Architecture** | 0 | 1 | 0 | 1 | **2** |
| **Client UI & Services** | 0 | 0 | 1 | 0 | **1** |
| **Code Quality & Security** | 0 | 0 | 2 | 0 | **2** |
| **Total** | **2** | **4** | **4** | **1** | **11** |

---

## Detailed Audit Findings (Ordered by Severity)

### AUD-A-01 (Severity: S1) - Missing Soft-Delete Compound Unique Indexes in Live MongoDB
- **Module**: MongoDB / Library (`faculties`, `rooms`, `subjects`)
- **Evidence**:
  - Live index query via `db.collection.getIndexes()` on `slotly-mongodb`:
    - `faculties`: `{ institutionId: 1, code: 1 }` (`unique: true`) without `isDeleted: 1`
    - `rooms`: `{ institutionId: 1, code: 1 }` (`unique: true`) without `isDeleted: 1`
    - `subjects`: `{ institutionId: 1, code: 1 }` (`unique: true`) without `isDeleted: 1`
  - Dry-run migration execution:
    ```bash
    node -e "const { runIndexMigration } = require('./server/dist/database/migrations/ensure-indexes'); ..."
    # Output: "faculties": action: plan_create, "rooms": action: plan_create, "subjects": action: plan_create
    ```
- **Impact**: Soft-deleting an entity (`isDeleted: true`) does not free up its unique code in live MongoDB. Attempting to create a new entity with the same code fails with MongoDB `E11000 duplicate key error`.
- **Suggested Fix**: Run `pnpm --filter server db:ensure-indexes` against the database to create `{ institutionId: 1, code: 1, isDeleted: 1 }` (`unique: true`) and drop the legacy `{ institutionId: 1, code: 1 }` unique index.
- **Estimated Effort**: 0.5 hours.

---

### AUD-A-02 (Severity: S1) - Matrix Out-of-Bounds Dimension Truncation in FacultyAvailabilityConstraint
- **Module**: Engine (`FacultyAvailabilityConstraint`, `server/src/modules/engine/core/constraints/hard/faculty-availability.constraint.ts:47-54`)
- **Evidence**:
  ```ts
  if (!isUnavailable && faculty.availability && faculty.availability[slot.day]) {
    const dayAvailability = faculty.availability[slot.day];
    if (dayAvailability && dayAvailability[period - 1] === false) {
      isUnavailable = true;
    }
  }
  ```
  `AvailabilityGrid` in the client defaults to 5 days by 7 periods. On a 6-day institution calendar (Mon-Sat), `faculty.availability[5]` is `undefined`. Because `dayAvailability` is undefined, `isUnavailable` remains `false`.
- **Impact**: Faculty members configured with standard 5x7 UI matrices are evaluated as available on Saturday (day 5) or periods 8+, generating schedules with illegal placements.
- **Suggested Fix**: Call `normalizeAvailabilityMatrix(faculty.availability, settings.days.length, settings.periodsPerDay)` in `ScheduleState` or `FacultyAvailabilityConstraint` before coordinate lookup.
- **Estimated Effort**: 1 hour.

---

### AUD-A-03 (Severity: S2) - BullMQ "builds" Queue Bypass & Distributed Lock Key Name Inversion
- **Module**: Builds (`server/src/modules/builds/services/builds.service.ts:36-53`) vs `docs/ROUTES.md:121-124`
- **Evidence**:
  - `docs/ROUTES.md` documents:
    - Queue: `builds` (concurrency: 2, processor: `BuildsProcessor`)
    - Redis lock: `slotly:build:lock:{projectId}`
  - Code implementation:
    - `BuildsService.startBuild` calls `BuildFacade.build` directly in-process without enqueuing a BullMQ job.
    - Redis lock key is `slotly:lock:build:${projectId}` (inverted key structure).
- **Impact**: Timetable solver runs in the main API node process instead of worker queues, risking HTTP event-loop blocking under heavy load. Monitoring tools querying `slotly:build:lock:*` detect no locks.
- **Suggested Fix**: Wire `BuildsProcessor` to consume from BullMQ `builds` queue, and unify Redis lock key to `slotly:build:lock:{projectId}`.
- **Estimated Effort**: 2 hours.

---

### AUD-A-04 (Severity: S2) - WebSocket Event Name Drift on /builds Namespace
- **Module**: Contracts & Builds (`server/src/modules/builds/gateways/builds.gateway.ts:147`, `client/src/features/builds/services/builds-socket.service.ts:63`) vs `docs/ROUTES.md:118`
- **Evidence**:
  - `docs/ROUTES.md`: `client -> server: join:project, leave:project`
  - Server & Client: `build:join`, `build:leave`
  - In `packages/contracts/src/index.ts`, `SocketEvents` contains only `/blueprint` events, omitting `/builds` events entirely.
- **Impact**: Discrepancy between documentation, shared contracts, and socket handlers.
- **Suggested Fix**: Add `BUILD_JOIN`, `BUILD_LEAVE`, `BUILD_PROGRESS`, `BUILD_COMPLETED`, and `BUILD_FAILED` to `SocketEvents` in `@slotly/contracts`, and support both event aliases in `BuildsGateway`.
- **Estimated Effort**: 1 hour.

---

### AUD-A-05 (Severity: S2) - Circular Module Dependencies in Server
- **Module**: NestJS Architecture (`server/src/modules/`)
- **Evidence**:
  - Command: `npx madge --circular --extensions ts --ts-config server/tsconfig.json server/src`
  - Cycles found:
    1. `modules/auth/auth.module.ts > modules/institutions/institutions.module.ts > modules/users/users.module.ts`
    2. `modules/blueprint/blueprint.module.ts > modules/projects/projects.module.ts`
- **Impact**: Requires `forwardRef()` across multiple modules, degrades DI startup time, and can mask circular initialization ordering errors.
- **Suggested Fix**: Move shared data access/interfaces into dedicated common services or a core domain module.
- **Estimated Effort**: 3 hours.

---

### AUD-A-06 (Severity: S2) - Email Queue Name and Concurrency Drift
- **Module**: Queue & Email (`server/src/common/email/email.processor.ts:25`, `server/src/common/queue/queue.module.ts:25`) vs `docs/ROUTES.md:129-131`
- **Evidence**:
  - `docs/ROUTES.md` documents queue `email` with concurrency 3.
  - Server code registers and processes queue `notifications` (`NOTIFICATIONS_QUEUE`) with concurrency 5.
- **Impact**: Queue monitoring scripts expecting `bull:email:*` find no jobs.
- **Suggested Fix**: Update `docs/ROUTES.md` to reflect `notifications` queue or rename the BullMQ queue to `email`.
- **Estimated Effort**: 0.5 hours.

---

### AUD-A-07 (Severity: S3) - Non-Standard SHA-256 Hash Token Signature instead of HMAC
- **Module**: Auth & Security (`server/src/modules/auth/services/sessions.service.ts:131`, `server/src/modules/auth/guards/auth.guard.ts:82`)
- **Evidence**:
  ```ts
  const expectedSig = createHash('sha256')
    .update(`${header}.${payload}.${secret}`)
    .digest('base64url');
  ```
  Uses `crypto.createHash('sha256')` rather than standard HMAC-SHA256 (`crypto.createHmac('sha256', secret)`).
- **Impact**: Non-standard signature generation diverges from standard RFC 7519 / JWS specifications.
- **Suggested Fix**: Refactor token signing to `createHmac('sha256', secret)` or standard `jsonwebtoken` library.
- **Estimated Effort**: 1.5 hours.

---

### AUD-A-08 (Severity: S3) - Client Pages Still Import from Legacy Blueprint API Re-export
- **Module**: Client (`client/src/app/blueprint-templates/page.tsx`, `client/src/app/home/page.tsx`, `client/src/app/projects/new/page.tsx`)
- **Evidence**: Callers import `{ blueprintApi }` from `@/features/projects/services/blueprint.api` rather than the canonical `@/features/blueprint/services/blueprint.api`.
- **Impact**: Lingering references to the backward-compatibility shim prevent its deprecation and clean removal.
- **Suggested Fix**: Update all page imports to point directly to `@/features/blueprint/services/blueprint.api`.
- **Estimated Effort**: 0.5 hours.

---

### AUD-A-09 (Severity: S3) - Duplicate Repository Boilerplate and Large Monolith Files
- **Module**: Code Quality (`jscpd`, `packages/contracts/src/index.ts`)
- **Evidence**:
  - `jscpd` reports 304 clones (3,924 duplicated lines, 7.42% duplicate token density), heavily concentrated in repository classes (`faculty.repository.ts`, `room.repository.ts`, `subject.repository.ts`) and modal forms.
  - `packages/contracts/src/index.ts` is 2,006 lines long in a single file without modular breakdown.
- **Impact**: Repetitive CRUD boilerplate increases surface area for inconsistent soft-delete / caching logic.
- **Suggested Fix**: Create a shared `MongoBaseLibraryRepository<T>` and split contracts into domain barrels.
- **Estimated Effort**: 3 hours.

---

### AUD-A-10 (Severity: S3) - Vulnerable Dependencies in Dev/Server Tree
- **Module**: Package Dependencies (`pnpm audit`)
- **Evidence**: `pnpm audit` reports 8 vulnerabilities: 4 high (Prototype Pollution & ReDoS in `xlsx` <0.20.2; memory exhaustion in `zod`), 2 moderate (`esbuild`), 2 low (`deepmerge`).
- **Impact**: Ingestion of untrusted Excel files could expose the server to ReDoS.
- **Suggested Fix**: Migrate Excel parsing from `xlsx` to `exceljs`.
- **Estimated Effort**: 2 hours.

---

### AUD-A-11 (Severity: S4) - Root Endpoint Lacks Explicit @Public Decorator
- **Module**: Server App Controller (`server/src/app.controller.ts:12`)
- **Evidence**: `GET /` lacks explicit `@Public()` decorator or `@UseGuards()`.
- **Suggested Fix**: Add `@Public()` decorator for explicit documentation of intended public access.
- **Estimated Effort**: 0.1 hours.

---

## Known Issues Verdicts

| Issue | Target Area | Status | Verdict & Evidence |
| :--- | :--- | :---: | :--- |
| **A** | Availability matrices dimensions | Partially Resolved | `normalizeAvailabilityMatrix` added in `@slotly/contracts`, but `FacultyAvailabilityConstraint` does not normalize, leaving Saturday/periods 8+ unvalidated on 6-day timetables (AUD-A-02). |
| **B** | Institution server data caching vs TanStack Query | Fully Resolved | `useInstitutionStructure` and `useInstitutionMutations` manage cache in TanStack Query; `useInstitutionStore` in Zustand is cleanly pruned to UI selection state. |
| **C** | `blueprint.api.ts` canonical path and imports | Partially Resolved | File was moved to `features/blueprint/services/blueprint.api.ts`, but multiple client pages still import via legacy re-export shim (AUD-A-08). |
| **D** | Queue names in `docs/ROUTES.md` vs BullMQ code | Divergent | `docs/ROUTES.md` documents `builds` queue and `email` queue, but code runs builds in-process and uses queue `'notifications'` (AUD-A-03, AUD-A-06). |
| **E** | `docs/PROGRESS.md` Phase 9 and audit entries | Fully Resolved | Up to date with complete records for Phase 9 and Phase 09 Stabilized. |

---

## Test Gap Analysis (Scenarios 1 - 15)

The 15 integration scenarios required by the audit specification were reviewed and codified in `server/src/integration-audit/cross-module-scenarios.spec.ts`:

| Scenario | Scope | Coverage in Suite | Findings / Status |
| :---: | :--- | :---: | :--- |
| **1** | Auth, OTP, Login, Refresh, Logout-All, MFA, Step-Up | Yes | Covered in `auth.service.spec.ts`, `session.spec.ts`, `mfa.spec.ts` |
| **2** | Session Revoked from Another Device | Yes | Covered in `token-rotation.spec.ts`, `session.spec.ts` |
| **3** | Institution Tree Hierarchy & Cache Invalidation | Yes | Covered in `tree-builder.spec.ts`, `dependency-checker.spec.ts` |
| **4** | Library CRUD, Matchers, and Qualifiers | Yes | Covered in `faculty-qualifier.spec.ts`, `room-matcher.spec.ts`, `faculty-workload.spec.ts` |
| **5** | Project Starter Kit & Completion Rules | Yes | Covered in `completion-rules.spec.ts`, `gates.spec.ts` |
| **6** | Gate Chain, Reason Codes & Regression Propagation | Yes | Covered in `gates.spec.ts`, `regression-propagation.spec.ts`, `reason-codes.spec.ts` |
| **7** | Write-Behind Persistence, Coalescing & Barrier | Yes | Covered in `write-behind.service.spec.ts`, `build-facade.spec.ts` |
| **8** | Revision Conflict & Optimistic Concurrency | Yes | Covered in `operation-batch.spec.ts`, `blueprint-gateway.spec.ts` |
| **9** | Engine Validation Caching & Invalidation | Yes | Covered in `validation.service.spec.ts`, `pre-build.spec.ts` |
| **10** | Build Engine Solver & Alternatives Ranking | Yes | Covered in `solver.spec.ts`, `build-facade.spec.ts` |
| **11** | RBAC Permission Matrix | Yes | Covered in `rbac.spec.ts` (all 5 roles evaluated) |
| **12** | Redis Down Resilience & Fallback Degrade | Yes | Covered in `cache.service.spec.ts`, `email.service.spec.ts` |
| **13** | Graceful Shutdown & Drain In-Flight | Yes | Simulated in `cross-module-scenarios.spec.ts` |
| **14** | Multi-Client Real-Time Presence & Locks | Yes | Covered in `blueprint-gateway.spec.ts` |
| **15** | Client End-to-End Workflow & Toast Mapping | Yes | Covered in `cross-module-scenarios.spec.ts` |

### Recorded Failing / Todo Bug Demonstration Tests
The following tests in `server/src/integration-audit/cross-module-scenarios.spec.ts` document the exact reproduction criteria for uncovered bugs:
1. `AUD-BUG-01`: Soft-deleted entity compound unique index prevents recreating item with same code when index lacks `isDeleted` in live Mongo (`faculties`, `rooms`, `subjects`).
2. `AUD-BUG-02`: `FacultyAvailabilityConstraint` fails to normalize availability matrix dimensions: 5x7 UI matrix causes out-of-bounds Saturday/period-8 to be treated as available on 6-day timetable.
3. `AUD-BUG-03`: BullMQ `builds` queue processor is documented in `docs/ROUTES.md` but `BuildsService` executes in-process and uses inverted lock key `slotly:lock:build:{projectId}`.
4. `AUD-BUG-04`: Socket event name drift: `docs/ROUTES.md` documents `join:project`/`leave:project` on `/builds` namespace but `BuildsGateway` listens on `build:join`/`build:leave`.
5. `AUD-BUG-05`: Circular dependency in server modules: `auth.module` -> `institutions.module` -> `users.module`.

---

## Runtime Verification Evidence

### 1. HTTP Server Health
- **Endpoint**: `GET http://localhost:4000/health`
- **Output**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-08T04:25:25.219Z",
    "service": "slotly-server",
    "version": "0.1.0",
    "uptime": 14.85,
    "dependencies": {
      "mongodb": "up",
      "redis": "up"
    }
  }
  ```

### 2. Redis Memory & Keys
- **Memory Used**: `2.40 MB`
- **Memory Peak**: `2.66 MB`
- **Key Count (`dbsize`)**: 36 active keys (bounded with TTLs and tag sets)

### 3. Socket Concurrency & Load Test
- **Tool**: `scripts/audit-socket-load.js`
- **Test Configuration**: 50 concurrent authenticated WebSocket clients on namespace `/blueprint`, 10 drag events per client (500 events total).
- **Results**:
  - Connected: `50 / 50` (100%)
  - Connection Errors: `0`
  - Dropped Connections: `0`
  - Events Emitted & Received: `500`
  - Average Emit Latency: `0.03 ms`
  - Peak Emit Latency: `1 ms`
  - Total Duration: `2,548 ms`

---

## Reproduction Commands

Every finding and check in this report can be reproduced using the following commands:

```bash
# 1. Clean build & static checks
pnpm build
pnpm lint
pnpm typecheck
pnpm test

# 2. Check circular dependencies
npx madge --circular --extensions ts --ts-config server/tsconfig.json server/src
npx madge --circular --extensions ts,tsx --ts-config client/tsconfig.json client/src

# 3. Check code duplication
npx jscpd server/src client/src packages/contracts/src --threshold 5

# 4. Check package vulnerabilities
pnpm audit

# 5. Check live MongoDB indexes
node scripts/audit-mongo-indexes.js

# 6. Run WebSocket load test (50 clients)
node scripts/audit-socket-load.js
```
