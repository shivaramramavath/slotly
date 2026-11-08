# Slotly Architecture Specification

## 1. Feature Coverage Matrix (FEATURES.md to Phases 1-14)

| Category / Section        | Feature Name                      | Description                                                                            | Target Phase |
| :------------------------ | :-------------------------------- | :------------------------------------------------------------------------------------- | :----------- |
| **Designer (React Flow)** | 1. Visual Canvas                  | Infinite canvas, zoom, pan, snap to grid, minimap, multi-select, fit view              | Phase 5      |
|                           | 2. Academic Structure Nodes       | Institution, Department, Program, Academic Year, Semester, Section, Batch              | Phase 4, 5   |
|                           | 3. Faculty Nodes                  | Faculty profile, availability weekly matrix, workload limits, qualification            | Phase 5, 8   |
|                           | 4. Subject Nodes                  | Theory, Lab, Tutorial, Electives, consecutive hours, credits, rooms                    | Phase 5, 8   |
|                           | 5. Room Nodes                     | Classroom, Lab, Seminar hall, capacity, equipment, availability                        | Phase 5, 8   |
|                           | 6. Drag & Drop System             | Palette to canvas drag, handle-to-handle connections, connection gate validation       | Phase 5      |
|                           | 7. Node Config Panel              | Contextual sidebar configuration panel, schema validation, inline edits                | Phase 5      |
|                           | 8. Graph Validation Engine        | Structural validation, constraint validation, error navigation, fix hints              | Phase 4      |
|                           | 9. Auto Arrange Engine            | Hierarchical Dagre layout (TB default, LR, BT, RL), edge routing                       | Phase 5      |
|                           | 10. Node Grouping & Containers    | Department containers, semester groups, collapsible visual containers                  | Phase 5      |
|                           | 11. Graph Templates               | Save subtree/graph as template, duplicate, export/import JSON                          | Phase 6      |
|                           | 12. Undo, Redo & History          | Command pattern for graph operations, history panel, snapshot restore                  | Phase 6      |
|                           | 13. Auto Save & Persistence       | Non-critical position autosave via Redis/BullMQ, revision checks                       | Phase 6, 11  |
|                           | 14. Graph Search & Navigation     | Search nodes by name/code, focus node, mini-map highlights                             | Phase 5      |
|                           | 15. Smart Recommendations         | Automatic faculty/room assignment recommendations based on tags/qualifications         | Phase 8, 13  |
|                           | 16. Graph Constraints             | Institution-level, department-level and section-level inherited constraints            | Phase 4, 8   |
|                           | 17. Timetable Preview             | Direct read-only matrix preview generated from current blueprint graph                 | Phase 8      |
|                           | 18. Import & Export               | Export blueprint to JSON/SVG/PNG, import academic structure JSON/CSV                   | Phase 6      |
|                           | 19. Collaboration                 | Real-time presence, multi-user node locking, collaborative cursors                     | Phase 7      |
|                           | 20. Performance & Reliability     | Virtualized canvas rendering, memoized completion calculations, stampede guard         | Phase 4, 5   |
|                           | 21. Advanced UI Features          | Guided mode (find first incomplete node), quick connect, badges                        | Phase 4, 5   |
|                           | 22. Designer Toolbar              | Zoom controls, layout selector, validation summary, build launcher                     | Phase 5      |
| **Auth & Security**       | 1. Authentication Core            | Registration, Login, Logout, Argon2 password hashing, secure cookies                   | Phase 1      |
|                           | 2. Session Management             | Redis-backed session tracking, multi-device tracking, revoke single/all                | Phase 1      |
|                           | 3. Token Management               | Access token in memory (15m), Refresh token in httpOnly cookie with rotation           | Phase 1      |
|                           | 4. Multi-Factor Auth (MFA)        | TOTP MFA enrollment (QR code), verification, recovery codes, step-up auth              | Phase 2      |
|                           | 5. Password Management            | Reset via secure token, change password, breached password check (pwned API)           | Phase 2      |
|                           | 6. Email Verification & OTP       | 6-digit OTP via email, rate limiting, expiry, resend cooldown                          | Phase 2      |
|                           | 7. Account Recovery               | Recovery codes verification, emergency admin reset                                     | Phase 2      |
|                           | 8. Passkeys & WebAuthn            | Biometric / FIDO2 authentication fallback                                              | Phase 2      |
|                           | 9. Role-Based Access (RBAC)       | SUPER_ADMIN, ADMIN, DESIGNER, FACULTY, STUDENT roles                                   | Phase 1, 3   |
|                           | 10. Authorization & Security      | Institution and department resource-level ownership guards                             | Phase 3      |
|                           | 11. Threat Protection             | IP rate limiting, account lockout after failed attempts, helmet headers                | Phase 1      |
|                           | 12. Device Management             | Device fingerprinting, browser/OS detection, remote revocation                         | Phase 2      |
|                           | 13. Security Notifications        | Email alert on new login, password change, MFA status changes                          | Phase 2      |
|                           | 14. Audit Logs                    | Write-behind queue for authentication and security events                              | Phase 2      |
|                           | 15. Account Lifecycle             | User deactivation, soft delete, role assignment by institution admin                   | Phase 3      |
|                           | 16. Auth API Routes               | Routes per docs/ROUTES.md (/auth/_, /users/me/security/_)                              | Phase 1, 2   |
|                           | 17. Redis Session Structure       | Session hash keys: `slotly:session:{sessionId}` with TTL                               | Phase 1      |
|                           | 18. Auth Frontend Pages           | Login, register, verify-email, reset-password, mfa-challenge, security settings        | Phase 1, 2   |
| **Timetable Editor**      | 1. Editor Main Features           | Grid-based matrix view by Section, Faculty, and Room                                   | Phase 10     |
|                           | 2. Interactive Schedule Table     | Day x Period grid, responsive layout, custom periods                                   | Phase 10     |
|                           | 3. Cell-Level Editing             | Click-to-edit cell modal: Subject, Faculty, Room assignment                            | Phase 10     |
|                           | 4. Advanced Cell Editor           | Conflict warnings in real-time, replacement recommendations                            | Phase 10     |
|                           | 5. Drag & Drop Editing            | dnd-kit drag class between periods and days with drop indicators                       | Phase 10     |
|                           | 6. Cell Copy, Paste & Duplication | Clipboard operations for period assignments across days/sections                       | Phase 10     |
|                           | 7. Multi-Cell Selection           | Bulk move, bulk clear, bulk faculty reassignment                                       | Phase 10     |
|                           | 8. Timetable Cell Types           | Theory, Lab (multi-period span), Break, Free, Elective group                           | Phase 10     |
|                           | 9. Cell Merging & Splitting       | Merge contiguous periods for lab blocks (2-4 hrs), split merged cells                  | Phase 10     |
|                           | 10. Conflict Detection            | Live faculty double-booking, room overlap, section clashes                             | Phase 10     |
|                           | 11. Smart Cell Suggestions        | Highlight valid free slots when dragging or clicking a class                           | Phase 10     |
|                           | 12. History & Undo/Redo           | Command pattern on client and server for slot operations                               | Phase 11     |
|                           | 13. Auto-Save & Write-Behind      | Redis-first write-behind queue for slot moves with revision tags                       | Phase 11     |
|                           | 14. Keyboard Shortcuts            | Vim/standard navigation (arrows, Delete, Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V)               | Phase 10     |
|                           | 15. Table Customization           | Toggle Saturday/Sunday, periods count, lunch duration, compact mode                    | Phase 10     |
|                           | 16. Locking & Permissions         | Designer edit mode vs Admin approve mode, cell lock during active drag                 | Phase 10, 12 |
|                           | 17. Schedule Comparison           | Diff visualizer between two timetable versions (highlights changes)                    | Phase 12     |
|                           | 18. Publishing Lifecycle          | State pattern: draft -> building -> ready -> pending_approval -> published -> archived | Phase 12     |
|                           | 19. AI-Assisted Editing           | Groq LangGraph agent parses scheduling commands & proposes operations                  | Phase 13     |
|                           | 20. Editor API Routes             | Endpoints matching docs/ROUTES.md with If-Match revision headers                       | Phase 10, 11 |
| **Solver & Analytics**    | Constraint Engine                 | Hard constraints (no overlap, room capacity) & soft preferences                        | Phase 9      |
|                           | BullMQ Build Pipeline             | Async scheduling solver job with progress events and cancellation                      | Phase 9      |
|                           | Exporters                         | PDF timetable generator, Excel (.xlsx) export, iCal (.ics) subscription                | Phase 14     |
|                           | Public Viewer                     | Read-only hashed token share link for students and public boards                       | Phase 14     |
|                           | Workload & Analytics              | Faculty teaching hours distribution, room utilization heatmaps                         | Phase 14     |

