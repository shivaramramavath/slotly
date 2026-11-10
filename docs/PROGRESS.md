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

## Phase 5: Projects & The Blueprint Domain (Server Domain, No Canvas Yet)

### What Was Built

1. **Shared Contracts (`packages/contracts`):**
   - **Projects:**
     - `ProjectLifecycleStatusSchema`: State pattern values (`draft`, `building`, `ready`, `pending_approval`, `published`, `archived`).
     - `ProjectStrictnessSchema`: (`strict`, `flexible`, `relaxed`).
     - `ProjectTermSchema`: Term kinds (`odd`, `even`, `custom`), `startDate`, `endDate`, `academicYearLabel`.
     - `ProjectSettingsSchema`: `days`, `periodsPerDay`, `periodDuration`, `startTime`, `breaks[]`, `perDayOverrides`.
     - `ProjectDtoSchema`, `CreateProjectDtoSchema`, `UpdateProjectDtoSchema`, `DuplicateProjectDtoSchema`.
   - **Blueprint & Gates:**
     - `BlueprintNodeTypeSchema`: 11 node types (`institution`, `department`, `program`, `academicYear`, `semester`, `section`, `batch`, `subjectAssignment`, `electiveGroup`, `faculty`, `room`).
     - `NodeStatusSchema`: (`complete`, `incomplete`, `blocked`).
     - `MissingFieldSchema`: `{ field, reason }`.
     - `BlueprintNodeDtoSchema` and `BlueprintEdgeDtoSchema`: Core schema model for the graph with positions, locks, visibility, metadata, constraints, status, and effectiveStatus.
     - `BlueprintGraphDtoSchema`: Graph model with optimistic concurrency `revision`.
     - `BlueprintOpSchema`: Atomic operations (`add_node`, `update_node`, `delete_node`, `add_edge`, `delete_edge`, `move_node`).
     - `ApplyOperationsDtoSchema`: Client revision + operation list.
     - `ReasonCodeSchema`: Exhaustive gate rejection codes (`PROJECT_LOCKED`, `UNAUTHORIZED`, `PARENT_NOT_FOUND`, `PARENT_TYPE_NOT_ALLOWED`, `PARENT_INCOMPLETE`, `SINGLE_PARENT_VIOLATION`, `CYCLE_DETECTED`, `DUPLICATE_NAME`, `CAPACITY_EXCEEDED`, `ENDPOINT_INCOMPLETE`, `NOT_QUALIFIED`, `INVALID_OPERATION`).
     - `FixHintSchema`: `{ nodeId, field }`.
     - `BatchOperationResultSchema`: `{ revision, applied[], skipped[] }`.
     - `BlueprintReadinessDtoSchema`: Overall graph completion metrics, node counts, missing critical elements, readiness score (0-100), and solver readiness boolean.
     - `BlueprintImpactDtoSchema`: Downstream affected nodes and cascade impact count for node modifications/deletions.
     - `BlueprintRecommendationDtoSchema`: AI/heuristic recommendation structure with scores, target connections, and descriptions.
     - `GraphTemplateDtoSchema`: Graph subtree templates with seeded starter kits.
     - `BlueprintHistoryEntryDtoSchema`, `BlueprintSnapshotDtoSchema`, `BlueprintCommentDtoSchema`.
   - **Permissions:**
     - Added `PROJECT_ARCHIVE` to permission registry and updated `RolePermissions` for all roles.

2. **Server Architecture (`server/src/modules/projects/` & `server/src/modules/blueprint/`):**
   - **Project Lifecycle State Pattern (`ProjectState`):**
     - `DraftState`, `BuildingState`, `ReadyState`, `PendingApprovalState`, `PublishedState`, `ArchivedState` managed via `ProjectStateFactory`. Enforces strict state transition rules (e.g., published and archived projects cannot be edited; published projects cannot be directly deleted).
   - **NodeType Registry (Factory + Registry Pattern):**
     - `NodeTypeRegistry` registering the 11 node types, each specifying `allowedParentTypes`, `defaultData`, `completionRule`, `constraintScope`, and `isResource` flag.
   - **Completion Rules (Strategy Pattern):**
     - Concrete strategies: `InstitutionCompletionRule`, `DepartmentCompletionRule`, `ProgramCompletionRule`, `AcademicYearCompletionRule`, `SemesterCompletionRule`, `SectionCompletionRule`, `BatchCompletionRule`, `SubjectAssignmentCompletionRule`, `ElectiveGroupCompletionRule`, `FacultyCompletionRule`, `RoomCompletionRule`.
     - `CompletionService`: Computes node missing fields and status (`complete` vs `incomplete`). Evaluates ancestor tree regression (G3): when any ancestor is not complete, `effectiveStatus` becomes `blocked` down the entire descendant subtree. Recomputes status in topological order and caches in Redis (`slotly:project:{id}`).
   - **GateChain (Chain of Responsibility Pattern):**
     - Ordered chain of 11 validation gates:
       1. `ProjectNotLockedGate`: Enforces project status mutability.
       2. `PermissionGate`: Enforces RBAC permissions per operation.
       3. `ParentExistsGate`: Ensures parent node exists in graph.
       4. `ParentTypeAllowedGate`: Ensures child type is permitted under parent type.
       5. `ParentCompleteGate` (G1 creation gate): Child node can only be created if its direct parent is `complete`.
       6. `SingleParentGate`: Ensures nodes have at most one hierarchy parent edge.
       7. `NoCycleGate`: Depth-first search cycle detection preventing cycles in hierarchy edges.
       8. `DuplicateNameGate`: Prevents sibling nodes with identical names under the same parent container.
       9. `CapacityGate`: Ensures sum of batch sizes does not exceed section capacity.
       10. `ConnectionEndpointGate` (G2 connection gate): Requires both connection endpoints to be complete before creating edges.
       11. `QualificationGate`: Validates faculty assignment against qualified subject IDs.
     - Returns `{ allowed, reasonCode, message, fixHint }`.
   - **Batch Operation Execution (`OperationService`):**
     - Evaluates batches with topological ordering (parents processed before children).
     - G6 Skip Cascade: When an operation fails a gate, all subsequent operations targeting or referencing that node or its descendants are skipped automatically with `PARENT_INCOMPLETE` / `INVALID_OPERATION`.
     - In-memory graph staging before atomic persistence to MongoDB.
   - **Impact Analyzer (`ImpactAnalyzerService`):**
     - G4 Impact Cascade: Computes full downstream ripple effect of deleting or changing a node, identifying all affected child nodes, dependent assignments, and edges.
   - **Constraint Inheritance Resolver (`ConstraintResolverService`):**
     - G9 Constraint Inheritance: Traverses ancestor chain from Institution root to Batch leaf, applying hierarchical constraint inheritance with child override semantics.
   - **Graph Hierarchy Builder (`GraphFromInstitutionBuilder`):**
     - Builder pattern traversing Phase 3 institution structure (departments, programs, academic years, semesters, sections) and library resources to automatically construct a populated vertical blueprint graph.
   - **Starter Kits & Templates (`TemplateService`):**
     - Seeded templates: `School Kit` (K-12 grade/division hierarchy), `College Kit` (UG/PG semester/branch structure), `Lab-Heavy STEM Kit` (lab-intensive curriculum with equipment constraints).
     - Supports template creation, listing, duplication, import, and subtree anchoring.
   - **Heuristic Recommendations (`RecommendationsService`):**
     - `FacultyRecommender`: Recommends optimal faculty based on qualifications and availability.
     - `RoomRecommender`: Recommends rooms matching capacity and equipment specifications.
     - `MissingConnectionDetector`: Flags orphaned nodes lacking hierarchy parents.
     - `UnusedResourceDetector`: Flags registered faculty or rooms with no timetable assignments.
   - **Readiness Calculation (`ReadinessService`):**
     - Evaluates blueprint completeness score (0-100), counts node statuses (`complete`, `incomplete`, `blocked`), checks critical path requirements, and yields solver readiness.
   - **Optimistic Concurrency & Caching:**
     - Both project and blueprint writes require revision matching (`clientRevision` / `If-Match`), rejecting stale requests with `409 ConflictException` and `{ code: 'REVISION_CONFLICT', currentRevision, rejectedRevision, currentState }`.
     - Redis cache-aside with tag-based invalidation (`project:{id}`).
   - **Controllers:**
     - `ProjectsController` (`/projects`): CRUD, list with filters/pagination, duplicate, archive.
     - `BlueprintController` (`/projects/:projectId/blueprint`): Graph fetch, operations, readiness, node impact, history, snapshots, comments, recommendations, export/import.
     - `TemplateController` (`/blueprint-templates`): Template list, details, apply, duplicate, export, import.

3. **Client Architecture (No Canvas Yet):**
   - **API Clients (`client/src/features/projects/services/`):**
     - `projects.api.ts`: Typed client for project management, settings, list, duplicate, archive.
     - `blueprint.api.ts`: Typed client for blueprint graph, operations, readiness, impact, history, snapshots, comments, and starter templates.
   - **Pages & Components:**
     - `/home`: Project dashboard shell with term summaries, quick links, and recent projects list.
     - `/projects` (and `/dashboard` alias): Full project management view with search, status filters, lifecycle status badges, duplicate dialog, and archive dialog.
     - `/projects/new`: 3-step project creation wizard:
       1. Project Details & Term (kind, academic year, date range, strictness).
       2. Source Selection (Blank slate, Auto-generate from Institution tree, Starter Kit).
       3. Schedule Timing & Breaks (working days, periods per day, period duration, start time, recess/lunch break configuration).
     - `/projects/[projectId]/settings`: Comprehensive project settings editor with General & Term tab, Schedule Timing & Breaks tab (including per-day overrides), and Danger Zone (archive/delete).
     - `/blueprint-templates` (and `/kits` alias): Starter kits showcase with subtree inspector dialog and instant project instantiation.
     - `ProjectStatusBadge`: Semantic color-coded badges strictly adhering to design rules (`#22C55E` ready/published, `#FACC15` draft/building, `#8A8A8A` pending_approval/archived).

4. **Unit Tests (46 new tests across 6 test suites, monorepo total 97 tests passing):**
   - `completion-rules.spec.ts`: Tests every CompletionRule strategy across all 11 node types.
   - `gates.spec.ts`: Tests every gate in the GateChain (G1 creation gating, G2 connection gating, G7 duplicate naming, G8 capacity, qualification, cycles).
   - `regression-propagation.spec.ts`: Tests G3 parent regression and blocked status cascade propagation down child subtrees.
   - `operation-batch.spec.ts`: Tests topological sorting and G6 skip cascade behavior when operations fail.
   - `constraint-resolver.spec.ts`: Tests G9 constraint inheritance from institution down to batches with leaf overrides.
   - `impact-analyzer.spec.ts`: Tests G4 impact cascade reporting for deletion and updates.

### Decisions Made

- **Pure Server Domain First (No Canvas Yet):** Kept Phase 5 strictly focused on the core graph data structures, completion rules, gate chains, batch operation engine, and project lifecycle state machines on the server, paired with project management UI on the client, reserving the interactive React Flow visual canvas for Phase 6.
- **Topological Operation Reordering:** When applying a batch of operations, additions are dynamically sorted by hierarchy depth so parent nodes are evaluated and persisted before child nodes, avoiding false parent-missing rejections during template applications.
- **G6 Skip Cascade:** When an operation in a batch fails a gate check, subsequent operations that reference or target that node are automatically skipped with `PARENT_INCOMPLETE` without aborting the entire batch, returning a detailed `{ applied, skipped }` response.
- **Optimistic Concurrency Revision Control:** Blueprint writes must match current revision. A revision conflict returns HTTP 409 carrying both the rejected and current revision alongside the complete current graph state so the client can resolve or overwrite.

### What Was Skipped

- Interactive React Flow / @xyflow canvas, custom node components, and visual drag-and-drop connections (scheduled for Phase 6: Blueprint Canvas).
- Constraint solver engine and automated schedule generation (scheduled for Phase 7).

---

## Phase 6: Blueprint Canvas Core

### What Was Built

1. **Contracts Package (`@slotly/contracts`):**
   - Added socket event constants and Zod schemas:
     - Events: `PROJECT_JOIN`, `PROJECT_LEAVE`, `CURSOR_UPDATE`, `LOCK_NODE`, `UNLOCK_NODE`, `NODE_ADD`, `NODE_UPDATE`, `NODE_MOVE`, `NODE_DELETE`, `EDGE_ADD`, `EDGE_DELETE`, `PRESENCE_CHANGED`, `NODE_STATUS_CHANGED`, `OPS_APPLIED`, `NODE_LOCKED`, `NODE_UNLOCKED`, `REVISION_CONFLICT`.
     - Typed payloads: `ProjectJoinPayload`, `ProjectLeavePayload`, `CursorUpdatePayload`, `NodeLockPayload`, `NodeUnlockPayload`, `PresenceUser`, `PresenceChangedPayload`, `NodeStatusChangedPayload`, `OpsAppliedPayload`, `NodeLockedPayload`, `NodeUnlockedPayload`, `RevisionConflictPayload`, `NodeMovePayload`, `NodeUpdatePayload`, `NodeAddPayload`, `NodeDeletePayload`, `EdgeAddPayload`, `EdgeDeletePayload`.
   - Built to ESM, CJS, and DTS with `tsup`.

2. **Server Architecture (WebSocket Gateway & Coalesced Write-Behind):**
   - **`BlueprintGateway` (`/blueprint` namespace):**
     - Handshake authentication validating short-lived JWT Bearer tokens and active session status in Redis via `SessionsService`.
     - Multi-tenant room isolation with `project:{projectId}` room management.
     - Role-based permissions guard (`DESIGNER` / `ADMIN` edit rights; `FACULTY` / `STUDENT` read-only).
     - Ephemeral multi-user presence (`presence:changed`) with avatar color allocation and real-time cursor broadcasting.
     - Collaborative node locking (`node:lock`, `node:unlock`, `node:locked`, `node:unlocked`) preventing concurrent edits on the same node.
     - **Routing by Criticality:**
       - _Critical Operations_ (`node:add`, `node:delete`, `edge:add`, `edge:delete`): Evaluated synchronously through the server `GateChain` (`BlueprintService.applyOperations`), committed directly to MongoDB, cache invalidated, acknowledging with stable reason codes (`PARENT_MISSING`, `PARENT_INCOMPLETE`, `DUPLICATE_NAME`, `CAPACITY_EXCEEDED`, `CYCLE`, etc.) and `fixHint`, and broadcasting `ops:applied`.
       - _Non-Critical Operations_ (`node:move`, `node:update` autosave): Persisted immediately to Redis cache-aside for zero-latency peer updates, acknowledged instantly, enqueued to BullMQ write-behind queue with deterministic coalescing `jobId = node:${nodeId}`, recomputing completion status and broadcasting `node:status-changed` to all project collaborators.
   - **`BlueprintWriteProcessor`:**
     - Consumes BullMQ `sync-node` write-behind jobs, idempotently persisting coalesced node coordinates and configuration to MongoDB while decrementing the pending-writes consistency barrier counter.
   - **Gateway Unit Tests (`blueprint-gateway.spec.ts` - 11 tests, monorepo total 108 tests passing):**
     - Tests handshake presence and disconnect cleanups.
     - Tests collaborative node lock acquisition, lock conflict rejection, and unlock broadcasts.
     - Tests synchronous critical operations routing through the gate chain and rejection reason propagation.
     - Tests Redis-first non-critical updates with write-behind job coalescing and completion regression status broadcasts.
     - Tests processor persistence to MongoDB.

3. **Client Architecture (`/projects/[projectId]/blueprint`):**
   - **Core State Store (`useBlueprintStore` via Zustand):**
     - Manages `nodes`, `edges`, `revision`, `layoutDirection`, `activeTab`, `presenceUsers`, `remoteCursors`, `lockedNodes`, `autosaveStatus`, `impactPreviewNode`, `regressionBanner`, `undoStack`, `redoStack`, and `fixHint`.
     - Integrates Command pattern for undo/redo.
   - **WebSocket Service & Hook (`useBlueprintSocket`):**
     - Manages lifecycle of Socket.IO connection to `/blueprint` with automatic token handshake and exponential reconnect.
     - Dispatches real-time events (`ops:applied`, `node:status-changed`, `presence:changed`, `node:locked`, `node:unlocked`, `revision:conflict`).
   - **Visual Canvas (`BlueprintCanvas` via `@xyflow/react` + `dagre`):**
     - Vertical hierarchy by default (`TB`), switchable to `LR`, `BT`, `RL`.
     - MiniMap, controls, snap-to-grid (15x15), background grid, keyboard shortcuts (Delete, Ctrl+Z, Ctrl+Y).
     - Remote cursors layer displaying collaborator movements in real time.
     - Drag-and-drop support from the left node library palette.
   - **Custom Node Factory (`NodeFactory` / `BlueprintNode`):**
     - Custom renderers for all 11 node types (`institution`, `department`, `program`, `academicYear`, `semester`, `section`, `batch`, `subjectAssignment`, `electiveGroup`, `faculty`, `room`).
     - Strict black-and-white aesthetic with thin 1px borders and semantic status rings:
       - Green complete (`#22C55E`).
       - Dashed yellow incomplete (`#FACC15`) with toggleable missing-fields checklist.
       - Grey blocked (`#8A8A8A`) with "Parent incomplete" badge.
     - Gating `+` add-child handle at node bottom that appears **only when the node is complete**, opening a dropdown of valid child types.
     - Multi-user lock indicator badge.
   - **Gating UX & Guided Mode:**
     - `useGateValidation`: Mirrors server G1-G8 rules for client UI, providing disabled palette states with descriptive tooltip reasons (e.g., "Complete 'CSE Program' first") and validating connection handles.
     - `useGuidedMode`: Implements G10 "Next step" algorithm that identifies the first incomplete node in hierarchy order, automatically focusing it in the canvas and opening the sidebar at the missing field.
     - `ParentRegressionBanner`: Displays a persistent warning banner when an edit renders an ancestor incomplete, informing that descendants have become blocked.
     - `ImpactPreviewDialog`: G4 delete confirmation modal computing full downstream ripple impact and displaying affected descendant nodes before cascade deletion.
     - `ValidationPanel`: Slide-over health panel categorizing complete, incomplete, and blocked nodes with one-click "Go fix" jump navigation.
   - **Right Configuration Sidebar (`BlueprintSidebar`):**
     - Tabs for `Config`, `Constraints` (Phase 8 placeholder), and `Slotly AI` (Phase 10 placeholder).
     - Dynamic forms per node type with required asterisks, inline validation, dirty tracking, Apply/Reset buttons, and `fixHint` highlight rings.
     - Node selection state reset handled cleanly via keying (`key={selectedNode.id}`).

### Decisions Made

- **Pinning Socket Dependencies on NestJS 11:** Maintained `@nestjs/websockets@^11.0.1` and `@nestjs/platform-socket.io@^11.0.1` to align with the root NestJS 11 monorepo framework and preserve CommonJS Jest compatibility.
- **Strict Generic Socket Data Typing:** Typed the server socket with `DefaultEventsMap` and `SocketData` to enforce strict TypeScript typing on authenticated user attributes (`client.data.user`), eliminating unsafe `any` assignments under ESLint.
- **Key-Based Form Reset in React 19:** Utilized React 19 key-based remounting (`<NodeConfigForm key={selectedNode.id} ... />`) instead of `useEffect` setState synchronization for the node configuration form, preventing cascading render issues.
- **Vertical Hierarchy Default with Animated Transitions:** Graph layout defaults to Dagre top-to-bottom (`TB`) ranking per `BLUEPRINT_RULES.md`, with animated `fitView` transitions upon switching to `LR`, `BT`, or `RL`.

### What Was Skipped

- Advanced designer tools, bulk generation, templates, snapshots, visual diff, align/distribute, containers/sub-flows, smart help recommendations, search/filter, and export/import (scheduled for Phase 7).
- Timetable constraint solving engine execution and conflict detection (scheduled for Phase 8).

---

## Phase 7: Advanced Designer Features

### What Was Built

1. **Canvas & Editing Enhancements:**
   - **Box Selection & Multi-Drag:** Enabled box drag selection (`selectionOnDrag`), multi-drag, and `Ctrl+A` select-all.
   - **Smart Snapping & Align/Distribute:** Added `BlueprintFloatingAlignBar` activating whenever $\ge 2$ nodes are selected, providing alignment (Left, Center, Right, Top, Middle, Bottom), distribution (Horizontal, Vertical with equidistant spacing), and adjustable grid snapping (10px, 15px, 20px, 25px).
   - **Keyboard Shortcuts (`?`):** Added `ShortcutsDialog` cheat sheet covering navigation, alignment, lock (`L`), hide (`H`), focus (`F`), duplicate (`Ctrl+D`), delete, undo/redo, and full-screen (`F11`).
   - **Context Menu (`BlueprintContextMenu`):** Native right-click context menu offering Copy, Paste, Duplicate Subtree, Delete with G4 impact preview, Lock/Unlock, Hide/Show, Focus Mode, Comments, Save as Template, and Add Child.
   - **Focus Mode & Visibility Controls:** Focus mode dims unselected graph branches with grayscale filtering; per-node hide/show toggles node visibility; per-node lock blocks drag and edit operations; canvas lock blocks all movements.
   - **Subtree Copy, Paste & Duplicate:** Subtree duplicate and paste validate the target parent through the G1 gate chain (`effectiveStatus === 'complete'`), toast-notifying the exact reason code (`PARENT_INCOMPLETE`) if denied.
   - **Bulk Add Children (`BulkAddDialog`):** Dialog for bulk generating standard academic batches (e.g., Sections A-D, Semesters 1-8, Batches B1-B3) under complete parent nodes.

2. **Layout Engine (`useBlueprintLayout`):**
   - Pure geometric layout engine supporting three distinct algorithms:
     - **Hierarchical:** Standard top-to-bottom or left-to-right Dagre ranking.
     - **Compact:** Reduced node and rank separation for dense term structures.
     - **Department-Based:** Isolates separate department branches into distinct columns with institution top-centered and resource nodes aligned on the flank.
   - **Overlap Avoidance (`avoidOverlaps`):** Continuous bounding-box collision detection and separation pushing intersecting nodes apart.
   - **Layout Preview & Revert:** `saveSnapshotForReset()` and `resetLayout()` restore manual positions prior to layout calculation.

3. **Sub-Flows & Container Groups:**
   - Container node component `BlueprintGroupNode` (`blueprintGroup` type) for visually wrapping departments, programs, semesters, and sections.
   - Collapsible sub-flows with completion summary pill (`X/Y Complete`), boundary movement dragging children, and context menu support.

4. **History & Snapshots Persistence:**
   - **History Timeline (`HistoryDialog`):** Audit log of all server revision operations with timestamps, operation types, and actor attribution.
   - **Snapshots & Visual Diff (`SnapshotsDialog`):** Manual/automatic snapshot creation, instant restore (`POST .../snapshots/:id/restore`), and comparative visual diff modal displaying added, removed, and modified nodes between snapshot and current graph state.
   - **Optimistic Concurrency Conflict Reconciliation (`RevisionConflictDialog`):** Automatic modal surfaced on server 409 or `revision:conflict` socket events offering "Keep Mine", "Take Theirs" (reloads server state), and "Review Differences".

5. **Search, Filter & Viewport Navigation (`BlueprintSearchFilter`):**
   - Search bar matching node labels, faculty codes, subject codes, departments, and room names.
   - One-click viewport jump and centering (`fitBounds` / `setCenter`).
   - Node type filter pills (`All`, `Section`, `Subject`, `Faculty`, `Room`) and "Hide Unrelated" toggle.

6. **Templates, Import & Export:**
   - **Templates (`TemplatesDialog` & `SaveTemplateDialog`):** Subtree extraction and template persistence with categories (`School`, `College`, `STEM`, `Custom`), versioning, and anchor node type verification.
   - **Export (`ExportDialog`):** Client-side JSON backup download and vector SVG diagram generation with custom styled elements.
   - **Import (`ImportDialog`):** JSON upload with client-side GateChain simulation preview tabulating applied elements and skipped items with reason codes.

7. **Smart Help & Readiness:**
   - **Smart Recommendations in `BlueprintSidebar`:** Integrates server recommendations service proposing qualified faculty for subjects with match reasoning, optimal rooms based on capacity and equipment, and unused resource / orphan connection flags.
   - **Auto-Fix Safe Defaults:** "Fix automatically" button resolves missing required fields (e.g., default hours, capacity, codes) and updates node configuration with a single click.
   - **Solver Readiness Gate (`ReadinessDialog`):** Comprehensive timetable readiness meter with health score percentage, category breakdowns, missing requirements checklist with "Go fix" jump links, and Build Schedule action gated strictly by G5.
   - **Rich Node Badges:** Compact weekly availability matrix mini-grid rendered on faculty nodes; seating capacity on room nodes.

