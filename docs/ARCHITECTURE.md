# Slotly Architecture Specification

Last updated: 2026-11-08 (status taken from docs/PROGRESS.md). Reflects Phases 0 to 9, the audit stabilization fixes, the code map, namespaced server configuration (C1), social login (S1, both passes), refresh-flow hardening (P1 Part A), Phase 10 pass 0 and pass 1 (engine package and schedule server) and Phase 11 pass 1 (versions and publishing server). Client passes of Phases 10 and 11, the slots client and route protection Part B are still pending.

How to read this file:

- **Built** means the item exists in the repository and is described in `docs/PROGRESS.md` or visible in git history. **Planned** means designed but not yet built. **Done (branch)** means finished on a branch whose merge into `main` should be confirmed.
- Items marked **(verify)** were written from the specification or progress log and must be checked against the code. Section 14 has a prompt that does this.
- Names in `ROUTES.md` are authoritative unless Section 13 (Decisions) says otherwise.

Related files: `AGENTS.md`, `FEATURES.md`, `ROUTES.md`, `BLUEPRINT_RULES.md`, `CLIENT_UX.md`, `CLIENT_ROUTES.md`, `CODEMAP.md`, `AUDIT_REPORT.md`, `AUTH_VERIFICATION.md`, `PROGRESS.md`.

---

## 1. Roadmap and status

| Step | Scope | Status |
|---|---|---|
| Phases 0 to 8 | Scaffold, foundation, identity, institution, library, projects and Blueprint domain, canvas, advanced designer, constraint engine | Built |
| Phase 9 | Generation: solver, builds, build UI | Built |
| Stabilization | Fixes recorded in PROGRESS as AUD-001 to AUD-009 (pending-writes set, audit processor, RBAC and socket auth, availability normalization, unique indexes and migration, reason-code canonicalization, contract drift, institution data in TanStack Query, `blueprint.api.ts` relocation, docs) | Built |
| Integration audit | `docs/AUDIT_REPORT.md` findings AUD-A-01 to AUD-A-11 (a different ID scheme from the fix list above) | Report done; several findings still open, see 13.3 |
| Code map | `docs/CODEMAP.md`, generator, `pnpm codemap` and `pnpm codemap:check` | Built |
| C1 | Server configuration: namespaced `registerAs` configs, Joi validation, env migration helper | Built |
| S1 | Social login (Google, GitHub): server pass and client pass | Built |
| P1 Part A | Refresh verification and hardening (grace window, cross-tab lock, proactive refresh, cleanup registry, CORS and cookie fixes) | Built |
| P1 Part B | Route access registry, RouteGuard, auth state machine, optional edge hint | Planned |
| UX-2 | Library routes, shared layout, export dropdown, URL filters, counts | Branch work exists (`ux/02-library-routes`) but has no entry in PROGRESS; confirm it is merged |
| UX-1a | Client route restructure and slots (`CLIENT_ROUTES.md`) | Planned |
| UX-1 | Skeletons, optimistic updates, rendering retrofit | Planned |
| Phase 10 pass 0 | Engine extraction into `packages/engine` (`@slotly/engine`) | Built |
| Phase 10 pass 1 | Schedule server: entries, occupancy, operations log, MoveValidator, `/schedule` gateway, undo and redo | Built |
| Phase 10 pass 2 | Board and Studio client | Pending |
| Phase 11 pass 1 | Versions, diff, change summary, publish state machine, publish requests, ratings | Built |
| Phase 11 pass 2 | Versions, compare, publish and approvals client | Pending |
| Phase 12 | Viewers, exports, sharing, notifications | Planned |
| Phase 13 | Analytics, admin, audit query, monitoring, feedback | Planned |
| Phase 14 | AI assistant and RAG | Planned |
| Phase 15 | CI and release hardening | Planned |
| Phase 16 | Optional additions | Planned |

Recommended order from here: confirm merges and the UX-2 branch; close the open audit findings that affect names and security (13.3 items 1 to 5); UX-1a; P1 Part B; UX-1; Phase 10 pass 2; Phase 11 pass 2; Phase 12. The slots client (UX-1a) comes before the Board and Studio client so those screens are built on the final routes, and the route guard (P1 Part B) attaches to the final `(auth)` and `(app)` layouts.

---|---|---|
| Phases 0 to 8 | Scaffold, foundation, identity, institution, library, projects and Blueprint domain, canvas, advanced designer, constraint engine | Built |
| Phase 9 | Generation: solver, builds queue, build UI | Built |
| Audit | Integration audit and fixes AUD-001 to AUD-009 (pending writes leak, guards and socket auth, availability matrices, unique indexes, canonical reason codes, contract drift, TanStack Query for institution data, `blueprint.api.ts` relocation, docs alignment) | Done (branch `fix/integration-audit`, tag `phase-09-stabilized`; confirm merge to `main`) |
| Code map | `docs/CODEMAP.md` and generator, `pnpm codemap` and `pnpm codemap:check` | Done (branch `docs/codemap`, tag `codemap-done`; confirm merge) |
| UX-2 | Library routes (`/library/faculty`, `/subjects`, `/rooms`), shared layout, export dropdown, URL filters, counts endpoint | Done (branch `ux/02-library-routes`; confirm merge) |
| C1 | Server configuration refactor to namespaced `registerAs` configs with Joi validation | Planned |
| UX-1a | Client route restructure and slots (`CLIENT_ROUTES.md`) | Planned |
| P1 | Protected routes in the client and refresh-token verification and hardening | Planned |
| UX-1 | Client retrofit: skeletons, optimistic updates, rendering | Planned |
| S1 | Social login (Google, GitHub) | Planned |
| Phase 10 | Board and Studio (schedule editor) | Planned |
| Phase 11 | Versions, comparison, publishing workflow | Planned |
| Phase 12 | Viewers, exports, sharing, notifications | Planned |
| Phase 13 | Analytics, admin, audit query, monitoring, feedback | Planned |
| Phase 14 | AI assistant and RAG | Planned |
| Phase 15 | CI and release hardening | Planned |
| Phase 16 | Optional additions | Planned |

Recommended order: confirm merges, then C1, UX-1a, P1, UX-1, S1, then Phase 10. Config comes first because later work adds environment variables (OAuth). UX-1a comes before P1 because the route guard attaches to the final `(auth)` and `(app)` layouts. Social login comes after both because it touches the login, profile and security pages.

