# Slotly Integration Audit Report

This report documents the integration audit findings across contracts, server, client, architecture, security, and documentation, along with their verified fixes.

## Summary of Findings

| ID | Title | Severity | Status | Commit / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **AUD-001** | Pending writes counter leaks, queue retries without idempotency, dead letter handling, listener leaks, unbounded Redis keys | S1 | Fixed | `7382ae1` Idempotent pending job set per project, BullMQ audit processor, 3600s TTL bounding |
| **AUD-002** | Missing route/socket permissions, guards, and RBAC matrix test coverage | S1 | Fixed | `f3de964` PermissionsGuard on UsersSecurityController, socket auth handshake, full matrix unit tests |
| **AUD-003** | Availability matrices dimension mismatch & fixed constants | S1 | Fixed | `8c1e78b` `normalizeAvailabilityMatrix` canonical helper, dynamic dimensions on read/write, client grid adaptation |
| **AUD-004** | Missing MongoDB indexes & unique constraints specified in ARCHITECTURE.md | S1 | Fixed | `ccdafe5` Compound unique indexes with `isDeleted`, `ensure-indexes.ts` migration script with `--dry-run` |
| **AUD-005** | Reason codes divergence & canonical mapping in `@slotly/contracts` | S2 | Fixed | `0bffce2` Canonical `ReasonCodeSchema`, alias map, `normalizeReasonCode`, `REASON_CODE_MESSAGES`, `toast.fromErrorCode` |
| **AUD-006** | Contract drift between contracts, server DTOs, and client types | S2 | Fixed | `cd31b93` Value vs type imports reconciled, exact property types aligned |
| **AUD-007** | Institution server data stored in Zustand instead of TanStack Query | S2 | Fixed | `d70255d` `useInstitutionStructure` / `useInstitutionMutations` in TanStack Query, Zustand store pruned to UI state |
| **AUD-008** | Misplaced `blueprint.api.ts` in `features/projects/services` | S3 | Fixed | `c0e0a44` Relocated to `features/blueprint/services/blueprint.api.ts` with backward compatibility re-export |
| **AUD-009** | Documentation drift (Phase 9 in PROGRESS.md, ROUTES.md queue/event naming, CODEMAP.md) | S3 | Fixed | Aligned `ROUTES.md`, added Phase 9 and audit log to `PROGRESS.md`, refreshed `CODEMAP.md` |

---

## Findings Status & Verification

### AUD-001 (Severity: S1) - Background Queue, Pending Writes & Redis Resilience
- **Status**: Fixed (`commit 7382ae1`)
- **Fix**: Replaced scalar counter with a Set of pending job IDs in Redis and memory. Coalesced writes with identical `jobId` now correctly increment only once and decrement cleanly upon job completion. Added dedicated `AuditProcessor` to drain the BullMQ audit queue. Enforced 3600s TTL defaults on un-expiring cache entries.
- **Verification**: `write-behind.service.spec.ts` passes with rapid 5-job coalescing test; `audit.processor.spec.ts` passes; `cache.service.spec.ts` confirms TTL bounding.

### AUD-002 (Severity: S1) - RBAC Route & Socket Permissions Enforcement
- **Status**: Fixed (`commit f3de964`)
- **Fix**: Applied `PermissionsGuard` to `UsersSecurityController` and added JWT handshake verification to `BuildsGateway`. Added full RBAC matrix tests in `rbac.spec.ts` verifying all roles (`SUPER_ADMIN`, `ADMIN`, `DESIGNER`, `FACULTY`, `STUDENT`) across permissions.
- **Verification**: `server/src/modules/auth/tests/rbac.spec.ts` passes with 6 complete role-permission tests.

### AUD-003 (Severity: S1) - Dynamic Availability Matrices
- **Status**: Fixed (`commit 8c1e78b`)
- **Fix**: Added `normalizeAvailabilityMatrix(matrix?, daysCount, periodsCount)` in `@slotly/contracts`. Normalized availability matrices in `LibraryService` (`createFaculty`, `updateFaculty`, `createRoom`, `updateRoom`) and `NodeTypeRegistry` on read and write. Updated client `AvailabilityGrid` and dialogs to accept dynamic dimensions.
- **Verification**: `availability-matrix.spec.ts` passes (3 tests).