---

## 2. Target Folder Trees

### 2.1 Client Application (`client/`)

```
client/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── mfa/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── institutions/page.tsx
│   │   │   └── settings/security/page.tsx
│   │   ├── (studio)/
│   │   │   ├── projects/[projectId]/
│   │   │   │   ├── blueprint/page.tsx      # React Flow Visual Designer
│   │   │   │   ├── editor/page.tsx         # Interactive Timetable Grid Studio
│   │   │   │   ├── comparison/page.tsx     # Version Diff Viewer
│   │   │   │   └── settings/page.tsx
│   │   ├── share/[token]/page.tsx          # Public Viewport
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/                             # shadcn/ui primitives (Button, Dialog, Dropdown, Input, etc.)
│   ├── features/                           # Feature-sliced modules (SOLID container/presentation)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── types/
│   │   ├── blueprint/
│   │   │   ├── components/
│   │   │   │   ├── canvas/                 # React Flow canvas wrapper
│   │   │   │   ├── nodes/                  # Custom Node types (Institution, Dept, Subject, etc.)
│   │   │   │   ├── edges/                  # Custom Gates & Edges
│   │   │   │   ├── panels/                 # NodeConfigPanel, ValidationSummary, Palette
│   │   │   │   └── toolbar/                # BlueprintToolbar (TB/LR, Fit, Guided Mode)
│   │   │   ├── hooks/                      # useBlueprintGraph, useGateValidation, useGuidedMode
│   │   │   ├── services/                   # blueprint.api.ts, blueprint.socket.ts
│   │   │   ├── store/                      # blueprint.store.ts (Zustand)
│   │   │   └── types/
│   │   ├── timetable-editor/
│   │   │   ├── components/
│   │   │   │   ├── grid/                   # Weekly timetable matrix
│   │   │   │   ├── cell/                   # TimetableCell, MergedCell
│   │   │   │   ├── modals/                 # CellEditModal, ConflictWarningModal
│   │   │   │   ├── dnd/                    # DragOverlay, DropSlot
│   │   │   │   └── toolbar/                # EditorToolbar, FilterControls
│   │   │   ├── hooks/                      # useTimetableGrid, useDndSchedule, useUndoRedo
│   │   │   ├── services/                   # timetable.api.ts
│   │   │   ├── store/                      # timetable.store.ts
│   │   │   └── types/
│   │   ├── ai-assistant/
│   │   │   ├── components/                 # ChatDrawer, OperationProposalCard
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── store/
│   │   └── analytics/
│   │       ├── components/                 # WorkloadChart, RoomHeatmap
│   │       └── services/
│   ├── lib/
│   │   ├── api-client.ts                   # Axios/Fetch wrapper with JWT refresh interceptor
│   │   ├── socket-client.ts                # Socket.IO client instance
│   │   ├── utils.ts                        # Styling / clsx / twMerge helpers
│   │   └── query-client.ts                 # TanStack Query client setup
│   └── types/
├── package.json
└── tsconfig.json
```