---

## 2. Feature coverage matrix

Sections refer to `FEATURES.md`.

| FEATURES section | Topic | Phase or step | Status |
|---|---|---|---|
| 2.1 to 2.4, 2.8, 2.13 | Registration, sessions, tokens, OTP, throttling, RBAC | 2 | Built (hardened by AUD-002) |
| 2.5 to 2.7, 2.9 to 2.12, 2.15 | Passwords, recovery, MFA, step-up, devices, audit events, lifecycle, auth UI | 2 | Built |
| 2.1 (extension) | Social login with Google and GitHub, account linking, onboarding | S1 | Built |
| 2.2, 2.3 (client side) | Single-flight and cross-tab refresh, proactive refresh | P1 Part A | Built |
| 2.13 (client side) | Protected routes, route access registry, RouteGuard | P1 Part B | Planned |
| 2.14 | Passkeys, risk-based auth | 16 | Planned |
| 3 | Institution and academic management | 3 | Built |
| 4 | Library | 4, UX-2 | Built (routes and export menu done on branch) |
| 5 | Projects | 5 | Built |
| 6.1 to 6.3, 6.7, 6.10 to 6.12, 6.16 to 6.17 (server) | Blueprint domain, gating, templates, history, readiness, import and export | 5 | Built |
| 6.4 to 6.7 (client), 6.12 | Canvas, gating UX, sync, autosave | 6 | Built (sidebar tabs move to slots in UX-1a) |
| 6.4, 6.8 to 6.20 | Advanced designer features | 7 | Built |
| 6.15, 7 | Constraints and validation | 8 | Built |
| 8 | Generation | 9 | Built |
| 9 | Board and Studio | 10 | Server built, client pending |
| 10 | Versions and publishing | 11 | Server built, client pending |
| 11 | Viewers, export, sharing, notifications | 12 | Planned |
| 12, 13 | Analytics, admin, feedback, monitoring | 13 | Planned |
| 14 | AI and RAG | 14 | Planned |
| 15 | Platform requirements (CI, security pass, runbook) | 15 | Planned |
| 16 | Later additions | 16 | Planned |
| CLIENT_UX | Parallel routes, skeletons, optimistic updates, rendering budget | UX-1a, UX-1 | Planned |

---

## 3. Target folder trees

### 3.1 Repository

```
slotly/
├── client/                 Next.js (App Router, TypeScript, Tailwind v4)
├── server/                 NestJS (TypeScript)
├── packages/
│   ├── contracts/          shared zod schemas, DTO types, reason codes, socket event names (tsup)
│   └── engine/             @slotly/engine: framework-free constraint engine shared by server and client (built, Phase 10 pass 0)
├── docs/                   FEATURES, ROUTES, BLUEPRINT_RULES, ARCHITECTURE, CLIENT_UX, CLIENT_ROUTES,
│                           CODEMAP + codemap/, AUDIT_REPORT, AUTH_VERIFICATION, PROGRESS
├── scripts/                codemap generator, env-migrate, audit scripts (routes, indexes, socket load)
├── docker-compose.yml      Redis (verify: MongoDB is hosted on Atlas, no local MongoDB service)
├── AGENTS.md
└── pnpm-workspace.yaml
```

### 3.2 Client (`client/src`)

Canonical routes with slots (`@name` folders are parallel-route slots; `(group)` folders do not appear in URLs). Every segment and every slot has `loading.tsx` and `error.tsx`; every slot also has `default.tsx`.

```
app/
├── layout.tsx  error.tsx  global-error.tsx  not-found.tsx  globals.css  favicon.ico
│
├── (public)/
│   ├── layout.tsx                          PublicLayout
│   ├── page.tsx                            /  landing
│   └── s/[token]/                          page, loading, not-found       public share view
│
├── (auth)/
│   ├── layout.tsx                          AuthLayout + RouteGuard (guestOnly)
│   ├── login  register  forgot-password  reset-password
│   ├── verify-email  mfa  onboarding       state-restricted pages
│   └── auth/callback/                      social login return page (built; moves under the (auth) group in UX-1a)
│
└── (app)/
    ├── layout.tsx                          AppShell + session gate; props {children, modal}
    ├── loading.tsx  error.tsx
    │
    ├── @modal/                             global intercepting modals and drawers
    │   ├── default.tsx                     returns null
    │   ├── (.)projects/new/page.tsx        wizard modal
    │   ├── (.)library/faculty/new  subjects/new  rooms/new
    │   ├── (.)library/faculty/[facultyId]  subjects/[subjectId]  rooms/[roomId]    drawers
    │   └── (.)notifications/page.tsx       notification drawer
    │
    ├── home/                               layout props {children, stats, recent, status}
    │   ├── page.tsx
    │   └── @stats/  @recent/  @status/     each: default, loading, error, page
    │
    ├── projects/
    │   ├── page.tsx  loading.tsx  error.tsx
    │   ├── new/page.tsx                    full-page fallback for hard navigation
    │   └── [projectId]/
    │       ├── layout.tsx                  project header and tabs (stays mounted); props {children, modal}
    │       ├── @modal/                     default.tsx, (.)publish/page.tsx
    │       ├── blueprint/
    │       │   ├── layout.tsx              props {children, sidebar}
    │       │   ├── page.tsx                canvas, palette, toolbar (dynamic import, ssr false)
    │       │   ├── default.tsx             re-exports page (hard load of a sidebar URL)
    │       │   └── @sidebar/               default (null), page (Config), config, constraints,
    │       │                               validation, history, ai   (each with loading and error)
    │       ├── build/                      page, loading, error
    │       ├── board/                      layout props {children, picker}; page, default, loading, error
    │       │   ├── [sectionId]/            page, loading
    │       │   └── @picker/                section picker (stays mounted)
    │       ├── studio/                     layout props {children, picker, conflicts}
    │       │   ├── page  default  loading  error
    │       │   └── @picker/  @conflicts/
    │       ├── versions/                   page, loading
    │       │   └── compare/                layout props {children, left, right}; @left/ @right/
    │       ├── publish/                    page, loading
    │       └── settings/                   page, loading
    │
    ├── institution/                        layout (header and tab links); page; structure, departments,
    │                                       programs, academic-years, semesters, sections, calendar,
    │                                       working-days (page + loading each)
    ├── library/                            layout (shared shell: header, toolbar, tabs)
    │   ├── page.tsx                        redirects to /library/faculty
    │   ├── faculty/  subjects/  rooms/     page + loading each
    │   └── import/
    ├── kits/                               page, loading
    ├── timetables/                         me/  faculty/[facultyId]/  sections/[sectionId]/  rooms/[roomId]/
    ├── analytics/                          layout props {children, workload, rooms, periods, free,
    │                                       unallocated, efficiency}; one @slot per card
    ├── admin/                              layout (role guard); users, roles, approvals, conflicts,
    │                                       feedback, audit-logs, system
    ├── notifications/                      hard-navigation fallback of the drawer
    ├── profile/                            layout (tabs); page; security/; sessions/
    └── help/  feedback/

components/
├── ui/                primitives (built); dropdown-menu, popover, avatar, progress, route-modal,
│                      route-drawer, boundary, skeletons/ (planned)
└── layouts/           app-layout, auth-layout, public-layout

features/              (feature-sliced: components, hooks, services, store, types)
├── auth/              built (refresh coordination, cross-tab sync, token refresher, logout registry, OAuth buttons and callback, step-up); auth state machine and RouteGuard planned in P1 Part B
├── institution/       built (server data in TanStack Query after AUD-007; store keeps UI state)
├── library/           built (entity registry, tables, toolbar, export menu, filters hook)
├── projects/          built (project table, wizard, settings form to be extracted from pages)
├── blueprint/         built (canvas, nodes, palette, sidebar tabs, dialogs, hooks, stores, blueprint.api.ts)
├── builds/            built
├── home/  profile/  board/  studio/  versions/  publishing/  viewer/
├── notifications/  analytics/  admin/  ai/        planned

lib/
├── api-client.ts  query-provider.tsx  utils.ts                    built
├── route-access.ts   route policy registry (planned, P1 Part B)
├── routes.ts  query-keys.ts  web-vitals.ts                        planned
├── auth/              cross-tab-sync, token-refresher, logout-registry   built (P1 Part A; verify file names)
├── optimistic/        createOptimisticMutation, per-resource mutation queue       planned (UX-1)
└── socket/            socket factory (blueprint, builds, schedule, notifications)   planned
```

