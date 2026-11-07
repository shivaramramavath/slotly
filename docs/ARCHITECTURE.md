# Slotly Architecture Specification

Last updated: 2026-11-07. Reflects Phases 0 to 9 as built, plus the revised plan for the remaining phases and the client UX retrofit.

How to read this file:

- **Built** means the item exists in the repository and is described in `docs/PROGRESS.md`. **Planned** means designed but not yet built.
- Items marked **(verify)** were written from the specification or progress log and must be checked against the code. Section 13 contains a prompt that does this check.
- Names in `ROUTES.md` are authoritative unless Section 12 (Decisions) says otherwise.

Related files: `AGENTS.md`, `FEATURES.md`, `ROUTES.md`, `BLUEPRINT_RULES.md`, `CLIENT_UX.md`, `CLIENT_ROUTES.md`, `PROGRESS.md`.

---

## 1. Phase roadmap and status

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold, monorepo, docs | Built |
| 1 | Foundation: cache, queues, repositories, events, audit, RBAC skeleton, design system, layouts | Built |
| 2 | Identity: auth, sessions, tokens, OTP, MFA, step-up, throttling, RBAC | Built |
| 3 | Institution and academic structure | Built |
| 4 | Library: faculty, subjects, elective groups, rooms, import and export | Built |
| 5 | Projects and Blueprint domain (completion, gates, batch operations, templates, readiness) | Built |
| 6 | Blueprint canvas core and live sync | Built |
| 7 | Advanced Blueprint features | Built |
| 8 | Constraint engine (pure core) and validation | Built |
| 9 | Generation: solver, builds queue, build UI | Built (progress log entry pending) |
| UX-1a | Client route restructure and slots (`CLIENT_ROUTES.md`) | Planned |
| UX-1 | Client retrofit: skeletons, optimistic updates, rendering | Planned |
| UX-2 | Library routes, shared layout, export dropdown | Planned |
| 10 | Board and Studio (schedule editor) | Planned |
| 11 | Versions, comparison, publishing workflow | Planned |
| 12 | Viewers, exports, sharing, notifications | Planned |
| 13 | Analytics, admin, audit query, monitoring, feedback | Planned |
| 14 | AI assistant and RAG | Planned |
| 15 | CI, release hardening | Planned |
| 16 | Optional additions (passkeys, substitution manager, what-if, and so on) | Planned |

Recommended order from here: UX-1a, UX-1, UX-2, then Phase 10. Doing the client retrofit first means the Board and Studio are built on the final route and rendering patterns.

---

## 2. Feature coverage matrix

Sections refer to `FEATURES.md`.

| FEATURES section | Topic | Phase | Status |
|---|---|---|---|
| 2.1 to 2.4, 2.8, 2.13 | Registration, sessions, tokens, OTP, throttling, RBAC | 2 | Built |
| 2.5 to 2.7, 2.9 to 2.12, 2.15 | Passwords, recovery, MFA, devices, notifications (events only), audit events, lifecycle, auth UI | 2 | Built (email delivery path completes in 12) |
| 2.14 | Passkeys, risk-based auth | 16 | Planned |
| 3 | Institution and academic management | 3 | Built |
| 4 | Library | 4 | Built |
| 5 | Projects | 5 | Built |
| 6.1 to 6.3, 6.7, 6.10 to 6.12, 6.16 to 6.17 (server) | Blueprint domain, gating, templates, history, readiness, import and export | 5 | Built |
| 6.4 to 6.7 (client), 6.12 | Canvas, gating UX, sync, autosave | 6 | Built |
| 6.4, 6.8 to 6.20 | Advanced designer features | 7 | Built |
| 6.15, 7 | Constraints and validation | 8 | Built |
| 8 | Generation | 9 | Built |
| 9 | Board and Studio | 10 | Planned |
| 10 | Versions and publishing | 11 | Planned |
| 11 | Viewers, export, sharing, notifications | 12 | Planned |
| 12, 13 | Analytics, admin, feedback, monitoring | 13 | Planned |
| 14 | AI and RAG | 14 | Planned |
| 15 | Platform requirements (CI, security pass, runbook) | 15 | Planned |
| 16 | Later additions | 16 | Planned |

---