### 2.2 Server Application (`server/`)

```
server/
├── src/
│   ├── common/
│   │   ├── adapters/                       # LLM, BreachedPassword, Mailer, OAuth
│   │   ├── decorators/                     # CurrentUser, Roles, Public, Revision
│   │   ├── filters/                        # GlobalExceptionFilter, MongoExceptionFilter
│   │   ├── guards/                         # AuthGuard, SessionGuard, RolesGuard, ResourceGuard
│   │   ├── interceptors/                   # LoggingInterceptor, RevisionHeaderInterceptor
│   │   ├── pipes/                          # ZodValidationPipe
│   │   └── types/
│   ├── config/                             # @nestjs/config schemas & validation
│   ├── infrastructure/
│   │   ├── cache/                          # CacheService (ioredis, tag invalidation, single-flight)
│   │   ├── database/                       # Mongoose connection & transactional session manager
│   │   └── queue/                          # BullMQ modules & workers config
│   ├── modules/
│   │   ├── auth/                           # Authentication, tokens, Argon2, sessions
│   │   ├── users/                          # User entity, profile, security settings
│   │   ├── institutions/                   # Multi-tenancy, hierarchy, permissions
│   │   ├── blueprint/
│   │   │   ├── controllers/                # BlueprintController, TemplateController
│   │   │   ├── gates/                      # G1-G10 Chain of Responsibility gates
│   │   │   ├── gateways/                   # BlueprintGateway (/blueprint namespace)
│   │   │   ├── repositories/               # BlueprintRepository, CachedBlueprintRepository
│   │   │   ├── schemas/                    # Mongoose schemas (Node, Edge, Template)
│   │   │   ├── services/                   # BlueprintService, GateValidationService, LayoutService
│   │   │   └── blueprint.module.ts
│   │   ├── solver/
│   │   │   ├── constraints/                # Strategy pattern constraint rules
│   │   │   ├── engine/                     # Solver engine (backtracking / CSP)
│   │   │   ├── processors/                 # BullMQ SolverJobProcessor
│   │   │   └── solver.module.ts
│   │   ├── timetable/
│   │   │   ├── controllers/                # TimetableController, SlotController
│   │   │   ├── repositories/               # VersionRepository, SlotRepository
│   │   │   ├── schemas/                    # TimetableVersion, Slot
│   │   │   ├── services/                   # TimetableService, SlotMoveValidator
│   │   │   ├── lifecycle/                  # State pattern (Draft, Ready, Published, Archived)
│   │   │   └── timetable.module.ts
│   │   ├── write-behind/                   # BullMQ Write-Behind Queue & processors
│   │   ├── ai/                             # Groq LangChain/LangGraph agent & tools
│   │   ├── audit/                          # Audit log consumer & repository
│   │   └── export/                         # PDF, XLSX, iCal Exporter strategies
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── package.json
└── tsconfig.json
```