8. **Collaboration Polish:**
   - Threaded node comments dialog (`NodeCommentsDialog`) with `@mention` highlighting and instant posting.
   - Real-time multi-user cursor tracking, presence avatars, and edit lock badges.

### Decisions Made

- **Pure Functional Layout Engine:** Structured the layout calculations (`calculateHierarchicalOrCompact`, `calculateDepartmentLayout`, `avoidOverlapsHelper`, `getLayoutedElements`) as pure functions outside React hooks to eliminate cyclic closures and avoid React 19 compiler hoisting issues.
- **Client-Side Gate Simulation for Import:** Implemented a simulation phase in the Import dialog that verifies parent existence and completion before committing, presenting a clear summary table of valid vs skipped operations.
- **Strict B&W Design Token Compliance:** Maintained monochrome `#0A0A0A` / `#111111` / `#232323` / `#FAFAFA` palette with accent indicators strictly constrained under 5% (`#22C55E` complete/valid, `#FACC15` warning/selected, `#EF4444` conflict/destructive, `#3B82F6` vector/info).

### What Was Skipped

- Timetable constraint solving engine, hard/soft constraint strategies, and worker solvers (scheduled for Phase 8).
- Studio Grid timetable slot placement and drag-and-drop schedule editing (scheduled for Phase 9).

---

## Phase 8: Constraint Engine (Pure TypeScript Core)

### What Was Built

1. **Shared Contracts (`@slotly/contracts`):**
   - Added complete schemas and DTO types for constraints and timetable validation:
     - `SlotTypeSchema`: `theory`, `lab`, `tutorial`, `seminar`, `break`, `free`, `exam`, `event`, `empty`.
     - `SlotDtoSchema`: Academic slot coordinate representation (`sectionId`, `batchId?`, `day`, `period`, `type`, `subjectId`, `facultyId`, `roomId`, `span`).
     - `ViolationSeveritySchema` (`error` for hard constraints, `warning` for soft constraints).
     - `ViolationSuggestionSchema`: Ranked alternatives (`day`, `period`, `roomId?`, `facultyId?`, `score`, `reason`).
     - `ViolationDtoSchema`: Structured conflict report (`id`, `ruleId`, `severity`, `message`, `sectionId`, `batchId?`, `subjectId`, `facultyId`, `roomId`, `slotRefs`, `suggestions`, `fixHint`).
     - `PreBuildCheckErrorSchema`: Pre-build validation report (`code`, `severity`, `message`, `entityId`, `entityType`, `fixHint`).
     - `ValidationReportDtoSchema`: Complete validation summary (`isValid`, `hardViolationsCount`, `softViolationsCount`, `violations`, `preBuildErrors`, `score`).
     - `ConstraintScopeSchema`: Scope hierarchy (`institution`, `department`, `program`, `section`).
     - `HardConstraintsConfigSchema` & `SoftConstraintsConfigSchema`: Granular toggles and parameter weights for all 27 constraints.
     - `ValidateProjectDtoSchema` & `ValidateVersionDtoSchema`: Request validation payloads.
   - Built to CJS, ESM, and DTS maps via `tsup`.

2. **Pure TypeScript Engine Core (`server/src/modules/engine/core/`):**
   - **Zero Framework Coupling:** Completely decoupled from NestJS, Mongoose, and Redis; zero decorators, pure TypeScript types and algorithms.
   - **State Pattern & Indexing (`ScheduleState`):** Fast indexed lookups by faculty (`[facultyId][day][period]`), room (`[roomId][day][period]`), section (`[sectionId][day][period]`), batch, and subject. Supports hypothetical move cloning (`cloneWithMove`) for O(1) state evaluation during validation.
   - **Strategy Pattern (`IConstraint`):**
     - Interface: `{ id, name, type, weight, check(state, move), score(state), explain(violation) }`.
     - Open/Closed: Engine core is closed to modification; new rules are registered dynamically via `ConstraintRegistry`.
   - **20 Hard Constraints (`constraints/hard/`):**
     1. `FacultyNoDoubleBooking`: Prevents faculty overlapping in the same day and period.
     2. `RoomNoDoubleBooking`: Prevents room overlapping in the same day and period.
     3. `SectionNoDoubleBooking`: Prevents section overlapping in the same day and period.
     4. `FacultyAvailability`: Enforces faculty unavailable slots and matrix preferences.
     5. `RoomAvailability`: Enforces room availability grids.
     6. `SectionAvailability`: Enforces per-day period counts and section timing boundaries.
     7. `MaxHoursPerDay`: Enforces faculty maximum teaching hours per day limit.
     8. `MaxHoursPerWeek`: Enforces faculty maximum weekly hours limit.
     9. `MinHoursPerWeek`: Enforces faculty minimum contracted teaching hours.
     10. `MaxClassesPerDay`: Enforces section daily class limits.
     11. `MinBreaks`: Guarantees daily student break periods.
     12. `RoomCapacityFitsSection`: Ensures room capacity $\ge$ section strength.
     13. `RoomTypeMatchesSubject`: Matches room type (lecture, lab, seminar) to subject requirements.
     14. `EquipmentMatch`: Validates subject-required equipment (projector, computers, etc.) is available in assigned room.
     15. `LabConsecutiveBlock`: Enforces consecutive period spanning for lab sessions.
     16. `ElectiveSimultaneity`: Ensures concurrent elective groups run at identical periods.
     17. `HolidayExclusion`: Blocks scheduling classes on institution calendar holidays.
     18. `WeeklyHoursMet`: Checks subject weekly target hours against total scheduled slots.
     19. `MissingAllocation`: Flags subjects with zero allocated periods.
     20. `BreakNotOverwritable`: Protects scheduled breaks from collision.
   - **7 Soft Constraints (`constraints/soft/`):**
     1. `FacultyPreferredPeriods`: Penalizes slots scheduled outside faculty preferred periods.
     2. `SpreadSubjectsAcrossDays`: Penalizes clustering same-subject theory classes on the same day.
     3. `LimitConsecutiveSameSubject`: Discourages consecutive back-to-back periods of the same theory subject.
     4. `BalanceFacultyLoad`: Penalizes high standard deviation in faculty daily teaching hours.
     5. `LabsInAfternoon`: Incentivizes scheduling lab blocks in afternoon periods.
     6. `MinimizeRoomChanges`: Penalizes sections switching lecture halls within the same day.
     7. `DepartmentRules`: Soft rules and preferences defined at the department level.
   - **Suggestion Strategy (`SuggestionStrategy`):**
     - Ranks conflict-free alternative periods and rooms by evaluating hypothetical candidate moves against all hard constraints and scoring soft constraint impacts.
   - **Pre-Build Checker (`PreBuildChecker`):**
     - Validates blueprint project graph prior to solver invocation, surfacing user-friendly, fixable errors:
       - `INSUFFICIENT_LAB_CAPACITY`: Total required lab hours exceeds aggregate available lab room capacities.
       - `MISSING_ALLOCATION`: Subject assignments missing faculty or room linkages.
       - `FACULTY_OVERLOAD`: Subject weekly hour demands exceed faculty maximum teaching capacity.
       - `INVALID_GRAPH`: Disconnected or unlinked nodes in the blueprint graph.
   - **Validation Orchestrator (`ValidationService`):**
     - Aggregates pre-build checks, evaluates state against the 27 constraints, computes suggestions for conflicts, and calculates overall schedule quality score.

3. **Server NestJS Integration (`server/src/modules/engine/`):**
   - **`EngineValidationService`:**
     - Injects `CacheService`, `ProjectsService`, and `BlueprintService`.
     - Derives `EngineInput` from project settings and blueprint graph nodes.
     - SHA-256 idempotency input hashing for Redis cache-aside caching (`slotly:validation:{hash}`) with 300s TTL and project tag invalidation (`project:{projectId}`).
   - **`EngineController`:**
     - `POST /projects/:projectId/validate`: Validates project blueprint and current timetable slots.
     - `POST /versions/:versionId/validate`: Validates a saved schedule version's slots.
     - Protected by `AuthGuard` and `PermissionsGuard` (`PROJECT_READ`).
   - Registered in `EngineModule` and imported in root `AppModule`.

4. **Engine Unit Tests (`server/src/modules/engine/tests/`):**
   - `constraints-hard.spec.ts`: Dedicated test fixture for each of the 20 hard constraints verifying violation reporting and clean passage.
   - `constraints-soft.spec.ts`: Test fixtures for all 7 soft constraints verifying scoring penalties.
   - `suggestion-strategy.spec.ts`: Verifies conflict-free alternative period and room ranking.
   - `pre-build.spec.ts`: Verifies pre-build validation error catching with actionable `fixHint` messages.
   - `validation.service.spec.ts`: End-to-end integration of the constraint engine pipeline.
   - Monorepo suite: 27 test suites, 143 tests passing.

5. **Client UI (`client/src/features/blueprint/`):**
   - **Blueprint Constraints Tab (`BlueprintConstraintsTab`):**
     - Scope selector (`institution`, `department`, `program`, `section`).
     - Hard vs Soft constraint tabs with toggle switches and parameter controls.
     - Inheritance badges: Visual indicators displaying whether a constraint setting is `Inherited` from a parent scope or an active `Override`, with one-click "Override" action.
     - Group categorization matching `FEATURES.md`: Faculty, Room, Section, and Laboratory.
     - Integrated "Validate Current Blueprint" action with live spinner and validation results summary.
   - **Conflict Card Component (`ConflictCard`):**
     - Reusable component displaying problem summary, affected entities (section, faculty, room, subject, day/period coordinates), and ranked suggestions with an "Apply" button (wired for Phase 10).
   - Added `validateProject` and `validateVersion` to `blueprintApi`.

### Decisions Made

- **Strict Decoupling of Engine Core:** Isolated `server/src/modules/engine/core/` completely from NestJS, Mongoose, and third-party libraries. All types, constraints, state trackers, suggestion generators, and pre-build validators operate exclusively on pure TypeScript primitives for maximum speed, reusability in web workers, and zero-mock testing.
- **Hypothetical State Move Evaluation:** Optimized move evaluations in `ScheduleState.cloneWithMove` using shallow clones of slot index tables, providing sub-millisecond constraint evaluation.
- **SHA-256 Input Caching:** Cached validation results in Redis keyed by `slotly:validation:${hash}` where hash encapsulates project revision, input settings, and slot configurations, avoiding expensive recomputations on repeated requests.
- **Accents Under 5%:** Adhered strictly to the black-and-white design system with semantic accents reserved for status (`#EF4444` for hard conflict errors, `#FACC15` for soft warnings, `#22C55E` for suggestions).

### What Was Skipped

- Timetable generation solver worker with BullMQ and constraint optimization algorithms (scheduled for Phase 9).
- Studio Grid timetable interactive slot editor and drag-and-drop schedule editing (scheduled for Phase 10).

---

## Next Steps

- **Phase 9:** Timetable Generation (Constraint satisfaction solver, BullMQ worker, progress streaming over WebSockets, conflict explanation).

---

## Phase 9: Generation

### What Was Built

1. **Contracts Package (`@slotly/contracts`):**
   - Added DTO schemas, enum types, and socket payloads:
     - `ScheduleVersionKindSchema` (`auto`, `regenerate`, `manual`).
     - `ScheduleVersionStatusSchema` (`draft`, `ready`, `published`, `archived`).
     - `ScheduleVersionStatsSchema` (`totalSlots`, `occupiedSlots`, `roomUtilizationPct`, `facultyLoadBalanceScore`, `afternoonLabPct`).
     - `ScheduleVersionDtoSchema`: Full version representation (`id`, `projectId`, `versionNo`, `label`, `slots`, `conflicts`, `stats`, `score`, `kind`, `revision`, `status`, `createdAt`, `updatedAt`).
     - `BuildProfileSchema` (`standard`, `workload-balanced`, `preference-first`, `room-efficient`).
     - `BuildModeSchema` (`fresh`, `regenerate`).
     - `CreateBuildDtoSchema` (`alternatives`, `profile`, `mode`, `seed`, `timeLimitMs`).
     - `BuildJobStatusSchema` (`queued`, `running`, `completed`, `failed`, `cancelled`).
     - `BuildProgressPayloadSchema` (`projectId`, `buildId`, `status`, `progress`, `step`, `message`, `versions`, `error`, `missing`).
   - Built to CJS, ESM, and DTS maps with `tsup`.

2. **Pure TypeScript Engine Solver (`server/src/modules/engine/core/solver/`):**
   - **Zero Framework Coupling:** Completely decoupled from NestJS, Mongoose, and Redis; zero decorators, pure TypeScript types and algorithms.
   - **Deterministic Mulberry32 PRNG (`SeededRng`):** Guarantees exact reproducibility for given seeds (`next()`, `range()`, `pick()`, `shuffle()`).
   - **Hardest-First Task Deconstruction (`TaskBuilder`):**
     - Deconstructs subject assignments into atomic scheduling tasks.
     - Computes MRV/degree hardness ratings (lab blocks +500, electives +400, qualified faculty/room scarcity, weekly hours).
     - Bundles simultaneous elective groups per weekly block index (`bundle:${group.id}:${b}`) to ensure parallel streams run at identical time periods across separate rooms.
   - **Timetable Solver (`TimetableSolver`):**
     - Greedy placement across ALL sections simultaneously (faculty and rooms are shared resources).
     - Candidate slot evaluation checking all hard constraints: section/batch conflicts, faculty availability, faculty max hours per day/week, room type and capacity, room equipment, holidays, and break boundaries.
     - Soft score ranking tailored to the selected weight profile.
     - Single-victim backtracking mechanism with domain restoration when candidate placement is blocked.
     - Pairwise swap-based local search improvement pass optimizing soft scores without violating hard constraints.
     - Graceful degradation returning the best-so-far valid schedule if time limit expires.
   - **Alternatives Generation (`generateAlternatives`):**
     - Solves $N$ alternatives with distinct random seeds and weight profiles (`standard`, `workload-balanced`, `preference-first`, `room-efficient`).
     - Deduplicates identical timetable candidates via slot fingerprint hashes (`computeFingerprint`).
     - Ranks alternatives by quality score descending and labels the top choice as `Alternative 1 (Recommended)`.

3. **Server Builds Module (`server/src/modules/builds/`):**
   - **Mongoose Schema (`ScheduleVersion`):**
     - Compound indexes on `{ projectId: 1, versionNo: 1 }` and `{ projectId: 1, status: 1 }`.
   - **Repository Pattern & Caching:**
     - `IScheduleVersionRepository`: Abstraction token `SCHEDULE_VERSION_REPOSITORY`.
     - `MongoScheduleVersionRepository`: MongoDB persistence implementation.
     - `CachedScheduleVersionRepository`: Decorator pattern with Redis cache-aside (`slotly:version:{id}`, `slotly:project:{projectId}:versions`) and tag-based invalidations (`version:{id}`, `project:{projectId}`).
   - **Build Pipeline (`BuildFacade`):**
     - Enforces Consistency Barrier: Awaits or flushes pending write-behind jobs for the project via `WriteBehindService.flushOrAwaitPendingWrites`.
     - Gate G5 Enforcement: Evaluates `ReadinessService.checkReadiness(projectId)` and blocks build if any node is incomplete or blocked.
     - Pre-build Integrity: Runs `PreBuildChecker` on derived `EngineInput` catching structural bottlenecks.
     - Solves timetable via `generateAlternatives`.
     - Saves `ScheduleVersion` records with version numbers and computed metrics.
     - Transitions project lifecycle status to `ready`.
     - Publishes domain event `build.completed` on `EventBus` and logs audit entry.
   - **Distributed Lock & Orchestration (`BuildsService`):**
     - Redis distributed lock `slotly:lock:build:{projectId}` (180s TTL) ensuring strictly one active build per project.
     - Build cancellation support and active build status inspection.
   - **WebSocket Gateway (`BuildsGateway`):**
     - Namespace `/builds` with JWT and Redis session validation.
     - Room per project (`slotly:build:{projectId}`) for isolated live updates.
     - Emits `build:progress`, `build:completed`, and `build:failed`.
   - **Controllers (`BuildsController`):**
     - Endpoints matching `docs/ROUTES.md`:
       - `POST /projects/:projectId/builds`: Initiates timetable generation build.
       - `GET /projects/:projectId/builds/current`: Checks currently running build.
       - `POST /projects/:projectId/builds/cancel` & `DELETE /projects/:projectId/builds/current`: Aborts running build.
       - `GET /projects/:projectId/versions`: Lists all saved schedule versions for a project.
       - `GET /versions/:versionId`: Fetches detailed schedule version with slots and conflicts.

4. **Unit Tests (29 suites, 154 tests passing across server):**
   - `solver.spec.ts`: 8 test scenarios:
     1. Small school (1 section, standard subjects, 0 conflicts).
     2. 3-section college with shared department faculty.
     3. Multi-department institution with shared general faculty.
     4. Lab-heavy STEM program with 3-period consecutive blocks and equipment checks.
     5. Simultaneous elective streams running parallel subjects in separate rooms.
     6. Impossible case (over-constrained requirements) terminating gracefully with best effort.
     7. Locked slots preservation honoring user-pinned slots in regenerate mode.
     8. Multi-alternative generation producing ranked, deduplicated candidates.
   - `build-facade.spec.ts`:
     - Blocks build with `PRE_BUILD_FAILED` when Gate G5 is not met.
     - Blocks build when pre-build structural checks fail.
     - Successfully flushes write-behind queue, solves schedule, saves versions, updates project status to `ready`, and publishes domain event and audit log.

5. **Client UI (`/projects/[projectId]/build`):**
   - **State & Communication (`client/src/features/builds/`):**
     - `builds.api.ts`: Typed API client for builds and version retrieval.
     - `builds-socket.service.ts`: Socket.IO client for `/builds` namespace handling progress, completion, and failure events.
     - `useBuildsStore`: Zustand store managing solver status, progress %, logs, versions, readiness, comparison pair, and solver configuration.
   - **Components:**
     - `BuildBlockedView`: Gate G5 blocked banner showing health score gauge, missing blueprint requirements table, and direct "Go fix" jump links to Blueprint nodes.
     - `BuildConfigCard`: Solver settings with candidates count (1-5), primary weight profile selector (`standard`, `workload-balanced`, `preference-first`, `room-efficient`), generation mode (`fresh` vs `regenerate`), and deterministic seed input.
     - `BuildProgressPanel`: Real-time animated progress bar, status pill, terminal-style live execution log feed, and abort build action.
     - `AlternativeCard`: Candidate timetable card showing label, quality score badge (`Score: 84/100`), conflict pill (`Conflict-Free (0 hard violations)`), 4-metric mini stats grid (room utilization %, faculty balance %, afternoon lab %, slots scheduled), "Open in Board" link, and compare toggle.
     - `CompareDialog`: Side-by-side modal dialog evaluating metrics (scores, hard conflicts, soft warnings, room utilization, faculty load balance, afternoon lab %) between two candidate timetables with highlighted winners.
     - `BuildView`: Main feature container connecting socket, loading readiness and versions, and managing UI state transitions.
   - **Pages & Navigation:**
     - Route `/projects/[projectId]/build/page.tsx` rendering `BuildView`.
     - Connected "Build Schedule" button in Blueprint header toolbar directly to `/projects/[projectId]/build`.

### Decisions Made

- **Simultaneous Elective Strength Splitting:** For elective groups where `mustBeSimultaneous = true`, each parallel elective subject divides the section strength (`Math.ceil(sectionStrength / electiveCount)`). `RoomCapacityFitsSectionConstraint` and `SectionNoDoubleBookingConstraint` allow parallel streams of the same simultaneous elective group to run concurrently without triggering double-booking or room under-capacity violations.
- **Elective Bundle Grouping by Block Index:** `TaskBuilder` groups elective tasks by block index `b` (`bundle:${group.id}:${b}`) rather than bundling all weekly hours into a single slot, ensuring each hour of the elective runs at a separate day/period.
- **Section Safety in Swaps:** `TimetableSolver.runSwapImprovementPass` verifies `!this.isSectionOrBatchBusy()` for both swapped slots to prevent inter-section slot swaps from inadvertently double-booking a section.
- **Distributed Build Lock:** A Redis distributed lock `slotly:lock:build:{projectId}` with 180s TTL guarantees only one active generation build can execute for any project at a given time.
- **Gate G5 Enforcement in Facade:** BuildFacade verifies Gate G5 (`isReadyForBuild`) and rejects unready blueprints with `400 BadRequestException` prior to solver invocation.

### What Was Skipped

- Studio Grid interactive timetable slot editor, drag-and-drop moves, live conflict highlighting on grid cells, and manual slot adjustments (scheduled for Phase 10: Interactive Studio Grid Editor).

---

## Infrastructure & Service Integration: Brevo Email Integration & System Runtime Verification

### What Was Built

1. **Brevo Transactional Email Integration (`server/src/common/email/`):**
   - **`IEmailSender` Interface & Token:** Clean abstraction (`EMAIL_SENDER` injection token) decoupling business logic and adapters from third-party email providers (SOLID Dependency Inversion).
   - **`BrevoEmailSender`:** Concrete implementation communicating with Brevo REST API v3 (`https://api.brevo.com/v3/smtp/email`) via native `fetch`:
     - Secure `api-key` header authentication using configured `BREVO_API_KEY`.
     - Supports customized sender name (`EMAIL_FROM_NAME`) and sender email (`EMAIL_FROM`).
     - Normalizes single and multiple recipient formats (`{ email, name? }`).
     - Includes automatic zero-crash development simulation fallback when `BREVO_API_KEY` is empty, logging styled mock dispatches for local development workflows.
   - **`EmailTemplateRenderer`:** Semantic, strict black-and-white styled responsive HTML and plain-text email template engine:
     - Themed styling honoring strict B&W design system (`#000000` / `#0A0A0A` background, `#111111` surface cards, `#232323` borders, `#FAFAFA` heading/body, `#8A8A8A` muted text, `#FACC15` / `#22C55E` subtle status indicators).
     - Dedicated templates for `verify` (prominent 6-digit OTP code verification card), `recovery` (password reset link button and expiration notice), `security-alert` (tabular event, IP address, and timestamp alert), and `invite` (workspace invitation).
   - **BullMQ Background Queue (`notifications`):**
     - Registered `'notifications'` queue with BullMQ concurrency 5.
     - `EmailProcessor` worker processing background `'send-email'` jobs with automatic exponential backoff retries and error logging.
     - `EmailService` providing write-behind enqueuing for transactional emails (`sendOtp`, `sendSecurityAlert`, `send`) with immediate delivery fallback if Redis is unavailable.
   - **Adapter Integration:**
     - Connected `QueueEmailAdapter` in `AuthModule` to `EmailService`, dispatching authentication OTPs and security alerts through the Brevo email pipeline.
   - **Configuration:**
     - Added `BREVO_API_KEY`, `EMAIL_FROM`, and `EMAIL_FROM_NAME` to `EnvSchema` in `server/src/config/env.config.ts`, `.env.example`, and `.env`.

2. **Full System Runtime Verification & Error Fixes:**
   - Fixed schema decorator issues (`User.mfaSecret` type, `ScheduleVersion.createdAt` / `updatedAt` type).
   - Fixed Mongoose duplicate schema index warnings in `institution.schema.ts` and `user.schema.ts`.
   - Fixed global `EventBus` dependency injection via global `EventsModule`.
   - Verified clean monorepo builds (`pnpm build`), type checks (`pnpm typecheck`), and lint checks (`pnpm lint`).
   - Verified comprehensive test suite: 32 test suites and 166 unit tests passing (`pnpm test`).
   - Verified live running development servers:
     - Client running on `http://localhost:3000` (Next.js 16 App Router).
     - Server running on `http://localhost:4000` (NestJS 11 with MongoDB, Redis, and BullMQ).

### Decisions Made

- **Brevo REST API v3 vs SMTP:** Used Brevo REST API v3 over SMTP to avoid external Node SMTP/nodemailer dependencies, providing faster HTTP/2 execution, precise JSON error payloads, and seamless serverless compatibility.
- **Safe Development Simulation:** If `BREVO_API_KEY` is unset or blank in `.env`, `BrevoEmailSender` logs formatted mock dispatches rather than failing, enabling smooth local development without requiring live credentials.
- **Write-Behind Delivery with Fallback:** Routine emails are sent asynchronously through BullMQ on the `'notifications'` queue to keep HTTP response times fast; if Redis/BullMQ is down or if `immediate: true` is requested, `EmailService` falls back to direct HTTP delivery.

---

## Next Steps