## 3. Target folder trees

### 3.1 Repository

```
slotly/
├── client/                 Next.js (App Router, TypeScript, Tailwind v4)
├── server/                 NestJS (TypeScript)
├── packages/contracts/     shared zod schemas, DTO types, reason codes, socket event names (tsup)
├── docs/                   FEATURES, ROUTES, BLUEPRINT_RULES, ARCHITECTURE, CLIENT_UX, CLIENT_ROUTES, PROGRESS
├── docker-compose.yml      MongoDB 7 (replica set rs0) and Redis 7 (AOF)
├── AGENTS.md
└── pnpm-workspace.yaml
```

### 3.2 Client (`client/src`)

The route tree and slot layout are defined in `CLIENT_ROUTES.md`. Summary:

```
app/
├── layout.tsx  error.tsx  global-error.tsx  not-found.tsx  globals.css
├── (public)/        page (landing), s/[token]
├── (auth)/          login, register, verify-email, forgot-password, reset-password, mfa
└── (app)/
    ├── layout.tsx   shell, session gate, slot: modal
    ├── @modal/      intercepting routes: projects/new, library create and detail, notifications
    ├── home/        slots: stats, recent, status
    ├── projects/[projectId]/
    │     layout (project header), @modal (publish)
    │     blueprint/ (slot: sidebar -> config, constraints, validation, history, ai)
    │     build/  board/ (slot: picker)  studio/ (slots: picker, conflicts)
    │     versions/ (compare: slots left, right)  publish/  settings/
    ├── institution/ (tab sub-routes)
    ├── library/ (faculty, subjects, rooms, import)
    ├── kits/  timetables/  analytics/ (6 slots)  admin/  notifications/  profile/  help/  feedback/

components/
├── ui/              primitives (built), dropdown-menu, popover, avatar, progress, route-modal, route-drawer,
│                    boundary, skeletons/ (planned)
└── layouts/         app-layout, auth-layout, public-layout

features/            (feature-sliced: components, hooks, services, store, types)
├── auth/            built
├── institution/     built (server data must move from the Zustand store to TanStack Query)
├── library/         built (tables, toolbar, export menu, filters hook planned in UX-2)
├── projects/        built (project table, wizard, settings form to be extracted from pages)
├── blueprint/       built (canvas, nodes, palette, sidebar tabs, dialogs, hooks, store)
│                    blueprint.api.ts to move here from features/projects
├── builds/          built
├── home/  profile/  board/  studio/  versions/  publishing/  viewer/
├── notifications/  analytics/  admin/  ai/         planned

lib/
├── api-client.ts  query-provider.tsx  utils.ts          built
├── routes.ts  query-keys.ts  web-vitals.ts               planned
├── optimistic/      createOptimisticMutation, per-resource mutation queue   planned
└── socket/          socket factory (blueprint, builds, schedule, notifications)   planned
```

Client rules:

- Server data lives in TanStack Query. Zustand holds UI and ephemeral state only (selection, dialogs, viewport, presence, undo stacks).
- Pages in `app/` are thin and import from features.
- Slots exist for persistent panels (Blueprint sidebar, Board picker) and independently streaming cards (Home, Analytics).
- Skeletons, error boundaries, optimistic mutations and prefetch-on-intent follow `AGENTS.md` and `CLIENT_UX.md`.

### 3.3 Server (`server/src`)