---

## 3. Socket Contract (`/blueprint`)

### 3.1 Gateway Endpoint

- Namespace: `/blueprint`
- Auth: Bearer JWT in handshake auth (`auth: { token: "Bearer ..." }`)

### 3.2 Event Definitions

| Event Name            | Direction        | Payload Schema                                                                               | Description                         |
| :-------------------- | :--------------- | :------------------------------------------------------------------------------------------- | :---------------------------------- |
| `project:join`        | Client -> Server | `{ projectId: string }`                                                                      | Join room `project:{projectId}`     |
| `project:leave`       | Client -> Server | `{ projectId: string }`                                                                      | Leave room `project:{projectId}`    |
| `cursor:update`       | Client -> Server | `{ projectId: string, x: number, y: number }`                                                | Broadcast user cursor position      |
| `node:lock`           | Client -> Server | `{ projectId: string, nodeId: string }`                                                      | Acquire exclusive lock on node      |
| `node:unlock`         | Client -> Server | `{ projectId: string, nodeId: string }`                                                      | Release lock on node                |
| `presence:changed`    | Server -> Client | `{ users: Array<{ userId: string, name: string, color: string, activeNodeId?: string }> }`   | Active users in the project         |
| `node:status-changed` | Server -> Client | `{ nodeId: string, status: NodeStatus, missing: Array<{ field: string, message: string }> }` | Emitted when completion changes     |
| `ops:applied`         | Server -> Client | `{ revision: number, appliedOps: Array<{ opId: string, type: string, targetId: string }> }`  | Emitted after batch ops apply       |
| `node:locked`         | Server -> Client | `{ nodeId: string, userId: string, userName: string }`                                       | Notify other peers of locked node   |
| `node:unlocked`       | Server -> Client | `{ nodeId: string }`                                                                         | Lock released                       |
| `revision:conflict`   | Server -> Client | `{ currentRevision: number, rejectedRevision: number, message: string }`                     | Informs client of out-of-date write |

---

## 4. MongoDB Collections, Indexes & Relations

### 4.1 Schema Overview

1. **`users`**
   - Fields: `_id`, `email`, `passwordHash`, `name`, `role` (enum), `institutionId` (ref), `departmentId` (ref), `isEmailVerified`, `mfaEnabled`, `mfaSecret`, `recoveryCodes[]`, `createdAt`, `updatedAt`
   - Indexes:
     - `{ email: 1 }` (unique)
     - `{ institutionId: 1, role: 1 }`
   - Relations: Belongs to `institutions`.

2. **`sessions`**
   - Fields: `_id`, `userId` (ref), `sessionId` (UUID), `userAgent`, `ipAddress`, `refreshTokenHash`, `lastActiveAt`, `expiresAt`, `createdAt`
   - Indexes:
     - `{ sessionId: 1 }` (unique)
     - `{ userId: 1 }`
     - `{ expiresAt: 1 }` (TTL index)
   - Relations: Belongs to `users`.

3. **`institutions`**
   - Fields: `_id`, `name`, `code` (unique), `workingDays` (number[]), `periodConfig` ({ startTime, periodDuration, periodsPerDay, breaks[] }), `createdAt`, `updatedAt`
   - Indexes:
     - `{ code: 1 }` (unique)

4. **`departments`**
   - Fields: `_id`, `institutionId` (ref), `name`, `code`, `createdAt`, `updatedAt`
   - Indexes:
     - `{ institutionId: 1, code: 1 }` (unique compound)
   - Relations: Belongs to `institutions`.

5. **`programs`**
   - Fields: `_id`, `departmentId` (ref), `institutionId` (ref), `name`, `code`, `durationYears`, `createdAt`, `updatedAt`
   - Indexes:
     - `{ departmentId: 1, code: 1 }` (unique compound)

6. **`academic_years`**
   - Fields: `_id`, `programId` (ref), `institutionId` (ref), `yearNumber`, `label`, `createdAt`, `updatedAt`
   - Indexes:
     - `{ programId: 1, yearNumber: 1 }` (unique compound)

7. **`semesters`**
   - Fields: `_id`, `academicYearId` (ref), `programId` (ref), `institutionId` (ref), `semesterNumber`, `startDate`, `endDate`, `createdAt`, `updatedAt`
   - Indexes:
     - `{ academicYearId: 1, semesterNumber: 1 }` (unique compound)