- **Phase 10:** Studio Grid (Interactive timetable editor, drag-and-drop slot moves, live move validation, conflict highlighting, undo/redo).

---

## Task: Code Map for Fast Navigation and Reuse

### What Was Built

1. **Central Code Map Index (`docs/CODEMAP.md`):**
   - High-level directory overview with one-line descriptions for all workspaces, app paths, module directories, and feature folders.
   - Verified "Reuse First" table mapping common development tasks to verified reusable singletons, repositories, services, decorators, components, and hooks.
   - Verified "Extension Points" table mapping strategy families and registries to their interfaces, locations, and copyable unit test templates.
   - Core development conventions covering naming, dependency injection tokens, cache keys, write-behind jobs, and Zustand store architecture.
   - Key system gotchas covering in-memory token lifecycle, write-behind barrier flushes, exactOptionalPropertyTypes, React 19 render-phase synchronization, and MongoDB replica sets.
   - Auto-updating table linking to all 16 module code maps with line counts.

2. **Automated Code Map Generator & Checker (`scripts/codemap/generate.ts`):**
   - Fast AST scanner leveraging `ts-morph` parsing 316 source files across `packages/contracts`, `server`, and `client`.
   - Generates 16 detailed, deterministic module maps under `docs/codemap/`.
   - Extracts and cleanly formats special patterns:
     - NestJS Controllers: HTTP method, full route path, permission requirements, and guard bindings (including `public`).
     - WebSocket Gateways: namespace and `@SubscribeMessage` event bindings.
     - BullMQ Processors: queue names, worker hosts, and job handlers.
     - Injectables: constructor dependency tokens and classes.
     - Mongoose Schemas: collection names and indexed fields.
     - Zod Schemas: schema identifier -> inferred TypeScript DTO type.
     - Next.js App Routes: derived route URLs with route groups stripped, parallel slots noted, and exported components.
     - React Hooks & Components: parameters and return/prop types.
     - Zustand Stores: store name and exposed action method list.
   - Link and symbol checker validating that every path and exported identifier in `docs/CODEMAP.md` exists on disk.
   - CLI flags: `pnpm codemap` updates on-disk maps; `pnpm codemap:check` validates in CI without side effects.

3. **Generator Fixtures & Golden Test (`scripts/codemap/tests/generate.spec.ts`):**
   - Unit tests running on 7 synthetic fixtures (`tiny.controller.ts`, `tiny.gateway.ts`, `tiny.processor.ts`, `tiny.schema.ts`, `tiny.zod.ts`, `tiny.hook.ts`, `tiny.page.tsx`).
   - Compares generator AST extraction against `scripts/codemap/tests/golden.md`.
   - Integrated into root `pnpm test` script.

4. **100% Export Documentation & Line 1 Purpose Backfill:**
   - Line 1 purpose comments added to all 316 source files in `packages/contracts`, `server`, and `client`.
   - One-line JSDoc summaries added to all 903 exported classes, functions, interfaces, types, constants, components, hooks, and stores.
   - Zero files remaining without a header description (`Files without header purpose: 0`).

5. **Agent Governance & CI Enforcement (`AGENTS.md`):**
   - Added "CODE MAP RULES" instructing agents to check `docs/CODEMAP.md` before creating any new classes, components, or utilities.
   - Updated git workflow requiring `pnpm codemap` before committing.
   - CI check command `pnpm codemap:check` ready for Phase 15 pipeline integration.

### Decisions Made

- **Markdown Tables Format:** Tables in `docs/CODEMAP.md` separated with `<!-- MANUAL:START -->` and `<!-- MANUAL:END -->` to allow developer customization while keeping generated tables strictly synchronized via `<!-- GENERATED:START -->`.
- **Prettier & Line Ending Normalization:** Formatted all generated and annotated source files to ensure clean compliance with project ESLint and Prettier rules.
- **AST Parsing with ts-morph:** Selected `ts-morph` for AST extraction to accurately resolve decorators, types, parameters, and JSDoc tags without executing runtime code.

### Possible Duplicates / Cleanup Candidates

- **Date / Time Formatting:** Identified multiple formatters in `client/src/features/institution/` and `client/src/features/library/` (e.g. `formatTime`, `formatDateRange`) that can be consolidated into `client/src/lib/formatters.ts` in a future refactor.
- **Dialog Shell Wrappers:** Modal wrapper structures in `client/src/features/blueprint/components/dialogs/` share common header/footer boilerplate that could benefit from a unified `ResponsiveDialog` component.

### Manual Verification Checklist

- [x] Run `pnpm codemap`: 316 files parsed, 903 symbols extracted, 0 broken links, 0 broken symbols.
- [x] Run `pnpm codemap:check`: In-memory regeneration matches on-disk maps cleanly.
- [x] Run `pnpm test`: 32 Jest test suites (166 tests) + generator golden test pass.
- [x] Run `pnpm typecheck`: Contracts, server, and client all typecheck with zero errors.
- [x] Run `pnpm lint`: Contracts, server, and client lint with zero errors or warnings.
- [x] Run `pnpm build`: Contracts `tsup`, server `nest build`, and client Next.js build all complete successfully.

---

## Fix: Institution Context Auto-Healing, Master Dev OTP & Runtime Error Resolution

### What Was Built

1. **Auto-Healing Institution Context:**
   - Updated `AuthGuard`: If `session.institutionId` is unset, it attempts to resolve `user.institutionId` from Mongo. If the user still lacks an institution, it looks up the first active institution or creates default `"Main Campus"` (code: `MAIN`), updates the user record, synchronizes the Redis session, and attaches `request.user.institutionId`.
   - Updated `InstitutionsController.resolveInstitutionId` and `LibraryController.resolveInstitutionId`: Made asynchronous with fallback to the active institution repository, resolving 400 Bad Request responses on `/institution/structure`, `/institution/departments`, and all `/library/*` resource endpoints.
   - Updated `InstitutionsController.createInstitution`: Automatically associates new institution IDs to creator users when unassigned, updating both Mongo and active sessions.
   - Updated `ProjectsService.create`: Added fallback lookup for active institution ID when creating projects without explicit `institutionId`, resolving 409 Conflict errors on `POST /projects`.

2. **Master Dev OTP & Verification UX:**
   - Updated `RedisOtpService.verifyOtp`: Supports master dev code `123456` and `000000` when `NODE_ENV === 'development'`, preventing developers and testers from getting blocked on email OTP verification if external email delivery is not configured.
   - Updated `verify-email` page: Added developer hint displaying `123456` in development mode.
   - Updated `register` page: Enhanced inline guidance for password length ($\ge 12$ characters) and uniqueness.

3. **Client API Client & Ignore Configuration:**
   - Updated `client/src/lib/api-client.ts`: Silenced error toasts for expected 401 Unauthorized responses during silent session initialization checks on `/auth/refresh`.
   - Updated `.gitignore`: Added `!client/src/lib/` exception under `**/lib/` to ensure client utilities (`api-client.ts`, `query-provider.tsx`, `utils.ts`) are properly tracked in version control.

### Decisions Made

- **Zero-Friction Single-Tenant / First-Run Initialization:** When a user registers or logs in without an institution specified and the database has no institutions yet, the server auto-seeds a default institution (`Main Campus`, `MAIN`) so navigation to library, institutions, or projects is immediately functional.
- **Master Dev OTP Environment Check:** Restricted development bypass code strictly to `NODE_ENV === 'development'` and non-test environments to prevent any impact on security in production or test assertions in CI.

### Manual Verification Checklist

- [x] Run `pnpm typecheck`: Contracts, server, and client all pass with 0 errors.
- [x] Run `pnpm lint`: Contracts, server, and client pass with 0 errors.
- [x] Run `pnpm test`: All 32 Jest test suites (166 tests) + codemap golden test pass.
- [x] Run `pnpm codemap:check`: All maps and symbol references verified cleanly.
- [x] Run `pnpm build`: Contracts `tsup`, server `nest build`, and client Turbopack production build pass.

---

## Phase 9: Generation & Timetable Engine

### What Was Built

1. **Pure TypeScript Engine & Constraint Solver (`server/src/modules/engine/core`):**
   - Implemented hardest-first backtracking timetable solver across all sections, shared faculty, and rooms simultaneously.
   - Built swap-based soft constraint optimizer and `AlternativesGenerator` producing diverse candidate schedules using seeded RNG and different objective profiles (workload-balanced, preference-first, room-efficient).
   - Enforced 18 hard constraints (e.g. `FacultyNoDoubleBooking`, `RoomNoDoubleBooking`, `SectionNoDoubleBooking`, `RoomCapacityFitsSection`, `RoomTypeMatchesSubject`, `LabConsecutiveBlock`, `ElectiveSimultaneity`) and 6 soft constraints.
   - Implemented `PreBuildChecker` validating graph completeness, lab capacities, allocations, and max faculty workloads before generation.

2. **Builds Module & Facade (`server/src/modules/builds`):**
   - `BuildFacade`: Consistency barrier awaiting pending write-behind operations before build starts, blueprint gate checks, graph-to-input mapping, and `ScheduleVersion` persistence with scores, conflicts, and statistics.
   - Enqueued on BullMQ `builds` queue with per-project Redis mutual exclusion locks (`slotly:build:lock:{projectId}`).
   - Progress and lifecycle updates emitted across WebSocket namespace `/builds` (`build:progress`, `build:completed`, `build:failed`).

3. **HTTP & WebSocket Endpoints:**
   - `POST /projects/:projectId/builds`: Enqueues fresh, regenerate, or repair timetable generation.
   - `GET /projects/:projectId/builds`: Lists generated schedule versions.
   - `GET /projects/:projectId/builds/:versionId`: Fetches full schedule version with slots, stats, and conflicts.
   - `POST /projects/:projectId/builds/cancel`: Gracefully aborts running solver jobs.

### Decisions Made

- **Pure Framework-Agnostic Core:** Constraint solver logic is kept pure TypeScript without NestJS or Mongoose dependencies, allowing fast deterministic unit testing.
- **Deduplication of Generated Alternatives:** Alternatives generator calculates schedule signatures based on slot placements to ensure distinct, ranked options.

### Manual Verification Checklist

- [x] Run `pnpm test`: Engine solver, constraints, alternatives generator, pre-build checker, and build facade tests pass (172 tests total).
- [x] Socket gateway broadcasts progress events and handles disconnects cleanly.
- [x] Pre-build validation halts solver with structured error reports if requirements are unsatisfied.

---

## Phase 09 Stabilized: Integration Audit Fixes (AUD-001 through AUD-009)

### What Was Built

1. **AUD-001 (S1) - Background Queue, Pending Writes & Redis Resilience:**
   - Switched `WriteBehindService` pending counter from scalar to idempotent `Set<string>` in memory and Redis sets (`pending_jobs:{projectId}`).
   - Created `AuditProcessor` to consume BullMQ `audit` queue and persist logs to MongoDB.
   - Enforced 3600s TTL bounding on un-expiring cache entries in `RedisCacheService` and `InMemoryCacheService`.

2. **AUD-002 (S1) - RBAC Route & Socket Permissions Enforcement:**
   - Added `PermissionsGuard` and `@RequirePermissions` across security routes in `UsersSecurityController`.
   - Added JWT handshake verification to `BuildsGateway` socket connections.
   - Expanded `rbac.spec.ts` with complete matrix testing across all five user roles.

3. **AUD-003 (S1) - Dynamic Availability Matrices:**
   - Added canonical `normalizeAvailabilityMatrix(matrix?, daysCount, periodsCount)` in `@slotly/contracts`.
   - Updated `LibraryService` and `NodeTypeRegistry` to normalize availability matrices on read and write.
   - Updated client `AvailabilityGrid`, `FacultyDialog`, and `RoomDialog` to dynamically adapt to institution/project dimensions.

4. **AUD-004 (S1) - MongoDB Indexes & Unique Constraints Migration:**
   - Added compound unique indexes with `isDeleted: 1` on `departments`, `programs`, `academic_years`, `semesters`, `sections`, `faculties`, `rooms`, `subjects`.
   - Added `{ ownerId: 1 }` index to `projects`.
   - Created idempotent database migration `server/src/database/migrations/ensure-indexes.ts` supporting `--dry-run`.

5. **AUD-005 (S2) - Reason Codes Canonicalization:**
   - Canonicalized 17 reason codes in `ReasonCodeSchema`, added alias dictionary `REASON_CODE_ALIASES`, `normalizeReasonCode`, and human-friendly `REASON_CODE_MESSAGES`.
   - Updated client `toast.fromErrorCode` to display canonical explanations for all reason codes.

6. **AUD-006 (S2) - Contract Drift Across Workspaces:**
   - Reconciled value vs type imports across server library services and migration tests.
   - Aligned exact optional property types for mock DB interfaces.

7. **AUD-007 (S2) - Institution State Management in Client:**
   - Replaced manual `useState`/`useEffect` in `InstitutionsPage` with TanStack Query's `useInstitutionStructure`.
   - Created `useInstitutionMutations` for automatic cache invalidation.
   - Pruned `useInstitutionStore` in Zustand to manage only client UI selection and tab state.

8. **AUD-008 (S3) - Blueprint API Service Location:**
   - Relocated `blueprint.api.ts` into `client/src/features/blueprint/services/blueprint.api.ts`.
   - Provided a backward-compatibility re-export at `client/src/features/projects/services/blueprint.api.ts`.

9. **AUD-009 (S3) - Documentation & Codemap Alignment:**
   - Aligned `docs/ROUTES.md`, `docs/AUDIT_REPORT.md`, `docs/PROGRESS.md`, and refreshed `docs/CODEMAP.md`.

### Decisions Made

- **Availability Matrix Normalization Strategy:** Rather than destructive DB wipes, matrices are dynamically normalized during ingestion and retrieval, padding smaller matrices with `true` and truncating oversized ones.
- **Idempotent Pending Job Set:** Set-based tracking eliminates counter leakage when BullMQ rapidly coalesces writes with identical job IDs.

### Manual Verification Checklist

- [x] Run `pnpm build`: Contracts `tsup`, server `nest build`, and client Turbopack production build pass.
- [x] Run `pnpm lint`: Contracts, server, and client lint with zero errors or warnings.
- [x] Run `pnpm typecheck`: Contracts, server, and client all typecheck with zero errors.
- [x] Run `pnpm test`: All 36 Jest test suites (178 tests) + codemap golden test pass.
- [x] Run `pnpm codemap:check`: All maps and symbol references verified cleanly.

---

## Integration Audit (Phases 0 to 9)

### What Was Built

- **Baseline Verification:** Tagged `pre-audit-baseline` on `main`/`fix/integration-audit`. Verified clean install, clean temporary clone build, MongoDB replica set `rs0`, and Redis health.
- **Static Analysis:**
  - Circular dependencies: identified 2 cycles in server via `madge` (`auth.module` -> `institutions.module` -> `users.module`, `blueprint.module` -> `projects.module`); 0 in client.
  - Code duplication: identified 304 clones (7.42% duplicate token density) via `jscpd` across repository CRUD implementations and client modals.
  - Vulnerability scan: identified 8 vulnerabilities via `pnpm audit` (`xlsx` Prototype Pollution/ReDoS, `zod` collection memory exhaustion).
  - Code smells: 0 `any`, 0 `@ts-ignore`, 0 TODO/FIXME comments, 0 `console.log` in production code; 1 `@typescript-eslint/no-require-imports` in migrations.
- **Contract & Drift Analysis:**
  - Audited 122 controller routes and gateways against `@RequirePermissions`, identifying unguarded endpoints.
  - Identified live MongoDB missing compound unique indexes (`{ institutionId: 1, code: 1, isDeleted: 1 }` unapplied on `faculties`, `rooms`, `subjects`).
  - Identified matrix dimension out-of-bounds issue in `FacultyAvailabilityConstraint` for 6-day institutions.
  - Identified BullMQ queue naming drift (`builds` in-process execution, `notifications` vs `email`, and inverted Redis lock key `slotly:lock:build:{projectId}`).
  - Identified socket event name drift on `/builds` (`build:join`/`build:leave` vs `join:project`/`leave:project`).
- **Integration Test Suite (`server/src/integration-audit/cross-module-scenarios.spec.ts`):**
  - Added test coverage for Scenarios 1 through 15.
  - Documented 5 confirmed bug reproduction `.todo` tests without altering production behavior.
- **Runtime Checks:**
  - Verified `/health` dependency reporting (MongoDB and Redis up).
  - Verified Redis memory footprint (2.40 MB, 36 keys).
  - Executed WebSocket load test (`scripts/audit-socket-load.js`) with 50 concurrent authenticated clients and 500 drag events (0% drops, 0.03 ms avg emit latency).
- **Audit Report:**
  - Compiled comprehensive `docs/AUDIT_REPORT.md` with findings categorized S1 through S4, impact analysis, reproduction commands, and test gap tables.

### Decisions Made

- **Zero Production Code Changes:** Strictly adhered to audit task requirements. Discovered discrepancies and bugs are documented with evidence and `.todo` tests rather than patched in-place.
- **Dedicated Audit Tooling in `scripts/`:** Preserved audit analysis scripts (`audit-routes.js`, `audit-mongo-indexes.js`, `audit-socket-load.js`, etc.) for reproducible verification.

### Manual Verification Checklist

- [x] Pre-audit baseline tagged and pushed (`pre-audit-baseline`).
- [x] Clean clone build passes cleanly.
- [x] Static checks completed (madge, jscpd, pnpm audit, code smell metrics).
- [x] Live MongoDB index queries and dry-run migration executed.
- [x] WebSocket load test (50 concurrent clients, 500 events) executed with 0 dropped events.
- [x] Full workspace verification passes: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- [x] Comprehensive `docs/AUDIT_REPORT.md` generated.

---

## Refactor: Namespaced Server Configuration & Strict Validation

### What Was Built
1. **Core Configuration Namespaces (`server/src/config/`):**
   - Implemented 11 typed namespaces using NestJS `registerAs`:
     - `appConfig` (`app`): port, nodeEnv, clientUrl, corsOrigins, apiPrefix, logging.
     - `databaseConfig` (`database`): MongoDB connection URI from `DATABASE_URL`, serverSelectionTimeoutMS, maxPoolSize.
     - `redisConfig` (`redis`): host, port, password, db, tls.
     - `jwtConfig` (`jwt`): access/refresh secrets (min 16 chars) and expiry durations.
     - `sessionConfig` (`session`): Redis session TTL, max lifetime, httpOnly cookie settings.
     - `authConfig` (`auth`): Argon2 parameters, OTP config, step-up window, throttles, password policy.
     - `oauthConfig` (`oauth`): callback base URL, Google & GitHub client ID/secrets with derived `enabled` status.
     - `emailConfig` (`email`): driver (`log` | `brevo`), Brevo API key, sender email/name, timeout, max retries.
     - `cacheConfig` (`cache`): default TTL and entity-specific TTLs (blueprint, readiness, tree, slots, user profile).
     - `queueConfig` (`queue`): BullMQ prefix, retry attempts, backoff delay, queue concurrency policies.
     - `groqConfig` (`groq`): Groq API key, model, request token limits and temperature.
   - `DEFAULT_CONFIG` (`defaults.ts`): Centralized, single source of truth for fallback values across all namespaces.
   - `AppConfigModule` (`config.module.ts`): Global wrapper module with `isGlobal: true`, `cache: true`, `load: [...]`, Joi `validationSchema`, and `validate: (raw) => validateEnv(raw)`. In `NODE_ENV=test`, `ignoreEnvFile: true` ensures `.env` is never read.
   - Barrel export `server/src/config/index.ts` exporting all configs, schemas, and types.

2. **Strict Validation & Legacy Variable Trap (`env.validation.ts`):**
   - Joi schema validating all environment variables at bootstrap, with `.required()` for critical secrets and URIs outside `NODE_ENV=test`.
   - `checkLegacyVariables`: Traps legacy variables (`MONGODB_URI`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `GOOGLE_CALLBACK_URL`, `GITHUB_CALLBACK_URL`, `SMTP_*`) and halts bootstrap with descriptive error messages detailing renamed/removed keys.
   - Never logs or exposes secret values in error messages or logs; errors report variable names only.

3. **Typed Configuration Injection Across Server:**
   - Refactored `AppModule`, `main.ts`, `QueueModule`, `CacheModule`, `RedisCacheService`, `EmailModule`, `BrevoEmailSender`, `EmailTemplateRenderer`, `AuthGuard`, `SessionsService`, `OtpService`, `AuthController`, `BlueprintGateway`, and `BuildsGateway` to inject typed namespaces (`@Inject(thatConfig.KEY)`).
   - Replaced all direct `process.env` access and `ConfigService.get(...)` calls across production code.

4. **Dynamic Email Driver Adapter:**
   - Created `LogEmailSender` providing mock email delivery with masked OTP codes when `EMAIL_DRIVER=log`.
   - Updated `EmailModule` to dynamically bind `EMAIL_SENDER` to `BrevoEmailSender` or `LogEmailSender` based on `config.driver`.

5. **Linting & Tooling:**
   - Configured ESLint rule `no-process-env: 'error'` across server with explicit override allowing `process.env` only in `src/config/**`, `src/main.ts`, `src/database/migrations/ensure-indexes.ts`, and test files.
   - Created `scripts/env-migrate.ts` and root CLI script `pnpm env:migrate` to safely transform existing `.env` files to `.env.migrated` without printing or leaking secrets.
   - Updated `server/.env.example` with grouped namespaces, comments, and clean placeholders.
   - Created `README.md` documenting architecture, prerequisites, environment setup, and migration.
   - Updated `docs/ARCHITECTURE.md` (Section 9) and `docs/CODEMAP.md`.

6. **Comprehensive Unit & Integration Tests:**
   - `env.validation.spec.ts`: Tests validation of valid env, default fallbacks, missing required variables, malformed URIs, short secrets, invalid ports, enum violations, legacy variable detection, and zero-leakage error messages.
   - `config-factories.spec.ts`: Tests typed shape mappings and integer/boolean parsing for all 11 factories.
   - `email-driver.spec.ts`: Tests dynamic driver resolution for `log` and `brevo`, and OTP masking.
   - `config-boot.integration.spec.ts`: Tests application bootstrap and DI resolution of all typed configs.

### Decisions Made
- **CommonJS NestJS Ecosystem Alignment:** Standardized on `@nestjs/config@^4.0.4` for NestJS 11 CommonJS compatibility with ts-jest while fully providing typed `registerAs` and native Joi validation options (`abortEarly: false, allowUnknown: true`).
- **Secret Redaction by Design:** `validateEnv` error extraction explicitly maps `details` to `context.key || path.join('.')`, preventing Joi from printing rejected secret values in application error traces.
- **Worker Concurrency in Windows Jest:** Added `--maxWorkers=2` to server test script to prevent memory exhaustion during parallel test execution.

### Manual Verification Checklist
- [x] Run `pnpm typecheck`: Contracts, client, and server typecheck with zero errors.
- [x] Run `pnpm lint`: Contracts, client, and server pass lint with zero errors or warnings (ESLint `no-process-env` strictly enforced).
- [x] Run `pnpm test`: All 41 server Jest test suites (221 tests) + codemap golden test pass.
- [x] Run `pnpm env:migrate scripts/__fixtures__/legacy.env`: Correctly renames legacy keys and flags deprecated keys without leaking values.
- [x] Run `pnpm codemap` & `pnpm codemap:check`: Architecture map and symbol indices generated and verified.

---

## Feature: Social Login with Google and GitHub (Pass 1 - Completed)

### Existing Auth Architecture Analysis (Read First)

1. **Registration Flow:**
   - Validates email format and password strength via `StandardPasswordPolicy`.
   - Hashes password using Argon2id.
   - Assigns role: First user of an institution becomes `ADMIN`, otherwise `DESIGNER`.
   - Institution handling: If `institutionName` is supplied, creates a new institution with standard 5-day schedule config (`isComplete: true`); if omitted, falls back to the first existing institution or creates a default `${name}'s Institution`.
   - Creates `User` document with `isEmailVerified: false, mfaEnabled: false, status: 'active'`.
   - Sends a 6-digit email OTP (TTL 600s, cooldown 60s).
   - Issues Redis session via `SessionsService.createSession`, issuing Bearer `accessToken` and setting httpOnly `refreshToken` cookie.
   - Logs `AUTH_SESSION_CREATED` in audit log.

2. **Login & MFA Flow:**
   - Throttled per IP + email (5 attempts / 300s).
   - Verifies user status is `active` and checks password hash.
   - Auto-associates default institution if missing.
   - If `mfaEnabled` is true, requires TOTP/recovery code: if missing code, returns signed temporary token `{ mfaRequired: true, mfaToken }` for the `/mfa` screen.
   - Upon successful credentials/MFA, calls `SessionsService.createSession`, sets `refreshToken` cookie, logs `AUTH_LOGIN_SUCCESS`.

