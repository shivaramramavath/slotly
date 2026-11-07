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
- Institution and Blueprint creation (scheduled for Phase 3: Institution and Academic Management).

---

## Phase 3: Institution & Academic Management

### What Was Built
1. **Contracts Package (`@slotly/contracts`):**
   - Added Zod schemas and TypeScript types for academic entities:
     - `PeriodBreakSchema`, `PeriodConfigSchema`, `InstitutionDtoSchema`, `CreateInstitutionDtoSchema`, `UpdateInstitutionDtoSchema`.
     - `DepartmentDtoSchema`, `CreateDepartmentDtoSchema`, `UpdateDepartmentDtoSchema`.
     - `ProgramDtoSchema`, `CreateProgramDtoSchema`, `UpdateProgramDtoSchema`.
     - `AcademicYearDtoSchema`, `CreateAcademicYearDtoSchema`, `UpdateAcademicYearDtoSchema`.
     - `SemesterDtoSchema`, `CreateSemesterDtoSchema`, `UpdateSemesterDtoSchema`.
     - `BatchDtoSchema`, `SectionDtoSchema`, `CreateSectionDtoSchema`, `UpdateSectionDtoSchema`.
     - `HolidayDtoSchema`, `CreateHolidayDtoSchema`, `UpdateHolidayDtoSchema`.
     - `InstitutionStructureDto`: Full hierarchical structure tree contract with aggregated node counters.
   - Built and bundled to CJS, ESM, and DTS maps via `tsup`.

2. **Server Architecture (`server/src/modules/institutions/`):**
   - **Schemas & Persistence:** Mongoose schemas for `Institution`, `Department`, `Program`, `AcademicYear`, `Semester`, `Section`, and `Holiday` with soft delete support (`isDeleted`, `deletedAt`).
   - **Repository Layer:** Abstract repository interfaces (`IInstitutionRepository`, `IDepartmentRepository`, etc.) implemented with `Mongo*Repository` and decorated with `Cached*Repository`. Read-through caching with Redis keys (`slotly:institution:{id}`) and automatic tag-based invalidations (`institution:{id}`).
   - **Pure Logic Services:**
     - `DependencyCheckerService`: Implements Blueprint referential integrity gates (asserting active parent existence before child creation, blocking soft delete when active dependent children exist, and verifying batch capacities do not exceed section strength).
     - `TreeBuilderService`: Assembles the complete hierarchical academic tree and computes aggregate structure metrics (`totalDepartments`, `totalPrograms`, `totalAcademicYears`, `totalSemesters`, `totalSections`, `totalStudents`).
   - **Orchestration & Controller:**
     - `DefaultInstitutionsService`: Full CRUD orchestrator with Redis tree caching (`slotly:institution:{id}:tree`), `academic.changed` domain event publishing via `EventBus`, and asynchronous audit logging via BullMQ.
     - `InstitutionsController`: Exposes endpoints matching `docs/ROUTES.md` (`GET /institution/structure`, `/institution`, `/departments`, `/programs`, `/academic-years`, `/semesters`, `/sections`, `/holidays`) guarded by `@RequirePermissions` with role-based policies (ADMIN full access, DESIGNER scoped department creation, FACULTY and STUDENT read access).
   - **Unit Tests:**
     - `dependency-checker.spec.ts`: Validates parent-child referential gates, prevents orphan nodes, prevents deleting nodes with active children, and verifies batch sum capacity bounds.
     - `tree-builder.spec.ts`: Validates hierarchical tree structure construction and metric counters across empty and multi-tiered setups.
     - Full test suite: 34 tests across 11 test suites passing cleanly.

3. **Client Architecture (`client/src/features/institution/` & `/institutions`):**
   - **API Client:** `institutionApi` covering all academic CRUD operations and tree queries.
   - **Zustand Store:** `useInstitutionStore` managing cached tree structures, selected node state, active tab, and dialog controls.
   - **UI Views & Tabs (`/institutions`):**
     - **Overview:** Structure summary metric cards, quick-action shortcuts, and recent institution activity.
     - **Hierarchy Tree View (`StructureTree`):** Interactive vertical tree visualization with expand/collapse, inline add-child actions (gated with clear warnings when parent nodes are missing), edit dialogs, and deletion guards.
     - **Individual Management Tabs:** Dedicated data tables and modal dialogs for Departments, Programs, Academic Years, Semesters, Sections & Batches.
     - **Calendar & Holidays (`HolidayCalendar`):** Holiday schedule manager with event categorization badges, date ranges, and deletion confirmation dialogs.
     - **Working Days & Period Schedule (`WorkingDaysConfig`):** Day-of-week selection toggles (Mon-Sun), default period timings (start time, period duration, periods per day), and break schedules.
   - **Strict Theme Compliance:** Strict black and white tokens with semantic accents (`#FACC15` primary, `#22C55E` success, `#EF4444` danger, `#3B82F6` links) under 5% of screen surface. React 19 render-phase prop synchronization.