8. **`sections`**
   - Fields: `_id`, `semesterId` (ref), `institutionId` (ref), `name`, `strength`, `createdAt`, `updatedAt`
   - Indexes:
     - `{ semesterId: 1, name: 1 }` (unique compound)

9. **`batches`**
   - Fields: `_id`, `sectionId` (ref), `institutionId` (ref), `name`, `size`, `createdAt`, `updatedAt`
   - Indexes:
     - `{ sectionId: 1, name: 1 }` (unique compound)

10. **`subjects`**
    - Fields: `_id`, `institutionId` (ref), `departmentId` (ref), `name`, `code`, `type` (Theory, Lab, Tutorial, Elective), `weeklyHours`, `consecutivePeriods`, `allowedRoomTypes[]`, `createdAt`, `updatedAt`
    - Indexes:
      - `{ institutionId: 1, code: 1 }` (unique compound)

11. **`faculties`**
    - Fields: `_id`, `userId` (ref, optional), `institutionId` (ref), `departmentId` (ref), `name`, `employeeId`, `email`, `maxHoursPerDay`, `maxHoursPerWeek`, `qualifiedSubjectIds[]` (ref), `availability` (matrix: 7xN booleans), `createdAt`, `updatedAt`
    - Indexes:
      - `{ institutionId: 1, employeeId: 1 }` (unique compound)

12. **`rooms`**
    - Fields: `_id`, `institutionId` (ref), `departmentId` (ref, optional), `name`, `code`, `type` (Classroom, Lab, Seminar), `capacity`, `equipment[]`, `createdAt`, `updatedAt`
    - Indexes:
      - `{ institutionId: 1, code: 1 }` (unique compound)

13. **`projects`**
    - Fields: `_id`, `institutionId` (ref), `name`, `term`, `academicYear`, `status` (enum: draft, building, ready, pending_approval, published, archived), `revision`, `activeVersionId` (ref), `createdById` (ref), `createdAt`, `updatedAt`
    - Indexes:
      - `{ institutionId: 1, status: 1 }`
      - `{ createdById: 1 }`

14. **`blueprints`**
    - Fields: `_id`, `projectId` (ref), `revision`, `nodes` (Array of { id, type, parentId, data, position: {x,y}, status, missing[] }), `edges` (Array of { id, source, target, type }), `viewport` ({ x, y, zoom }), `updatedAt`
    - Indexes:
      - `{ projectId: 1 }` (unique)

15. **`blueprint_templates`**
    - Fields: `_id`, `institutionId` (ref, optional), `name`, `category`, `rootNodeType`, `treeData` (json), `isPublic`, `createdAt`
    - Indexes:
      - `{ category: 1 }`
      - `{ institutionId: 1 }`

16. **`timetable_versions`**
    - Fields: `_id`, `projectId` (ref), `versionNumber`, `revision`, `status` (draft, published, archived), `publishApprovedBy` (ref), `publishedAt`, `createdAt`
    - Indexes:
      - `{ projectId: 1, versionNumber: 1 }` (unique)
      - `{ projectId: 1, status: 1 }`

17. **`timetable_slots`**
    - Fields: `_id`, `versionId` (ref), `projectId` (ref), `dayOfWeek` (0-6), `periodIndex`, `durationSpan` (default 1), `sectionId` (ref), `batchId` (ref, optional), `subjectId` (ref), `facultyId` (ref), `roomId` (ref), `isLocked`, `createdAt`, `updatedAt`
    - Indexes:
      - `{ versionId: 1, dayOfWeek: 1, periodIndex: 1, facultyId: 1 }` (sparse conflict index)
      - `{ versionId: 1, dayOfWeek: 1, periodIndex: 1, roomId: 1 }` (sparse conflict index)
      - `{ versionId: 1, dayOfWeek: 1, periodIndex: 1, sectionId: 1 }` (sparse conflict index)

18. **`audit_logs`**
    - Fields: `_id`, `institutionId` (ref), `userId` (ref), `action` (string), `resource` (string), `resourceId` (string), `metadata` (object), `ipAddress`, `createdAt`
    - Indexes:
      - `{ institutionId: 1, createdAt: -1 }`
      - `{ resourceId: 1 }`

19. **`oauth_identities`**
    - Fields: `_id`, `userId` (ref: users), `provider` ('google' | 'github'), `providerUserId`, `email`, `name`, `avatarUrl`, `createdAt`, `updatedAt`
    - Indexes:
      - `{ provider: 1, providerUserId: 1 }` (unique)
      - `{ userId: 1 }`
    - Relations: Belongs to `users`.

---

## 5. Redis Keys, TTLs, Tags, Queues & Job Names

### 5.1 Redis Keys & Invalidation Tags

