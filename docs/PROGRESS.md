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
       - *Critical Operations* (`node:add`, `node:delete`, `edge:add`, `edge:delete`): Evaluated synchronously through the server `GateChain` (`BlueprintService.applyOperations`), committed directly to MongoDB, cache invalidated, acknowledging with stable reason codes (`PARENT_MISSING`, `PARENT_INCOMPLETE`, `DUPLICATE_NAME`, `CAPACITY_EXCEEDED`, `CYCLE`, etc.) and `fixHint`, and broadcasting `ops:applied`.
       - *Non-Critical Operations* (`node:move`, `node:update` autosave): Persisted immediately to Redis cache-aside for zero-latency peer updates, acknowledged instantly, enqueued to BullMQ write-behind queue with deterministic coalescing `jobId = node:${nodeId}`, recomputing completion status and broadcasting `node:status-changed` to all project collaborators.
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

## UX Task 02: Library Routes, Shared Layout & Export Dropdown

### What Was Built
1. **Server Architecture (Counts Endpoint & Caching):**
   - **`GET /library/counts` Endpoint:**
     - Added endpoint to `LibraryController` accepting `departmentId`, `archived`, and optional `institutionId` query parameters.
     - Implemented `LibraryService.getCounts` running parallel count queries across faculty, subject, and room repositories.
     - Integrated Redis cache-aside caching via `CacheService.remember` with cache key `slotly:library:counts:${institutionId}:${deptPart}:${archPart}`, 3600s TTL, and invalidation tag `library:${institutionId}`.
     - Registered `LibraryCountsDtoSchema` in `@slotly/contracts`.
     - Documented route in `docs/ROUTES.md`.
     - Unit test suite `library-counts.spec.ts` verifying filtering, aggregation, and cache-aside tag invalidation (100% passing).

2. **Client Architecture (Routes & Shared Layout):**
   - **Shared Layout & Navigation Shell (`src/app/library/layout.tsx` & `LibraryShell`):**
     - Server layout component wrapping child routes in `AppLayout`, `React.Suspense`, and `<LibraryShell>`.
     - Stays persistently mounted when switching across catalog tabs.
     - `<LibraryShell>` renders page title, description, header action toolbar, search/department/archive filter toolbar, removable active filter chips, and navigation link tabs.
   - **Routing & Thin Page Structure:**
     - `src/app/library/page.tsx`: Redirects `/library` to `/library/faculty`.
     - `next.config.ts`: Configured permanent redirects `/library/subject -> /library/subjects` and `/library/room -> /library/rooms`.
     - Sub-routes for `/library/faculty`, `/library/subjects`, and `/library/rooms`, each rendering only its specialized table component.
     - Column-accurate `loading.tsx` routes for all three tabs using `LibraryTableSkeleton` to eliminate layout shift during route transitions.
   - **Accessible Navigation Link Tabs:**
     - `<nav aria-label="Library catalog tabs">` with `aria-current="page"` on the active tab, resolved dynamically using `useSelectedLayoutSegment()`.
     - Hover and focus prefetch both the Next.js page route and the TanStack list query (`client.prefetchQuery`).
     - Tab switching preserves URL query parameters while resetting `page=1`.
     - Live count badge on each tab displaying a skeleton pill while loading (never jumping from "(0)").

3. **URL-Driven Filters & Active Chips:**
   - **`use-library-filters` Hook:**
     - Parses and serializes `q`, `dept`, `archived`, and `page` using Zod schema `LibraryFiltersSchema`.
     - 250ms debounced search input updating the URL via `router.replace` inside `React.startTransition` for typing responsiveness.
     - Search, department, and archived filter changes automatically reset `page` to 1.
     - Active filters render as removable chips (`[Search: "..." ×]`, `[Dept: CSE ×]`, `[Archived ×]`) with a "Clear filters" action.

4. **Table Components & Dual Empty States:**
   - Standalone table components: `faculty-table.tsx`, `subject-table.tsx`, and `room-table.tsx`.
   - TanStack Query integration with `placeholderData: keepPreviousData`.
   - Rows dim to 60% opacity with a thin indeterminate yellow progress bar at table top while refetching.
   - Dual empty states:
     - Zero items overall: Standard empty state with primary "Add <entity>" and secondary "Import" buttons.
     - Zero results for active filters: "No results for these filters" empty state with a "Clear filters" button.