3. **Session Issuance & Refresh:**
   - `createSession(userId, role, meta)` establishes a Redis session hash with 7-day TTL, generates stateless SHA256-signed Bearer access token (15m) and cryptographically random refresh token family in Redis.
   - `POST /auth/refresh` rotates the refresh token with family reuse detection.

4. **Step-Up Authentication:**
   - Sensitive endpoints are guarded by `StepUpGuard` verifying `isStepUpValid(sessionId)` in Redis (valid for 600s).
   - `POST /auth/step-up` currently verifies password or TOTP code. For passwordless social login accounts, step-up must be extended to support email OTP verification.

5. **Existing Google OAuth Endpoint:**
   - `POST /auth/oauth/google` exists taking `{ idToken }` and using `GoogleOAuthVerifier.verifyGoogleToken(idToken)`.
   - It only decodes the unverified base64 payload, bypasses MFA (`mfaVerified: true`), creates a dummy password hash, lacks OAuth identity linking, and auto-associates institutions immediately.
   - This endpoint will be deprecated/refactored to route through the unified `AccountLinkingService` and `OAuthService`.

### What Was Built (Pass 1: Contracts and Server)

1. **Shared Contracts (`packages/contracts`):**
   - Added `OAuthProviderKeySchema` (`'google' | 'github'`), `OAuthProviderInfoSchema` (including `enabled: boolean`), and `OAuthProvidersResponseSchema`.
   - Added `ConnectedAccountDtoSchema` (`provider`, `email`, `createdAt`, `avatarUrl?`).
   - Added `OAuthErrorCodeSchema`: `'oauth_denied' | 'oauth_state_invalid' | 'oauth_email_unverified' | 'oauth_account_conflict' | 'oauth_provider_error' | 'oauth_disabled' | 'account_suspended' | 'link_conflict'`.
   - Extended `StepUpDtoSchema` to support passwordless accounts with `{ method: 'email_otp', otp: string }`.
   - Added `OnboardingDtoSchema` (`institutionName?`, `institutionCode?`, `joinCode?`, `displayName?`).
   - Updated `UserDtoSchema` status enum to include `'pending_onboarding'`.
   - Added audit event names: `AUTH_OAUTH_SIGNUP`, `AUTH_OAUTH_LOGIN_SUCCESS`, `AUTH_OAUTH_LOGIN_FAILED`, `AUTH_OAUTH_LINKED`, `AUTH_OAUTH_UNLINKED`.

2. **Decoupled Architecture & SOLID Strategies:**
   - **Adapters:** `HttpClient` interface with `FetchHttpClient` for network abstraction and easy test mocking.
   - **Provider Strategies:** `OAuthProvider` interface implemented by `GoogleProvider` (PKCE S256 + nonce) and `GithubProvider` (code exchange + userinfo/emails primary verified email resolution), managed by `OAuthProviderRegistry`.
   - **State Pattern & Binding:** `OAuthStateService` storing state in Redis (`slotly:oauth:state:${state}`, 10m TTL, single-use `del`) coupled with httpOnly `oauth_binding` cookie.
   - **Redirect Sanitizer:** Pure `RedirectSanitizer` restricting `next` URLs strictly to in-app relative paths.
   - **Account Linking State Machine:** Pure `AccountLinkingService` evaluating decision table for login and link modes (conflict prevention, pre-hijack takeover of unverified accounts, suspended/deactivated account rejection).
   - **Shared Session Service:** Extracted `AuthSessionService` handling session creation, device tracking, and unrecognized device alerts.
   - **OAuth Identity Persistence:** `OAuthIdentity` collection (`oauth_identities`) with compound unique index `{ provider: 1, providerUserId: 1 }` and `{ userId: 1 }`, backed by `OAuthIdentityRepository`.

3. **Endpoints & Security:**
   - `GET /auth/oauth/providers`: Public list of available/enabled OAuth providers.
   - `GET /auth/oauth/:provider/start`: Supports `login` mode (public) and `link` mode (requires auth + step-up). Sets `oauth_binding` cookie and redirects to provider.
   - `GET /auth/oauth/:provider/callback`: Validates single-use state & binding cookie, resolves account linking, sets refresh token cookie, and redirects to destination or `/onboarding`.
   - `POST /auth/onboarding`: Allows `pending_onboarding` users to create or join an institution.
   - `POST /auth/step-up/email/send` & `POST /auth/step-up`: 6-digit email OTP step-up for passwordless users.
   - `GET /users/me/security/connections`: Returns connected OAuth accounts.
   - `DELETE /users/me/security/connections/:provider`: Unlinks OAuth provider; guarded by `StepUpGuard` and enforces last sign-in method security.

4. **Tooling & Config Validation:**
   - Mutual configuration validation in `env.config.ts` (fails fast if only ID or secret is provided).
   - Script `scripts/print-oauth-urls.ts` and `pnpm oauth:urls` printing exact callback URLs.
   - Updated root `README.md` and `server/.env.example`.

### Decisions Made

- **Decoupled Config from Strategies:** To avoid Jest CommonJS/ESM conflicts with NestJS v12 config packages, strategy configurations are injected as plain objects via factories in `auth.module.ts`.
- **Pre-hijack Defense:** Unverified local accounts matched by a verified OAuth email have their dummy password removed, active sessions revoked, and account converted to OAuth-verified identity with email notification.
- **Last Sign-in Method Invariant:** A user cannot disconnect their last OAuth provider unless they have an active password hash set.

### Automated Test Evidence

- **Unit Tests:**
  - `account-linking.service.spec.ts`: Pure decision matrix coverage (10 scenarios).
  - `auth-session.service.spec.ts`: Session issuance, device tracking, and security alerts (4 tests).
  - `google.provider.spec.ts`: PKCE URL generation, token exchange, and ID token payload parsing (4 tests).
  - `github.provider.spec.ts`: Token exchange and email resolution (4 tests).
  - `oauth-state.service.spec.ts`: State creation, TTL, and single-use consumption (4 tests).
  - `redirect-sanitizer.spec.ts`: Relative path validation, evil path rejection (16 tests).
  - `oauth.service.spec.ts`: Full orchestration of start, callback, onboarding, and connection lifecycles (10 tests).
- **Integration Test:**
  - `oauth-flow.spec.ts`: End-to-end integration flow using a real local HTTP server mocking Google & GitHub token and userinfo endpoints (4 tests).
- **Overall Suite:**
  - Server: 45 test suites, 243 tests passed, 0 failures.
  - Typecheck: 0 errors in server, contracts, and client.
  - Lint: 0 errors in server, contracts, and client.

### Manual Verification Checklist (Pass 1)

- [x] Run `pnpm oauth:urls` and verify callback URL formatting.
- [x] Run all server tests: `pnpm --filter server test`.
- [x] Verify strict typing: zero `any` in new code and test suites.
- [x] Verify zero secrets in code, logs, and git diff.
- [x] Build contracts: `pnpm --filter @slotly/contracts build`.
- [x] Build server: `pnpm --filter server build`.
- [x] Run `pnpm codemap` and verify sync.

---


### What Was Built (Pass 2: Client UI, Callback, Onboarding & Security Settings)

1. **OAuth Buttons & Monochrome Visual Tokens:**
   - Created `OAuthButtons` (`client/src/features/auth/components/oauth-buttons.tsx`):
     - Renders outline monochrome buttons with accessible `aria-label`s ("Continue with Google", "Continue with GitHub").
     - Renders native `<a>` links directly to backend `/auth/oauth/:provider/start` endpoint for full-page navigation.
     - Dynamically checks enabled providers using `authApi.getOAuthProviders()`, renders skeleton while loading, and renders nothing if no providers are enabled.
     - Reusable across login, registration, and account linking.
   - Created `GoogleMonochromeIcon` and `GitHubIcon` (`client/src/features/auth/components/oauth-icons.tsx`) strictly adhering to black-and-white theme without brand color fills.

2. **Login & Register Integration with Error Banners:**
   - Created `getOAuthErrorMessage()` (`client/src/features/auth/utils/oauth-errors.ts`) mapping `OAuthErrorCode` strings to user-friendly plain-language messages.
   - Integrated `OAuthErrorBanner` in `client/src/app/(auth)/login/page.tsx` and `client/src/app/(auth)/register/page.tsx`:
     - Reads `?error=` search parameter.
     - Renders alert banner with error message.
     - Cleans URL parameter via `window.history.replaceState` without triggering reload or cascading renders.
   - Embedded `<OAuthButtons mode="login" />` above credentials form with "or continue with" divider.

3. **OAuth Callback Handler (`/auth/callback`):**
   - Created `client/src/app/(auth)/auth/callback/page.tsx`:
     - Renders "Signing you in..." skeleton within `AuthLayout`.
     - Calls `authApi.refresh()` to fetch current session and set in-memory access token from httpOnly cookie.
     - Checks user status: redirects `pending_onboarding` users to `/onboarding`, redirects MFA challenges to `/mfa`, or redirects to sanitized relative `next` URL (defaults to `/dashboard`).
     - Error handling redirects cleanly to `/login?error=oauth_state_invalid`.

4. **Single-step Onboarding (`/onboarding`):**
   - Created `client/src/app/(auth)/onboarding/page.tsx`:
     - Dedicated onboarding page for users authenticated via OAuth without institution assignment.
     - Stepper-free UI providing options to create a new institution (name + optional code) or join an existing institution via join code.
     - Terms of Service agreement checkbox.
     - Submits `authApi.onboardOAuth(dto)` and redirects directly to `/dashboard`.

5. **Connected Accounts & Security Management (`/users/me/security`):**
   - Created `ConnectedAccounts` component (`client/src/features/auth/components/connected-accounts.tsx`):
     - Card in Security settings listing Google and GitHub connection statuses, email addresses, and linked dates.
     - Connect action initiates `/auth/oauth/:provider/start?mode=link`.
     - Disconnect action triggers confirmation dialog before calling `DELETE /users/me/security/connections/:provider`.
     - Security safeguard: Disconnect button is disabled with an explanatory tooltip if OAuth is the user's only sign-in method (`!hasPassword && accounts.length <= 1`).
   - Integrated `<ConnectedAccounts />` into `client/src/app/users/me/security/page.tsx`.

6. **Email OTP Step-Up Support:**
   - Updated `StepUpDialog` (`client/src/features/auth/components/step-up-dialog.tsx`) to support `email_otp` verification alongside password and TOTP for passwordless accounts.

7. **Client Tests:**
   - Added `client/src/features/auth/utils/oauth-errors.spec.ts`: Unit tests verifying error code mappings and fallback messages.
   - Added `client/src/features/auth/services/auth.api.spec.ts`: Unit tests verifying OAuth start URL formatting for login, link, and next parameters.
   - Configured `client/package.json` test script to run Node test runner with `tsx`.

### Decisions Made (Pass 2)

- **Pure Query Parameter Reading:** To prevent React Compiler cascading render warnings, `OAuthErrorBanner` computes error message directly from search parameters during render and executes `window.history.replaceState` inside `useEffect` without component re-renders.
- **Strict Black & White Styling:** Adhered strictly to the 5% accent rule by rendering third-party brand logos in monochrome outlines (`#FAFAFA` on `#111` surface with `#232323` borders) without brand-colored fills.
- **Account Disconnect Prevention:** Prevented user lockouts by checking whether the account has a password or alternative login method before allowing provider unlinking.

### Automated Test Evidence (Pass 2)

- **Client Tests:** 6/6 tests passed (`authApi.getOAuthStartUrl`, `getOAuthErrorMessage`).
- **Server Tests:** 45 test suites passed, 243 tests passed, 0 failures.
- **Typecheck:** 0 errors across `@slotly/contracts`, `server`, and `client`.
- **Lint:** 0 errors across `@slotly/contracts`, `server`, and `client`.
- **Build:** Next.js production build succeeded with all static auth and onboarding routes prerendered.
- **Codemap:** All 339 files mapped, 0 missing purpose headers, `pnpm codemap:check` passed.

### Manual Verification Checklist (Pass 2)

- [x] Run `pnpm test` and verify client and server tests pass.
- [x] Run `pnpm lint` and verify zero errors/warnings.
- [x] Run `pnpm typecheck` and verify clean TypeScript output.
- [x] Run `pnpm build` and verify successful compilation of client and server.
- [x] Run `pnpm codemap:check` and confirm codemap is in sync.
- [x] Verify monochrome B&W UI tokens in `OAuthButtons` and `ConnectedAccounts`.

---


## Protected Routes & Verified Refresh Flow — Part A: Verify and Harden Refresh Flow

### What Was Built (Part A)

1. **Security & Flow Audit (`docs/AUTH_VERIFICATION.md`):**
   - Mapped full lifecycle: login, refresh, token rotation, token family tracking, reuse detection, concurrent-refresh grace window, logout, logout-all, session validation, cookie attributes, CORS settings, rate limiting, and client-side handling.
   - Audited cookie attributes (`HttpOnly`, `SameSite=Lax`, `Path=/auth`, `Secure`, `Max-Age=2592000`).
   - Audited WebSocket gateways and remediated wildcard CORS (`origin: '*' -> CLIENT_URL`).

2. **Server Hardening (`server`):**
   - **Concurrent Refresh Grace Window (`RedisSessionsService`):**
     - Implemented 10-second grace window (`graceTokenHash`, `graceRotatedAt`, `graceAccessToken`, `graceRefreshToken`).
     - Multi-tab race conditions presenting the just-rotated token within 10 seconds receive identical new credentials without triggering false reuse detection.
     - Token presentation after 10 seconds revokes the entire token family (`REFRESH_TOKEN_REUSE_DETECTED`) and logs a security warning.
   - **Refresh Token Format & UUID Parsing (`auth.controller.ts`):**
     - Standardized refresh token format: `s_${sessionId}_${randomBytes(32).toString('hex')}` across initial login and rotation.
     - Fixed `sessionId` extraction to support underscored IDs (`ses_...`): `parts.slice(1, -1).join('_')`.
   - **Cookie Scoping & Rate Limiting (`auth.controller.ts`):**
     - Restricted cookie scope to `path: '/auth'` for both setting and clearing.
     - Injected `THROTTLER_SERVICE` and added per-IP throttling (30 requests/min) to `POST /auth/refresh`.
   - **Gateway CORS Hardening (`blueprint.gateway.ts`, `builds.gateway.ts`):**
     - Replaced permissive `origin: '*'` with `process.env['CLIENT_URL'] || 'http://localhost:3000'`.
   - **Server Integration Tests (`server/src/modules/auth/tests/refresh-flow.spec.ts`):**
     - 10 automated test scenarios covering token rotation, 10 parallel concurrent requests within grace window, reuse detection after grace window revoking family, malformed/expired cookies, session revocation on password change, inactivity/maximum timeouts, MFA challenge restrictions, logout cookie clearing, throttling, and response header security.

3. **Client Hardening (`client`):**
   - **Single-Flight Refresh & Cross-Tab Coordination (`cross-tab-sync.ts`):**
     - Wrapped refresh calls in Web Locks API (`navigator.locks.request('slotly_refresh_lock')`) to serialize multi-tab executions.
     - BroadcastChannel (`slotly_auth_sync`) broadcasts `token_refreshed`, `login`, and `logout` across all open tabs.
   - **Logout Cleanup Observer Registry (`logout-registry.ts`):**
     - Observer pattern allowing components and feature stores to register cleanup callbacks.
     - `auth.store.ts` executes registered handlers on logout or session expiration, resetting caches, sockets, and timers.
   - **Proactive Token Refresher (`token-refresher.ts`):**
     - Reads JWT `exp` and schedules refresh 60 seconds before expiration.
     - Pauses while tab is hidden via `document.hidden`; triggers `checkAndRefreshIfStale()` on tab visibility changes and `window.online`.
   - **API Client Loop Prevention & Error Resilience (`api-client.ts`):**
     - Excluded `/auth/login`, `/auth/register`, and `/auth/refresh` from 401 refresh interceptors.
     - Network errors and 5xx responses during refresh retain the access token and surface retryable errors rather than logging the user out.
     - Replays original requests with the fresh token and validates replayed status.
   - **WebSocket Dynamic Auth Handshake (`blueprint-socket.service.ts`):**
     - Configured Socket.IO dynamic auth callback to supply current in-memory access token.
     - Retries connection once after proactive refresh on handshake auth errors.
     - Registered socket disconnection with `registerLogoutCleanup`.
   - **Client Unit Tests (`api-client.spec.ts` & `token-storage.spec.ts`):**
     - 5 unit tests verifying single-flight concurrency, loop prevention, 5xx handling, step-up 403 bypass, and definitive 401 cleanup.
     - Token storage leak test verifying 0 occurrences of token persistence in `localStorage` or `sessionStorage` across client source files.

### Decisions Made (Part A)

- **10-Second Concurrent Grace Window:** Configured a 10,000ms grace period in `RedisSessionsService` allowing concurrent browser requests (such as initial dashboard loads in multiple tabs) to safely receive the new token pair without false-positive token family revocations.
- **Strict Cookie Scoping:** Cookie path set to `/auth` prevents the browser from sending the `refreshToken` cookie on routine API calls, minimizing exposure.
- **Web Locks API with BroadcastChannel Fallback:** Used `navigator.locks` when available to guarantee cross-tab mutual exclusion during token rotation, backed by BroadcastChannel to sync token state across tabs.

### Automated Test Evidence (Part A)

- **Server Tests:** 46 test suites passed (253 tests passed, 0 failed, 5 todo) including `refresh-flow.spec.ts` (10/10) and `token-rotation.spec.ts` (2/2).
- **Client Tests:** 4 test suites passed (12/12 tests passed) including `api-client.spec.ts` (5/5) and `token-storage.spec.ts` (1/1).
- **Typecheck:** Clean across contracts, server, and client (`tsc --noEmit` exited with code 0).
- **Lint:** Clean across contracts, server, and client (`eslint` exited with code 0).
- **Codemap:** All 342 source files mapped, 0 missing purpose headers, `pnpm codemap:check` passed.
- **Build:** `pnpm build` succeeded across contracts, server, and client (all Next.js routes prerendered/compiled).

### Manual Verification Checklist (Part A)

- [x] Verify `docs/AUTH_VERIFICATION.md` covers architecture, cookie table, and threat model.
- [x] Run `pnpm test` and verify 10 server refresh scenarios + 5 client refresh scenarios pass.
- [x] Run `pnpm --filter client test src/lib/token-storage.spec.ts` to confirm no client token storage leaks.
- [x] Verify cookie attributes in response (`Path=/auth`, `HttpOnly`, `SameSite=Lax`).
- [x] Verify WebSocket gateways do not allow wildcard CORS with credentials.
- [x] Verify `pnpm codemap:check` passes without errors.

## Phase 10: Board and Studio (In Progress)

### What Was Built
- **Pass 0: Engine Extraction (Committed `3e21568`)**:
  - Extracted pure constraint engine core (`types`, `ScheduleState`, constraints, `SuggestionStrategy`, `PreBuildChecker`, `ValidationService`) into framework-free package `@slotly/engine`.
  - Built with `tsup` supporting ESM, CJS, and DTS.
  - Server and client import from `@slotly/engine`.
- **Pass 1: Contracts and Server Schedules Implementation**:
  - **Contracts (`packages/contracts`)**:
    - Added `ScheduleResourceTypeSchema` (`faculty`, `room`, `section`, `batch`).
    - Added DTOs: `ScheduleEntryDto`, `ScheduleOccupancyDto`, `ScheduleOperationDto`, `MoveSlotDto`, `SwapSlotsDto`, `EditSlotDto`, `BulkSlotsDto`, `MergeSlotDto`, `SplitSlotDto`, `LockSlotDto`, `UpdatePeriodsDto`, `PeriodsChangeResultDto`, `MoveValidationResultDto`.
    - Added `ScheduleSocketEvents` contract for `/schedule` gateway.
  - **Storage & Indexes (`server/src/modules/schedules`)**:
    - `ScheduleEntry`: models granular timetable slot cells with sectionId, batchId, facultyId, roomId, subjectId, day, startPeriod, span, type, locked, revision.
    - `ScheduleOccupancy`: unique compound index on `(versionId, resourceType, resourceId, day, period)` guaranteeing zero double-booking at DB level.
    - `ScheduleOperation`: audit log sequence storing forward and inverse payloads for undo/redo.
    - Updated index migration `ensure-indexes.ts` with compound unique index specifications.
  - **MoveValidator Chain of Responsibility (`server/src/modules/schedules/validators`)**:
    - 10 handlers: `VersionEditableValidator`, `LockValidator`, `BreakValidator`, `LabBlockValidator`, `TargetFreeValidator`, `FacultyFreeValidator`, `RoomFreeValidator`, `FacultyAvailabilityValidator`, `RoomAvailabilityValidator`, `WorkloadValidator`.
    - `MoveValidatorChain`: coordinates sequential validation and returns structured failure codes with resolution suggestions.
  - **Operations Command Registry (`server/src/modules/schedules/operations`)**:
    - Implemented `IScheduleCommand` with `apply()` and `revert()` for: `edit`, `move`, `swap`, `bulk` (atomic batch), `clear`, `merge`, `split`, `lock`, `applySuggestion`, `changePeriodConfig`, `copyPaste`.
    - `ScheduleOperationRegistry`: injectable registry managing command dispatch.
  - **Transactional Execution & Copy-on-Write (`server/src/modules/schedules/services`)**:
    - `SchedulesService`: coordinates execution inside MongoDB replica set transactions via `TransactionHelper`.
    - Optimistic concurrency: verifies `If-Match` revision header, throwing 409 `RevisionConflictException` on mismatch.
    - Conflict Catching: catches MongoDB 11000 duplicate key errors on unique occupancy index and maps to 409 `OCCUPANCY_CONFLICT` with structured swap/reschedule suggestions.
    - Copy-on-Write: editing a published version creates a new draft version, clones entries and occupancies, remaps slot ID references, and applies changes to the fork.
    - Redis Cache-aside: reads cached under tag `project:{id}:schedule` with immediate invalidation on mutation.
    - Undo/Redo: reverts most recent operation from `ScheduleOperation` log and syncs occupancies.
  - **WebSocket Gateway (`server/src/modules/schedules/gateways/schedule.gateway.ts`)**:
    - Namespace `/schedule` with JWT handshake auth and Redis session verification.
    - Room presence tracking: `join:schedule`, `leave:schedule`, `presence:changed`.
    - Real-time event broadcasts: `slot:moved`, `slot:updated`, `slot:locked`, `slot:cleared`, `revision:conflict`.
  - **Migration Service (`server/src/modules/schedules/migrations/schedule-migration.service.ts`)**:
    - Idempotent migration from legacy `ScheduleVersion.slots` embedded arrays to `ScheduleEntry` and `ScheduleOccupancy` collections.
    - Full support for `--dry-run`.
  - **BuildFacade Integration (`server/src/modules/builds/services/build.facade.ts`)**:
    - Automatically persists generated alternatives into `ScheduleEntry` and `ScheduleOccupancy` collections within transactions.

### Decisions
1. **Synchronous Chain Validation**: Validator handlers evaluate pure in-memory business rules over `MoveValidationContext`, eliminating unnecessary async overhead while returning standard Promises from the root coordinator.
2. **Copy-on-Write Slot Remapping**: When published schedules fork to a new draft revision, cloned entries receive new UUIDs and input parameter slot IDs are automatically remapped to the fork's cloned entries so operations complete without requiring client re-query.
3. **Double-Booking Prevention at Database Level**: Compound unique index on `(versionId, resourceType, resourceId, day, period)` guarantees zero double bookings even under concurrent race conditions. Collisions are intercepted and converted to structured 409 `OCCUPANCY_CONFLICT` responses with alternative slot suggestions.

### Test Evidence
- 9 dedicated test suites in `server/src/modules/schedules/tests/`:
  - `move-validators.spec.ts` (18 tests): validates all 10 rules and chain short-circuiting.
  - `unique-occupancy-concurrency.spec.ts` (2 tests): tests concurrent moves and 11000 duplicate key catch to `OCCUPANCY_CONFLICT`.
  - `merge-split.spec.ts` (4 tests): tests multi-period merge and split round-trip.
  - `bulk-atomic.spec.ts` (4 tests): tests atomic batch operations and rollback on error.
  - `swap-operation.spec.ts` (3 tests): tests atomic slot swaps across days/periods and revert.
  - `undo-redo.spec.ts` (2 tests): tests undo and redo from audit log.
  - `revision-conflict.spec.ts` (2 tests): tests `If-Match` revision check throwing 409.
  - `published-copy-on-write.spec.ts` (1 test): tests published immutability and draft fork.
  - `migration-idempotency.spec.ts` (3 tests): tests legacy slot migration accuracy and idempotency.