```
common/
├── cache/           CacheService, RedisCacheService, InMemoryCacheService (fallback), tags, single-flight
├── database/        BaseRepository, MongoBaseRepository, CachedRepository, TransactionHelper
├── queue/           QueueModule, WriteBehindService (coalescing, dead-letter, pending-writes counter)
├── events/          typed EventBus
├── audit/           AuditService, AuditLog schema
├── monitoring/      metrics interceptor (extended in Phase 13)
├── rbac/            Permission enum, RolePermissions registry, guards, decorators
├── concurrency/     RevisionHelper, RevisionConflictException (409 with current state)
├── filters/ pipes/ middleware/ interceptors/            global exception filter, zod pipe, request id, logging
└── adapters/        email, OAuth, breached-password, TOTP (LLM and embeddings added in Phase 14)

config/              validated env (zod)

modules/
├── auth/            tokens, sessions, OTP, MFA, step-up, throttling, devices, recovery        built
├── users/           profile, security, admin lifecycle                                       built
├── institutions/    institution, departments, programs, academic years, semesters, sections,
│                    holidays, tree builder, dependency checker                              built
├── library/         faculty, subjects, elective groups, rooms, workload, RoomMatcher,
│                    FacultyQualifier, FileParser (CSV, Excel), import service               built
├── projects/        ProjectState (state pattern), projects service and controller            built
├── blueprint/       NodeTypeRegistry, CompletionRules, CompletionService, GateChain (11 gates),
│                    OperationService (batch, topological), ImpactAnalyzer, ConstraintResolver,
│                    GraphFromInstitutionBuilder, templates, recommendations, readiness,
│                    BlueprintGateway (/blueprint), BlueprintWriteProcessor                  built
├── engine/          core/ (pure TypeScript: ScheduleState, constraints, SuggestionStrategy,
│                    PreBuildChecker, ValidationService) + EngineValidationService, controller   built
├── builds/          solver (pure), alternatives, BuildFacade, builds queue processor,
│                    /builds gateway, controller (verify exact layout)                       built
├── schedules/       entries, occupancy, operations log, MoveValidator, /schedule gateway     planned (10)
├── versions/  publishing/                                                                   planned (11)
├── viewer/  exports/  sharing/  notifications/  emails/                                     planned (12)
├── analytics/  admin/  feedback/  audit-query/  monitoring/                                 planned (13)
└── ai/              llm, rag, operations                                                    planned (14)
```

The engine core and the solver must stay free of NestJS, Mongoose and Redis imports.

---

## 4. Socket contract

All namespaces authenticate the handshake with the Bearer access token and verify the Redis session. Write permissions: DESIGNER and ADMIN edit, FACULTY and STUDENT are read-only. Mutating payloads carry `opId` and the client `revision`.

### 4.1 `/blueprint` (built)

| Event | Direction | Notes |
|---|---|---|
| `project:join`, `project:leave` | client to server | Joins room `project:{projectId}` |
| `cursor:update` | client to server | Ephemeral |
| `node:lock`, `node:unlock` | client to server | Exclusive edit lock |
| `node:add`, `node:delete`, `edge:add`, `edge:delete` | client to server | Critical path: gate chain, synchronous write, acknowledgement with reason code and fix hint on rejection |
| `node:update`, `node:move` | client to server | Non-critical path: Redis first, write-behind job, completion recompute |
| `presence:changed` | server to client | Users with colors and active node |
| `node:status-changed` | server to client | Node and descendants after completion recompute |
| `ops:applied` | server to client | New revision plus applied operations |
| `node:locked`, `node:unlocked` | server to client | Lock state |
| `revision:conflict` | server to client | Current and rejected revision |

### 4.2 `/builds` (built, verify event names)

| Event | Direction | Notes |
|---|---|---|
| `build:subscribe` | client to server | Join the project's build room |
| `build:progress` | server to client | Step, percent, log line |
| `build:completed` | server to client | Version ids and ranking |
| `build:failed` | server to client | Step and reason |

### 4.3 `/schedule` (planned, Phase 10)

`slot:moved`, `slot:updated`, `slot:locked`, `slot:cleared`, `revision:conflict`, `presence:changed`. Writes arrive over REST; the gateway broadcasts after commit with the originating `opId` so clients ignore their own echoes.

### 4.4 `/notifications` (planned, Phase 12)

`notification:created`, `announcement:created`, delivered to room `user:{userId}`.

---

## 5. MongoDB collections

Transactions require a replica set (configured in `docker-compose.yml` and required in every deployment).

### 5.1 Built