### 3.3 Server (`server/src`)

```
config/                namespaced configs (built, C1): app, database, redis, jwt, session, auth, oauth,
                       email, cache, queue, groq .config.ts; defaults.ts; env.validation.ts (Joi);
                       config.module.ts (AppConfigModule); index.ts barrel

common/
├── cache/             CacheService, RedisCacheService, InMemoryCacheService (fallback), tags, single-flight
├── database/          BaseRepository, MongoBaseRepository, CachedRepository, TransactionHelper
├── queue/             QueueModule, WriteBehindService (coalescing, dead-letter, bounded pending-writes counter)
├── events/            typed EventBus
├── audit/             AuditService, audit processor, AuditLog schema
├── monitoring/        metrics interceptor (extended in Phase 13)
├── rbac/              Permission enum, RolePermissions registry, guards, decorators
├── concurrency/       RevisionHelper, RevisionConflictException (409 with current state)
├── filters/ pipes/ middleware/ interceptors/
└── adapters/          email (Brevo and log drivers), OAuth, breached-password, TOTP (LLM, embeddings later)

modules/
├── auth/              tokens, sessions, OTP, MFA, step-up, throttling, devices, recovery        built
│   └── oauth/         provider registry, state store, account linking, onboarding               built (S1)
├── users/             profile, security, admin lifecycle                                       built
├── institutions/      institution, departments, programs, academic years, semesters, sections,
│                      holidays, tree builder, dependency checker                                built
├── library/           faculty, subjects, elective groups, rooms, workload, RoomMatcher,
│                      FacultyQualifier, FileParser (CSV, Excel), import, counts endpoint        built
├── projects/          ProjectState (state pattern), service and controller                      built
├── blueprint/         NodeTypeRegistry, CompletionRules, CompletionService, GateChain (11 gates),
│                      OperationService, ImpactAnalyzer, ConstraintResolver, builders, templates,
│                      recommendations, readiness, BlueprintGateway, BlueprintWriteProcessor      built
├── engine/            core/ (pure TypeScript) + EngineValidationService, controller              built
├── builds/            solver, alternatives, BuildFacade, processor, /builds gateway              built
├── schedules/         entries, occupancy, operations log, MoveValidator, /schedule gateway       built (10, server pass)
├── versions/  publishing/   versions, diff, change summary, publish state machine, requests       built (11, server pass)
├── viewer/  exports/  sharing/  notifications/  emails/                                        planned (12)
├── analytics/  admin/  feedback/  audit-query/  monitoring/                                    planned (13)
└── ai/                llm, rag, operations                                                     planned (14)
```

The engine core and the solver must stay free of NestJS, Mongoose and Redis imports. After C1, `process.env` is read only inside `config/` and the bootstrap file.

---

## 4. Client routing architecture

### 4.1 Slots (parallel routes)

| Layout | Slots | Purpose | Notes |
|---|---|---|---|
| `(app)` | `@modal` | Global intercepting modals and drawers | `default.tsx` returns `null` |
| `home` | `@stats`, `@recent`, `@status` | Independently streaming dashboard cards | Each has its own skeleton and error boundary |
| `projects/[projectId]` | `@modal` | Publish modal over any project page | Full page `publish/` exists for hard navigation |
| `blueprint` | `@sidebar` | Config, Constraints, Validation, History and AI tabs as real URLs | Canvas never re-renders when switching tabs; selected node lives in client state (optional `?node=`), not in the route |
| `board` | `@picker` | Persistent section picker | Stays mounted and cached when the section changes |
| `studio` | `@picker`, `@conflicts` | Section picker and conflict panel | |
| `versions/compare` | `@left`, `@right` | Two versions loading independently | |
| `analytics` | `@workload`, `@rooms`, `@periods`, `@free`, `@unallocated`, `@efficiency` | One slot per card | |

Rules: every slot has `default.tsx`; `@modal` defaults return `null`; below a width breakpoint the Blueprint sidebar and Studio panels render as bottom sheets; Next.js 16 `params` and `searchParams` are promises (`await` in server components, `use` in client components).