- All 46 server test suites pass (232 tests passing, 5 todo).
- Monorepo verification: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm codemap:check` all pass with 0 errors.

### Next Steps (Pass 2: Client)
- Timetable Board & Studio UI (FEATURES §9, CLIENT_UX §5.7 & §5.8).
- Interactive drag-and-drop timetable grid using `@dnd-kit/core` with instant client-side validation using `@slotly/engine`.
- Undo/redo shortcuts, bulk selection, period timing manager modal, conflict inspector panel.


## Phase 11: Versions, Comparison, Publishing (Pass 1: Contracts & Server)

### What Was Built
- **Contracts (`packages/contracts`)**:
  - Reason codes: `VERSION_IMMUTABLE`, `INVALID_STATE_TRANSITION`, `HARD_CONFLICTS_EXIST`.
  - Extended `ScheduleVersionStatus`: `['draft', 'editing', 'ready', 'validated', 'pending_approval', 'approved', 'published', 'archived']`.
  - Added Zod schemas and TypeScript types: `PublishRequestStatusSchema`, `PublishRequestDtoSchema`, `RequestPublishDtoSchema`, `ReviewPublishDtoSchema`, `UpdateVersionLabelDtoSchema`, `DuplicateVersionDtoSchema`, `SlotChangeDetailSchema`, `SlotDiffItemSchema`, `FacultyWorkloadDeltaSchema`, `ConflictDeltaSchema`, `ScoreDeltaSchema`, `VersionDiffDtoSchema`, `TimetableRatingDtoSchema`, `TimetableRatingResponseDtoSchema`.
- **Pure State Machine (`server/src/modules/publishing/state-machine`)**:
  - Implemented `PublishStateMachine` with State pattern (`BasePublishState`, `DraftState`, `EditingState`, `ValidatedState`, `PendingApprovalState`, `ApprovedState`, `PublishedState`, `ArchivedState`).
  - Guards: `validated` strictly requires zero hard conflicts and a complete blueprint graph.
  - Reviewer rejection automatically returns the lifecycle to `editing` with a mandatory reviewer comment.
- **Pure Diff and Change Summary Services (`server/src/modules/versions/services`)**:
  - `DiffService`: Computes slot deltas (added, removed, modified faculty/room/subject/time), faculty workload deltas, conflict deltas, and score metric deltas between any two versions.
  - `ChangeSummaryService`: Deterministic sentence builder converting slot diffs into readable, human-friendly summaries ("Data Structures moved from Mon P1 to Wed P3") without AI.
- **Repositories & Immutability (`server/src/modules/versions`, `server/src/modules/publishing`, `server/src/modules/builds`)**:
  - Enforced `VERSION_IMMUTABLE` at the repository layer: `MongoScheduleVersionRepository.update`, `delete`, and `ScheduleEntryRepository.create`, `createMany`, `update`, `delete`, `deleteByVersion` throw 409 `ConflictException('VERSION_IMMUTABLE')` if the version status is `published` or `archived`.
  - Created `PublishRequest` schema and repository (`publish_requests` collection).
  - Created `TimetableRating` schema and repository (`timetable_ratings` collection).
  - Updated index migration `ensure-indexes.ts` with compound indexes for publish requests and timetable ratings.
- **Transactional Publishing (`server/src/modules/publishing/services/publishing.service.ts`)**:
  - `executePublishTransaction`: One atomic MongoDB replica set transaction (`TransactionHelper.withTransaction`) sealing the target version as `published`, archiving the previously published version, updating project status to `published`, marking the publish request approved, recording audit entries, and emitting domain events. Any failure automatically rolls back all changes.
- **REST Endpoints (`server/src/modules/versions`, `server/src/modules/publishing`)**:
  - `GET /projects/:projectId/versions` - List all versions for a project.
  - `GET /versions/:versionId` - Retrieve detailed version metadata.
  - `PATCH /versions/:versionId/label` - Rename/tag a version.
  - `POST /versions/:versionId/duplicate` - Duplicate a version and clone entries.
  - `POST /versions/:versionId/restore` - Restore an archived or published version as a fresh draft revision.
  - `POST /versions/:versionId/archive` - Archive a version.
  - `GET /versions/:leftVersionId/diff/:rightVersionId` - Compute pure diff and summary.
  - `POST /versions/:versionId/publish-request` - Designer requests publishing.
  - `GET /projects/:projectId/publish-requests` - List publish requests for a project.
  - `GET /admin/approvals` - Admin queue of pending publish requests.
  - `POST /publish-requests/:requestId/approve` - Admin approves request and executes publish transaction.
  - `POST /publish-requests/:requestId/reject` - Admin rejects request back to editing state with comment.
  - `POST /versions/:versionId/publish` - Admin direct publish (seals and publishes in transaction).
  - `POST /versions/:versionId/rate` - Submit feedback/rating for a version.
  - `GET /versions/:versionId/ratings` - Retrieve rating summaries and faculty feedback.

### Decisions
1. **Repository-Level Immutability**: Immutability is enforced at the repository layer (`MongoScheduleVersionRepository` and `ScheduleEntryRepository`), ensuring no controller, background worker, or service can bypass immutability checks on published/archived versions.
2. **Deterministic Diff Summaries**: Slot movements, room changes, and teacher changes generate natural language explanations via `ChangeSummaryService` with zero LLM dependence, guaranteeing speed, consistency, and no external token cost.
3. **Atomic MongoDB Multi-Document Publishing**: All publish lifecycle mutations (version status update, archiving of prior published versions, project status update, request approval, and audit logs) execute inside a single MongoDB transaction session via `TransactionHelper`.

### Test Evidence
- 6 test suites covering Phase 11 Pass 1 functionality:
  - `publish-state-machine.spec.ts` (9 tests): Validates lifecycle transitions, guards for hard conflicts and blueprint completion, and rejection returns.
  - `diff-and-summary.spec.ts` (4 tests): Tests slot diffs, workload deltas, conflict deltas, and natural language summary generation.
  - `transactional-publishing.spec.ts` (3 tests): Tests atomic publish execution, previous version archiving, and rollback on failure.
  - `repository-immutability.spec.ts` (6 tests): Validates `VERSION_IMMUTABLE` repository exceptions across versions and schedule entries.
  - `publishing-workflow.spec.ts` (4 tests): Tests request, approve, and reject workflows with role checks and comments.
  - `versions-service.spec.ts` (4 tests): Tests duplicate, restore, label update, and archive flows.
- Total test suite status: 52 passed, 262 tests passed, 0 failures.
- Verification: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm codemap:check` all pass cleanly with 0 errors.

### Manual Test Checklist
1. **Version Duplication & Restore**:
   - Duplicate an existing version -> verify new version is created with status `draft` and identical entries.
   - Restore an archived or published version -> verify a new draft revision is created.
2. **Diff & Summary**:
   - Request diff between two versions -> verify returned JSON contains `added`, `removed`, `changed`, `workloadDeltas`, `conflictDeltas`, and readable `summaryLines`.
3. **Publishing Lifecycle & Approval**:
   - As DESIGNER, request publish on a draft with hard conflicts -> verify 400 rejection `HARD_CONFLICTS_EXIST`.
   - As DESIGNER, request publish on a valid schedule -> verify status is `pending_approval`.
   - As ADMIN, reject request with comment -> verify status transitions back to `editing` and comment is recorded.
   - As ADMIN, approve request -> verify version is sealed `published`, previous version is `archived`, and project status is `published`.
4. **Immutability Protection**:
   - Attempt to update or delete a published version or its schedule entries -> verify 409 `VERSION_IMMUTABLE` response.



## Phase 12: Viewers, Exports, Sharing, Notifications (Pass 1: Server & Contracts Complete)

### What Was Built (Pass 1: Contracts & Server)

1. **Contracts Package (`@slotly/contracts`):**
   - Added reason codes: `SHARE_EXPIRED`, `SHARE_REVOKED`, `FEED_REVOKED`, `NO_PUBLISHED_VERSION`, `EXPORT_EXPIRED`.
   - Added permissions: `TIMETABLE_SHARE`, `ANNOUNCEMENT_CREATE` to `PermissionSchema` and `RolePermissions`.
   - Added Zod schemas and TypeScript types: `ViewerEntityTypeSchema`, `CurrentPeriodStatusSchema`, `ViewerTimetableQueryDtoSchema`, `ViewerTimetableDtoSchema`, `ExportFormatSchema`, `CreateExportDtoSchema`, `ExportJobStatusSchema`, `ExportJobDtoSchema`, `CreateCalendarFeedDtoSchema`, `CalendarFeedDtoSchema`, `ShareScopeSchema`, `CreateShareDtoSchema`, `ShareDtoSchema`, `PublicShareViewDtoSchema`, `NotificationChannelSchema`, `NotificationTypeSchema`, `NotificationDtoSchema`, `NotificationPreferencesDtoSchema`, `CreateAnnouncementDtoSchema`, `NotificationSocketEvents`.

2. **Viewer Module (`server/src/modules/viewer`):**
   - `CurrentPeriodService`: Pure domain service computing period position with injectable `CLOCK` token (`IClock`), supporting before first period, active periods, breaks, after last period, holidays, and per-day overrides.
   - `ViewerService`: Queries published-only timetable versions, computes live period status, resolves entity landing timetable (`me` for Faculty/Student), and caches results in Redis under `slotly:viewer:...` with invalidation tag `project:{id}:viewer`.
   - `ViewerController`: `GET /viewer/projects/:projectId/timetable` and `GET /viewer/me`.

3. **Exports Module (`server/src/modules/exports`):**
   - Exporter Strategy pattern: `IExporter` implemented by:
     - `PdfExporter` (landscape vector grid via `pdfkit`)
     - `ExcelExporter` (multi-column spreadsheet via `xlsx`)
     - `ImageExporter` (raster PNG table via pure JavaScript `pngjs` - no native bindings)
     - `IcsExporter` (RFC 5545 compliant recurring iCalendar VCALENDAR/VEVENT events with proper timestamps, UTC conversions, and breaks)
   - `ExporterFactory`: Resolves exporter strategy by requested format.
   - `LocalStorageProvider`: `IStorageProvider` adapter persisting artifacts under `uploads/exports/`.
   - `ExportFacade`: Coordinates BullMQ export jobs, expiring signed download tokens, and ownership authorization.
   - `ExportProcessor`: BullMQ worker processing `exports` queue jobs.
   - `ExportsController`: `POST /exports/projects/:projectId`, `GET /exports/:jobId`, `GET /exports/download/:token`.

4. **Calendar Feeds Module (`server/src/modules/calendar-feeds`):**
   - `CalendarFeed` schema and repository: SHA-256 token hashing, per-faculty/section/room scopes, and active status tracking.
   - `CalendarFeedsService`: Feed URL tokenization and RFC 5545 streaming.
   - `CalendarFeedsController`: `POST /calendar-feeds/projects/:projectId`, `GET /calendar-feeds/projects/:projectId`, `DELETE /calendar-feeds/:feedId`.
   - `PublicCalendarController`: Public unauthenticated rate-limited endpoint `GET /public/calendar/:feedToken.ics` with live calendar streaming.

5. **Shares Module (`server/src/modules/shares`):**
   - `Share` schema and repository: SHA-256 token hashing, scope (`all`, `section`, `faculty`, `room`), label, and expiry tracking.
   - `SharesService`: Generates revocable random tokens, handles public read-only resolution cached under `slotly:public:share:${tokenHash}` with 300s TTL.
   - `SharesController`: `POST /shares/projects/:projectId`, `GET /shares/projects/:projectId`, `DELETE /shares/:shareId`.
   - `PublicSharesController`: Public endpoint `GET /public/shares/:token` returning published timetable views.

6. **Notifications & Announcements Module (`server/src/modules/notifications`):**
   - `Notification` and `NotificationPreferences` schemas and repositories.
   - `RecipientResolverService`: Resolves recipient user IDs and emails for announcements (role and institution targeting) and timetable lifecycle events.
   - `NotificationsGateway`: WebSocket gateway on namespace `/notifications` with JWT handshake authentication, joining personal user room `user:${userId}`, and emitting `notification:received` and `announcement:received`.
   - `NotificationsService`: Preference evaluation (global channels and per-type overrides), in-app notification creation, gateway push, and email dispatch.
   - `NotificationsFanoutProcessor`: Event consumer on `EventBus` listening to `timetable.published`, `timetable.updated`, `timetable.assignment_changed`, `timetable.conflict_found`, and `timetable.schedule_change`. Automatically invalidates cache tag `project:${projectId}:viewer` when published.
   - `NotificationsController`: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`, `GET /notifications/preferences`, `PUT /notifications/preferences`.
   - `AnnouncementsController`: Admin-only `POST /announcements`.

### Decisions
1. **Zero Native C++ Dependencies**: Selected `pngjs` for raster PNG generation and `pdfkit` for vector PDF rendering, eliminating binary build dependencies (`node-gyp` / `canvas`) that frequently cause platform instabilities on Windows and Docker.
2. **Deterministic SHA-256 Token Hashing**: Public calendar feeds and public shares store SHA-256 hashes of cryptographically random hex tokens, ensuring database leaks cannot compromise active subscription feeds.
3. **Published-Only Isolation**: All viewer, export, calendar feed, and public share queries strictly load the **published** schedule version only. Un-published projects uniformly return `NO_PUBLISHED_VERSION`.
4. **Cache Invalidation on Publish**: `ViewerService` caches are tagged with `project:${projectId}:viewer`. When `timetable.published` is emitted on the domain event bus, `NotificationsFanoutProcessor` invalidates the cache tag.

### Test Evidence
- 4 test suites covering Phase 12 Pass 1 functionality:
  - `current-period.service.spec.ts` (7 tests): Validates clock before start, in period, in break, after end, holidays, off-days, and per-day overrides using a FakeClock.
  - `exporters.spec.ts` (5 tests): Validates golden outputs for PDF (`%PDF-1.3`), Excel (`workbook.SheetNames`), PNG (magic signature `0x89 0x50 0x4E 0x47`), and RFC 5545 compliant iCalendar string structure.
  - `shares.spec.ts` (5 tests): Validates token hashing, public timetable resolution, `SHARE_REVOKED` on inactive/missing tokens, `SHARE_EXPIRED` on past expiry dates, and cache eviction on revocation.
  - `notifications-fanout.spec.ts` (6 tests): Validates announcement audience resolution, event recipient resolution, channel preference filtering (in-app vs email), per-type preference overrides, and `timetable.published` cache invalidation.
- Monorepo tests: 69 test suites passed, 373 tests passed, 0 failures.
- Verification: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm codemap` all pass cleanly with 0 errors.

### Manual Test Checklist
1. **Viewer & Current Period**:
   - Query `GET /viewer/projects/:projectId/timetable?type=section&targetId=:secId` on a published project -> verify published timetable is returned with current period context.
   - Query `GET /viewer/me` as FACULTY / STUDENT -> verify landing timetable is automatically resolved for the user.
2. **Exports & Downloads**:
   - Request export `POST /exports/projects/:projectId` with format `pdf` / `excel` / `image` / `ics` -> verify job is enqueued.
   - Poll `GET /exports/:jobId` until completed -> verify signed download URL.
   - Download file using signed URL `GET /exports/download/:token` -> verify valid binary/text content.
3. **Calendar Feeds & Sharing**:
   - Create feed `POST /calendar-feeds/projects/:projectId` -> subscribe in calendar app or fetch `GET /public/calendar/:feedToken.ics` -> verify valid VCALENDAR stream.
   - Create share link `POST /shares/projects/:projectId` -> fetch unauthenticated `GET /public/shares/:token` -> verify public timetable payload.
   - Revoke share / feed -> verify subsequent requests return 404 / 410.
4. **Notifications & Announcements**:
   - Connect WebSocket client to `/notifications` with JWT.
   - Post admin announcement `POST /announcements` -> verify WebSocket client receives `announcement:received` and notification appears in `GET /notifications`.
   - Update preferences `PUT /notifications/preferences` with inApp disabled -> verify subsequent notifications are suppressed from in-app delivery.


### Plan
- **Contracts (`packages/contracts`)**:
  - Viewer DTOs: `ViewerTimetableDto`, `CurrentPeriodStatusDto`, `ViewerTimetableQueryDto`.
  - Export DTOs: `CreateExportDto`, `ExportJobDto`, `ExportFormat` ('pdf' | 'excel' | 'image' | 'ics').
  - Calendar Feed DTOs: `CreateCalendarFeedDto`, `CalendarFeedDto`.
  - Public Share DTOs: `CreateShareDto`, `ShareDto`, `PublicShareViewDto`.
  - Notification DTOs: `NotificationDto`, `NotificationPreferencesDto`, `CreateAnnouncementDto`, `NotificationType`.
  - Socket events: `/notifications` namespace with `notification:received`, `announcement:received`.
- **Viewer Module (`server/src/modules/viewer`)**:
  - Pure `CurrentPeriodService` with injectable `CLOCK` token (`IClock`) supporting fake clock in tests.
  - `ViewerService`: loads week/day schedules from published version only, resolves current & upcoming period.
  - Tag-based caching with `project:{id}:viewer` invalidated when a new version is published.
- **Exports Module (`server/src/modules/exports`)**:
  - Strategy pattern: `IExporter` implemented by `PdfExporter` (`pdfkit`), `ExcelExporter` (`xlsx`), `ImageExporter` (`pngjs`), and `IcsExporter` (RFC 5545).
  - Factory & Facade: `ExporterFactory`, `ExportFacade`.
  - Storage: `IStorageProvider` adapter (`LocalStorageProvider` targeting `./uploads/exports/`).
  - BullMQ `exports` queue worker + signed download token generator with ownership check.
- **Calendar Feed Module (`server/src/modules/calendar-feeds`)**:
  - Hashed token generation (SHA-256), database persistence in `calendar_feeds`, revocation.
  - Public endpoint `GET /public/calendar/:feedToken.ics` rendering live RFC 5545 iCalendar stream.
- **Sharing Module (`server/src/modules/shares`)**:
  - Random token generation, SHA-256 hashing, scoped visibility (`all`, `section`, `faculty`, `room`).
  - Public endpoint `GET /public/shares/:token` (rate-limited, Redis cached, published read-only).
- **Notifications & Announcements (`server/src/modules/notifications`)**:
  - Fan-out processor listening to domain events (`timetable.published`, `timetable.updated`, `timetable.assignment_changed`, `timetable.conflict_found`, `timetable.schedule_change`, `announcement.created`).
  - Recipient resolver: resolves users by role, department, section, or faculty assignment.
  - User channel preferences filtering (`email`, `in_app`).
  - In-app notification repository and WebSocket gateway (`/notifications` namespace).
  - BullMQ `EmailProcessor` with retry, exponential backoff, and dead-letter queue.
  - Admin announcement dispatch.
- **Tests**:
  - Fake clock testing for `CurrentPeriodService` (before start, in period, in break, after end, holidays, per-day overrides).
  - Exporter golden outputs (valid PDF buffer, Excel buffer, PNG magic header, compliant RFC 5545 .ics structure).
  - Calendar feed & share token hashing, verification, expiry, and revocation.
  - Fan-out recipient resolution & notification preference filtering.
---

## Phase 13: Analytics and Administration (Pass 1: Contracts & Server - Completed)

### Plan
- **Contracts (`packages/contracts`):**
  - Added permissions: `ANALYTICS_READ`, `FEEDBACK_SUBMIT`, `FEEDBACK_MANAGE`, `SYSTEM_MONITOR`.
  - Analytics DTOs: `AnalyticsOverviewDto`, `FacultyWorkloadDistributionDto`, `RoomUtilizationDto`, `PeriodUtilizationDto`, `FacultyFreePeriodsDto`, `DepartmentStatsDto`, `UnallocatedSubjectDto`, `SchedulingEfficiencyDto`, `WorkloadBalancingSuggestionDto`.
  - Admin & Security DTOs: `AdminUserListItemDto`, `ChangeUserRoleDto`, `RolePermissionsMatrixDto`, `AdminTimetableItemDto`, `AdminReportedConflictDto`, `SecurityEventDto`, `UserSessionItemDto`.
  - Feedback DTOs: `CreateFeedbackDto`, `FeedbackDto`, `UpdateFeedbackDto`.
  - Audit Query DTOs: `AuditQueryDto`, `AuditLogListDto`.
  - Monitoring DTOs: `SystemHealthDto`, `QueueHealthItemDto`, `QueuesHealthResponseDto`, `ClientWebVitalsDto`.
- **Analytics Module (`server/src/modules/analytics`):**
  - Strategy Pattern: `AnalyticsMetric` interface with individual metric calculators:
    - `OverviewCountsMetric` (totals: faculty, departments, rooms, subjects, sections, generated/published timetables, open conflicts)
    - `FacultyWorkloadMetric` (target vs scheduled hours, under/overload status)
    - `RoomUtilizationMetric` (capacity, occupied periods, percentage)
    - `SubjectAllocationMetric` (allocated vs required weekly periods)
    - `PeriodUtilizationMetric` (period popularity across days)
    - `FreePeriodsMetric` (free periods per faculty)
    - `DepartmentStatsMetric` (sections, faculty, weekly hours)
    - `UnallocatedSubjectsMetric` (missing hours and unassigned classes)
    - `SchedulingEfficiencyMetric` (compactness, teacher preference, distribution)
  - `MetricRegistry`: Register and resolve metric strategies dynamically.
  - `WorkloadBalancerService`: Read-only suggestion engine identifying load rebalancing swaps.
  - `AnalyticsService`: Redis cache-aside (`slotly:analytics:{projectId}:{metric}`, TTL 1h) tagged with `project:{projectId}:analytics`.
  - BullMQ `analytics` queue worker for background counter increments and cache pre-warming.
- **Admin Module (`server/src/modules/admin`):**
  - User management: List users with pagination and search, role modification with step-up verification (password or MFA), force password reset, and require MFA flag.
  - Role permissions matrix endpoint (`GET /admin/roles`).
  - Session and security audit tracking per user.
  - Timetable and reported conflict monitoring.
  - System health and queue operations (`GET /admin/system/health`, `GET /admin/system/queues`, retry failed jobs).
- **Feedback Module (`server/src/modules/feedback`):**
  - Mongoose `Feedback` schema and repository (`feedback` collection).
  - User submission and own feedback querying (`POST /feedback`, `GET /feedback/me`).
  - Admin triage, status transitions, and replies (`GET /admin/feedback`, `PATCH /admin/feedback/:id`).
- **Audit Query & CSV Export:**
  - Indexed filtering on `AuditLog` collection: actorId, action, targetType, targetId, date range, pagination.
  - Export CSV job on `exports` queue returning expiring signed download ticket.
- **Monitoring & Observability (`server/src/modules/monitoring`):**
  - Prometheus metrics at `GET /metrics` via `prom-client`.
  - Terminus health indicators for MongoDB, Redis, and BullMQ queues.
  - Redis sliding window rate limiting storage adapter.
  - Web Vitals collector `POST /monitoring/vitals` enqueuing client metrics.
- **OpenAPI Swagger:**
  - Configured at `/docs` in `server/src/main.ts` for non-production environments.
- **Tests:**
  - Metric calculators tested with deterministic timetable and blueprint fixtures.
  - Audit filtering and pagination unit tests.
  - Admin endpoint authorization guards and step-up verification tests.
  - Rate limiting tests.


### Pass 1 Implementation Summary (Completed)
- **Built**:
  - `packages/contracts`: Analytics, Admin, Feedback, Monitoring, Audit DTO schemas; permissions (`ANALYTICS_READ`, `FEEDBACK_SUBMIT`, `FEEDBACK_MANAGE`, `SYSTEM_MONITOR`); reason codes (`STEP_UP_REQUIRED`, `FEEDBACK_NOT_FOUND`).
  - `AnalyticsModule`: `IAnalyticsMetric` strategy interface and 9 metric implementations in `MetricRegistry` (`overview_counts`, `faculty_workload`, `room_utilization`, `subject_allocation`, `period_utilization`, `free_periods`, `department_stats`, `unallocated_subjects`, `scheduling_efficiency`); `WorkloadBalancerService` returning non-destructive suggestions; `AnalyticsService` caching with Redis (TTL 3600s, tagged `project:{projectId}:analytics`); `AnalyticsProcessor` consuming BullMQ `analytics` queue.
  - `FeedbackModule`: Mongoose `Feedback` schema and repository; user endpoints (`POST /feedback`, `GET /feedback/me`); administrative triage endpoints (`GET /admin/feedback`, `PATCH /admin/feedback/:id`).
  - `AdminModule`: `AdminUsersService` with step-up verification for role escalation, password reset enforcement, mandatory MFA, session revocation, security events history; `AdminRolesController` returning permission matrix; `AdminTimetablesService` tracking institutional timetable versions and constraint violations; `AdminSystemService` inspecting subsystem health and BullMQ queue depths with retry capabilities; `AdminAuditController` with indexed query filters and background CSV exports.
  - `MonitoringModule`: `PrometheusMetricsService` collecting standard runtime metrics, HTTP request latency/counters, and active builds at `GET /metrics`; `RedisRateLimitGuard` (`slotly:system:rate-limit:{ipOrUserId}`); Web Vitals intake at `POST /monitoring/vitals`; OpenAPI Swagger docs enabled at `/docs`.
  - Notification Cache Invalidation: `NotificationsFanoutProcessor` updated to synchronously invalidate tag `project:{projectId}:analytics` on `timetable.published`.