### AUD-004 (Severity: S1) - Schema Indexes & Unique Constraints
- **Status**: Fixed (`commit ccdafe5`)
- **Fix**: Added compound unique indexes with `isDeleted: 1` on `departments`, `programs`, `academic_years`, `semesters`, `sections`, `faculties`, `rooms`, `subjects`. Added `{ ownerId: 1 }` index to `projects`. Created idempotent database migration `server/src/database/migrations/ensure-indexes.ts` supporting `--dry-run`.
- **Verification**: `ensure-indexes.spec.ts` passes (3 tests) validating schema index definitions and migration dry run.

### AUD-005 (Severity: S2) - Reason Codes Canonicalization
- **Status**: Fixed (`commit 0bffce2`)
- **Fix**: Canonicalized 17 reason codes in `ReasonCodeSchema`, added `REASON_CODE_ALIASES` map, `normalizeReasonCode` parser, and user-friendly `REASON_CODE_MESSAGES`. Updated client `toast.fromErrorCode` to display canonical explanations for all codes.
- **Verification**: `reason-codes.spec.ts` passes (3 tests) validating all canonical codes, alias normalization, and message coverage.

### AUD-006 (Severity: S2) - Contract Drift Across Workspaces
- **Status**: Fixed (`commit cd31b93`)
- **Fix**: Reconciled value vs type imports across server library services and migration tests. Aligned exact optional property types for mock DB interfaces.
- **Verification**: `pnpm typecheck` and `pnpm lint` pass with 0 errors across all 3 workspaces.

### AUD-007 (Severity: S2) - Institution State Management in Client
- **Status**: Fixed (`commit d70255d`)
- **Fix**: Replaced manual `useState`/`useEffect` in `InstitutionsPage` with TanStack Query's `useInstitutionStructure`. Created `useInstitutionMutations` for automatic cache invalidation. Pruned `useInstitutionStore` in Zustand to manage only client UI selection and tab state.
- **Verification**: `pnpm --filter client typecheck` passes with 0 errors.

### AUD-008 (Severity: S3) - Blueprint API Service Location
- **Status**: Fixed (`commit c0e0a44`)
- **Fix**: Relocated `blueprint.api.ts` into `client/src/features/blueprint/services/blueprint.api.ts`. Provided a backward-compatibility re-export at `client/src/features/projects/services/blueprint.api.ts`.
- **Verification**: Clean imports verified in client typecheck.

### AUD-009 (Severity: S3) - Documentation & Codemap Alignment
- **Status**: Fixed (Current commit)
- **Fix**: Updated `docs/ROUTES.md` to document builds namespace, socket events, BullMQ queues, and library endpoints. Appended Phase 9 and Integration Audit to `docs/PROGRESS.md`. Updated `docs/CODEMAP.md`.
- **Verification**: `pnpm codemap` and `pnpm codemap:check` pass cleanly.

---

## Residual Risks & Mitigations

1. **MongoDB Replica Set for Transactions**:
   - *Risk*: MongoDB standalone instances without replica set `rs0` cannot execute multi-document transactions in `TransactionHelper`.
   - *Mitigation*: Local `docker-compose.yml` pre-configures a single-node replica set `rs0`. Fallback non-transactional execution is logged as a warning in development mode.
2. **Third-Party Email Rate Limits (Brevo)**:
   - *Risk*: Exhaustion of monthly credits or invalid API keys on Brevo.
   - *Mitigation*: `BrevoEmailSender` falls back to direct console OTP output and SMTP transport if configured, ensuring developers and tests are never blocked.
3. **Optimistic Revision Conflicts under High Multi-User Concurrency**:
   - *Risk*: Multiple designers editing the same blueprint node simultaneously will receive HTTP 409 `REVISION_CONFLICT`.
   - *Mitigation*: Client `toast.fromErrorCode('REVISION_CONFLICT')` prompts users to refresh, and WebSocket `/blueprint` gateway broadcasts peer presence and node locks to prevent collision.