### 4.2 Intercepting routes

| Soft navigation URL | Rendered as | Hard navigation fallback |
|---|---|---|
| `/projects/new` | Modal wizard | `projects/new/page.tsx` |
| `/library/{faculty,subjects,rooms}/new` | Modal dialog | Full page |
| `/library/{faculty,subjects,rooms}/[id]` | Right drawer | Full page |
| `/notifications` | Drawer | `/notifications` page |
| `/projects/[projectId]/publish` | Modal | `publish/` page |

### 4.3 Route access policies (planned, P1 Part B)

A single registry (`lib/route-access.ts`) maps route patterns to a policy. The guard, edge hint, navigation, command palette and redirect targets all read it. A test fails if any route file has no policy.

| Policy | Routes | Behaviour |
|---|---|---|
| public | `/`, `/s/[token]`, `/auth/callback` | Always reachable |
| guestOnly | `/login`, `/register`, `/forgot-password`, `/reset-password` | Signed-in users are redirected to their role home |
| state-restricted | `/verify-email` (needs unverified email), `/mfa` (needs pending MFA), `/onboarding` (needs pending onboarding) | Other states are redirected to the allowed page; pending-onboarding users can reach nothing else |
| authenticated | Everything under `(app)` | Signed-out users go to `/login?next=<sanitized path>` |
| role or permission | `/admin/*`, approvals, analytics scopes | 403 screen on mismatch, never a redirect loop |
| role home | FACULTY and STUDENT land on `/timetables/me`; others on `/home` | |

### 4.4 Migration from built routes

| Built | Canonical | Handling |
|---|---|---|
| `/dashboard` | `/home` | Permanent redirect |
| `/blueprint-templates` | `/kits` | Permanent redirect |
| `/institutions` | `/institution` (tabs as sub-routes) | Redirect and split |
| `/projects/:id/editor` | `/projects/:id/studio` | Redirect |
| `/users/me`, `/users/me/security` | `/profile`, `/profile/security` | Redirect |
| `/sessions` (inside `(auth)`) | `/profile/sessions` (inside `(app)`) | Move and redirect |
| `/library` with state tabs | `/library/{faculty,subjects,rooms}` | Done in UX-2 |
| `blueprint/export`, `import`, `history`, `readiness` pages | Dialogs and the `@sidebar/history` slot | Delete pages |
| `versions/[versionId]/periods` page | None (API route name, not a screen) | Delete |

---

## 5. Auth architecture

### 5.1 Tokens and sessions (built)

- Access token: short-lived (15 minutes), in memory only, carries `userId` and `sessionId`. Refresh token: httpOnly cookie, hashed at rest, rotated on every refresh, token families with reuse detection. Every request also validates the Redis session (inactivity timeout 7 days, maximum lifetime 30 days), so revocation is immediate. The socket handshake authenticates the same way (builds namespace enforced by AUD-002).
- Step-up window 10 minutes; step-up accepts password, TOTP or a fresh email OTP (the email option serves accounts with neither a password nor MFA).

### 5.2 Client refresh and protection (refresh part built in P1 Part A; route guard and state machine planned in Part B)

| Concern | Design |
|---|---|
| Single flight | All 401 handling shares one refresh promise; replayed requests retry once; refresh, login and register 401s never trigger another refresh |
| Cross-tab | Web Locks API (with a BroadcastChannel fallback) serializes refresh across tabs; timestamp-only broadcasts for "refreshed", "logout", "login"; no tokens ever broadcast |
| Server concurrency policy | A previous refresh token stays acceptable for a short grace window; reuse after the window revokes the family |
| Proactive refresh | Scheduled shortly before expiry, paused while the tab is hidden, immediate on visibility or online events |
| Failure handling | Only a definitive 401 or 403 from refresh signs out; network errors and 5xx keep the session and show a retryable state; step-up 403 is not a session expiry |
| State machine | idle, restoring, authenticated, unauthenticated, mfaPending, needsVerification, needsOnboarding |
| RouteGuard | Renders only a skeleton while idle or restoring; never renders protected children, names or cached data before authentication resolves; redirects once per navigation; `sanitizeNext()` allows only relative in-app paths |
| Edge hint | Non-sensitive `slotly_session_hint` cookie lets the proxy (`proxy.ts` or `middleware.ts` depending on the Next.js version) redirect obvious signed-out visitors early. It is a convenience only: a forged hint can cause at most a redirect that the guard corrects |
| Logout cleanup | Observer registry clears query cache, stores, sockets and timers on logout, definitive refresh failure and user change |
| Storage | No token in localStorage, sessionStorage, URLs or logs |

### 5.3 Social login (built, S1)

```
Continue with Google/GitHub (normal link)
 -> GET /auth/oauth/:provider/start      state, PKCE (where supported) and nonce stored in Redis (10 min, single use)
                                         + short-lived httpOnly binding cookie, redirect to provider
 -> GET /auth/oauth/:provider/callback   verify state and binding, exchange code, read VERIFIED email,
                                         decide login / link / create, issue the normal session and refresh cookie
 -> client /auth/callback                calls /auth/refresh, then goes to next, /mfa or /onboarding
```

Linking rules: an identity already linked logs in that user; an unverified provider email is rejected; a match with a verified-email account links; a match with an unverified-email account takes ownership (password and sessions cleared, email marked verified, owner notified); no match creates a user with no institution and status pending_onboarding. MFA is never skipped. Provider tokens are not stored. Providers are plug-ins behind a registry; a provider is enabled only when both its id and secret are configured. New collection: `oauth_identities`.

---

## 6. Socket contract

All namespaces authenticate the handshake with the Bearer access token and verify the Redis session. Write permissions: DESIGNER and ADMIN edit; FACULTY and STUDENT are read-only. Mutating payloads carry `opId` and the client `revision`. The client reads the current in-memory token at each connect and reconnects once after a refresh on a handshake auth error.

### 6.1 `/blueprint` (built)