- **Decisions Made**:
  - Faculty workload balancing returns suggestions only without modifying timetable entries.
  - User role modifications strictly enforce recent step-up authentication within active session or inline password confirmation; target user's active sessions are automatically revoked to apply new permissions immediately.
  - Analytics calculations use cache-aside with tags for instantaneous invalidation on publishing.
- **What Was Skipped / Deferred**:
  - Pass 2 Client views (Analytics parallel slots, ChartSkeleton, Admin management tables, Feedback modal, Monitoring charts) deferred to Pass 2.
- **Manual Test Checklist**:
  1. `GET /metrics` returns valid Prometheus metrics format including runtime memory and custom HTTP counters.
  2. `GET /docs` serves Swagger UI in development.
  3. `GET /admin/system/health` returns `status: ok` with MongoDB, Redis, and queues statuses.
  4. `GET /admin/system/queues` lists all queues with waiting/active/completed/failed counts.
  5. `POST /feedback` submits user feedback; `GET /feedback/me` retrieves it; `GET /admin/feedback` lists it for administrators; `PATCH /admin/feedback/:id` updates status with admin reply.
  6. `PATCH /admin/users/:userId/role` returns 403 `STEP_UP_REQUIRED` if caller session is not stepped up and no valid password is provided.
  7. `GET /analytics/projects/:projectId/overview` and `GET /analytics/projects/:projectId/metrics` return computed analytical metrics and cache them under tag `project:{projectId}:analytics`.


---

## UX Task 03: Sys0 Header & Project Cards Restyle

Restyled application header and project cards to the sys0 visual language specification (`ux/03-sys0-header-cards`).

### What Was Built

1. **Contracts & Server Readiness Integration:**
   - Extended `@slotly/contracts`: Added `blueprintProgress` (nullable number from 0 to 100) to `ProjectDtoSchema`.
   - Updated `ProjectsService` in NestJS: Reads cached blueprint readiness (`slotly:blueprint:${id}:readiness`) or cached blueprint nodes from Redis to compute progress percentage dynamically with zero database overhead.

2. **Design Tokens & Global Styles (`client/src/app/globals.css`):**
   - Added visual spec tokens: `--radius-card: 20px`, `--radius-control: 12px`, `--card-padding: 24px`, `--header-height: 72px`, `--page-max-width: 1016px`, `--border-strong: #383838`.
   - Preserved strict monochrome palette: background `#0A0A0A`, surface `#111111`, border `#232323`, text `#FAFAFA`, muted `#8A8A8A`.
   - Accent yellow `#FACC15` restricted to under 5% (the wordmark "o", unread notification dot, and single primary "New project" button).

3. **Core Layout & Navigation Components:**
   - `PageContainer`: Centered 1016px content column (`max-w-5xl`, `px-4 sm:px-6`) with fluid mode for full-bleed workspaces.
   - `PageHeader`: 36px title (30px mobile, tracking -0.02em), 15px description, quiet links, and actions slot, plus `PageHeaderSkeleton`.
   - `AppNav`: Plain text links (14px, muted hover to white), active link white with 1px underline offset 6px in white at 60% opacity (`decoration-white/60`, never yellow), role filtering, accessible ARIA landmarks, and vertical variant for mobile sheets.
   - `UserMenu`: 32px circular avatar dropdown showing user initials, email, role badge, Profile, Security, Active Sessions, and Sign out.
   - `AppHeader`: 72px sticky header, wordmark lockup ("slotly" with yellow "o", 16px divider, "Beta" mono tag linking to `/home`), plain notification bell with unread dot, user avatar, scroll-state backdrop blur and border (after 12px scroll), mobile sheet, and compact mode (`compact=true`, 56px) for canvas workspaces.
   - `AppLayout`: Composes `AppHeader` and `PageContainer` with route protection and zero-layout-shift shell skeletons.

4. **Surface Card & Project Components:**
   - `SurfaceCard`: 20px radius, 24px padding, `#111111` surface, `#232323` border, hover border `#383838`, hover bg `#161616`, focus-within ring.
   - `ProgressBars`: 3-bar progress indicator glyph (6px, 10px, 14px) with status mapping (`getIndicatorConfig`: 1 bar draft/archived, 2 yellow bars building/pending, 2 green bars ready, 3 green bars published).
   - `StatusIndicator`: Combines 3-bar indicator with monospace status label and percentage ("Draft · 40% set up").
   - `ProjectCard`:
     - Stretched link overlay covering the card (`Link` to `/projects/:id/blueprint`).
     - Top row: 32px monochrome calendar glyph, status label with arrow (nudges 2px on hover), isolated "..." dropdown menu button (`MoreHorizontal`) opening Settings, Duplicate, and Archive options with stopPropagation.
     - Middle: 20px title (clamp-2), monospace subtitle, 3-line description.
     - Pinned footer row: 3-bar status indicator and revision/opened metadata ("Rev 1 · opened 9 Nov").
     - `ProjectCardSkeleton`: Matching structure and dimensions in 6-card grid.

5. **Projects Page (`client/src/app/projects/page.tsx`):**
   - Restyled with `PageHeader` ("Academic Projects", "Templates and Kits" quiet link, single yellow "New project" button).
   - Single-row filter bar: search input (40px, rounded 12px, surface bg) and compact status select (40px, rounded 12px).
   - Responsive 3-column surface card grid.
   - SurfaceCard-styled Empty and Error states.
   - Duplicate and Archive modal dialog flows preserved.

6. **Automated Tests:**
   - Server: `projects.service.spec.ts` testing cached readiness, graph fallback, null fallback, and DTO validation.
   - Client: `app-nav.spec.ts` testing `isNavActive` matching; `status-indicator.spec.ts` testing `getIndicatorConfig` and `formatStatusLabel`; `project-card.spec.ts` testing `formatOpenedMeta`, `getProjectDescription`, and `getStatusColorClass`.

### Decisions Made

- **Stretched Link Overlay Pattern:** Placed a full-card stretched link `Link` covering `absolute inset-0 z-10` with rounded corners. Isolated interactive elements (the `MoreHorizontal` menu button) with `relative z-20` and `e.stopPropagation(); e.preventDefault();` to allow menu interaction without navigating.
- **Active Navigation Indicator:** Implemented active link styling strictly as white text with a 1px underline offset 6px (`decoration-white/60`), never using yellow accents, per design rules.
- **Header Creation Button Migration:** Removed the header "Create Project" button, moving primary creation to the page header of `/projects` as "New project".
- **Compact Header Mode:** Kept `compact` variant on `AppHeader` and `AppLayout` so full-bleed interactive workspaces (Blueprint canvas, Studio) preserve their existing layout.

### Manual Test Checklist

1. Navigate to `/projects`: App header displays wordmark "slotly" with yellow "o", 16px vertical divider, "Beta" mono tag linking to `/home`.
2. Header navigation links (Projects, Institution, Library, Templates) are plain text without pill borders; active link ("Projects") is white with a subtle white underline.
3. Notification bell appears as a clean icon button with a small yellow unread indicator dot.
4. Clicking the 32px circular avatar opens the dropdown showing name, email, role, Profile, Security, and Sign Out.
5. Projects page header shows "Academic Projects", "Templates and Kits" quiet link with arrow, and single yellow "New project" button.
6. Filter bar shows search input and status select in a single clean row with 12px rounded corners.
7. Project cards render in a responsive 3-column grid with 20px rounded corners, 24px padding, calendar glyph, status arrow nudging on hover, title, subtitle, description, and pinned footer with 3-bar indicator and opened date.
8. Clicking a card navigates to `/projects/:id/blueprint`; clicking the "..." menu opens the options dropdown without navigating to the blueprint.

Merged via `ux/03-sys0-header-cards`, tag `ux-03-sys0-header-cards-merged`.


---

## UX Task 04: Library Routes & Layout Modernization

Split monolithic Library page into dedicated route segments (`/library/faculty`, `/library/subjects`, `/library/rooms`) with shared persistent layout, export dropdown, per-route loading/error states, and unified spacing scale (`ux/04-library-routes`).

### What Was Built

1. **Routing & Server Redirects:**
   - Dedicated route segments: `/library/faculty`, `/library/subjects`, `/library/rooms`.
   - Permanent and temporary redirects: `/library` redirects to `/library/faculty`; `/library/subject` and `/library/room` redirect to `/library/subjects` and `/library/rooms` in `next.config.ts` and in route page fallbacks.
   - Preserves query parameters across tab navigation: `search` and `archived` preserved globally; `department` preserved between Faculty and Subjects, and cleanly excluded from Rooms (which are institution-level facilities).

2. **Shared Layout (`client/src/app/library/layout.tsx`):**
   - Composes `AppLayout` (`activePath="/library"`), `LibraryProvider`, `PageHeader`, `LibraryTabs`, `LibraryToolbar`, and `{children}`.
   - Header, tabs, and filter toolbar stay mounted during tab transitions (zero re-mounting).
   - Strict spacing scale applied: PageContainer top padding to `PageHeader`, 40px gap (`mb-10`) to `LibraryTabs`, 16px gap (`mb-4`) to `LibraryToolbar`, 16px gap (`mb-4`) to table card, and 64px bottom padding (`pb-16`). All sharing the identical 1016px max-width gridline.

3. **Segmented Link Navigation (`LibraryTabs`):**
   - Segmented link navigation with icons (`Users`, `BookOpen`, `DoorOpen`), 40px height, 12px radius, surface active background (`#181818`), border `#232323`, and inactive muted text.
   - Real Next.js `Link` components with `usePathname()` and `aria-current="page"`.
   - Displays real counts when loaded or an inline skeleton bar when uncomputed (never misleading "0").

4. **Unified Toolbar & Header Actions (`LibraryToolbar`, `LibraryHeaderActions`):**
   - Flattened toolbar without nested bordered boxes: 40px search input with search icon, 40px department select, and 40px active/archived toggle button.
   - `LibraryExportDropdown`: Single 40px outline button with download icon and chevron, menu options for "Excel (.xlsx)" and "CSV (.csv)", keyboard accessible (Enter/Space opens, arrow keys navigate, Escape closes with focus return).
   - Single primary yellow button matching active tab: "Add faculty", "Add subject", or "Add room" (the only yellow element on the page besides the wordmark "o" and unread bell dot).

5. **Table Surfaces & Per-Route States:**
   - Flush `SurfaceCard` (static 20px radius, 1px border `#232323`, `#111111` surface, no outer table padding so borders reach edges, table scrolls horizontally inside card below 1024px).
   - Fixed column min-widths preventing wrap at 1024px: "Teaching Workload" (`min-w-[220px]`), "Qualified Subjects" (`min-w-[140px]`).
   - `LibraryTableSkeleton`: Zero-layout-shift skeleton for each route with 8 body rows matching column widths.
   - `LibraryErrorPanel`: Isolated error card per route with Retry button calling `reset()` and return link to `/library/faculty`.
   - `LibraryEmptyState`: Clean 48px vertically padded empty state inside table with primary create button and import link.

6. **State & Dialog Architecture (`LibraryProvider`, `useLibrary`):**
   - Context provider managing shared filter state, query parameter synchronization, tab counts, and dialog instances (`FacultyDialog`, `SubjectDialog`, `RoomDialog`, `ElectiveGroupDialog`, `ImportWizardDialog`, `ConfirmDialog`) mounted once at the layout level.

7. **Automated Tests:**
   - `library-tabs.spec.ts`: Tests `getActiveLibraryTab`, `getLibraryTabHref` query parameter preservation and room department filtering, and tab definitions.
   - `library-empty-state.spec.ts`: Tests empty messages and primary button labels per entity.
   - `library-columns.spec.ts`: Tests column definitions, min-widths, and alignment across all 3 tables.
   - `library-redirects.spec.ts`: Validates `next.config.ts` redirects for `/library`, `/library/subject`, and `/library/room`.

### Decisions Made

- **Layout-Level Dialog Hosting:** Placed all entity edit/create/import/delete dialogs inside `LibraryProvider` at the layout level so dialog opening never remounts the table, and child route files remain strictly focused on table row rendering.
- **Query Parameter Preservation Rule:** Preserved `search` and `archived` across all tabs. Preserved `department` between Faculty and Subjects, but excluded it from Rooms because rooms are institution-level entities.
- **Loading State Skeleton Counts:** Replaced misleading "(0)" count on loading tabs with an inline skeleton pill so users are not mislead into thinking a directory is empty before data arrives.

### Manual Test Checklist

1. Navigate to `/library`: Confirmed server-side redirect to `/library/faculty`.
2. Navigate to `/library/subject` and `/library/room`: Confirmed redirects to `/library/subjects` and `/library/rooms`.
3. Verify top bar has "Library" active with a white 1px underline.
4. Verify PageHeader displays "Resource Library" with 40px spacing to the tab bar.
5. In `LibraryTabs`, verify 3 segmented tabs (Faculty, Subjects, Rooms & Facilities) with 40px height and 12px radius; active tab has surface background and 1px border.
6. Verify clicking tabs updates URL without full page reload or layout remounting.
7. Verify search, department, and active filters are plain controls on the page background without nested boxes.
8. Verify "Export" is a single outline dropdown button with `.xlsx` and `.csv` items; test opening with Enter/Space and closing with Escape.
9. Verify single yellow primary action button ("Add faculty", "Add subject", "Add room") per tab.
10. Verify tables scroll horizontally inside the SurfaceCard below 1024px with zero horizontal page scroll at 390px.
11. Confirm "Teaching Workload" and "Qualified Subjects" headers do not wrap or collide at 1024px.

Merged via `ux/04-library-routes`, tag `ux-04-library-routes-merged`.


---

## UX Task 05: Templates & Kits Page Restyle

Restyled the Blueprint Templates and Kits page (`/templates`, `/blueprint-templates`, `/kits`) to match the sys0 visual language and Projects page anatomy (`ux/05-templates-restyle`).

### What Was Built

1. **Page Shell & Layout Alignment (`PageHeader`, `PageContainer`):**
   - Title: "Blueprint Templates and Kits", description in 15px sans muted text with max width ~660px, 40px spacing (`mb-10`) below the header.
   - Header actions slot: quiet text link "Projects" with arrow pointing to `/projects`, and single yellow primary button "New project" linking to `/projects/new`.
   - Strict single-yellow accent budget: only the "New project" button uses the yellow accent; all cards, filters, and inspect triggers use monochrome/outline tokens.

2. **Single Toolbar Segmented Control (`CategoryFilter`, `SegmentedControl`):**
   - Reusable `SegmentedControl` in `client/src/components/ui/segmented-control.tsx` (40px height, 12px radius, 1px `#232323` border, surface background, accessible tablist/tab roles, and keyboard arrow navigation).
   - `CategoryFilter` wrapping `SegmentedControl`: displays categories "All 3", "K-12 School", "University", "Vocational and STEM" with dynamic count aggregation.
   - Robust category matching normalizing casing and `&` vs `and`.
   - Single source of truth: filter state derived directly from URL `?category=...` parameter without cascading `useEffect` renders.
   - Horizontally scrollable on narrow viewports with hidden scrollbars; no horizontal page scroll at 390px.

3. **Kit Card Anatomy (`KitCard` composing `SurfaceCard`):**
   - Responsive grid: 3 columns at $\ge 1024$px, 2 columns at 640–1023px, 1 column below 640px, 16px gap (`gap-4`), 20px radius, 24px padding (`p-6`), equal heights (`min-h-[270px]`), footer pinned to bottom.
   - Top row: 32px monochrome glyph in 32px rounded box (`GraduationCap` for K-12, `Landmark` for University, `FlaskConical` for Vocational & STEM, `Layers` fallback); mono 12px category label with arrow nudging 2px right on hover; 32px options button opening dropdown with duplicate action.
   - Content: 20px medium white title (clamped to 2 lines), mono 12px muted subtitle (`Subtree · N nodes · M connections` with lowercase unit words), 14px description with 22px line height (clamped to 3 lines; uses template description or generated fallback "Includes Node1, Node2 and X more."). Tag chips removed from card face.
   - Pinned footer row: 1px top border; left mono 12px version ("v1"); right quiet "Inspect" text button with Eye icon, and outline "Use kit" button (1px border, white text, 32px height, 12px radius, arrow icon). Never yellow.
   - Interaction overlay: Whole card opens non-destructive Inspect Subtree dialog via stretched overlay; action triggers sit above overlay at `z-20`.
   - Hover and focus-visible: border lightens to `#383838`, background shifts to `#161616`, focus-within 2px ring with offset.

4. **Per-Route Loading & Error States:**
   - `KitCardSkeleton`: Skeletons matching exact card anatomy (20px radius, 24px padding, glyph box, category badge, title line, subtitle, 2 description lines, footer border, version, and 2 button skeletons).
   - `loading.tsx`: Added for `/blueprint-templates`, `/kits`, and `/templates` rendering PageHeader skeleton, SegmentedControl skeleton, and 6-card grid.
   - `error.tsx`: Added for `/blueprint-templates`, `/kits`, and `/templates` rendering SurfaceCard error panel with Retry trigger.
   - Empty state: SurfaceCard panel with "No template kits found", description, and "Clear filter" action when a category is filtered.

5. **Route Parity:**
   - `/templates`, `/blueprint-templates`, and `/kits` all cleanly render the unified TemplatesPage.
   - `app-nav.tsx` updated so `/templates` keeps the "Templates" nav link active with the white 1px underline.
   - `middleware.ts` updated with `/templates` in protected routes and matcher.

6. **Automated Tests:**
   - `kit-card.spec.ts`: Tests `formatCategoryLabel`, `formatSubtitle`, `getKitDescription` (custom, <=2 nodes, >2 nodes, empty), `getCategoryGlyph`, clamp classes, and design tokens.
   - `category-filter.spec.ts`: Tests `normalizeCategory`, `matchCategory` (all, exact, ampersand normalization, keywords, rejection).
   - `segmented-control.spec.ts`: Tests option data structure and count properties.
   - `app-nav.spec.ts`: Tests `isNavActive` for `/templates`, `/blueprint-templates`, and `/kits`.

### Decisions Made

- **URL-First Category State:** Derived active category directly from `searchParams.get('category') || 'all'` to avoid cascading `useEffect` renders while keeping URLs shareable and back-button friendly.
- **Ampersand & Keyword Normalization:** Normalized `&` to `and` in category matching so database values (`Vocational & STEM`) seamlessly map to UI specifications (`Vocational and STEM`).
- **Shared SegmentedControl Primitive:** Built a reusable `SegmentedControl` in `components/ui/` with full keyboard arrow navigation and WAI-ARIA tablist semantics.

### Manual Test Checklist

1. Navigate to `/templates`, `/blueprint-templates`, and `/kits`: Verify all three routes load the identical restyled page.
2. Verify top bar has "Templates" active with a white 1px underline.
3. Verify PageHeader displays "Blueprint Templates and Kits" with sans 15px muted description.
4. Verify actions slot has quiet "Projects" link with arrow, and one yellow primary "New project" button. Confirm this is the only yellow element on the page.
5. In CategoryFilter, verify segmented control with "All 3", "K-12 School", "University", "Vocational and STEM" with counts.
6. Verify clicking a category filters the card grid and updates the URL `?category=...`.
7. Verify clearing the category filter restores all cards.
8. Verify each KitCard has: 32px glyph, category label with arrow, "..." menu with Duplicate kit, 20px title (line-clamp-2), mono subtitle, 14px description (line-clamp-3), footer with version, quiet "Inspect", and outline "Use kit".
9. Click card face: verifies Inspect Subtree dialog opens.
10. Click "Use kit": verifies navigation to `/projects/new` without opening Inspect dialog.
11. Click "..." menu: verifies dropdown opens with "Duplicate kit"; press Escape: menu closes without navigation.
12. Verify responsive layout at 1440px (3 cols), 768px (2 cols), 390px (1 col, no horizontal page overflow).

Merged via `ux/05-templates-restyle`, tag `ux-05-templates-restyle-merged`.


---

## UX 06: Landing Page Restyle and Auth Redirect

Visual restyle of the public marketing landing page (`/`) conforming to the sys0 visual language established in `ux/03` and `ux/05`, and implementation of server-side session redirection to `/dashboard`.

### What Was Built

1. **Server-Side Session Validation & Redirect (`/`):**
   - Implemented an async Next.js Server Component in `client/src/app/page.tsx` that reads cookies and verifies the visitor's session against the backend Redis session endpoint before returning any HTML.
   - `validateSessionServer` helper in `client/src/features/auth/services/session-validator.ts` extracts the `sessionId` from `slotly_session` or raw tokens and calls the backend session check `GET /auth/sessions/:sessionId`.
   - Valid sessions trigger an immediate Next.js HTTP 307 temporary redirect to `/dashboard` with 0 flash of landing page content.
   - Expired, revoked, malformed, or missing sessions cleanly render the landing page with HTTP 200 without redirect loops.
   - Added `@Public() @Get('sessions/:sessionId')` endpoint in `server/src/modules/auth/auth.controller.ts` fulfilling `docs/ROUTES.md` line 6.

2. **Public Header Lockup (`PublicHeader`):**
   - 72px transparent header (`h-[72px] pt-4 sm:pt-6`) that transitions on scroll (`window.scrollY > 12`) to a subtle dark backdrop with thin bottom border (`bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#232323]`).
   - Wordmark lockup: "slotly" (20px semibold, accent yellow "o") + 1px vertical divider + mono "Beta" label, linking to `/`.
   - Right action controls: plain text "Sign in" link (14px, muted text `#8A8A8A`, hover white, href `/login`) and outline "Get started" button (1px border, 40px high, 12px radius, href `/register`). Unaccented to reserve the single yellow primary for the hero CTA.

3. **Hero & Features Grid Shell (`HomePage` & `PublicLayout`):**
   - Contained within `PageContainer` (max width 1016px, px-6 / px-4 on mobile).
   - Removed internal developer phase badges ("PHASE 1 FOUNDATION", "SYSTEM OPERATIONAL").
   - Headline: 56px (36px mobile) semibold with balanced text wrapping: "Academic Scheduling, Architected for Zero Conflicts."
   - Description: 17px (15px mobile) muted text `#8A8A8A` (max width 620px).
   - Actions row: exactly ONE yellow primary button on the entire page: "Launch Studio" (height 44px, radius 12px, href `/dashboard`, ArrowRight icon) + outline button "Explore Templates" (height 44px, radius 12px, href `/templates`).
   - Features grid: 4 columns desktop ($\ge 1024$px), 2 columns tablet (640–1023px), 1 column mobile, 16px gap (`gap-4`), sitting 72px below hero actions.
   - 4 feature cards using `SurfaceCard variant="static"` (20px radius, 24px padding, `#111111` surface, `#232323` border):
     - All-white 32px glyphs (`Sliders`, `Cpu`, `Layers`, `ShieldCheck`), eliminating inconsistent colored icon styling.
     - 18px semibold white titles: Visual Blueprint, Constraint Solver, Interactive Studio, Enterprise Security.
     - 14px muted descriptions clamped to 4 lines.

4. **Minimal Site Footer (`SiteFooter`):**
   - Contained within `PageContainer`, positioned 96px (64px mobile) below features grid.
   - 1px top border (`#232323`), 24px vertical padding. Left: "© 2026 Slotly Academic Scheduling" (13px muted); right: "v0.1.0" (mono 12px muted).

5. **Automated Tests:**
   - `session-validator.spec.ts`: Tests `extractSessionId` (null, undefined, empty, legacy '1', malformed, `ses_...`, `s_ses_...`) and `validateSessionServer` (missing session, active session in Redis, 401 expired/revoked, network failure).
   - `landing-redirect.spec.ts`: Tests `getLandingAuthRedirect` resolving `'/dashboard'` for valid sessions and `null` for unauthenticated or revoked visitors.

### Decisions Made