| Pattern                                   | Type          | TTL      | Purpose                                    | Invalidation Tags                              |
| :---------------------------------------- | :------------ | :------- | :----------------------------------------- | :--------------------------------------------- |
| `slotly:session:{sessionId}`              | Hash          | 7 days   | Active session authentication data         | `user:{userId}`                                |
| `slotly:oauth:state:{state}`              | String (JSON) | 10 mins  | OAuth PKCE and CSRF state store            | n/a (single-use del)                           |
| `slotly:user:{userId}:profile`            | String (JSON) | 1 hour   | Cached user profile & roles                | `user:{userId}`                                |
| `slotly:blueprint:{projectId}`            | String (JSON) | 2 hours  | Cached blueprint graph & completion status | `project:{projectId}`, `blueprint:{projectId}` |
| `slotly:blueprint:{projectId}:readiness`  | String (JSON) | 10 mins  | Computed readiness score & missing fields  | `blueprint:{projectId}`                        |
| `slotly:institution:{institutionId}:tree` | String (JSON) | 24 hours | Hierarchy tree (depts, programs)           | `institution:{institutionId}`                  |
| `slotly:version:{versionId}:slots`        | String (JSON) | 2 hours  | Full schedule slots matrix for editor      | `version:{versionId}`                          |
| `slotly:lock:node:{projectId}:{nodeId}`   | String        | 30 secs  | Distributed lock for node editing          | n/a (auto-expires / explicit del)              |
| `slotly:lock:slot:{versionId}:{slotId}`   | String        | 30 secs  | Distributed lock for slot move             | n/a                                            |

### 5.2 BullMQ Queues and Job Names

| Queue Name      | Job Name              | Payload                                               | Concurrency | Description                                 |
| :-------------- | :-------------------- | :---------------------------------------------------- | :---------- | :------------------------------------------ |
| `write-behind`  | `sync-node-positions` | `{ projectId, nodePositions: [{ id, x, y }] }`        | 10          | Coalesced background DB persistence         |
| `write-behind`  | `sync-node-config`    | `{ projectId, nodeId, data }`                         | 10          | Coalesced node autosave                     |
| `write-behind`  | `sync-chat-history`   | `{ projectId, userId, message }`                      | 5           | Persist AI conversation history             |
| `solver`        | `solve-timetable`     | `{ projectId, versionId, constraints, options }`      | 2           | Conflict-free constraint engine execution   |
| `audit`         | `log-event`           | `{ userId, institutionId, action, metadata, ip }`     | 20          | Asynchronous audit log persistence          |
| `notifications` | `send-email`          | `{ to, subject, template, variables }`                | 5           | SMTP email dispatch (OTP, invites, alerts)  |
| `export`        | `generate-export`     | `{ versionId, format: 'pdf'\|'xlsx'\|'ics', userId }` | 4           | Background generation of heavy export files |

---

## 6. CRITICAL vs NON-CRITICAL Operations

| Category         | Operation                                         | Execution Pattern                  | DB Target                                    | Consistency Guarantee              |
| :--------------- | :------------------------------------------------ | :--------------------------------- | :------------------------------------------- | :--------------------------------- |
| **CRITICAL**     | User Registration & Login                         | Synchronous                        | MongoDB + Redis                              | Immediate Strong Consistency       |
| **CRITICAL**     | Session Revocation                                | Synchronous                        | Redis (immediate) + Mongo                    | Immediate Invalidation             |
| **CRITICAL**     | Role / Permission Change                          | Synchronous                        | MongoDB + Redis cache bust                   | Immediate Strong Consistency       |
| **CRITICAL**     | Project Creation & Delete                         | Synchronous                        | MongoDB                                      | Immediate Strong Consistency       |
| **CRITICAL**     | Structural Graph Change (Add/Remove Node or Edge) | Synchronous after Gate Chain check | MongoDB + Redis cache update                 | Immediate Strong Consistency       |
| **CRITICAL**     | Batch Operations (Topological Apply)              | Synchronous                        | MongoDB (Transaction)                        | Atomic Rollback on Failure         |
| **CRITICAL**     | Solver Build Job Enqueue                          | Synchronous barrier                | Redis / BullMQ                               | Flushes pending write-behind first |
| **CRITICAL**     | Save Studio Slot Move                             | Synchronous validation + write     | MongoDB (Transaction)                        | Conflict-free verification         |
| **CRITICAL**     | Timetable Publish & Approval                      | Synchronous                        | MongoDB (Transaction)                        | Version immutability sealed        |
| **CRITICAL**     | Accept AI Changes                                 | Synchronous                        | MongoDB (Transaction)                        | Complete state validation          |
| **NON-CRITICAL** | Canvas Node Drag (Positions)                      | Write-behind                       | Redis first -> BullMQ (`jobId=node:${id}`)   | Eventual Consistency (coalesced)   |
| **NON-CRITICAL** | Node Config Autosave                              | Write-behind                       | Redis first -> BullMQ (`jobId=config:${id}`) | Eventual Consistency (debounce)    |
| **NON-CRITICAL** | Real-time Cursor & Presence                       | In-memory broadcast                | Socket.IO                                    | Ephemeral                          |
| **NON-CRITICAL** | Chat History Storage                              | Write-behind                       | Redis -> BullMQ -> Mongo                     | Eventual Consistency               |
| **NON-CRITICAL** | Audit & Activity Logging                          | Write-behind                       | BullMQ -> Mongo                              | Fire-and-forget buffer             |
| **NON-CRITICAL** | Analytics Counters                                | Write-behind                       | Redis INCRBY -> BullMQ batch flush           | Eventual Consistency               |
| **NON-CRITICAL** | Email Notifications                               | Async Queue                        | BullMQ -> SMTP worker                        | Asynchronous retry with backoff    |