### Decisions Made
- **Referential Integrity Gates:** Applied strict parent existence verification (`G1` creation gate) and dependent children verification (`G4` delete gate) to enforce blueprint invariants at the academic root level.
- **Cache Tags & Invalidation:** Tagged all cached entity records and hierarchical trees with `institution:${institutionId}` so that mutations to any child element trigger immediate tag invalidation, ensuring consistency across reads.
- **Pure Domain Separation:** Isolated `DependencyCheckerService` and `TreeBuilderService` from database and framework dependencies, enabling zero-mock unit testing and reuse.
- **Render-Phase State Synchronization:** Replaced `useEffect` prop-synchronization patterns in modal dialogs with React 19 render-phase state adjustment to satisfy strict ESLint rules and eliminate re-render cascades.

### What Was Skipped
- Blueprint node drag-and-drop canvas and solver execution (scheduled for subsequent phases).

---

## Phase 4: Library (Faculty, Subjects, Elective Groups, Rooms, Import/Export)

### What Was Built
1. **Contracts Package (`@slotly/contracts`):**
   - Added permissions: `'SUBJECT_READ'`, `'SUBJECT_MANAGE'` and updated `RolePermissions` registry.
   - Added Zod schemas and TypeScript types:
     - `SlotCoordinateSchema`: Matrix coordinate representation for weekly availability grids `[day][period]`.
     - `FacultyDtoSchema`, `CreateFacultyDtoSchema`, `UpdateFacultyDtoSchema`, `FacultyWorkloadDtoSchema`.
     - `SubjectTypeSchema` (`theory`, `lab`, `tutorial`, `seminar`), `RoomTypeSchema` (`lecture`, `lab`, `seminar`).
     - `SubjectRequirementsSchema` (`roomType`, `minCapacity`, `equipment`).
     - `SubjectDtoSchema`, `CreateSubjectDtoSchema`, `UpdateSubjectDtoSchema`.
     - `ElectiveGroupDtoSchema`, `CreateElectiveGroupDtoSchema`, `UpdateElectiveGroupDtoSchema`.
     - `RoomDtoSchema`, `CreateRoomDtoSchema`, `UpdateRoomDtoSchema`.
     - `RoomMatchRequestSchema`, `RoomMatchResultSchema`, `FacultyQualificationRequestSchema`, `FacultyQualificationResultSchema`.
     - `ImportEntitySchema`, `ImportRowErrorSchema`, `ImportValidationReportSchema`, `ImportJobStatusSchema`.
   - Bundled to CJS, ESM, and DTS with `tsup`.

2. **Server Architecture (`server/src/modules/library/`):**
   - **Schemas & Persistence:** Mongoose schemas for `Faculty`, `Subject`, `ElectiveGroup`, and `Room` with 7x10 availability matrices, qualification linkages, and equipment arrays.
   - **Repository Pattern & Decorators:** Repositories (`FacultyRepository`, `SubjectRepository`, `ElectiveGroupRepository`, `RoomRepository`) decorated with `CachedRepository` using Redis keys (`slotly:faculty:{id}`, `slotly:subject:{id}`, etc.) and tag-based invalidation (`library:{institutionId}`).
   - **Strategy Pattern:**
     - `RoomMatcher` (`StandardRoomMatcher`): Computes room suitability score (0-100) based on room type, seating capacity fit, and required equipment. Reusable by Blueprint gates and Solver Engine.
     - `FacultyQualifier` (`StandardFacultyQualifier`): Validates faculty subject qualifications, designation seniority, and time slot availability.
     - `FileParser` (`CsvFileParserStrategy`, `ExcelFileParserStrategy`): Parses CSV and Excel files into typed row records with column validation and row-level error reporting.
   - **Workload & Import Services:**
     - `FacultyWorkloadService`: Calculates assigned vs max weekly hours, identifies over-allocated faculty, and calculates utilization ratios.
     - `LibraryImportService`: Validates and ingests faculty, subjects, and rooms with row-level validation reports and database persistence.
   - **Controller & Endpoints (`LibraryController`):**
     - Full CRUD for Faculty, Subjects, Rooms, and Elective Groups.
     - `/library/faculty/:id/workload`: Workload metrics calculation.
     - `/library/rooms/match`: Capacity, type, and equipment room matching.
     - `/library/faculty/match`: Subject qualification matching.
     - `/library/export/:entity`: CSV and Excel exports.
     - `/library/import/:entity`: File parsing, dry-run validation, and execution.
     - Events: Publishes `library.changed` domain event and queues audit log records.
   - **Unit Tests (17 tests across 4 test suites):**
     - `room-matcher.spec.ts`: Tests room capacity fitting, equipment matching, and room type validation.
     - `faculty-qualifier.spec.ts`: Tests subject qualification matching, unavailable slot conflict detection, and workload limits.
     - `faculty-workload.spec.ts`: Tests workload calculation, over-allocation flags, and utilization ratio formulas.
     - `file-parser.spec.ts`: Tests CSV and Excel parsing, required column validation, and row error reporting.
     - Monorepo unit test total: 51 tests across 15 suites passing cleanly.