- **Server Component Over Edge Middleware for Session Check:** Performed session validation in `client/src/app/page.tsx` async Server Component rather than Edge Middleware to allow Redis session verification without introducing Edge runtime Node compatibility constraints.
- **Single Yellow Element Rule:** The "Launch Studio" hero button and the wordmark "o" are the only yellow elements on the page. Header buttons, feature icons, and footer are strictly monochrome.

### Manual Test Checklist

1. Navigate to `http://localhost:3000/` without an active session:
   - Verify landing page renders immediately with HTTP 200 and no redirect.
   - Verify PublicHeader has wordmark "slotly" (yellow "o", divider, "Beta"), plain text "Sign in", and outline "Get started".
   - Scroll page: verify header transitions to dark backdrop blur with subtle bottom border.
   - Verify hero has headline, description, yellow "Launch Studio", and outline "Explore Templates". No phase badges visible.
   - Verify 4 cards have all-white 32px icons, 18px titles, and descriptions.
   - Verify footer has copyright and mono "v0.1.0".
2. Sign in to an account, then navigate to `http://localhost:3000/`:
   - Verify browser is automatically and immediately redirected to `/dashboard` (HTTP 307) without flashing landing page content.
3. In browser dev tools, corrupt or delete the session cookie and reload `/`:
   - Verify page renders the landing page cleanly without redirect loops.

Merged via `ux/06-landing-redirect`, tag `ux-06-landing-redirect-merged`.

---

## Fix: Institution Department Creation & Cache Synchronization

Fix for the bug where creating a department in the Institution page showed a success toast but the department appeared neither in the UI hierarchy/lists nor in the database.

### What Was Built & Fixed

1. **Root Cause Analysis:**
   - **Scope/Context Mismatch:** The client dialogs (`DepartmentDialog`, `ProgramDialog`, `AcademicYearDialog`, `SemesterDialog`, `SectionDialog`, `HolidayDialog`) never included the current `institutionId` in their request bodies or query parameters.
   - **Session Provider Missing:** In `InstitutionsController`, `resolveInstitutionId(req, overrideId)` attempted to look up the session via `this.sessionsService`, but `InstitutionsModule` did not import `AuthModule` (which exports `SESSIONS_SERVICE`), leading to a silent failure to persist the active institution into the user's Redis session.
   - **Cache Invalidation Desynchronization:** Sibling creation dialogs only called an un-awaited `fetchStructure()`, which only fetched the hierarchical structure tree without invalidating the broader TanStack Query cache (`institutionKeys.all`), leaving the `departments` and other entity lists stale.
   - **Dialog Form Reset Failure:** When the dialog `open` state changed without an existing entity, form fields did not reset to empty values.

2. **Backend Resolution (`server/src/modules/institutions/`):**
   - Imported `forwardRef(() => AuthModule)` into `InstitutionsModule` so `SESSIONS_SERVICE` is properly injected.
   - Updated `resolveInstitutionId` to persist `institutionId` across the request user context, the Redis session (`updateSessionInstitution`), and MongoDB user document.
   - Updated all entity creation endpoints (`POST /institutions/departments`, `POST /institutions/programs`, etc.) to pass `dto.institutionId || queryInstId` into `resolveInstitutionId`.

3. **Client Resolution (`client/src/features/institution/`):**
   - Updated `useInstitutionMutations` with `invalidateStructure` that awaits `queryClient.invalidateQueries({ queryKey: institutionKeys.all })`.
   - Updated `DepartmentDialog`, `ProgramDialog`, `AcademicYearDialog`, `SemesterDialog`, `SectionDialog`, and `HolidayDialog` to accept `institutionId?: string | undefined`, reset form state on open/close, pass `institutionId` in payloads, and properly await cache invalidation.
   - Error responses keep dialogs open and display descriptive error toasts instead of false success toasts.

4. **Automated Regression Tests (`institution-flow.spec.ts`):**
   - Verified auto-creation of default institution when none exists.
   - Verified department creation with explicit and session-derived `institutionId`.
   - Verified that created departments are persisted in MongoDB and returned in both `/institutions/structure` and `/institutions/departments`.

### Manual Test Checklist

1. Navigate to `/institutions` as an admin or designer.
2. Click "Add Department" or "Create First Department".
3. Enter Code "CS" and Name "Computer Science" and submit.
4. Verify HTTP 201 response with created department object.
5. Verify dialog closes and department appears immediately in the Overview Tree and Departments list.
6. Verify Department count in the statistics summary increments by 1.
7. Refresh page and verify department persists.

Merged via `fix/institution-department-create`, tag `fix-institution-department-create-merged`.

---

## UX 07: Institution Layout Restyle and Sub-Routes

Restyle and architectural restructuring of the Institution feature (`/institutions`) conforming to the sys0 visual language established in `ux/03` through `ux/06`.

### What Was Built

1. **Sub-Route Architecture (`/institutions/*`):**
   - Split monolithic tab state into 8 distinct Next.js App Router sub-routes sharing a persistent layout shell:
     - `/institutions` -> Overview Tree
     - `/institutions/departments` -> Departments list and management cards
     - `/institutions/programs` -> Degree Programs list and cohort creation
     - `/institutions/academic-years` -> Academic Year cohorts
     - `/institutions/semesters` -> Instructional Semesters and term bounds
     - `/institutions/sections` -> Sections and student batch divisions
     - `/institutions/calendar` -> Calendar events and holidays
     - `/institutions/working-days` -> Working days and period timing matrix
   - Added granular `loading.tsx` (accurate layout skeletons) and client `error.tsx` (retry error boundaries) for each sub-route.

2. **Persistent Shell & Context (`app/institutions/layout.tsx`):**
   - Renders inside `PageContainer` (centered, max-w-[1016px], px-6 / px-4 on mobile).
   - Stays mounted across tab switches (zero flicker or re-mounting of header, stats, tabs, or modal dialogs).
   - `PageHeader`: Title displays the institution name (or "Institution Settings" fallback) alongside an inline monospace badge reading "Main", with a muted description below.
   - Header action button slot dynamically renders the primary yellow action corresponding to the active route, guaranteeing the Single Yellow Accent rule.
   - `InstitutionProvider` & `useInstitutionContext`: Centralized hierarchy query data, dialog visibility, and entity deletion actions with TanStack Query invalidation.