---

## 7. RBAC Matrix (Role x Resource x Action)

| Resource                       | Action                   | SUPER_ADMIN | ADMIN (Institution) |    DESIGNER     |      FACULTY      |    STUDENT     |      PUBLIC      |
| :----------------------------- | :----------------------- | :---------: | :-----------------: | :-------------: | :---------------: | :------------: | :--------------: |
| **Institution**                | Create / Delete          |     Yes     |         No          |       No        |        No         |       No       |        No        |
|                                | Edit Config / Periods    |     Yes     |      Yes (own)      |       No        |        No         |       No       |        No        |
|                                | View Details             |     Yes     |      Yes (own)      |    Yes (own)    |     Yes (own)     |   Yes (own)    |        No        |
| **Departments / Programs**     | Create / Edit / Delete   |     Yes     |   Yes (own inst.)   |       No        |        No         |       No       |        No        |
|                                | View                     |     Yes     |      Yes (own)      |    Yes (own)    |     Yes (own)     |   Yes (own)    |        No        |
| **Faculty & Room Resources**   | Create / Edit / Delete   |     Yes     |   Yes (own inst.)   | Yes (own dept.) |        No         |       No       |        No        |
|                                | Set Own Availability     |     Yes     |         Yes         |       Yes       |  Yes (self only)  |       No       |        No        |
| **Projects (Timetable Terms)** | Create / Delete          |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
|                                | Edit Metadata            |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
| **Blueprint Graph**            | View Graph & Status      |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
|                                | Add/Edit/Delete Nodes    |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
|                                | Apply Templates / Batch  |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
| **Solver Build**               | Trigger Build Job        |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
|                                | Cancel Build Job         |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
| **Timetable Editor**           | View Draft Schedules     |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
|                                | Move / Swap / Edit Slots |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
|                                | Lock / Unlock Slots      |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
| **Publishing Workflow**        | Submit for Approval      |     Yes     |   Yes (own inst.)   | Yes (assigned)  |        No         |       No       |        No        |
|                                | Approve / Reject Publish |     Yes     |   Yes (own inst.)   |       No        |        No         |       No       |        No        |
|                                | Publish to Production    |     Yes     |   Yes (own inst.)   |       No        |        No         |       No       |        No        |
| **Published Timetables**       | View Schedule            |     Yes     |   Yes (own inst.)   | Yes (own inst.) | Yes (own classes) | Yes (own sec.) | Yes (via Token)  |
|                                | Export (PDF/Excel/iCal)  |     Yes     |         Yes         |       Yes       | Yes (own classes) | Yes (own sec.) | Yes (if enabled) |
| **Audit Logs**                 | View Security & Activity |     Yes     |   Yes (own inst.)   |       No        |        No         |       No       |        No        |

---

## 8. Risks and Open Questions

### 8.1 Identified Risks & Mitigations

1. **Solver Scalability for Large Universities (500+ Faculty, 100+ Sections)**
   - _Risk:_ Combinatorial explosion in NP-hard timetable scheduling leading to worker timeout.
   - _Mitigation:_ Decouple solver into BullMQ workers with progressive constraint relaxation (hard constraints first, soft preferences optimized via simulated annealing/tabu search); partition by department where resources do not overlap.

2. **Concurrent Edits on Graph & Timetable Grid**
   - _Risk:_ Overwriting another designer's node movements or slot placements.
   - _Mitigation:_ Optimistic concurrency with mandatory `If-Match: <revision>` header; server returns `409 Conflict` with the latest state when stale; ephemeral Socket.IO presence and node locks warn users before editing.