| Collection | Key fields | Indexes |
|---|---|---|
| `users` | email, passwordHash (Argon2id), passwordHistory[], name, role, status, institutionId, departmentId, isEmailVerified, mfaEnabled, mfaSecret, recoveryCodes[] (hashed) | unique `{email}`, `{institutionId, role}` |
| `institutions` | name, code, workingDays, periodConfig, soft delete | unique `{code}` |
| `departments` | institutionId, name, code, headFacultyId?, soft delete | unique `{institutionId, code}` |
| `programs` | institutionId, departmentId, name, code, durationYears | unique `{departmentId, code}` |
| `academic_years` | institutionId, programId, yearNumber, label | unique `{programId, yearNumber}` |
| `semesters` | institutionId, academicYearId, number, startDate, endDate, active | unique `{academicYearId, number}` |
| `sections` | institutionId, parent reference (verify: semester or academic year), name, strength, batches[] | unique `{parent, name}` |
| `holidays` | institutionId, date range, name, category | `{institutionId, date}` |
| `faculty` | institutionId, departmentId, code, name, email, designation, availability matrix, preferred and unavailable slots, min and max hours, qualifiedSubjectIds[], archived | unique `{institutionId, code}` |
| `subjects` | institutionId, departmentId, code, name, type (theory, lab, tutorial, seminar), credits, weeklyHours, labHours, consecutivePeriods, requirements, isElective, electiveGroupId?, facultyIds[], archived | unique `{institutionId, code}` |
| `elective_groups` | institutionId, name, subjectIds[], mustBeSimultaneous | `{institutionId}` |
| `rooms` | institutionId, departmentId?, code, name, type (lecture, lab, seminar), capacity, building, equipment[], availability matrix, archived | unique `{institutionId, code}` |
| `projects` | institutionId, name, term, status, settings, strictness, revision, lastOpenedAt, createdById | `{institutionId, status}` |
| `blueprints` (verify: embedded nodes and edges, or separate node and edge collections) | projectId, revision, nodes[], edges[], viewport | unique `{projectId}` |
| `blueprint_templates` | institutionId?, name, category, subtree, version, visibility | `{category}`, `{institutionId}` |
| blueprint history, snapshots, comments (verify names) | projectId, entries, actor | `{projectId, createdAt}` |
| `builds` and schedule version storage from Phase 9 (verify names) | projectId, status, progress, versionNo, slots, conflicts, stats, score, kind, revision | `{projectId, createdAt}` |
| `audit_logs` | institutionId, userId, action, resource, resourceId, metadata, ip | `{institutionId, createdAt: -1}`, `{resourceId}` |

Sessions are stored in Redis (source of truth, see Section 6). There is no TTL-indexed sessions collection unless the code says otherwise (verify).

### 5.2 Planned

| Collection | Phase | Key fields and indexes |
|---|---|---|
| `schedule_entries` | 10 | versionId, sectionId, batchId?, day, startPeriod, span, type, subjectId?, facultyId?, roomId?, locked, revision. Replaces the older `timetable_slots` design. |
| `schedule_occupancy` | 10 | versionId, resourceType (faculty, room, section, batch), resourceId, day, period, entryId. **Unique** `{versionId, resourceType, resourceId, day, period}` makes double-booking impossible under concurrency. |
| `schedule_operations` | 10 | versionId, seq, userId, type, forward, inverse, at. Drives undo and redo. |
| `publish_requests` | 11 | projectId, versionId, requestedBy, status, reviewer, comment |
| `shares` | 12 | projectId, tokenHash, scope, expiresAt?, revokedAt? |
| `exports` | 12 | requester, target, format, status, storage key, expiresAt |
| `notifications`, `announcements` | 12 | userId, type, payload, readAt; audience, body |
| `feedback`, `ratings` | 13 | userId, type, message, status, reply; versionId, score |
| `policies`, `policy_chunks` | 14 | institutionId, document metadata; chunk text, embedding, source |
| `ai_conversations`, `ai_messages` | 14 | projectId, userId; role, content, operations |

---

## 6. Redis keys, tags, queues

### 6.1 Keys and tags