| Event | Direction | Notes |
|---|---|---|
| `project:join`, `project:leave` | client to server | Room `project:{projectId}` |
| `cursor:update` | client to server | Ephemeral |
| `node:lock`, `node:unlock` | client to server | Exclusive edit lock |
| `node:add`, `node:delete`, `edge:add`, `edge:delete` | client to server | Critical: gate chain, synchronous write, acknowledgement with reason code and fix hint on rejection |
| `node:update`, `node:move` | client to server | Non-critical: Redis first, write-behind job, completion recompute |
| `presence:changed` | server to client | Users with colors and active node |
| `node:status-changed` | server to client | Node and descendants |
| `ops:applied` | server to client | New revision plus operations |
| `node:locked`, `node:unlocked` | server to client | Lock state |
| `revision:conflict` | server to client | Current and rejected revision |

### 6.2 `/builds` (built; event names disagree between docs and code, see 13.3)

`build:subscribe` (client), `build:progress`, `build:completed`, `build:failed` (server).

### 6.3 `/schedule` (built, Phase 10 server pass; client event names to verify)

`slot:moved`, `slot:updated`, `slot:locked`, `slot:cleared`, `revision:conflict`, `presence:changed`. Writes use REST; the gateway broadcasts after commit with the originating `opId` so clients ignore their own echoes.

### 6.4 `/notifications` (planned, Phase 12)

`notification:created`, `announcement:created` to room `user:{userId}`.

---

## 7. MongoDB collections

Transactions require a replica set. MongoDB is hosted on Atlas, which provides one; any other deployment must too. Atlas network access should be restricted to known addresses.

### 7.1 Built

| Collection | Key fields | Indexes |
|---|---|---|
| `users` | email, passwordHash (Argon2id), passwordHistory[], name, role, status, institutionId, departmentId, isEmailVerified, mfaEnabled, mfaSecret, recoveryCodes[] (hashed) | unique `{email}`, `{institutionId, role}` |
| `institutions` | name, code, workingDays, periodConfig, soft delete | unique `{code}` |
| `departments` | institutionId, name, code, headFacultyId?, soft delete | unique `{institutionId, code}` |
| `programs` | institutionId, departmentId, name, code, durationYears | unique `{departmentId, code}` |
| `academic_years` | institutionId, programId, yearNumber, label | unique `{programId, yearNumber}` |
| `semesters` | institutionId, academicYearId, number, startDate, endDate, active | unique `{academicYearId, number}` |
| `sections` | institutionId, parent reference (verify), name, strength, batches[] | unique `{parent, name}` |
| `holidays` | institutionId, date range, name, category | `{institutionId, date}` |
| `faculty` | institutionId, departmentId, code, name, email, designation, availability (dimensions follow settings after AUD-003), preferences, min and max hours, qualifiedSubjectIds[], archived | unique `{institutionId, code}` |
| `subjects` | institutionId, departmentId, code, name, type (theory, lab, tutorial, seminar), credits, weeklyHours, labHours, consecutivePeriods, requirements, isElective, electiveGroupId?, facultyIds[], archived | unique `{institutionId, code}` |
| `elective_groups` | institutionId, name, subjectIds[], mustBeSimultaneous | `{institutionId}` |
| `rooms` | institutionId, departmentId?, code, name, type (lecture, lab, seminar), capacity, building, equipment[], availability, archived | unique `{institutionId, code}` |
| `projects` | institutionId, name, term, status, settings, strictness, revision, lastOpenedAt, createdById | `{institutionId, status}` |
| `blueprints` (verify: embedded nodes and edges, or separate collections) | projectId, revision, nodes[], edges[], viewport | unique `{projectId}` |
| `blueprint_templates` | institutionId?, name, category, subtree, version, visibility | `{category}`, `{institutionId}` |
| blueprint history, snapshots, comments (verify names) | projectId, entries, actor | `{projectId, createdAt}` |
| builds and schedule version storage (verify names) | projectId, status, progress, versionNo, slots, conflicts, stats, score, kind, revision | `{projectId, createdAt}` |
| `audit_logs` | institutionId, userId, action, resource, resourceId, metadata, ip | `{institutionId, createdAt: -1}`, `{resourceId}` |

AUD-004 added the compound unique indexes and a schema migration; confirm against the live database with `listIndexes`. Sessions live in Redis (source of truth).

### 7.2 Built after the first pass of this document (Phases 10 and 11 server passes, S1) and planned

| Collection | Step | Key fields and indexes |
|---|---|---|
| `oauth_identities` (built) | S1 | userId, provider, providerUserId, email, emailVerified, displayName, avatarUrl, linkedAt, lastLoginAt. Unique `{provider, providerUserId}`, index `{userId}`. No provider tokens stored. |
| `schedule_entries` (built) | 10 | versionId, sectionId, batchId?, day, startPeriod, span, type, subjectId?, facultyId?, roomId?, locked, revision |
| `schedule_occupancy` (built) | 10 | versionId, resourceType, resourceId, day, period, entryId. Unique `{versionId, resourceType, resourceId, day, period}` prevents double-booking under concurrency |
| `schedule_operations` (built) | 10 | versionId, seq, userId, type, forward, inverse, at (undo and redo) |
| `publish_requests` (built) | 11 | projectId, versionId, requestedBy, status, reviewer, comment |
| `shares`, `exports`, `notifications`, `announcements` | 12 | token hashes, export jobs, user notifications, announcements |
| ratings | 11 | Built as `timetable_ratings` in the Phase 11 server pass (verify the collection name); versionId, userId, score, comment |
| `feedback` | 13 | userId, type, message, status, reply |
| `policies`, `policy_chunks`, `ai_conversations`, `ai_messages` | 14 | RAG documents and chunks, chat history |

---

## 8. Redis keys, tags, queues

### 8.1 Keys and tags

