# Slotly Integration Audit Report

This report documents the integration audit findings across contracts, server, client, architecture, security, and documentation.

## Summary of Findings

| ID | Title | Severity | Status | Commit / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **AUD-001** | Pending writes counter leaks, queue retries without idempotency, dead letter handling, listener leaks, unbounded Redis keys | S1 | Open | Pending fix |
| **AUD-002** | Missing route/socket permissions, guards, and RBAC matrix test coverage | S1 | Open | Pending fix |
| **AUD-003** | Availability matrices dimension mismatch & fixed constants | S1 | Open | Pending fix |
| **AUD-004** | Missing MongoDB indexes & unique constraints specified in ARCHITECTURE.md | S1 | Open | Pending fix |
| **AUD-005** | Reason codes divergence & canonical mapping in `@slotly/contracts` | S2 | Open | Pending fix |
| **AUD-006** | Contract drift between contracts, server DTOs, and client types | S2 | Open | Pending fix |
| **AUD-007** | Institution server data stored in Zustand instead of TanStack Query | S2 | Open | Pending fix |
| **AUD-008** | Misplaced `blueprint.api.ts` in `features/projects/services` | S3 | Open | Pending fix |
| **AUD-009** | Documentation drift (Phase 9 in PROGRESS.md, ROUTES.md queue/event naming, CODEMAP.md) | S3 | Open | Pending fix |

---

## Detailed Findings

### AUD-001 (Severity: S1) - Background Queue, Pending Writes & Redis Resilience
- **Description**: The write-behind pending counter, BullMQ queue retries, dead-letter queue behavior, socket listener cleanup, and Redis key TTLs must be bounded and robust.
- **Impact**: Potential memory leak, stalled write-behind jobs, or Redis key bloat under high throughput.

### AUD-002 (Severity: S1) - RBAC Route & Socket Permissions Enforcement
- **Description**: Every HTTP route and WebSocket event must have explicit permission and authentication guards matching `docs/ARCHITECTURE.md` Section 7.
- **Impact**: Unauthorized access or privilege escalation.

### AUD-003 (Severity: S1) - Dynamic Availability Matrices
- **Description**: Faculty and Room availability grids currently use hardcoded 5-day / 7-period or 6-day constants instead of dynamic institution/project settings (`days` and `periodsPerDay`).
- **Impact**: Data corruption or out-of-bounds indexing when institutions configure 6-day weeks or non-7 period schedules.

### AUD-004 (Severity: S1) - Schema Indexes & Unique Constraints
- **Description**: MongoDB schemas must match the indexes and compound uniqueness constraints listed in `docs/ARCHITECTURE.md` Section 4.
- **Impact**: Duplicate records under concurrency, slow unindexed queries.

### AUD-005 (Severity: S2) - Reason Codes Canonicalization
- **Description**: Reason codes across blueprint gates, constraints, move validations, and errors must have one canonical set in `@slotly/contracts`, with aliases mapped at ingestion and client covering all codes.
- **Impact**: Confusing error dialogs, unhandled gate failure codes in the UI.

### AUD-006 (Severity: S2) - Contract Drift Across Workspaces
- **Description**: Type discrepancies between contracts DTOs, server response structures, and client API models.
- **Impact**: Runtime serialization errors and frontend rendering bugs.

### AUD-007 (Severity: S2) - Institution State Management in Client
- **Description**: Institution server data is cached inside Zustand stores instead of using TanStack Query for cache invalidation and server synchronization.
- **Impact**: Stale institution trees, cache inconsistency, redundant store code.

### AUD-008 (Severity: S3) - Blueprint API Service Location
- **Description**: `blueprint.api.ts` is placed inside `client/src/features/projects/services/` instead of `client/src/features/blueprint/services/`.
- **Impact**: Architectural inconsistency and cross-feature coupling.

### AUD-009 (Severity: S3) - Documentation & Codemap Alignment
- **Description**: `docs/PROGRESS.md` is missing the Phase 9 entry; `docs/ROUTES.md` queue names and socket event names have slight naming drift with implementation; `docs/CODEMAP.md` needs full refresh.
- **Impact**: Outdated documentation and developer confusion.