| Pattern | TTL | Purpose | Tags |
|---|---|---|---|
| `slotly:session:{sessionId}` | session policy | Session record (device, ip, status, mfaVerified, stepUpUntil) | `user:{userId}` |
| refresh token family keys, OTP keys, reset tokens, throttle counters (verify exact names) | OTP 10 min, resend cooldown 60 s | Auth state | none |
| `slotly:user:{userId}:profile` | 1 h | Profile and roles | `user:{userId}` |
| `slotly:institution:{id}` and `:tree` | 24 h | Institution and structure tree | `institution:{id}` |
| `slotly:faculty:{id}`, `slotly:subject:{id}`, `slotly:room:{id}` and list keys | long | Library reads | `library:{institutionId}` |
| `slotly:project:{id}` | 2 h | Project and blueprint graph with computed completion | `project:{id}` |
| `slotly:blueprint:{projectId}:readiness` | 10 min | Readiness result | `project:{id}` |
| `slotly:validation:{inputHash}` | 5 min | Validation results (hash covers revision, settings, slots) | `project:{id}` |
| `pending_writes:{projectId}` | none | Counter used by the consistency barrier | none |
| `slotly:lock:node:{projectId}:{nodeId}` | 30 s | Node edit lock | none |
| `slotly:build:{projectId}:lock` | job duration | One active build per project | none |
| `slotly:version:{versionId}:slots` | 2 h | Schedule reads (Phase 10) | `project:{id}:schedule` |
| `slotly:viewer:*`, `slotly:analytics:*`, `slotly:share:{token}` | varies | Phases 12 and 13 | by entity |

Auth limits (built): access token 15 minutes, session inactivity timeout 7 days, maximum lifetime 30 days, step-up window 10 minutes, login 5 per minute, OTP 3 per 15 minutes, refresh 30 per minute, password reset 3 per hour.

### 6.2 Queues

| Queue | Jobs | Status | Class |
|---|---|---|---|
| `write-behind` | `sync-node` (coalesced by `node:{id}`), later chat history | Built | non-critical write-behind |
| `audit` | `log-event` | Built | non-critical |
| `notifications` / emails | `send-email` (OTP, alerts), later fan-out | Built (email), planned (fan-out) | background |
| `builds` | `solve-timetable` | Built | critical, one per project |
| `imports` | library import (verify whether queued or synchronous) | Built or planned | background |
| `exports` | `generate-export` | Planned (12) | background |
| `analytics` | counters, refresh | Planned (13) | background |
| `ai-writes` | `save-message`, embeddings | Planned (14) | non-critical |

Queue names follow the code. `ROUTES.md` lists different names for some queues (for example `blueprint-writes`); align the document to the code (Section 12).

Rules: idempotent jobs, retries with exponential backoff, dead-letter handling, graceful shutdown drain, and a consistency barrier that flushes or awaits pending write-behind jobs before a build starts.

---

## 7. Critical versus non-critical operations

| Class | Operation | Pattern |
|---|---|---|
| Critical | Registration, login, session revocation, password and MFA changes, role changes | Synchronous write, immediate cache bust |
| Critical | Library and institution CRUD | Synchronous write, tag invalidation (optimistic on the client) |
| Critical | Project create, delete, archive | Synchronous |
| Critical | Structural graph change (add or delete node or edge), batch operations, template apply, import | Gate chain, then synchronous transactional write |
| Critical | Build enqueue | Consistency barrier, pre-build validation, Redis lock |
| Critical | Studio slot move, swap, bulk, merge, split (Phase 10) | MoveValidator, transaction, unique occupancy index, revision check |
| Critical | Publish and approval (Phase 11) | Single transaction, version sealed immutable |
| Critical | Accept AI changes (Phase 14) | Same gates and validators as manual edits |
| Non-critical | Node drag positions and config autosave | Redis first, coalesced write-behind job |
| Non-critical | Presence and cursors | In-memory broadcast |
| Non-critical | Audit log, chat history, analytics counters, last-opened time | Queue |
| Non-critical | Emails and notification fan-out | Queue with retry |

---

## 8. RBAC

Roles: SUPER_ADMIN (reserved), ADMIN (institution admin), DESIGNER, FACULTY, STUDENT, plus PUBLIC (share token only). Permissions are data in a registry (22 base permissions plus `SUBJECT_READ`, `SUBJECT_MANAGE`, `PROJECT_ARCHIVE`), enforced by guards on HTTP and sockets, with resource-level checks (institution, department, ownership) through an access policy.