| Pattern | TTL | Purpose | Tags |
|---|---|---|---|
| `slotly:session:{sessionId}` | session policy | Session record (device, ip, status, mfaVerified, stepUpUntil) | `user:{userId}` |
| refresh token family keys, OTP keys, reset tokens, throttle counters (verify exact names) | OTP 10 min, resend cooldown 60 s | Auth state | none |
| `slotly:oauth:state:{state}` (S1) | 10 min, single use | OAuth state, PKCE verifier, nonce, mode, sanitized next | none |
| `slotly:user:{userId}:profile` | 1 h | Profile and roles | `user:{userId}` |
| `slotly:institution:{id}` and `:tree` | 24 h | Institution and structure tree | `institution:{id}` |
| `slotly:faculty:{id}`, `slotly:subject:{id}`, `slotly:room:{id}`, list and counts keys | long | Library reads (counts endpoint added in UX-2) | `library:{institutionId}` |
| `slotly:project:{id}` | 2 h | Project and blueprint graph with computed completion | `project:{id}` |
| `slotly:blueprint:{projectId}:readiness` | 10 min | Readiness | `project:{id}` |
| `slotly:validation:{inputHash}` | 5 min | Validation results | `project:{id}` |
| `pending_writes:{projectId}` | bounded after AUD-001 | Consistency barrier counter | none |
| `slotly:lock:node:{projectId}:{nodeId}` | 30 s | Node edit lock | none |
| `slotly:build:{projectId}:lock` | job duration | One active build per project | none |
| `slotly:version:{versionId}:slots` | 2 h | Schedule reads (Phase 10) | `project:{id}:schedule` |
| `slotly:viewer:*`, `slotly:analytics:*`, `slotly:share:{token}` | varies | Phases 12 and 13 | by entity |

Auth limits (built): access token 15 minutes, session inactivity 7 days, maximum lifetime 30 days, step-up 10 minutes, login 5 per minute, OTP 3 per 15 minutes, refresh 30 per minute, password reset 3 per hour. After C1 these values live in the `auth` and `session` config namespaces.

### 8.2 Queues

| Queue | Jobs | Status | Class |
|---|---|---|---|
| `write-behind` | `sync-node` (coalesced by `node:{id}`), later chat history | Built | non-critical |
| `audit` | `log-event` (processor added in AUD-001) | Built | non-critical |
| `notifications` (email) | `send-email`, later fan-out | Built (the code uses the queue name `notifications`, not `email`); fan-out planned | background |
| `builds` | `solve-timetable` | Built | critical, one per project |
| `imports` | library import (verify whether queued) | Built or planned | background |
| `exports` | `generate-export` | Planned (12) | background |
| `analytics` | counters, refresh | Planned (13) | background |
| `ai-writes` | `save-message`, embeddings | Planned (14) | non-critical |

Queue names follow the code; `ROUTES.md` was aligned in AUD-009 (verify). Rules: idempotent jobs, retries with exponential backoff, dead-letter handling, graceful shutdown drain, and a consistency barrier before builds.

### 8.3 Cache layer and write-behind contract (refactor/cache-layer)

#### Architecture
The NestJS server uses a SOLID cache infrastructure located in `src/common/cache/`:
- `BaseCache`: Validates prefix, id, and TTL; builds keys via `ICacheKeyFactory` with format `slotly:{env}:{entity}:v{schemaVersion}`; jitter up to 10%; unified fail-open error handling; namespace version counter via Redis `INCR` (no `KEYS` or `SCAN`).
- `BaseCacheList<T>`: List storage with atomic mutations via Redis Lua scripts (preventing concurrent lost updates); corrupted JSON resilience (treated as miss and key purged); single-flight loading.
- `BaseCacheObject`: Hash/Object storage with date revivers; atomic `updateFields` and `setField` guarded by `EXISTS` (preventing partial/incomplete object cache hits); single-flight deduplication.
- `CacheRepository<T, TId>`: Entity cache-aside with negative caching (short-lived `__SLOTLY_NULL_SENTINEL__`, default 30s), single-flight loader deduplication, 256 KB payload size capping with warn log, and fail-open resilience.

#### Write-behind contract
Write-behind updates use generic `WriteBehindPublisher` and `WriteBehindProcessor` located in `src/common/queue/write-behind/`:
1. Validate input and assert revision match via `RevisionHelper`.
2. Write state to cache with `_persistence: 'pending'`.
3. Enqueue BullMQ job with deterministic ID `${entity}:${id}:${revision}` and exponential backoff defaults.
4. **Enqueue failure contract**: On enqueue error, rollback cache entry to previous state (or delete) and fail the HTTP request immediately. A request never reports success unless the job is durably enqueued.
5. **Processor success**: Persist to MongoDB, update cache `_persistence: 'persisted'`, and emit `${entity}.persisted` event via `EventBus`.
6. **Processor failure**: Retries with backoff. On final failure: update cache `_persistence: 'failed'`, purge cache entry, write audit log, and emit `${entity}.persistence_failed` event. Stale revision jobs (`job.revision < stored.revision`) are safely skipped.

#### How to add a new cache in 5 lines
```ts
class MyEntityCache extends CacheRepository<MyEntity> {
  constructor(@Inject(REDIS_CLIENT) redis: Redis, @Inject(CACHE_KEY_FACTORY) kf: ICacheKeyFactory, @Inject(CACHE_SERIALIZER) s: ICacheSerializer, @Optional() @Inject(CACHE_METRICS) m?: ICacheMetrics) {
    super(redis, 'my_entity', 3600, kf, s, m);
  }
}
```

---

## 9. Server configuration architecture (built, C1)

Pattern: one `registerAs` file per namespace, one Joi schema for all variables, one barrel, one `AppConfigModule`, typed injection with `@Inject(xConfig.KEY)` and `ConfigType<typeof xConfig>`, `ConfigModule.forFeature(xConfig)` in each module that depends on a namespace. Defaults live in one place. `process.env` is not read outside `config/` and bootstrap (lint rule).

| Namespace | Contents |
|---|---|
| `app` | port (4000), nodeEnv, clientUrl, CORS origins, API prefix, logging |
| `database` | `DATABASE_URL`, pool and timeout options |
| `redis` | host, port, password, db, tls |
| `jwt` | access and refresh secrets and lifetimes |
| `session` | inactivity TTL, maximum lifetime, cookie settings |
| `auth` | Argon2 parameters, OTP rules, step-up window, throttle limits, password policy |
| `oauth` | callback base URL and per-provider id and secret |
| `email` | driver (brevo or log), API key, sender, timeout, retries |
| `cache`, `queue`, `groq` | TTLs; BullMQ defaults; AI settings |

Validation fails fast with variable names only (never values), reports legacy names (`MONGODB_URI`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `EMAIL_FROM`, per-provider callback URLs, `SMTP_*`) as renamed or removed, and supplies safe fake defaults under `NODE_ENV=test`.

---

## 10. Critical versus non-critical operations