3. **Client Architecture (`client/src/features/library/` & `/library`):**
   - **API Client:** `libraryApi` covering all CRUD, workload, matching, import, and export endpoints.
   - **Interactive Components:**
     - `AvailabilityGrid`: 7 days x 8 periods interactive grid editor for faculty and room availability, with quick toggles (all available, all unavailable, weekdays only) and monospace coordinate tooltips. Reusable in Blueprint nodes.
     - `WorkloadBar`: Monospace workload meter indicating assigned vs max weekly hours with strict semantic accent thresholds (`#22C55E` normal, `#FACC15` near limit >80%, `#EF4444` overloaded >100%).
     - `FacultyDialog`: Modal dialog for creating and editing faculty, weekly availability, subject qualifications, and workload bounds.
     - `SubjectDialog`: Modal dialog for subjects, credits, hours, elective group assignments, and room/equipment requirements.
     - `RoomDialog`: Modal dialog for rooms, capacity, building, room type, equipment tags, and availability grid.
     - `ElectiveGroupDialog`: Modal dialog for managing elective groups and simultaneous scheduling constraints.
     - `ImportWizardDialog`: Multi-step upload modal featuring file upload, dry-run validation report preview, row error inspection table, import progress bar, and completion summary.
   - **Main Library Page (`/library`):**
     - Tabbed navigation: Faculty, Subjects, Rooms.
     - Global filter toolbar: search by keyword, filter by department, toggle between active and archived resources.
     - Action buttons: Add resource, Manage Elective Groups, Import (CSV/Excel wizard), Export (CSV / Excel).
     - TanStack React Query integration with optimistic state updates and query invalidations.
   - **Theme & Design Tokens:**
     - Strict Black and White palette with CSS tokens (`#000`, `#0A0A0A`, `#111`, `#232323`, `#FAFAFA`, `#8A8A8A`).
     - Accents strictly below 5% (`#FACC15` primary/warning, `#22C55E` success/active, `#EF4444` destructive/overload).
     - React 19 render-phase prop synchronization in all modals.

### Decisions Made
- **Strategy Pattern for Room Matching & Faculty Qualification:** Decoupled matching algorithms (`StandardRoomMatcher`, `StandardFacultyQualifier`) into swappable strategies to allow the Blueprint verification gates and the Phase 7 Constraint Solver engine to reuse identical matching logic.
- **Dual-Engine File Parsing (CSV & Excel):** Standardized CSV and XLSX file parsing through a unified `FileParser` interface, returning identical typed record structures and error diagnostics.
- **Tag-Based Cache Invalidation:** Resources are tagged by institution (`library:${institutionId}`). Any addition, update, or archive invalidates the entire library cache for that institution, ensuring zero stale reads in repeat queries.
- **Render-Phase State Synchronization:** Followed React 19 rules in all library modal dialogs, synchronizing form state during render phase rather than using cascading `useEffect` hooks.

### What Was Skipped
- Blueprint canvas node placement and solver scheduling (scheduled for Phase 5: Blueprint Graph & Creation Gates and Phase 7: Constraint Solver).

---

## Next Steps
- **Phase 5:** Blueprint Graph & Creation Gates (React Flow vertical hierarchy canvas, completion-gated child node creation, validation rules, drag-and-drop connections).