| Resource | Action | ADMIN | DESIGNER | FACULTY | STUDENT | PUBLIC |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Institution structure | Create, edit, delete | Yes | Limited (assigned departments) | No | No | No |
| Institution structure | View | Yes | Yes | Yes | Yes | No |
| Library (faculty, subjects, rooms) | Manage | Yes | Assigned departments | No | No | No |
| Library | View | Yes | Yes | Yes | No | No |
| Faculty availability | Edit own | Yes | Yes | Self only | No | No |
| Projects | Create, edit, archive | Yes | Assigned | No | No | No |
| Projects | Delete | Yes | No | No | No | No |
| Blueprint | View, edit, apply templates | Yes | Assigned | No | No | No |
| Build | Start, cancel | Yes | Assigned | No | No | No |
| Schedule (Studio) | Edit, lock | Yes | Assigned | No | No | No |
| Publish | Request | Yes | Assigned | No | No | No |
| Publish | Approve, publish | Yes | No | No | No | No |
| Published timetable | View | Yes | Yes | Own classes | Own section | Via token |
| Published timetable | Export | Yes | Yes | Own | Own | If enabled |
| Share links | Create, revoke | Yes | Assigned | No | No | No |
| Analytics | View | Yes | Assigned | Own workload | No | No |
| Admin area, audit logs, feedback management | Use | Yes | No | No | No | No |
| Notifications, feedback | Use | Yes | Yes | Yes | Yes | No |
| AI assistant | Use | Yes | Assigned | No | No | No |

---

## 9. Blueprint domain (reference)

- Hierarchy: Institution, Department, Program, Academic Year, Semester, Section, Batch. Subject assignments under Section. Elective groups under Semester. Faculty and Room are independent resource nodes.
- Completion statuses: empty, incomplete, complete (own status) and blocked (effective status when an ancestor is not complete).
- Gate chain (in order): ProjectNotLocked, Permission, ParentExists, ParentTypeAllowed, ParentComplete, SingleParent, NoCycle, DuplicateName, Capacity, ConnectionEndpoint, Qualification. Result: `{allowed, reasonCode, message, fixHint}`.
- Batch operations apply in topological order and skip dependents of failures (`applied[]`, `skipped[]` with reason codes).
- Revisions: every blueprint write carries the revision; a stale write returns 409 `REVISION_CONFLICT` with `currentRevision`, `rejectedRevision` and the current graph.
- Reason codes: the contract currently holds two spellings for some codes. The canonical set is the Phase 5 `ReasonCodeSchema`; legacy aliases stay accepted until removed (Section 12).

| Canonical | Legacy alias |
|---|---|
| `PARENT_NOT_FOUND` | `PARENT_MISSING` |
| `CYCLE_DETECTED` | `CYCLE` |
| `UNAUTHORIZED` | `PERMISSION_DENIED` |
| `PARENT_INCOMPLETE`, `PARENT_TYPE_NOT_ALLOWED`, `SINGLE_PARENT_VIOLATION`, `DUPLICATE_NAME`, `CAPACITY_EXCEEDED`, `ENDPOINT_INCOMPLETE`, `NOT_QUALIFIED`, `PROJECT_LOCKED`, `INVALID_OPERATION` | none |

---

## 10. Engine and generation (reference)

- **Engine core** (pure TypeScript, no framework imports): ScheduleState with indexed lookups and hypothetical move cloning, constraints as Strategy classes in a ConstraintRegistry (20 hard, 7 soft), SuggestionStrategy, PreBuildChecker, ValidationService. Adding a rule never edits the core.
- **Validation caching:** results cached in Redis keyed by an input hash, 5-minute TTL, tagged by project.
- **Solver** (pure): hardest-first ordering, greedy placement across all sections together, backtracking, swap-based improvement, seeded and deterministic, time limit returns best-so-far, honors locked slots, electives, batches, merged lab blocks and per-day period configuration.
- **Alternatives:** several ranked results from different seeds and weight profiles.
- **BuildFacade:** flush pending writes, check Blueprint gate G5 and pre-build validation, load complete non-blocked nodes, solve, save versions, update project status, emit `build.completed`. One active build per project (Redis lock). Cancel and retry supported.

---

## 11. Client architecture