5. **Open/Closed Entity Registry (`library-entities.ts`):**
   - Single registry defining `key`, `label`, `singularLabel`, `route`, `addLabel`, `searchPlaceholder`, `exportKey`, `dialog`, `icon`, and empty state texts.
   - Shell header, toolbar, and tabs read directly from the registry without entity switch statements.

6. **Export Dropdown (`ExportMenu` & `use-library-export`):**
   - Accessible B&W `DropdownMenu` component with `Excel (.xlsx)` and `CSV (.csv)` export options.
   - `use-library-export` downloads `<entity>-<YYYY-MM-DD>.<ext>` blob respecting active search, department, and archived filters.
   - Disabled with explanatory tooltip when current tab count is 0.
   - Retry action toast upon download failure.
   - Responsive mobile collapse: On screens under 640px, secondary header actions collapse into a `"⋯"` overflow menu.

7. **Centralized Dialog Context (`LibraryDialogsProvider`):**
   - Mounts `FacultyDialog`, `SubjectDialog`, `RoomDialog`, `ElectiveGroupDialog`, `ImportWizardDialog`, and `ConfirmDialog` once at shell root.
   - Exposes `useLibraryDialogs()` (`openAdd`, `openEdit`, `openImport`, `openElectiveGroups`, `confirmDelete`, `archiveItem`).

8. **Top Nav Active Fix & Client Unit Tests:**
   - Pure `getActiveNavSection(pathname)` helper in `src/components/layouts/nav-active.ts` matching on first path segment.
   - Integrated Vitest, `@testing-library/react`, and `happy-dom` in client.
   - 26 client unit tests across 5 test suites covering filter URL parsing, export filenames, entity registry completeness, ExportMenu interactions, and active nav section matching.
   - Monorepo totals: 194 passing unit tests across server and client.

### Decisions Made
- **React Suspense Boundary for `useSearchParams`:** Wrapped `<LibraryShell>` inside `<React.Suspense>` in `LibraryLayout` to satisfy Next.js static prerendering requirements when using `useSearchParams`.
- **Render-Time State Adjustment in `useLibraryFilters`:** Kept local `searchInput` synchronized with external URL changes using React's render-time state adjustment pattern instead of `useEffect` setState, avoiding cascading render warnings under React 19.
- **Single Request Filtered Counts:** Server `GET /library/counts` aggregates faculty, subject, and room counts in one round-trip and respects active department and archive filters, preventing mismatched list counts.

### What Was Skipped
- Faculty detail drawer (`/library/faculty/[facultyId]`) and availability grid editing sheet (scheduled for detail view phase).
- Batch multi-select actions bar on tables (bulk archive/restore).

### Manual Test Checklist
- [x] Navigate to `/library`: redirects to `/library/faculty`.
- [x] Navigate to `/library/subject` or `/library/room`: redirects permanently to plural routes `/library/subjects` and `/library/rooms`.
- [x] Top nav: "Library" link is highlighted when visiting `/library/faculty`, `/library/subjects`, or `/library/rooms`.
- [x] Switch tabs: URL changes, layout shell remains mounted, query params (`q`, `dept`, `archived`) are preserved, `page` resets to 1.
- [x] Tab counts: Shows skeleton pill while loading; updates to exact counts reflecting department and archived filters.
- [x] Search input: Typing debounces for 250ms and updates URL with `?q=...`.
- [x] Active chips: Displays active search, department, and archived chips; clicking "×" clears specific filter; clicking "Clear filters" resets all.
- [x] Empty states: Displays "No results for these filters" with "Clear filters" button when filters yield 0 rows; displays "Add <entity>" and "Import" buttons when zero items exist overall.
- [x] Export dropdown: Click opens Excel and CSV options; disabled with tooltip when count is 0; downloads `<entity>-<YYYY-MM-DD>.<ext>`.
- [x] Mobile responsiveness: On screens < 640px, header actions collapse into "⋯" overflow menu containing Import and Export.
- [x] Modals: Add, Edit, Import, Elective Groups, and Delete confirmation dialogs open and persist across tab changes.

---

## Next Steps
- **Phase 10:** Studio Grid (Interactive timetable editor, drag-and-drop slot moves, live move validation, conflict highlighting, undo/redo).