3. **Write-Behind Consistency Gap Before Builds**
   - _Risk:_ User triggers a Build immediately after moving nodes or updating configs, before BullMQ write-behind workers persist changes to MongoDB.
   - _Mitigation:_ Explicit **Consistency Barrier** implemented in `BuildFacade`: before enqueuing a build, the server flushes or awaits pending write-behind jobs for that `projectId`.

4. **Redis Ephemerality & Fallback**
   - _Risk:_ Redis connection loss could block all read queries if cache-aside is tightly coupled.
   - _Mitigation:_ `CacheService` handles Redis failures gracefully by falling back to MongoDB queries and logging a warning without crashing requests.

5. **LLM Hallucinations in Schedule Editing**
   - _Risk:_ Natural language commands from users producing invalid schedules or bypassing constraints.
   - _Mitigation:_ Strict Command Pattern: LLM acts only as an intent parser emitting structured AST operations (`MoveSlotCommand`, `SwapSlotCommand`). These commands pass through the deterministic `SlotMoveValidator` before applying.

### 8.2 Open Questions

1. **Academic Calendar Recurrence:** Should holiday breaks and odd/even week alternations (bi-weekly labs) be modeled as distinct node types or period-level rules in Phase 8?
2. **Student Elective Bidding:** Should student elective allocation happen within the timetable solver or as an upstream input to batch creation? (Default decision: Upstream input with section strength split).


---

## 9. Configuration Architecture (Namespaced `registerAs` & Strict Validation)

### 9.1 Namespaces & Typed Factories
All server configuration is strictly namespaced under `server/src/config/` using NestJS `registerAs`. Factories only map and parse `process.env` (integers, booleans, and fallbacks from `DEFAULT_CONFIG` in `defaults.ts`); no business logic.

| Namespace | Injection Key | Environment Variables | Purpose |
| :--- | :--- | :--- | :--- |
| `app` | `appConfig.KEY` | `PORT`, `NODE_ENV`, `CLIENT_URL`, `CORS_ORIGINS`, `API_PREFIX`, `LOG_LEVEL` | HTTP/WS server and environment |
| `database` | `databaseConfig.KEY` | `DATABASE_URL`, `DATABASE_TIMEOUT_MS`, `DATABASE_MAX_POOL_SIZE` | MongoDB connection & connection pooling |
| `redis` | `redisConfig.KEY` | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_TLS` | Redis client settings |
| `jwt` | `jwtConfig.KEY` | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | Token secrets and TTL durations |
| `session` | `sessionConfig.KEY` | `SESSION_TTL`, `SESSION_MAX_LIFETIME`, `SESSION_COOKIE_*` | Session lifetimes and httpOnly cookies |
| `auth` | `authConfig.KEY` | `ARGON2_*`, `OTP_*`, `STEP_UP_WINDOW`, `THROTTLE_*`, `PASSWORD_*` | Security parameters, hashing, rate limits |
| `oauth` | `oauthConfig.KEY` | `OAUTH_CALLBACK_BASE_URL`, `GOOGLE_*`, `GITHUB_*` | Social login providers & callbacks |
| `email` | `emailConfig.KEY` | `EMAIL_DRIVER`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Email driver (log \| brevo) & Brevo API |
| `cache` | `cacheConfig.KEY` | `CACHE_DEFAULT_TTL`, `CACHE_*_TTL` | Cache-aside TTL policies |
| `queue` | `queueConfig.KEY` | `QUEUE_PREFIX`, `QUEUE_ATTEMPTS`, `QUEUE_CONCURRENCY_*` | BullMQ worker & queue concurrency |
| `groq` | `groqConfig.KEY` | `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_MAX_TOKENS`, `GROQ_TEMPERATURE` | AI assistant LLM settings |

### 9.2 Validation & Legacy Variable Detection
1. **Unified Joi Schema**: `envValidationSchema` validates all environment variables at bootstrap. Fails fast with a unified message enumerating invalid/missing variable names only (never secret values).
2. **Legacy Variable Trap**: `checkLegacyVariables` detects historical variable names (`MONGODB_URI`, `JWT_ACCESS_EXPIRATION`, `EMAIL_FROM`, `SMTP_*`, `GOOGLE_CALLBACK_URL`, etc.) and halts bootstrapping with explicit migration guidance.
3. **Test Isolation**: In `NODE_ENV=test`, `ignoreEnvFile: true` ensures `.env` files are not loaded, providing safe in-memory defaults.
4. **Typed Injection**: Modules consume configs using `ConfigModule.forFeature(thatConfig)` and `@Inject(thatConfig.KEY) private readonly config: ConfigType<typeof thatConfig>`. Direct `process.env` access outside `src/config/` and `src/main.ts` is strictly prohibited and enforced via ESLint `no-process-env`.
5. **Migration CLI**: `pnpm env:migrate [path]` safely updates existing `.env` files into `.env.migrated` without logging or leaking secret values.