| Concern | Decision |
|---|---|
| Data fetching | TanStack Query for server data, with a key factory per entity. Server components render shells and skeletons (access token is in memory, so server components do not fetch user data; see Decision D1). |
| Local state | Zustand for UI state only; the Blueprint store is split into data, selection, viewport and UI stores. |
| Routing | Route groups, parallel slots and intercepting routes per `CLIENT_ROUTES.md`. Next.js 16: `params` and `searchParams` are promises. |
| Loading | `loading.tsx` and `error.tsx` on every segment and slot, matching skeletons, `Boundary` component, `keepPreviousData` on lists. |
| Optimistic updates | `createOptimisticMutation`, per-resource mutation queue, client-generated IDs, `opId` on graph and schedule operations, rollback toasts with reason. |
| Rendering | React Compiler on; manual memo only for React Flow nodes; selectors everywhere; socket events batched per animation frame; `next/dynamic` for canvas, drag and drop, charts. |
| Real time | One socket factory per namespace; echoes ignored by `opId`; reconnect shows read-only mode. |
| React 19 and lint rules | Prop synchronization during render or `key` remounting instead of `useEffect` state sync (already adopted in the dialogs). |
| Budgets | LCP under 2.5 s, INP under 200 ms, CLS under 0.05; Web Vitals reported to monitoring. |

---

## 12. Decisions and known inconsistencies

### Decisions

| ID | Decision |
|---|---|
| D1 | Access token stays in memory (Bearer) with the Redis session checked on every request; refresh token is an httpOnly cookie. Server components therefore do not prefetch user data. Revisit only if first-paint latency becomes a problem (it would require a same-origin cookie-based access token and CSRF protection). |
| D2 | Sessions live in Redis. Revocation takes effect immediately without waiting for access-token expiry. |
| D3 | Engine core and solver are pure TypeScript with no framework imports. |
| D4 | Schedule data model is one entry per session with a span; a unique occupancy index guarantees no double-booking. |
| D5 | Queue and job names follow the code, and `ROUTES.md` is updated to match. |
| D6 | Reason codes: Phase 5 `ReasonCodeSchema` is canonical; legacy aliases accepted and mapped in client copy. |
| D7 | Canonical client routes are those in `CLIENT_ROUTES.md`; old paths redirect permanently. |
| D8 | Each phase ends with branch, commits, safety scan, push, tag and a pull request (see `AGENTS.md` Git workflow). |

### Known inconsistencies to resolve

| # | Issue | Action |
|---|---|---|
| 1 | Availability matrices are fixed at 7 x 10 on the server and 7 x 8 in the client grid, but period and day counts are project settings. | Drive dimensions from institution and project settings; migrate stored matrices; add tests. |
| 2 | Duplicate reason code spellings in contracts. | Collapse to the canonical set (D6). |
| 3 | `ROUTES.md` queue names differ from the code. | Update `ROUTES.md` (D5). |
| 4 | Institution data is cached in a Zustand store as well as the server cache. | Move to TanStack Query (UX-1). |
| 5 | `blueprint.api.ts` lives in `features/projects`. | Move to `features/blueprint` (UX-1a). |
| 6 | Duplicate and misnamed routes (`dashboard` and `home`, `kits` and `blueprint-templates`, `editor` and `studio`, `institutions`). | Redirects and renames (UX-1a). |
| 7 | `PROGRESS.md` has no Phase 9 entry. | Add it in the Phase 9 checkpoint. |
| 8 | Earlier versions of this document used outdated phase numbers and a `timetable_slots` model. | Replaced by this file. |

---

## 13. Keeping this document accurate

Run this once now, and again at the end of each phase.

```
TASK: Architecture sync. Read docs/ARCHITECTURE.md, docs/PROGRESS.md and the code.
Git branch: docs/architecture-sync. Follow the GIT WORKFLOW (steps 5 to 11).

1. Walk every item marked "(verify)" in docs/ARCHITECTURE.md and every
   "Built" row. For each, check the code (schemas, indexes, module folders, queue
   names, socket event names, Redis key patterns, route files) and correct the
   document where they differ. Do not change code in this task.
2. Produce a "Drift report" at the end of the document listing every difference you
   found and whether the code or the document should change.
3. Update Section 1 (phase status) and add the missing Phase 9 entry to
   docs/PROGRESS.md.
4. Check docs/ROUTES.md against the code and list route, event, queue and key
   names that do not match.
5. Commit with "docs: architecture sync", push, open a PR. Do not merge.
```