| Class | Operation | Pattern |
|---|---|---|
| Critical | Registration, login (including social), session revocation, password and MFA changes, role changes | Synchronous write, immediate cache bust |
| Critical | Library and institution CRUD | Synchronous write, tag invalidation (optimistic on the client) |
| Critical | Project create, delete, archive | Synchronous |
| Critical | Structural graph change, batch operations, template apply, import | Gate chain, then synchronous transactional write |
| Critical | Build enqueue | Consistency barrier, pre-build validation, Redis lock |
| Critical | Studio slot move, swap, bulk, merge, split (Phase 10) | MoveValidator, transaction, unique occupancy index, revision check |
| Critical | Publish and approval (Phase 11) | Single transaction, version sealed immutable |
| Critical | Accept AI changes (Phase 14) | Same gates and validators as manual edits |
| Non-critical | Node drag positions and config autosave | Redis first, coalesced write-behind job |
| Non-critical | Presence and cursors | In-memory broadcast |
| Non-critical | Audit log, chat history, analytics counters, last-opened time | Queue |
| Non-critical | Emails and notification fan-out | Queue with retry |

---

## 11. RBAC

Roles: SUPER_ADMIN (reserved), ADMIN (institution admin), DESIGNER, FACULTY, STUDENT, plus PUBLIC (share token only). Permissions are data in a registry (22 base permissions plus `SUBJECT_READ`, `SUBJECT_MANAGE`, `PROJECT_ARCHIVE`), enforced by guards on HTTP and sockets, with resource-level checks through an access policy. The RBAC matrix test (AUD-002) calls every route and namespace as each role. The client mirrors the same policies for navigation and route access (Section 4.3) but the server is authoritative.

| Resource | Action | ADMIN | DESIGNER | FACULTY | STUDENT | PUBLIC |
|---|---|:---:|:---:|:---:|:---:|:---:|
| Institution structure | Create, edit, delete | Yes | Limited (assigned departments) | No | No | No |
| Institution structure | View | Yes | Yes | Yes | Yes | No |
| Library | Manage | Yes | Assigned departments | No | No | No |
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

## 12. Domain references

### 12.1 Blueprint (Blueprint v2)

- Hierarchy: exactly 7 node types: Institution, Department, Program, Academic Year, Semester, Section, Batch. Faculty and Room nodes and subjectAssignment/electiveGroup nodes are removed from the canvas.
- Resource Pools: Faculty, subjects, and rooms are references to Library items stored in per-node Resource Pools (`data.pool`). A child inherits the parent's effective pool: `effectivePool(node) = effectivePool(parent) + own additions - own exclusions`. Ancestor required items cannot be excluded (`POOL_ITEM_REQUIRED`); pinned items survive ancestor removal.
- Section Assignments: Subject assignments are configured directly inside Section and Batch node configurations (`data.assignments`). Unassigned faculty/rooms can be resolved at build time via Auto-fill (`off`, `same_department`, `allow_other_departments`).
- Layout: strictly vertical (TB layout only; algorithm selector retains Hierarchical Dagre, Compact, Department-based).
- Statuses: incomplete, complete, and blocked (effective status when an ancestor is not complete). Section completion requires valid assignments and either non-empty resource pools or auto-fill enabled.
- Gate chain in order: ProjectNotLocked, Permission, ParentExists, ParentTypeAllowed, ParentComplete, SingleParent, NoCycle, DuplicateName, Capacity, ConnectionEndpoint, Qualification, PoolItemExists, PoolItemActive, PoolDepartment, PoolRequired, PoolImpact, PoolDuplicate, AssignmentInPool. Result `{allowed, reasonCode, message, fixHint}`.
- Feature flag: `BLUEPRINT_V2` controls whether Blueprint v2 pool resolution and autosave behavior is enabled (default `false` until cutover).
- Real-time autosave: WebSocket events over `/blueprint` namespace with write-behind persistence to MongoDB and single-flight cache invalidation.
- Batch operations apply in topological order and skip dependents of failures.
- Revisions: stale write returns 409 `REVISION_CONFLICT` with current and rejected revision and the current graph.
- Reason codes canonicalized across contracts, server and client with stable error mapping and fix hints.

### 12.2 Engine and generation

- Engine core (pure TypeScript): ScheduleState, constraints as Strategy classes in a ConstraintRegistry (20 hard, 7 soft), SuggestionStrategy, PreBuildChecker, ValidationService. Validation results cached by input hash (5 minutes, tagged by project).
- Solver (pure): hardest-first, greedy across all sections, backtracking, swap-based improvement, seeded and deterministic, time limit returns best-so-far, honors locks, electives, batches, merged labs and per-day period configuration; ranked alternatives.
- BuildFacade: flush pending writes, check gate G5 and pre-build validation, load complete non-blocked nodes, solve, save versions, update status, emit event. One active build per project (Redis lock); cancel and retry supported.

---

## 13. Decisions, risks and known issues

### 13.1 Decisions

| ID | Decision |
|---|---|
| D1 | Access token stays in memory (Bearer) with the Redis session checked on every request; refresh token is an httpOnly cookie. Server components do not prefetch user data. Revisit only if first-paint latency becomes a problem (would need a same-origin cookie-based access token and CSRF protection). |
| D2 | Sessions live in Redis; revocation is immediate. |
| D3 | Engine core and solver are pure TypeScript with no framework imports. |
| D4 | One schedule entry per session with a span; a unique occupancy index guarantees no double-booking. |
| D5 | Queue and job names follow the code. |
| D6 | One canonical reason-code set; legacy aliases accepted and mapped in one place (done, AUD-005). |
| D7 | Canonical client routes and slots are those in Section 3.2 and `CLIENT_ROUTES.md`; old paths redirect permanently. |
| D8 | Each phase ends with branch, small commits, safety scan, push, tag and pull request (`AGENTS.md` Git workflow). |
| D9 | Server configuration uses namespaced `registerAs` configs, Joi validation and typed injection (C1). |
| D10 | Route protection has three layers: server guards (authoritative), client RouteGuard driven by a route access registry, and an optional non-sensitive edge hint cookie (P1). |
| D11 | Social login uses the server-side authorization code flow with state, PKCE where supported and a binding cookie; only verified provider emails are trusted; MFA is never skipped; provider tokens are not stored (S1). |
| D12 | `docs/CODEMAP.md` is generated from code and checked (`pnpm codemap:check`); the agent reads it before writing new code. |
| D13 | MongoDB is hosted on Atlas (replica set, transactions available); local Docker provides Redis only. |