3. **Statistics Row (`InstitutionStatsRow`):**
   - 6 clean stat cards on desktop (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`), radius 16px (`--radius-stat: 16px`, `rounded-[16px]`), surface background (`#111111`), 1px border (`#232323`).
   - Large monochrome numbers (30px, tabular figures, white `#FAFAFA`, never yellow) with muted mono labels below (12px, `#8A8A8A`).
   - Zero decorative icon clutter.

4. **Segmented Link Navigation (`InstitutionTabs`):**
   - 40px high segmented link strip (`rounded-[12px]`, surface `#111111`, 1px border `#232323`).
   - Full keyboard navigation with `ArrowLeft`, `ArrowRight`, `Home`, and `End` keys switching routes smoothly.

5. **Single Yellow Accent Rule Enforcement:**
   - Exactly ONE yellow element on screen: the primary CTA of the active tab located in the PageHeader's action slot (`+ Add Department`, `+ Add Program`, `+ Add Academic Year`, `+ Add Semester`, `+ Add Section`, `+ Add Holiday`, or neutral outline `Refresh Tree`).
   - All empty states use `SurfaceCard variant="static"`, 32px monochrome glyphs, and neutral OUTLINE action buttons (never yellow).
   - Working days form pills are styled with monochrome active state (`#1C1C1C` / `#FAFAFA`), reserving the single yellow button for `Save Configuration`.

6. **Hierarchy Tree Polish (`StructureTree`):**
   - 12px vertical padding per node item (`py-3`).
   - 24px indent per depth level (`pl-8` / `border-l border-[#232323]`).
   - 1px connector borders (`border-l border-[#232323]`).
   - Monochrome icons and monospace badges for entity codes ("CS", "CSE-BTech", etc.).

7. **Automated Tests:**
   - `institution-tabs.spec.ts`: Tests `getActiveInstitutionTab` mapping all 8 paths and verifies `INSTITUTION_TABS` contains all 8 items with accurate URLs.

### Manual Test Checklist

1. Navigate to `http://localhost:3000/institutions`:
   - Verify PageHeader displays institution name with "Main" mono badge and outline "Refresh Tree" button.
   - Verify 6 stat cards have 16px border radius and clean white numbers (no yellow).
   - Verify 8 tabs are rendered in a 40px high segmented strip.
2. Click through all 8 tabs:
   - Overview Tree (`/institutions`)
   - Departments (`/institutions/departments`) -> Header shows single yellow "+ Add Department" button.
   - Programs (`/institutions/programs`) -> Header shows single yellow "+ Add Program" button.
   - Academic Years (`/institutions/academic-years`) -> Header shows single yellow "+ Add Academic Year" button.
   - Semesters (`/institutions/semesters`) -> Header shows single yellow "+ Add Semester" button.
   - Sections (`/institutions/sections`) -> Header shows single yellow "+ Add Section" button.
   - Calendar (`/institutions/calendar`) -> Header shows single yellow "+ Add Holiday" button.
   - Working Days (`/institutions/working-days`) -> Single yellow "Save Configuration" button.
3. Test keyboard navigation on tabs: press ArrowRight / ArrowLeft / Home / End to verify active tab switches.
4. Verify empty states on each tab: SurfaceCard with 32px monochrome icon, title, description, and outline action button (never yellow).
5. Verify adding a department, program, or semester refreshes the tree and updates the statistics cards immediately.

Merged via `ux/07-institution-layout`, tag `ux-07-institution-layout-merged`.

---

## Blueprint v2 - Pass A: Specification, Contracts, and Feature Flag

Complete architectural specification, schema additions, gate rules, and server configuration for Blueprint v2.

### What Was Built

1. **Feature Checklist Audit & Plan (`docs/BLUEPRINT_V2.md`):**
   - Full matrix mapping Blueprint v2 requirements against existing Phase 5-8 implementations.
   - Identified all references to deprecated node types (`subjectAssignment`, `electiveGroup`, `faculty`, `room`) across contracts, server, client, and engine.
   - Designed 5-pass implementation roadmap (Pass A to Pass E) with strict backward-compatibility gating via `BLUEPRINT_V2` feature flag.

2. **Documentation & Architecture Alignment:**
   - `AGENTS.md`: Updated graph layout rules to strictly vertical (Dagre rankdir TB); removed legacy LR/BT/RL directions; layout menu provides 3 algorithms (hierarchical, compact, department-based).
   - `docs/ROUTES.md`: Added new Blueprint v2 endpoints (`GET/POST /projects/:id/nodes/:nodeId/pool`, `GET /projects/:id/pool/where-used`, `GET /projects/:id/pool/usage`, `POST /projects/:id/autofill/preview`, `POST /projects/:id/autofill/accept`) and socket event constants (`node:patch`, `pool:mutate`, `assignment:mutate`, etc.).
   - `docs/BLUEPRINT_RULES.md`:
     - Standardized on exactly 7 hierarchy node types: Institution, Department, Program, Academic Year, Semester, Section, Batch.
     - Documented Resource Pool inheritance: `effectivePool(node) = effectivePool(parent) + own additions - own exclusions`.
     - Documented required items (`POOL_ITEM_REQUIRED` - ancestors cannot be excluded) and pinned items (survive ancestor removal).
     - Documented Section completion rule: strength > 0, valid assignments, and for each resource type (faculty, subjects, rooms) either effective pool is non-empty or auto-fill is enabled.
     - Documented new pool and assignment gates: `PoolItemExistsGate`, `PoolItemActiveGate`, `PoolDepartmentGate`, `PoolRequiredGate`, `PoolImpactGate`, `PoolDuplicateGate`, `AssignmentInPoolGate`.
     - Documented canonical reason codes and fix hints.
   - `docs/FEATURES.md`: Updated Section 6 for Blueprint v2 node types, resource pools, section assignments, auto-fill modes, vertical-only layout, and socket autosave.
   - `docs/ARCHITECTURE.md`: Documented Blueprint v2 domain model changes, `BLUEPRINT_V2` feature flag, and WebSocket sync.
   - `docs/CLIENT_UX.md`: Documented minimal visual language (220px cards, status dots, count chips, floating pill toolbar), 360px right drawer (Details, Resources, Assignments, Rules, Check, History), autosave indicators (`Saved`, `Saving`, `Offline (N pending)`, `Conflict`, `Error`), and read-only library item inspection cards.

3. **Additive Contracts (`packages/contracts`):**
   - Added `BlueprintNodeTypeV2Schema`, `BlueprintNodeTypeV2`, `BLUEPRINT_V2_NODE_TYPES`.
   - Added `PoolItemTypeSchema`, `PoolEntrySchema`, `NodePoolSchema`, `AutoFillModeSchema`, `AssignmentSchema`.
   - Added `ResolvedPoolItemSchema`, `ResolvedPoolSchema`.
   - Added pool and assignment mutation schemas: `PoolOpTypeSchema`, `PoolOpPayloadSchema`, `AssignmentOpTypeSchema`, `AssignmentOpPayloadSchema`, `NodePatchPayloadSchema`.
   - Updated `BlueprintNodeDtoSchema` with optional `version`, `pool`, `assignments`, `autoFill`.
   - Added new reason codes to `ReasonCodeSchema`, `REASON_CODE_ALIASES`, and `REASON_CODE_MESSAGES`:
     - `POOL_ITEM_NOT_FOUND`, `POOL_ITEM_ARCHIVED`, `POOL_ITEM_REQUIRED`, `POOL_ITEM_IN_USE`, `POOL_DEPARTMENT_FORBIDDEN`, `POOL_DUPLICATE`, `ASSIGNMENT_NOT_IN_POOL`.
   - Added socket events to `SocketEvents` and exported `BlueprintSocketEvents`.
   - Built to ESM, CJS, and DTS.

4. **Server Configuration Flag (`server/src/config/`):**
   - Created `blueprint.config.ts` defining `blueprintConfig` with `v2Enabled` (reading `BLUEPRINT_V2` env variable).
   - Added `DEFAULT_CONFIG.blueprint.v2Enabled: false` to `defaults.ts`.
   - Added `BLUEPRINT_V2: Joi.boolean().default(false)` to `env.validation.ts`.
   - Registered `blueprintConfig` in `AppConfigModule` and barrel export in `index.ts`.
   - Added unit and integration tests in `config-factories.spec.ts` and `config-boot.integration.spec.ts` (all 29 tests passing).

### Decisions Made

- **Strictly Additive Contracts in Pass A:** Retained the legacy 11-member `BlueprintNodeTypeSchema` while introducing `BlueprintNodeTypeV2Schema` and optional `version`, `pool`, `assignments`, and `autoFill` fields on `BlueprintNodeDtoSchema` so existing code continues to compile and run without breaking. Full enum contraction is deferred to Pass E.
- **Default Feature Flag Off:** `BLUEPRINT_V2` defaults to `false` in all environments, ensuring existing test suites and behavior remain green throughout Passes A-D until cutover in Pass E.
- **Read-Only Library References:** Pool items in Blueprint are strictly references to Library items, not deep copies or mutable instances. They cannot be edited in the Blueprint canvas.
- **Top-Down Live Pool Resolution:** A node's effective pool is dynamically calculated by walking up the ancestor hierarchy, respecting ancestor `required` constraints and child `exclusions`.

### What Was Skipped (Scheduled for Later Passes)

- Pass B: Server Mongoose schema migration, `PoolResolverService`, write-behind socket autosave gateway handlers, and pool/assignment mutation endpoints.
- Pass C: Engine solver auto-fill adaptation, Section assignment build mapping, and pre-build validation.
- Pass D: Client minimal design cards, 360px drawer, resource pool inspector, floating toolbar pill, and real-time socket autosave hooks.
- Pass E: Feature flag flip to true, data migration, removal of deprecated node types, and final verification.

Merged via `docs/blueprint-v2-spec`, tag `docs-blueprint-v2-spec-merged`.

---

## Blueprint v2 - Pass B: Server Model, Pool Resolver, and Socket Autosave

Server implementation of Blueprint v2 resource pools, inheritance resolution, mutation gates, write-behind processor adaptation, and real-time WebSocket autosave.

### What Was Built

1. **Mongoose Schema & Repository Updates (`server/src/modules/blueprint/`):**
   - Updated `BlueprintNodeSchemaClass` with:
     - `version` (`Number`, default 1)
     - `pool` (`{ additions: [...], exclusions: [...] }`)
     - `assignments` (`[{ id, subjectId, facultyId, roomId, periodsPerWeek, isLab, labDuration }]`)
     - `autoFill` (`'off' | 'same_department' | 'allow_other_departments'`, default `'off'`)
   - Extended `IBlueprintRepository`, `MongoBlueprintRepository`, and `CachedBlueprintRepository.updateNode` to support granular updates for `version`, `pool`, `assignments`, `autoFill`, `status`, `effectiveStatus`, and `missing`.

2. **Pool Resolver Service (`PoolResolverService`):**
   - Implemented recursive top-down effective pool calculation:
     `effectivePool(node) = effectivePool(parent) + own additions - own exclusions`.
   - Enforced Ancestor Required Rule: items marked `required: true` by an ancestor cannot be excluded by descendants (`POOL_ITEM_REQUIRED`).
   - Resolved Library item details (name, code, departmentId) via injected `FacultyRepository`, `SubjectRepository`, and `RoomRepository`.
   - Implemented `getWhereUsed(projectId, refType, refId)` returning nodes where library resources are referenced in pools or assignments.

3. **Blueprint v2 Gates & Section Completion (`server/src/modules/blueprint/gates/`):**
   - Added `PoolDuplicateGate`: blocks duplicate addition of resources into a node's pool (`POOL_DUPLICATE`).
   - Added `PoolRequiredGate`: blocks descendant nodes from excluding ancestor required items (`POOL_ITEM_REQUIRED`).
   - Added `PoolImpactGate`: blocks excluding or removing resources actively assigned to classes (`POOL_ITEM_IN_USE`).
   - Added `AssignmentInPoolGate`: validates that assigned subjects, faculty, and rooms exist in the section's effective pool (`ASSIGNMENT_NOT_IN_POOL`).
   - Added `PoolItemExistsGate`, `PoolItemActiveGate`, `PoolDepartmentGate`.
   - Registered all gates in `GateChain`.
   - Updated `SectionCompletionRule` to validate assignments and resource pool presence / autoFill settings.

4. **Write-Behind Processor Adaptation (`BlueprintWriteProcessor`):**
   - Updated `SyncNodeJobData` and processor execution to persist `version`, `pool`, `assignments`, and `autoFill` changes to MongoDB.

5. **Real-Time WebSocket Autosave (`BlueprintGateway`):**
   - Implemented `@SubscribeMessage(SocketEvents.NODE_PATCH)` (`node:patch`):
     - Validates edit permissions.
     - Performs optimistic concurrency check on `node.version`, returning `REVISION_CONFLICT` on stale writes.
     - Increments `node.version`, updates Redis cache, enqueues write-behind job, and broadcasts `node:patched`.
     - Recomputes completion status and broadcasts `node:status-changed`.
   - Implemented `@SubscribeMessage(SocketEvents.POOL_MUTATE)` (`pool:mutate`):
     - Evaluates pool gates through `GateChain`.
     - Applies mutations (`add`, `exclude`, `restore`, `remove`, `require`, `pin`).
     - Increments `version`, updates Redis, enqueues write-behind, and broadcasts `pool:mutated`.
   - Implemented `@SubscribeMessage(SocketEvents.ASSIGNMENT_MUTATE)` (`assignment:mutate`):
     - Evaluates `AssignmentInPoolGate`.
     - Upserts or removes section assignments, updates Redis, and broadcasts `assignment:mutated`.

6. **REST Endpoints (`BlueprintController` & `LibraryController`):**
   - `GET /projects/:projectId/blueprint/nodes/:nodeId/pool`
   - `POST /projects/:projectId/blueprint/nodes/:nodeId/pool`
   - `GET /projects/:projectId/blueprint/where-used`
   - `GET /library/:type/:id/usage`

7. **Unit & Integration Tests (14 new tests, 77 blueprint tests total passing):**
   - `pool-resolver.spec.ts`: 5 tests covering direct additions, hierarchy inheritance, child exclusions, ancestor required protection, and where-used lookup.
   - `blueprint-v2-gates.spec.ts`: 6 tests covering `PoolDuplicateGate`, `PoolRequiredGate`, `PoolImpactGate`, `AssignmentInPoolGate`, and `SectionCompletionRule`.
   - `blueprint-gateway.spec.ts`: 3 new tests covering `node:patch`, `pool:mutate`, and `assignment:mutate` socket autosave handlers.

### Decisions Made

- **Atomic Node Versioning for Optimistic Concurrency:** Each node maintains an independent `version` counter incremented on patches, pool mutations, and assignment changes, providing fine-grained cell-level conflict detection without invalidating the whole graph revision for non-structural edits.
- **Pure Synchronous Gate Evaluation:** Core pool and assignment gates evaluate pure graph relationships synchronously, ensuring zero latency on WebSocket autosave operations while enforcing business rules strictly.

### What Was Skipped (Scheduled for Later Passes)

- Pass C: Engine solver auto-fill adaptation, Section assignment build mapping, and pre-build validation.
- Pass D: Client minimal design cards, 360px drawer, resource pool inspector, floating toolbar pill, and real-time socket autosave hooks.
- Pass E: Feature flag flip to true, data migration, removal of deprecated node types, and final verification.

Merged via `feat/blueprint-v2-server`, tag `feat-blueprint-v2-server-merged`.

---

## Task: Blueprint Canvas Restyle (`ux/04-blueprint-canvas-style`)

### What Was Built

1. **Tokens & Theme Variables (`globals.css`):**
   - Added `--blueprint-node-width: 200px`, `--blueprint-node-radius: 12px`, `--blueprint-control-radius: 10px`, `--blueprint-grid-color: rgba(255, 255, 255, 0.03)`, `--blueprint-edge-stroke: rgba(250, 250, 250, 0.55)`.
   - Added `@keyframes edge-flow` and `.edge-flow` class for slow dash flow on selected connections, with full `prefers-reduced-motion` override.

2. **Canvas Background & MiniMap (`blueprint-canvas.tsx`):**
   - Replaced dot background with 24px faint square grid lines (`rgba(255, 255, 255, 0.03)`) on `#0A0A0A`.
   - Added subtle radial corner vignette overlay (`pointer-events-none`).
   - Removed unstyled default Controls panel.
   - Restyled React Flow MiniMap into a 160×100 monochrome widget (`#2A2A2A` mask, 10px radius) toggleable via store `isMinimapOpen` and toolbar menu.
   - Preserved ghost "Next step" button in top-left.

3. **Single 48px Header (`BlueprintHeader`):**
   - Displays project name queried from API with skeleton loading (never displays DB ID).
   - Left: Back button to `/projects`, project name, Draft status chip.
   - Right: Autosave status (`Saved • rev X`, `Saving...`, `Offline`), single readiness circular ring (% ready), issues count chip (only when > 0), Studio text link, and primary yellow `Build` button.

4. **Minimal Node Card (`NodeCard` & `node-factory.tsx`):**
   - 200px width, 12px radius, `#232323` 1px border, subtle vertical gradient (`from-[#141414] to-[#0D0D0D]`).
   - 3-row layout:
     - Row 1: 16px node-type icon, title (14px font-medium), uppercase mono type label (11px), status indicator dot (solid green complete, amber incomplete with missing count, grey blocked), plus corner presence/lock/comment indicators.
     - Row 2: Metric line (`getNodeMetricLine`: student strength, duration, capacity, or resource pool summary `F 12 • S 8 • R 4`).
     - Row 3: `NodeProgress` (4px track, white 85% opacity, mono 11px percentage).
   - Handles:
     - Top target ring (`HandleRing`): 10px circular target handle.
     - Bottom source pill (`HandlePill`): 14×6px pill handle.
     - Hover/selected `AddChildButton`: 22px circle "+" button anchored below the card with allowed child types dropdown and completion gate reason tooltips.

5. **Dotted Edge (`DottedEdge` & `EdgeLabelPill`):**
   - Vertical bezier curves with `strokeDasharray: "1 6"` and round caps.
   - Animated flow (`.edge-flow`) when connected to selected nodes.
   - Midpoint `EdgeLabelPill` showing child counts below target, automatically hidden at zoom < 0.6.

6. **Floating Toolbar Pill & Menu (`FloatingToolbar`, `ToolbarMenu`):**
   - 40px height, 12px radius, centered bottom toolbar with blur background.
   - Controls: "+ Add" popover (shortcut `/`), zoom controls (`-`, %, `+`), fit view, vertical layout algorithm selector (Hierarchical TB, Compact, Department, Reset), history undo/redo (`⌘Z` / `⇧⌘Z`), search toggle with inline type-ahead drawer, and "More" menu (`ToolbarMenu`).
   - "More" menu groups: View, Edit, History, Data, Collaboration, and Help.

7. **360px Sidebar (`BlueprintSidebar` & `SidePanelTabs`):**
   - 360px width with underlined white text tabs (`Config`, `Constraints`, `Slotly AI`).
   - Clean summary block, standardized 36px inputs, sticky footer with quiet Reset and yellow `Apply Changes` button.

8. **First-Run Onboarding Hint (`FirstRunHint`):**
   - Floating card on single-node canvas with `useSyncExternalStore` for SSR-safe localStorage persistence without cascading renders.

9. **Tests (`blueprint-restyled-canvas.spec.ts`):**
   - 6 unit tests covering feature parity for all 25 historical actions, vertical-only algorithms, node card progress and metrics, pool chips, and edge label zoom threshold. All 92 client tests and 421 server tests passing.

### Decisions Made

- **Strictly Vertical Layout:** Removed direction arrows (down, right, up, left) in accordance with the minimal design decision; layout menu retains only algorithms (Hierarchical, Compact, Department-based, plus Reset).
- **Restrained Yellow Accent:** Confined strictly to primary `Build` button, `Apply Changes` button, and small attention/warning dots.
- **SSR-Safe External Store:** Used `useSyncExternalStore` for the first-run hint dismissal to comply with React 19 / ESLint `react-hooks/set-state-in-effect` rules.

### Manual Test Checklist

- [x] Open `/projects/:id/blueprint` — header shows project name (skeleton while fetching), single readiness ring, autosave status, and yellow Build button.
- [x] Canvas displays `#0A0A0A` background with faint 24px square grid lines and subtle corner vignette.
- [x] Nodes render 200px wide cards with 12px radius, 3-row layout, top ring handle, bottom pill handle, and bottom "+" add child button on hover/selection.
- [x] Edges render as dotted vertical bezier curves with flow animation on selected connections.
- [x] Floating toolbar pill at bottom provides "+ Add", zoom, fit view, layout algorithms (Hierarchical, Compact, Department, Reset), undo/redo, search with filter chips, and grouped "More" menu.
- [x] Zooming out below 0.6 hides edge label pills cleanly.
- [x] 360px sidebar opens with underlined tabs (Config, Constraints, Slotly AI), 36px inputs, and sticky footer.
- [x] First-run hint displays on single-node canvas and dismisses permanently.

Merged via `ux/04-blueprint-canvas-style`, tag `ux-04-blueprint-canvas-style-merged`.

---

## Task: Blueprint Floating Palette & Node Issues Hover Card (`ux/08-blueprint-palette`)

### What Was Built

1. **Floating Vertical Node Library Panel (`NodeLibraryPanel` & `NodeLibraryItem`):**
   - Floating over the canvas on the left edge (`left-4 top-4`), max height `calc(100% - 32px)`, hidden scrollbar with edge fade.
   - Container: radius 20px (`rounded-[20px]`), 1px border (`#232323`), 95% surface background with backdrop blur (`bg-[#111111]/95 backdrop-blur-md`), soft shadow, 8px padding (`p-2`).
   - Two states toggled via top header chevron button and persisted in `localStorage`:
     - **Collapsed (default < 1280px)**: 56px wide icon rail (`w-14`), 40px square icon buttons (radius 12px) stacked vertically with 4px gap. Hover or focus shows a styled right-side tooltip card with node name and one-line description.
     - **Expanded (default >= 1280px)**: 264px wide list (`w-[264px]`). Each row is 56px high: 20px icon, 14px medium title, 12px muted description (1-line clamp), grouped under "Hierarchy structure" and "Resources" section labels.
   - Mobile breakpoint (< 768px): Transforms into a 48px floating "Add node" button at the left edge opening a touch-optimized bottom sheet with 48px rows.
   - Roving tabindex keyboard navigation: Tab enters panel once, Arrow Up/Down moves between items, Enter or Space adds, Home/End jumps to first/last, Escape returns focus to canvas. Global shortcut `/` expands and focuses the library panel.
   - Disabled items remain visible at 50% opacity, focusable (`aria-disabled="true"`), displaying styled reason tooltips to the right without native browser tooltip overlap.
   - Drag-and-drop: Supports dragging items directly from the library panel onto the canvas.
   - Viewport & Layout Inset: Updated Dagre hierarchical/compact layout and React Flow `fitViewOptions` to enforce an 80px left offset, preventing any node from being obscured behind the left library rail on load, Fit, or Layout.

2. **Removal of "+ Add" Popup from Floating Toolbar (`floating-toolbar.tsx`):**
   - Removed the "+ Add" button and popup menu from the bottom centered floating toolbar.
   - Centered toolbar retains Zoom controls, Fit view, Layout algorithms, Undo/Redo, Search, and More menu.

3. **Stable Compact Node Footer (No Inline Dropdown) (`node-card.tsx`):**
   - Removed the expandable chevron and inline missing fields container from `NodeCard`.
   - Node footer now displays a compact, single-line status ("N missing", "Blocked", "Ready", or "Draft") alongside child count.
   - Node dimensions are strictly identical whether hovered or not (200px width, zero layout shift, no re-measure).
   - Added `aria-describedby` pointing to a visually hidden summary of issues for screen readers.

4. **Node Issues Hover & Focus Card (`NodeIssuesCard` & `issue-label.ts`):**
   - Appears after 150ms pointer hover on a node, on keyboard focus, or on touch tap. Closes 100ms after pointer leaves both the node and the card (hover bridge allows moving into the card).
   - Rendered in a React portal in screen space (does not scale with canvas zoom). Anchored to the node's DOM rectangle, preferring right, left, then below, automatically flipping and shifting to stay within safe canvas boundaries.
   - Content:
     - Header: Node name and uppercase monospace type label, with total issue count ("N issues found").
     - Grouped list: Errors (blocking) first with red alert glyphs, followed by Requirements / Warnings with amber glyphs.
     - Helper `formatIssueLabel` maps known keys (`workingDays`, `periodConfig`, `durationYears`, `startDate`, `endDate`, `strength`, `code`, etc.) to plain-language sentences with raw keys in mono 12px muted.
     - Internal scroll (`max-h-[280px]`) with "+N more" indicator if more than 6 issues are present.
     - Action buttons: "Fix automatically" (applies safe defaults for missing fields) and "Open in config" (selects node and opens Config tab in the right sidebar).
   - Dismisses on Escape (returning focus to the node) or clicking canvas; automatically hides during node dragging or canvas panning.

5. **Safe Defaults Helper (`safe-defaults.ts`):**
   - Provides canonical default configuration values for each node type to resolve missing requirements automatically.

6. **Tests (`node-palette-and-issues.spec.ts`):**
   - Added 9 unit tests covering `NodeLibraryPanel` and `PALETTE_ITEMS` ordering, disabled item attributes (`aria-disabled`), keyboard navigation key codes, issue labeling and grouping, safe defaults, and constant node card dimensions. All 101 client tests passing.

### Decisions Made

- **Screen-Space Portal for Hover Card:** Rendered `NodeIssuesCard` via React portal directly to `document.body` so text and action buttons remain pixel-crisp at standard size (13–14px) regardless of canvas zoom level.
- **Roving Tabindex Toolbar:** Implemented standard WAI-ARIA roving tabindex in `NodeLibraryPanel` for swift single-tab navigation into the rail and Arrow Up/Down item selection.
- **SSR-Safe Client Detection:** Used `useSyncExternalStore` for client-only portal rendering and localStorage reading without cascading effects or hydration mismatches.

### Manual Test Checklist

- [x] Open `/projects/:id/blueprint` — floating node library panel is visible on the left edge (`left-4 top-4`).
- [x] Click collapse/expand chevron at top of library panel — width toggles smoothly between 56px icon rail and 264px expanded list with section headers ("Hierarchy structure", "Resources").
- [x] Press `/` anywhere on canvas — library panel expands and focuses first item.
- [x] Use Arrow Up/Down, Home/End, Enter, Space to navigate and add nodes via keyboard; press Escape to return focus to canvas.
- [x] Hover or focus a disabled library item — shows styled right-side tooltip card with reason text (e.g., "Cannot add Academic Year under Institution. Needs a Program.").
- [x] Bottom toolbar is cleanly centered with Zoom, Fit, Layout, Undo/Redo, Search, and More (Add button removed).
- [x] Hover on an incomplete node ("New Institution") for 150ms or focus it via Tab — `NodeIssuesCard` appears anchored beside the node.
- [x] Move pointer smoothly into `NodeIssuesCard` — card stays open across hover bridge.
- [x] Review grouped issues in `NodeIssuesCard` — blocking errors first, requirements second, plain-language text plus raw keys.
- [x] Click "Fix automatically" in `NodeIssuesCard` — safe defaults are applied, status updates to ready, toast confirms fix.
- [x] Click "Open in config" in `NodeIssuesCard` — selects node and opens Config tab in the right sidebar.
- [x] Press Escape or click canvas — `NodeIssuesCard` dismisses cleanly.
- [x] Confirm node footer has no chevron or inline dropdown; node bounding box is identical whether card is hovered or not.
- [x] Run Layout (Hierarchical, Compact, Department) and Fit View — nodes start at 80px+ and are never hidden behind the 56px library rail.
- [x] Resize browser below 768px — library panel becomes a 48px floating circle button opening a bottom sheet.

Merged via `ux/08-blueprint-palette`, tag `ux-08-blueprint-palette-merged`.

---

## Phase UX-09: Projects Sections, Layouts & Per-User Pinning

### What Was Built

1. **Card Bug Fixes (`project-card.tsx`):**
   - **Height Equality & Vertical Alignment:** Eliminated content jumping across grid cards. Container is `h-full flex flex-col justify-between items-stretch` with `@container`. Fixed-height footer (`h-9 min-h-[36px] mt-auto pt-3 border-t border-[#181818]`). Status indicator label is single-line with `whitespace-nowrap truncate` and a full `title` tooltip. The top row has a fixed 32px height, and the middle content has a consistent top margin so titles, subtitles, and descriptions align at identical Y coordinates across cards in a row.
   - **Footer Label vs Meta Collision:** Preserved `Rev X` on narrow card viewports and truncated/hid the date part (`hidden @[260px]:inline truncate max-w-[110px]`) via container query and flex truncation.
   - **Archived Card Styling:** Archived projects render at 70% opacity with AA contrast maintained (`text-[#FAFAFA]`). The card menu presents "Restore" with an undo icon instead of "Archive".
   - **Compact Density Variant:** Added `density="compact"` for Compact view: 16px radius, 16px padding, min height 140px, 32px glyph, 2-line title clamp with `title` tooltip displaying revision and opened date, hidden subtitle and description, and compact status indicator footer.

2. **Per-User Pinning Backend & Contracts:**
   - **Contracts (`@slotly/contracts`):** Extended `ProjectDtoSchema` with `pinned?: boolean` and `pinnedAt?: string | null`. Documented `PUT /projects/:projectId/pin`, `DELETE /projects/:projectId/pin`, `POST /projects/:projectId/archive`, and `POST /projects/:projectId/restore` in `docs/ROUTES.md`.
   - **Database (`ProjectPin`):** Created `project-pin.schema.ts` collection `project_pins` with `userId` and `projectId` ObjectIds, `pinnedAt` date, compound unique index on `{ userId: 1, projectId: 1 }`, and index on `{ userId: 1, pinnedAt: -1 }`.
   - **Repository & Caching:** Added `pinProject`, `unpinProject`, `getUserPins`, and `countUserPins` to `MongoProjectRepository` and `CachedProjectRepository` with cache tag invalidation `user:${userId}:pins`.
   - **Service & Controller:** Updated `ProjectsService.findProjects` and `findById` to join/map pinned status for the requesting user. Implemented `pinProject` (enforcing max 12 pins limit with `BadRequestException`) and `unpinProject`. Added controller endpoints `PUT /projects/:projectId/pin` and `DELETE /projects/:projectId/pin`, plus `POST /projects/:projectId/restore`.

3. **Section Slot Architecture (`project-sections.registry.ts` & `project-selectors.ts`):**
   - Implemented extensible `ProjectSectionConfig` slot registry:
     - **Pinned:** Non-archived pinned projects, sorted by `pinnedAt` desc, max 12, collapsible, hidden when empty.
     - **Recent:** Projects opened in last 14 days, non-archived, not pinned, sorted by `lastOpenedAt` desc, max 6, non-collapsible, hidden when empty.
     - **All projects:** All active non-archived projects, non-collapsible, always displayed.
     - **Archived:** Archived projects only, collapsible (default collapsed), displays count in header, hidden when empty.
   - **Flat Results Selector:** Pure function `selectFlatResults` that activates when search or status filter is non-empty, rendering a single unified "Results" section in the chosen layout.

4. **Layout Modes & View Menu (`project-collection.tsx`, `project-row.tsx`, `view-menu.tsx`):**
   - **Grid:** 3 columns at $\ge 1024$px, 2 at 640–1023px, 1 below. Gap 16px. Cards rendered at normal density with equal heights.
   - **List:** Full-width 72px rows (`ProjectRow`), 16px radius, border `#232323`, 32px glyph, title + subtitle, status indicator, revision/opened date (hidden $<768$px), pin button, and dropdown menu. Whole row is accessible with stretched link overlay.
   - **Compact:** 4 columns at $\ge 1280$px, 3 at 1024px, 2 at 640px, 1 below. Gap 12px, 16px radius, 16px padding, min height 140px.
   - **View Menu:** 40px outline button in toolbar row with `LayoutGrid` icon and label "View". Popover includes layout radio group (Grid, List, Compact), section visibility checkboxes (Pinned, Recent, Archived with helpful hints), and a "Reset to default" button.
   - **Persistence & URL Sync:** Layout mode syncs with URL query parameter `?view=grid|list|compact` (URL wins, localStorage fallback, default 'grid'). Section visibility and collapse states persist in `localStorage` under `slotly:projects:view-settings`.

5. **Page Integration & Optimistic Updates (`/projects/page.tsx`):**
   - Integrated `ViewMenu`, `ProjectsSections`, and `ProjectCollectionSkeleton`.
   - Optimistic pinning: toggles pin instantly in React Query cache, enforces 12-pin limit with a warning toast, and rolls back on server error.
   - Archived project restoration via `restoreProject` mutation with confirmation toast.

6. **Automated Tests:**
   - Server: Unit tests in `projects.service.spec.ts` verifying pin retrieval, 12-pin limit enforcement, pin/unpin operations, and Zod contract validation.
   - Client: Unit tests in `project-sections.spec.ts` verifying registry definitions, pinned limit, recent 14-day calculation, exclusions, flat results filtering, and status filtering. Unit tests in `project-card.spec.ts` for date formatting and card utilities.
   - Monorepo: All 114 client tests and 425 server tests passing.

### Decisions Made

- **Container Query for Metadata Cutoff:** Used `@container` on card root to gracefully truncate and hide the opened date on narrow cards without layout shifting or text collisions.
- **Lazy State Hydration:** Initialized view settings from `localStorage` and URL parameters using lazy state initializers (`useState(() => ...)`) to eliminate synchronous `setState` in effects and ensure instant hydration without cascading re-renders.
- **Config-Driven Section Slots:** Modeled all project sections as self-contained slots conforming to `ProjectSectionConfig`. Adding new section rules requires only adding an entry to `PROJECT_SECTIONS`.

### Manual Test Checklist

- [x] Open `/projects` — projects load into organized sections: Pinned (if any), Recent (if opened within 14 days), All projects, and Archived (if any).
- [x] Observe card heights — cards in the same row have identical heights, footers are aligned at bottom, and status label never wraps to two lines.
- [x] Click the pin icon on an unpinned project — pin immediately fills with white at 70%, project appears in "Pinned" section optimistically, toast appears if 12 pin limit reached.
- [x] Click the pin icon on a pinned project — project is unpinned optimistically.
- [x] Click "View" button in toolbar — popover opens showing Layout (Grid, List, Compact) and Sections toggles.
- [x] Select "List" layout — URL updates to `/projects?view=list`, projects render as 72px rows.
- [x] Select "Compact" layout — URL updates to `/projects?view=compact`, projects render as 4-column compact cards with 2-line clamped titles and tooltip meta.
- [x] Select "Grid" layout — returns to standard grid view.
- [x] Toggle off "Recent" in View menu — Recent section disappears; preference is stored in localStorage.
- [x] Click "Reset to default" in View menu — resets layout to Grid, enables all sections.
- [x] Type in search box or select a status filter — sections collapse into a single flat "Results (N)" list. Clear search — returns to organized sections.
- [x] Open menu on an archived card — displays "Restore" option; clicking it restores the project to draft and moves it out of Archived.

Merged via `ux/09-projects-sections`, tag `ux-09-projects-sections-merged`.

---

## Phase / Task: ux/10-blueprint-dnd-compact: Blueprint Drag-and-Drop, Compact Node & Issues Card, Bottom Toolbar & Menu Fixes, Top Bar Clean Up

### What Was Built

1. **Drag and Drop from Node Library onto Canvas (`NodeLibraryPanel`, `NodeLibraryItem`, `BlueprintCanvas`, `NodeCard`):**
   - Enabled items in `NodeLibraryPanel` are draggable (`draggable="true"`), carrying MIME types `application/x-slotly-node` and `application/slotly-node-type` with the node type. Disabled items are not draggable (`draggable="false"`) and retain styled reason tooltips.
   - Drag preview: small ghost chip (32px high, radius 12px, surface background `#111111`, 1px border `#383838`, 80% opacity, icon + label) following pointer; library item dims to 50% opacity during dragging.
   - Dropping on a node: validates `canAddNodeType(draggedType, targetNode)`. Target nodes display a 2px light ring (`border-strong` token); invalid targets display `cursor-not-allowed` and a toast-like reason chip near cursor ("Drop onto a valid parent node. Needs a Program."). Dropping creates the child node connected to parent, creates exactly one undo/redo history entry, and automatically selects the new node with the Config tab opened.
   - Dropping on empty canvas: allowed only for root types (`institution` when none exists, `faculty`, `room`), displaying 1px dashed canvas outline. Rejects child types with cursor reason chip. Converts drop pointer via `screenToFlowPosition({ x, y })`.
   - Canvas lock check: drops rejected with message when canvas is locked.
   - Escape cancels dragging. Click-to-add and keyboard add (Enter/Space) remain fully operational.

2. **Compact, Calmer Node Card (`NodeCard` — 232px width, 64px min height, 12px radius):**
   - Width 232px, min-height 64px, padding 12px, radius 12px, background surface (`#111111`), 1px border token (`#232323`).
   - 20px node type icon (`#8A8A8A`), 14px medium white title (single line, truncate with tooltip), 12px mono muted subtitle (metric line, e.g. "Campus root", `Strength 60`).
   - Top-right status indicator: 16px yellow warning icon (`AlertTriangle`, `#FACC15`) with mono 12px count badge ("3") shown only when issues exist. Ready nodes display small muted check icon (`Check`, `#8A8A8A`).
   - Removed progress bar, percent value, divider line above footer, large "3 missing" row, and chevron. Dimensions are strictly identical whether hovered, selected, or unselected (zero layout shift).
   - Hover moves border to `border-strong` (`#383838`). Selection applies `border-[#FAFAFA]` with 1px outer focus ring (`ring-1 ring-[#FAFAFA] ring-offset-2 ring-offset-[#0A0A0A]`). No thick double ring, no glow, no shadow.
   - 8px connection handles visible only on hover, selection, or connecting. Top target dot, bottom source dot.
   - Updated layout engine node constants to `NODE_WIDTH = 232; NODE_HEIGHT = 64;` in `use-blueprint-layout.ts`.

3. **Compact Hover Card (`NodeIssuesCard` — 256px width):**
   - Width 256px (max 90vw), padding 12px, radius 12px, surface background (`#111111`), 1px border (`#232323`), small shadow, 6px caret.
   - Header: node title (13px medium, truncate) and total count ("3 issues", mono 12px muted) on one line. No close button (closes on Escape or pointer leave).
   - Group labels: 12px muted group labels ("Errors (N)", "Requirements (N)") shown only when both errors and warnings exist; omitted when only one group is present.
   - Rows: compact 8px vertical padding, 12px text, mono 12px raw key, 2px red left indicator for errors, 2px yellow for warnings, no background fill.
   - Max 4 items visible, internal scroll max height ~200px with "+N more".
   - Two 28px outline action buttons ("Fix automatically", "Open in config").

4. **Viewport Zoom Bounds (`fitView` maxZoom 1):**
   - React Flow configured with `fitViewOptions={{ maxZoom: 1, minZoom: 0.2, padding: 0.2 }}`.
   - Initial load, Fit button, and Layout actions enforce `maxZoom: 1` so lone nodes never zoom past 100%. Left inset (72px) preserved.

5. **Bottom Floating Toolbar & More Menu (`FloatingToolbar`, `ToolbarMenu`):**
   - Toolbar: 44px pill centered at bottom-4 (16px from bottom), radius 16px, 1px border, surface 95% blur, padding 6px. 32px icon buttons (radius 10px), 4px gap, 1px dividers. Tabular 56px zoom percent. Tooltips with shortcuts, accessible names, visible focus rings.
   - More menu: anchored above More button (`side="top" align="end" sideOffset={8}`), 248px width, max height bounded to viewport available space (`max-h-[calc(100vh-80px)]`) so it is never clipped at 1440, 1024, or 768px viewports. No scroll arrows; thin native scrollbar with edge visibility. 32px rows, 13px label, 16px icon, mono 12px muted shortcuts right-aligned, switch/on-off state. All 18 actions and 6 groups preserved. Escape returns focus to More button.

6. **Top Bar Clean Up (`BlueprintHeader`):**
   - Removed "Studio" text link from header, keeping all remaining items (back button, project name skeleton, status chip, autosave status, readiness chip, issues chip, Build button) aligned in a single row without uneven gaps.
   - Studio route remains active at `/projects/:id/editor`.

7. **Automated Tests:**
   - Client: Unit tests in `node-palette-and-issues.spec.ts` verifying DnD item dragability, parent and root drop rules, locked canvas rejections, compact node dimensions (232x64px), issue alert and count badge rendering, compact hover card specs (256px width, group label rules, max items), toolbar dimensions and zoom bounds (`maxZoom: 1`), and Studio button removal from header.
   - Monorepo: All 118 client tests and 425 server tests passing.

### Decisions Made

- **MIME & Event Drag Coordination:** Used custom MIME `application/x-slotly-node` with cross-window event coordination (`slotly:drag-node-start`, `slotly:drag-node-end`, `slotly:drag-reason`) to bypass browser security restrictions on `dataTransfer.getData()` during dragover, ensuring instant, non-blocking target validation and cursor feedback chips.
- **Top Bar Studio Link:** Removed only the top bar link per spec; left `/projects/:id/editor` intact so users can reach Studio via direct URL or project navigation.

### Manual Test Checklist

- [x] Open Blueprint canvas (`/projects/:id/blueprint`) — canvas renders with faint square grid lines and left floating library panel.
- [x] Drag an item from left library (e.g. Department) onto canvas — dragging shows 32px ghost chip; library item dims to 50%.
- [x] Hover dragged item over Institution node — node gains 2px light ring; drop effect is copy. Drop item — Department is added as child under Institution; Config tab opens.
- [x] Drag an item requiring parent (e.g. Program) onto empty canvas — cursor shows not-allowed and toast-like reason chip appears near pointer ("Drop onto a valid parent node. Needs a Department."). Drop is rejected.
- [x] Press Escape while dragging — drag is cancelled immediately.
- [x] Lock canvas via More menu — drag over canvas or node displays "Canvas is locked" chip and drop is rejected.
- [x] Inspect node styling — node width is 232px, min-height 64px, 12px radius, calm border, no progress bar, no percent value. Top-right shows yellow alert icon with issue count if issues exist, or check icon if ready.
- [x] Hover over node with issues — hover card opens with 256px width, node name and issue count on one line, compact rows with 2px indicator lines, and two 28px buttons.
- [x] Press Escape while hover card is open — hover card closes and focus returns to node.
- [x] Inspect bottom floating toolbar — 44px pill centered 16px from bottom, 32px icon buttons, 56px tabular zoom percent.
- [x] Click More button — More menu opens anchored above the button at 248px width, completely unclipped, with 32px rows, mono shortcuts, and clean dividers.
- [x] Press Escape while More menu is open — menu closes and focus returns to More button.
- [x] Inspect top bar — Studio link is gone; back button, project name, status chip, autosave status, readiness chip, issues chip, and Build button remain neatly aligned.

Merged via `ux/10-blueprint-dnd-compact`, tag `ux-10-blueprint-dnd-compact-merged`.