### 13.2 Stabilization fixes (as recorded in PROGRESS)

| Fix | Resolution |
|---|---|
| AUD-001 | Pending writes tracked as a set (idempotent), audit processor added, un-expiring cache entries bounded to 3600 s |
| AUD-002 | Permissions guard on users security routes, JWT handshake on the builds gateway, RBAC matrix test across five roles |
| AUD-003 | `normalizeAvailabilityMatrix` in contracts, used on read and write; client grids follow institution and project dimensions |
| AUD-004 | Compound unique indexes with `isDeleted`, `{ownerId}` on projects, idempotent `ensure-indexes` migration with dry run |
| AUD-005 | 17 canonical reason codes, `REASON_CODE_ALIASES`, `normalizeReasonCode`, `REASON_CODE_MESSAGES`, client toast mapping |
| AUD-006 | Value versus type import drift and exact optional property typing reconciled |
| AUD-007 | Institution data in TanStack Query; Zustand keeps UI state only |
| AUD-008 | `blueprint.api.ts` moved to the blueprint feature with a compatibility re-export (the re-export is still used by some pages) |
| AUD-009 | ROUTES, AUDIT_REPORT, PROGRESS and CODEMAP aligned at that time |

The audit report uses its own IDs (AUD-A-01 to AUD-A-11). The two schemes do not map one to one; see 13.3.

### 13.3 Open items

| # | Item | Action |
|---|---|---|
| 1 | AUD-A-03: builds run in-process instead of through the BullMQ `builds` queue, and the build lock key is spelled three ways (`slotly:build:lock:{id}` in ROUTES, `slotly:lock:build:{id}` in code at audit time, `slotly:build:{id}:lock` in this file) | Decide: route builds through the queue (matches the design) or document the in-process design; pick one lock key spelling and fix docs and code |
| 2 | AUD-A-04: socket event names differ between docs and code for `/builds` (`join:project` or `build:subscribe` versus `build:join`) and `/schedule` (`schedule:join` versus `join:schedule`) | Pick the spec names, fix code or docs, add a contract test |
| 3 | AUD-A-06: email queue is named `notifications` in code and `email` in ROUTES | Align ROUTES (code name wins unless there is a reason) |
| 4 | AUD-A-07 (S3): access tokens are signed with a plain SHA-256 over `header.payload.secret`, not HMAC | Move to HMAC-SHA256 or a standard JWT library with a transition window |
| 5 | AUD-A-02 residual: `FacultyAvailabilityConstraint` does not normalize the matrix for six-day institutions | Normalize in the constraint or at the engine input boundary and add a test |
| 6 | AUD-A-05: circular module dependencies (`auth` and `institutions` and `users`; `blueprint` and `projects`) | Break with an interface or event, add a madge check to CI |
| 7 | AUD-A-09 to A-11: repository boilerplate duplication and large files, vulnerable dependencies (`xlsx`, `zod` advisories), root endpoint without `@Public` | Schedule; update dependencies and replace `xlsx` if no fix exists |
| 8 | UX-2 branch has no PROGRESS entry | Confirm it is merged into `main`; add the entry |
| 9 | `docs/ROUTES.md` conflicts with the code on library, institution and version paths (see its reconciliation section) | Regenerate the table from controllers (`scripts/audit-routes.js`) and decide per item |
| 10 | Development-only master OTP and automatic institution context | Confirm they are impossible to enable in production and tested |
| 11 | Gateway CORS values must come through the config layer, not `process.env` in feature code | Use a helper exported from `src/config` |
| 12 | Atlas network access list and database user scope | Restrict to known addresses and least privilege; rotate any credential that was ever shared |

### 13.4 Risks

1. **Solver scale.** Large institutions can exceed time limits; mitigate with worker concurrency limits, best-so-far results, progressive relaxation, and department partitioning.
2. **Concurrent edits.** Optimistic revisions (`If-Match`), 409 with current state, presence and node locks; Phase 10 adds the unique occupancy index.
3. **Write-behind gap.** Consistency barrier before builds; Redis AOF; non-critical data only.
4. **Redis outage.** Cache falls back to MongoDB; writes that require Redis degrade or fail clearly as designed; recovery tested.
5. **LLM safety.** The model only proposes structured operations that pass the same gates and validators; retrieved text is data, not instructions.
6. **Multi-tab refresh races.** Rotation with reuse detection can sign users out everywhere if two tabs refresh at once; mitigated by the server grace window and client cross-tab locking (P1).
7. **Account takeover through social login.** Pre-registered unverified accounts and unverified provider emails are the main vectors; mitigated by the linking rules in Section 5.3 and tests.
8. **Client-only route protection.** The client guard improves experience, not security; server guards and the RBAC matrix test are the real control.
9. **Secrets handling.** Real `.env` files are never committed; configuration validates by name only; rotate any credential that is exposed.

---

## 14. Keeping this document accurate

Run this after merges and at the end of each phase.

```
TASK: Architecture sync. Read docs/ARCHITECTURE.md, docs/PROGRESS.md, docs/CODEMAP.md
and the code. Branch: docs/architecture-sync. Follow the GIT WORKFLOW (steps 5 to 11).

1. Walk every item marked "(verify)" and every "Built" row in docs/ARCHITECTURE.md.
   Check the code (schemas and live indexes, module folders, queue and job names,
   socket event names, Redis key patterns, route files) and correct the document where
   they differ. Do not change code in this task.
2. Verify the client route tree in Section 3.2: list every file under client/src/app,
   compare with the tree, and report missing slots, missing default.tsx, loading.tsx
   and error.tsx files, and routes that exist in code but not in the document or the
   reverse.
3. Check which of the steps C1, UX-1a, P1, UX-1, S1 have actually landed and update
   Section 1 and Section 13.3.
4. Append a "Drift report" listing every difference found and whether the code or the
   document should change.
5. Check docs/ROUTES.md against the code and list route, event, queue and key names
   that do not match.
6. Commit with "docs: architecture sync", push, open a PR. Do not merge.
```