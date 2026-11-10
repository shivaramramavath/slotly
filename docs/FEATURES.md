# Slotly: Feature Specification

An AI-assisted academic timetable platform for schools and colleges. Users model their institution as a visual graph, validate it, generate conflict-free timetables with a constraint solver, edit them like a spreadsheet, version them, and publish them.

This file is the single source of truth for scope. Related files: `AGENTS.md` (build rules), `ROUTES.md` (route, event, queue and key names), `BLUEPRINT_RULES.md` (completion gating).

**How to read this file**

- Sections are numbered so they can be referenced as `FEATURES §6.4`.
- Priority: **P0** core (needed for a working product), **P1** should have, **P2** later.
- A section header shows the build phase from `AGENTS.md`. Unless a bullet says otherwise, bullets in a section share the section's priority; mixed sections tag individual bullets.
- "Must" statements are requirements. "Can" statements are optional.

---

## 0. Decisions that override earlier notes

| Topic | Decision |
|---|---|
| Stack | Next.js (App Router) + NestJS + MongoDB + Redis + BullMQ + Socket.IO. Earlier notes mention MERN/Express; ignore those. |
| Roles | SUPER_ADMIN (reserved for multi-institution), ADMIN (institution admin), DESIGNER (timetable designer), FACULTY, STUDENT. |
| Blueprint hierarchy | Institution → Department → Program → Academic Year → Semester → Section → Batch. Subject assignments hang under a Section. Faculty and Room are independent resource nodes. |
| Project scope | One project is one academic term's timetable. A Semester node tells which semester each academic year is in. |
| Creation rule | A child node can be created only after its parent node is complete (§6.2). The server enforces it; the client mirrors it for UX. |
| Graph direction | Vertical (top to bottom) by default. Users can switch to left-right, bottom-top or right-left. |
| Auth tokens | Short-lived access token held in memory (Bearer) plus refresh token in an httpOnly cookie. A Redis session is checked on every request. |
| Schedule model | One schedule entry per session (day, start period, span, type, subject, faculty, room, section). A lab is one entry spanning several periods, never separate per-cell records. |
| Correctness | The constraint solver guarantees conflict-free schedules. The LLM interprets, recommends, proposes structured operations and explains. It is never responsible for correctness. |
| Routes | Names in `ROUTES.md` are authoritative (for example `/versions/:versionId/slots`), not the draft routes in older notes. |
| Theme | Black and white UI. Yellow (primary and active), green (success and complete), red (error and conflict) in small amounts. |
| Data handling | Redis caches reads. Non-critical writes go to Redis first and are persisted to MongoDB by BullMQ jobs. Critical writes are synchronous. |

---

## 1. Product overview

### 1.1 Core flow

1. Sign in and set up the institution (departments, programs, years, semesters, sections, calendar).
2. Fill the Library (faculty, subjects, rooms).
3. Create a project and build the Blueprint graph; complete each parent before adding children.
4. Assign subjects, faculty and rooms to sections; set constraints.
5. Validate the graph and check readiness.
6. Build: a background job generates ranked timetable alternatives.
7. Review on the Board; fix details in the Studio with drag and drop.
8. Version, compare, request approval, publish.
9. Faculty, students and rooms view the published timetable; export and share.

### 1.2 Roles and permissions

Scope words: **All** = whole institution, **Assigned** = only departments or projects assigned to the user, **Own** = their own data, **Read** = view only.

| Capability | ADMIN | DESIGNER | FACULTY | STUDENT |
|---|---|---|---|---|
| Manage users, roles | All | No | No | No |
| Manage institution structure | All | Assigned (limited create) | Read | Read |
| Manage Library (faculty, subjects, rooms) | All | Assigned | Read | No |
| Edit Blueprint | All | Assigned | No | No |
| Run Build | All | Assigned | No | No |
| Edit schedule (Studio) | All | Assigned | No | No |
| Request publish | All | Assigned | No | No |
| Approve and publish | All | No | No | No |
| View published timetable | All | Assigned | Own and department | Own section |
| View analytics | All | Assigned | Own workload | No |
| View audit logs | All | No | No | No |
| Submit feedback | Yes | Yes | Yes | Yes |

---

## 2. Identity and access (Phase 2)

### 2.1 Registration and login (P0)

- Register with email and password; log in with email and password; Google sign-in.
- Logout current session; logout from all devices.
- First user of an institution becomes ADMIN.
- Clear, non-leaking error messages.

### 2.2 Session management (P0)

- Server-side session per device, stored in Redis with TTL: sessionId, userId, device, browser, IP, coarse location, createdAt, lastActiveAt, expiresAt, status, MFA verified flag.
- Inactivity timeout and maximum session lifetime; renewal on activity.
- Every request validates the session. A valid token alone is not enough, so revocation takes effect immediately.
- List active sessions, view one, terminate one, terminate all others, detect expired and revoked sessions.
- Session state stays separate from audit logs.

### 2.3 Token management (P0)

- Access token: short life, carries userId and sessionId, minimal claims.
- Refresh token: httpOnly secure cookie, hashed at rest, bound to a session, rotated on every refresh, revoked on logout.
- Token families with reuse detection (reuse revokes the family).
- Atomic rotation in Redis and safe handling of concurrent refresh calls.
- Token and session versioning for forced invalidation.

### 2.4 Email verification and OTP (P0)

- Six-digit OTP from a cryptographically secure generator; only the hash is stored.
- Expiry, single use, resend cooldown, maximum attempts, rate limiting; a new OTP invalidates the previous one.
- Used for registration, email change and recovery verification.
- Responses never reveal whether an email is registered.

### 2.5 Password management (P0, items marked P1 later)

- Argon2id hashing.
- Policy by length (12 to 128 characters, spaces allowed), not arbitrary symbol rules.
- Reject common passwords and known compromised passwords through a replaceable checker. [P1: external breach database]
- Password history to block reuse. [P1]
- Change password requires recent authentication; reset and change revoke other sessions and notify the user.

### 2.6 Account recovery (P0)

- Forgot and reset password with one-time expiring tokens and a generic response ("If an account exists for this email, instructions will be sent").
- Recovery attempt limits; notify the user after recovery; revoke suspicious sessions.
- MFA recovery through recovery codes.

### 2.7 Multi-factor authentication (P1)

- TOTP: enroll (secret and QR code), verify, enable, disable.
- Recovery codes: hashed, regenerable, one-time use.
- Step-up authentication: enabling or disabling MFA, regenerating codes, changing password, changing email and changing roles require recent authentication.
- Policy: MFA can be required for ADMIN and DESIGNER accounts.
- Login flow: credentials, then MFA challenge if enabled.
- Email OTP is allowed for verification and recovery but is not the MFA method.

### 2.8 Login protection (P0)

- Rate limiting on login, OTP, refresh and recovery.
- Progressive throttling; no permanent lockout from failed attempts.
- Failed-login tracking, brute-force and credential-stuffing protection.
- IP and device signals are risk inputs only, never an authorization factor.
- CAPTCHA or challenge hook for suspicious traffic. [P2]

### 2.9 Device management (P1)

- Device records: name, browser, OS, last active, current-device marker.
- Trusted devices (add, remove); terminate a device's sessions.
- New-device detection triggers a notification.

### 2.10 Security notifications (P1)

- Events: new-device login, password changed, email changed, MFA enabled or disabled, recovery codes regenerated, recovery completed, session terminated, suspicious login, repeated failed attempts.
- Channels: email and in-app; a security activity page.
- Notifications never contain passwords, OTPs or tokens.

### 2.11 Authentication audit events (P1)

`AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`, `AUTH_SESSION_CREATED`, `AUTH_SESSION_REVOKED`, `AUTH_TOKEN_REFRESHED`, `AUTH_PASSWORD_CHANGED`, `AUTH_PASSWORD_RESET`, `AUTH_MFA_ENABLED`, `AUTH_MFA_DISABLED`, `AUTH_RECOVERY_COMPLETED`, `AUTH_PERMISSION_DENIED`.

Each record holds userId, sessionId, event, timestamp, IP, user agent, result and a failure reason category. Logs never contain passwords, OTPs, tokens or secrets.

### 2.12 Account lifecycle (P1)

- States: active, suspended, deactivated; restore; email change with verification.
- Admin actions: suspend, reactivate, revoke sessions, force password reset, require MFA, remove access, view security events.
- Deletion follows retention rules; academic and audit records are kept or anonymized, not blindly deleted.

### 2.13 RBAC and authorization (P0)

- Roles from §1.2; multiple roles per user; permission registry as data, not scattered conditionals.
- Resource-level checks: institution, department, project ownership.
- Role and permission management for ADMIN; permission changes are audited.
- Temporary permissions and permission inheritance. [P2]
- All decisions enforced on the server; frontend checks only hide UI.
- Permission-aware HTTP routes and socket handlers.

### 2.14 Passkeys and risk-based auth (P2, Phase 15)

- Register, remove and use passkeys (WebAuthn), multiple per account, device management, require passkey for sensitive actions.
- Risk-based authentication using device and IP signals.

### 2.15 Auth UI

Pages: sign up, sign in, email verification, MFA challenge, forgot and reset password, profile and preferences, security settings (change password, MFA, recovery codes, active sessions, trusted devices, security activity). Admin security: user management, session management, security events.

---

## 3. Institution and academic management (Phase 3, P0)

### 3.1 Entities

- **Institution**: name, code, address, working days, default period configuration.
- **Department**: name, code, optional head of department.
- **Program**: name (CSE, ECE and so on), department, duration in years.
- **Academic year**: year number and label within a program.
- **Semester**: name, number, start and end dates, active flag.
- **Section**: name, student strength, batches for lab groups.
- **Batch**: name and size within a section.

### 3.2 Rules

- A child can be created only under an existing active parent.
- Soft delete with dependency checks (for example, a program with sections cannot be deleted).
- All changes are audited and invalidate cached structure.

### 3.3 Calendar

- Working days per institution; Saturday or half-day configuration.
- Holidays and academic calendar events; holidays are excluded from scheduling.

### 3.4 UI

- Tabs: overview, departments, programs, academic years, semesters, sections and batches, calendar, working days.
- Tree view of the whole structure with inline actions; "Add child" disabled with a reason until the parent exists.

---

## 4. Library: faculty, subjects, rooms (Phase 4, P0)

### 4.1 Faculty

- Add, edit, archive; name, code, email, department, designation.
- Availability grid (day by period), unavailable slots, preferred periods and preferred working hours.
- Minimum and maximum hours per week, maximum hours per day.
- Qualifications: subjects the faculty can teach.
- Workload view (assigned versus limits; green within limit, yellow near, red over).
- Faculty timetable viewer (filled in Phase 12).

### 4.2 Subjects

- Code, name, credits, department, programs.
- Type: theory, laboratory, tutorial, seminar.
- Weekly hours and weekly lab hours; required consecutive periods (for example a 3-period lab).
- Preferred days; student enrollment; dependencies between subjects.
- Requirements: room type, minimum capacity, equipment.
- Faculty assignment (qualified faculty list).
- Electives: elective flag, elective groups, option to require simultaneous scheduling.

### 4.3 Rooms

- Classroom, laboratory, seminar hall.
- Capacity, building, equipment list, department ownership, shared-room flag.
- Availability grid and reservation constraints.
- Laboratories linked to the subjects they can host.
- Capacity and equipment matching against sections and subjects.

### 4.4 Import and export (P1)

- Excel and CSV import for faculty, subjects and rooms: upload, column mapping, preview, row-level errors, background processing with progress.
- Excel export of each list.

### 4.5 UI

- Library tabs with search, filters, pagination, create and edit dialogs, archive and restore.
- Compact weekly availability grid component, reused inside Faculty nodes on the Blueprint.

---

## 5. Projects (Phase 5, P0)

- Create, list (search, filter by status), open, rename, duplicate, archive, delete.
- Create from: empty, a template or starter kit, or generated from the institution structure.
- Term settings: odd, even or custom term with start and end dates.
- Period settings: working days, periods per day, period duration, start time, breaks and lunch, per-day overrides (for example a short Saturday), shift-based layouts. [per-day overrides P1]
- Lifecycle: draft → building → ready → pending approval → published → archived.
- Starter kits: school (8 periods), college (6 periods), lab-heavy.
- Dashboard (home): recent projects, build status, quick create.

---

## 6. Blueprint designer (Phases 5 to 7)

The Blueprint is a visual workspace for configuring the academic structure, resources and constraints, validating readiness, and starting a build. It is built from five systems: graph editor, graph configuration, graph validation, graph persistence, and scheduling integration. React Flow UI logic must stay separate from the scheduling algorithm.

### 6.1 Node types (P0)

- Blueprint v2 standardizes on exactly 7 hierarchy node types: Institution, Department, Program, Academic Year, Semester, Section, Batch.
- Faculty, subjects, and rooms are managed as per-node Resource Pools referencing Library items, not standalone canvas nodes.
- Subject assignments (theory, laboratory, tutorial, elective) live directly in Section and Batch configurations (`data.assignments`).
- Student strength configuration on Section and Batch.
- Multiple departments in one graph; multiple sections under one semester.
- Academic hierarchy visualization with node status indicators (incomplete, complete, blocked).

### 6.2 Completion gating (P0)

Full rules are in `BLUEPRINT_RULES.md`. Summary:

- Every node has a computed status: incomplete, complete, or blocked.
- A child can be created only under a complete parent (palette drop, add-child button, context menu, paste, duplicate, template apply, import, AI operations). Exception: the Institution root.
- A connection is allowed only when the type pair is allowed and both ends are complete.
- If a parent becomes incomplete, its descendants become blocked (greyed, excluded from builds), not deleted.
- Deleting a node shows an impact preview and is one undoable action.
- Build is available only when every in-scope node is complete and there are no errors.
- Bulk operations apply in topological order; failures skip their dependents and report reasons.
- Server enforces everything with stable reason codes and a fix hint; the client disables palette items, add-child handles and connections with the reason.
- Constraints and resource pools set on higher levels are inherited by descendants and can be overridden lower down.
- Guided mode: a "Next step" button jumps to the first incomplete node and the first missing field.

### 6.3 Resource Pools and Section Assignments (Blueprint v2)

**Resource Pools**

- Per-node resource pools (`data.pool`) hold references to Library items (faculty, subjects, rooms).
- Inherited down the hierarchy: `effectivePool(node) = effectivePool(parent) + own additions - own exclusions`.
- Items marked `required: true` by an ancestor cannot be excluded by descendants (`POOL_ITEM_REQUIRED`).
- Items marked `pinned: true` survive on descendants even if an ancestor removes them.
- Read-only Library view inside inspector cards with direct "Open in Library" navigation.

**Section Assignments**

- Section and Batch nodes configure subject assignments directly in their inspector drawer (`data.assignments`).
- Each assignment defines subject, faculty, room, periods per week, and lab configuration.
- Auto-fill modes (`off`, `same_department`, `allow_other_departments`) enable the solver to assign faculty/rooms at build time.

### 6.4 Canvas (P0 unless marked)

- Infinite canvas, zoom in and out, zoom to fit, pan, mini map, grid background, snap to grid, fullscreen.
- Strictly vertical layout (no LR, BT, RL direction toggling).
- Multi-select, box selection, select all, delete, undo and redo.
- Copy, paste and duplicate; pasting a subtree needs a complete target parent. [P1]
- Canvas lock and unlock, lock individual nodes, hide and show nodes, focus mode for the selected node's neighbourhood. [P1]
- Custom grid size, alignment guides, smart snapping, keyboard shortcuts, right-click context menu, smooth zoom, node position persistence, viewport restoration. [P1]
- Bulk add children ("add sections A to D") and quick create by typing. [P1]
- Canvas reset. [P1]

### 6.5 Drag and drop and connections (P0)

- Drag nodes from the palette to the canvas; drag within the canvas; drag multiple selected nodes.
- Drag nodes into containers and between groups; drop into predefined academic groups. [P1]
- Create relationships with handles: faculty to subject, subject to section, subject to room, section to semester, and the academic hierarchy.
- Connection validation: block invalid type pairs, duplicates and cycles; validate source and target types, required relationships, and gating (§6.2); show clear messages.

Examples: Faculty to Subject is valid; Section to Subject is valid; Room to Faculty is invalid.

### 6.6 Node configuration panel (P0)

- Right-side panel with dynamic forms per node type, tabs (general, constraints, validation), inline editing.
- Field validation, required indicators, validation errors, change detection, save, cancel, reset.
- Node-specific settings; missing-field checklist with "go to field".
- Recommendations inside the panel (faculty, rooms) with reasons.

### 6.7 Graph validation (P0)

- Structural validation: Institution exists; Department belongs to Institution; Program to Department; Academic Year to Program; Semester to Academic Year; Section to Semester; subject assigned to a section; faculty assigned to the subject; room assigned where required.
- Constraint validation: faculty, room and section availability, maximum faculty workload, subject weekly hours, laboratory duration, room capacity, consecutive-period requirements, duplicate assignments.
- Levels:

| Level | Meaning |
|---|---|
| Error | Blocks generation |
| Warning | Generation allowed, needs attention |
| Info | Configuration suggestion |

- Validate the whole graph, a selected node, a selected connection, and before generation; real-time and background validation.
- Validation summary, error navigation (click to focus), auto-fix suggestions with "Fix automatically" for safe fixes.

### 6.8 Auto arrange and layout (P1)

- Vertical layout only: hierarchical (Dagre TB), compact, and department-based. No direction switching (no LR, BT, RL).
- Align and distribute nodes, arrange selection or whole graph, preserve manual positions, minimize edge crossings, avoid overlap, automatic spacing and edge routing, layout preview and reset.
- ELK can replace Dagre later if routing needs outgrow it.

### 6.9 Grouping and containers (P1)

- Containers for department, program, semester and section; faculty and subject groups; nested groups.
- Collapse and expand; moving a group moves its children; group-level configuration and validation summary.

### 6.10 Graph templates (P1)

- Save a subtree as a template; duplicate; import and export; categories; preview; versioning; sharing within the institution.
- Create a project from a template; apply a template under a complete anchor parent.
- Example templates: CSE semester, ECE semester, laboratory scheduling, engineering college.

### 6.11 Undo, redo and history (P1)

- Undo and redo for node create and delete, move, connection create and delete, and configuration updates.
- History panel (for example "10:32 Subject connection added").
- Snapshots (manual and automatic), restore, compare a snapshot with the current graph.
- Version comparison of graph states.

### 6.12 Autosave and persistence (P0, advanced items P1)

- Autosave with save status indicator, manual save, unsaved-changes guard, restore after refresh.
- Persist positions, configurations, connections, viewport and graph metadata.
- Save only changed elements; background persistence through the queue.
- Revisions with optimistic concurrency; a stale write returns the current state and shows a conflict dialog (keep mine, take theirs, review). [P1]
- Graph configuration is stored separately from generated timetable data.

### 6.13 Search and navigation (P1)

- Search by node name, faculty ID or code, subject code, department, room.
- Highlight and focus results; navigate between connected nodes; filter by node type; hide unrelated nodes; clear search.

### 6.14 Smart connections and recommendations (P2)

- Recommend faculty and rooms for subjects using qualifications, availability, requirements and equipment, always with a reason.
- Suggest missing connections; detect unused faculty and rooms; detect subjects without sections.
- Recommend compatible laboratory rooms; flag incomplete configurations.

### 6.15 Scheduling constraints from the graph (P1)

- Faculty, room and section availability; subject duration; faculty workload; laboratory consecutive periods; preferred periods; maximum classes per day; minimum breaks; department-specific rules.
- Constraint panel groups: Faculty (no overlap, maximum periods per day, respect availability), Room (no overlap, match capacity), Section (no overlap, maximum periods per day), Laboratory (consecutive periods, laboratory room required).
- Hard and soft constraints are shown separately; inheritance badges show where a value comes from, with an override action.

### 6.16 Readiness and preview (P1)

- Counts (sections, faculty, subjects, rooms), percent complete, missing items each with a "go fix" link, blueprint health score.
- Preview of structure, faculty and room assignments, weekly subject hours, section workload, constraints, missing configuration.
- Actions: Validate graph, Generate timetable (gated by §6.2).

### 6.17 Import and export (P2)

- Export graph as JSON (versioned schema), PNG, SVG, configuration, and a full backup download.
- Import graph JSON, academic structure and nodes from Excel; imports run through the gating rules and show a preview of what will apply and what will be skipped.

### 6.18 Collaboration (P2)

- Shared editing with editor and read-only access, ownership, invitations.
- Live graph updates, presence (avatars and cursors), user activity indicators.
- Node comments and mentions; edit locks while a user edits a node.
- Concurrent editing detection with explicit conflict resolution (broadcasting updates alone is not sufficient).
- Approval workflow request from the toolbar.

### 6.19 Performance and reliability (P1)

- Lazy loading of large subgraphs, memoized custom nodes, virtualized sidebar lists, debounced autosave, batched updates.
- Background validation, error recovery, graph integrity checks on load, performance monitoring.
- Target: hundreds of nodes stay responsive.

### 6.20 UI polish (P2)

- Node color, icon, badge and shape options; connection colors; status indicators; graph overview.
- Floating toolbar, resizable and collapsible panels, fullscreen editor, tooltips, context menus, keyboard shortcut sheet, interactive onboarding.
- Dark theme only at launch; a light theme can come later.

### 6.21 Layout

Toolbar: Undo, Redo, Save, Validate, Generate, Publish; Zoom in, Zoom out, Fit view, Auto arrange, Fullscreen; Search, Templates, Import, Export, History.

Three regions: node palette (left), canvas (center), configuration with tabs for Config, Constraints and Slotly AI (right).

---

## 7. Constraint engine and validation (Phase 8, P0)

The engine is a pure module with no framework dependencies. New rules are added as new classes without editing engine core.

### 7.1 Hard constraints (must hold)

- No faculty double-booking; no room double-booking; no section double-booking.
- Faculty availability, room availability, section availability.
- Maximum hours per day and per week; minimum hours per week; maximum classes per day; minimum breaks.
- Room capacity fits section; room type matches subject; equipment matches.
- Laboratory consecutive block; laboratory room required.
- Elective simultaneity; holiday exclusion.
- Weekly hours met; no missing allocation.
- Break cells cannot be overwritten by ordinary moves.

### 7.2 Soft constraints (optimized with weights)

- Faculty preferred periods; spread subjects across days; limit consecutive same-subject periods.
- Balance faculty load; labs in the afternoon; minimize room changes; department rules.

### 7.3 Conflict detection and reporting

- Detect faculty, room and section double-booking; unavailable faculty or rooms; insufficient laboratory capacity; workload violations; missing allocations; invalid graph configuration.
- Each violation lists entities involved, affected slots, a message, severity and suggestions.
- Highlight conflicting slots in the UI; suggest alternative periods and rooms ranked by feasibility.
- Pre-build checks return fixable messages before the solver runs.
- Validation results are cached by input hash.

---

## 8. Timetable generation (Phase 9, P0)

- Automatic generation: assign faculty to subjects, assign classrooms, allocate lecture periods, schedule laboratory sessions, support multiple sections and departments, respect locks, electives and batches.
- Solver: hardest-first ordering, greedy placement across all sections together, backtracking, then swap-based improvement; deterministic with a seed; time limit returns the best result so far.
- Alternatives: generate several ranked timetables with different weight profiles (workload-balanced, preference-first, room-efficient). [P1]
- Regenerate when constraints change; reuse locked slots.
- Runs as a background job with real-time progress, cancellation, retry, one active build per project.
- Build page: blocked-state explanation with links back to incomplete nodes, configuration, live log, alternative cards (score, conflicts, stats), side-by-side comparison, open in Board.
- Multi-objective optimization and smart workload balancing. [P1]

---

## 9. Timetable Board and Studio (Phase 10)

Design principle: every cell is editable on its own while the whole timetable is continuously validated. The server validates every change before committing it.

### 9.1 Board views (P0)

- Views by section, faculty, room and subject; weekly and daily.
- Custom working days, period timings and break timings; lab blocks shown merged.
- Sticky day headers and period column, horizontal scrolling, responsive table, fullscreen, zoom, print-friendly layout.

### 9.2 Table customization (P1)

- Column width, row height, density, show or hide faculty, room, subject codes and credits, configurable cell display format, multiple layouts.

### 9.3 Cell types (P0)

| Type | Behavior |
|---|---|
| Theory | Regular lecture |
| Laboratory | Lab room, faculty, consecutive periods and capacity required |
| Tutorial | Tutorial class |
| Seminar | Seminar session |
| Break | No faculty or room; not overwritable by ordinary drag and drop |
| Free period | Unallocated |
| Examination | Exam room, invigilator, duration, section |
| Special event | Academic event |
| Empty | No assignment |

### 9.4 Cell editor (P0)

- Click to select, double-click or Enter to edit; edit subject, faculty, room, day, period, duration; clear; save; cancel.
- Tabs: General, Timing, Assignment, Constraints, Validation (conflict, workload and room status).
- Searchable faculty and room selectors, subject filtering, automatic suggestions, inline and field-level errors, unsaved-changes indicator.

### 9.5 Drag and drop (P0)

- Move a class to another period, day, room or section; swap two classes; move lab sessions; drag between views.
- While dragging, valid targets show green and invalid targets red.
- Flow: update local state, validate (client for speed, server as authority), commit atomically, show feedback. Invalid moves are never silently accepted.

### 9.6 Copy, paste, duplicate (P1)

- Copy one cell, a day or a week; paste into one or many cells; duplicate an entry.
- Copy modes: full assignment, subject only, faculty only, room only.
- Preview and validate before applying.

### 9.7 Selection and bulk edit (P1)

- Single, multi, row, column, day and whole-table selection; shift and ctrl selection; keyboard navigation; highlighting.
- Bulk actions: assign faculty, assign room, change subject, clear, copy, paste. The selection is validated together (availability, double-booking, workload) before applying.

### 9.8 Merge and split (P1)

- Merge consecutive periods into one entry; split; resize duration; move merged sessions as a unit.
- Validate consecutive availability and prevent overlaps.

### 9.9 Smart suggestions (P1)

- For a selected slot, suggest subjects, available faculty, available rooms, compatible laboratories, alternative periods and workload-balanced assignments.
- Suggestions come from real constraints, not from guesses.

### 9.10 History and undo (P1)

- Undo and redo of cell operations (atomic for multi-cell operations); history of who changed what and when; restore previous versions.

### 9.11 Autosave and concurrency (P0)

- Autosave after changes, manual save, save status, error handling with retry, unsaved indicator, restore last saved.
- Save only modified entries; optimistic concurrency with a revision; a stale revision returns 409 with the current state.
- Multi-cell operations commit in one transaction.

### 9.12 Keyboard shortcuts (P1)

Enter edit, Escape cancel, Delete clear, Ctrl+C copy, Ctrl+V paste, Ctrl+Z undo, Ctrl+Y redo, Ctrl+S save, Ctrl+D duplicate, arrow keys navigate, Shift+arrows extend selection. Text inputs always take priority.

### 9.13 Period configuration (P1)

- Add and remove periods, change duration, start and end times, breaks and lunch, working days, Saturday schedule, department-specific and section-specific timings.
- When periods change, detect entries that no longer fit.

### 9.14 Locking and permissions (P1)

- Lock cells, rows, days or the whole timetable; read-only mode by role; admin override.
- Published timetables are protected; editing one creates a draft revision.

### 9.15 AI-assisted editing (P2)

- Natural-language requests ("Move Java to Wednesday period 3 for CSE-A") become structured operations, shown as a proposal, applied only after user confirmation and engine validation. See §14.

---

## 10. Versions and publishing (Phase 11)

### 10.1 Versions (P0)

- Save drafts, duplicate a timetable, maintain history, label versions, archive older ones.
- Compare two versions: added, removed, changed subject, faculty or room; workload and conflict comparison; restore as a new draft. [compare P1]

### 10.2 Publishing workflow (P0)

- Lifecycle: draft → editing → validated → conflict review → pending approval → approved → published → archived.
- Designer requests publish; Admin approves or rejects with a comment.
- Publishing is blocked while hard conflicts exist.
- Published versions are immutable; publishing archives the previous published version; "Create new revision" starts a new draft.
- Notify faculty and students on publish and on updates.
- Rate timetable quality; report scheduling problems.

---

## 11. Viewers, export and notifications (Phase 12)

### 11.1 Viewers (P0)

- Faculty, section, room and subject timetables; weekly and daily views.
- Subject, faculty and classroom detail popovers.
- Current period indicator and upcoming class information.
- FACULTY lands on their own timetable; STUDENT on their section's.

### 11.2 Export and sharing (P1)

- PDF, Excel and PNG export per section, faculty, room or all; large exports run in the background with a download link.
- Public read-only share links (revocable, rate limited) so people can view a published timetable without logging in.

### 11.3 Notifications (P1)

- Timetable published and updated, faculty assignment, conflict found, schedule change, admin announcements.
- Channels: email and in-app (with live push); users control channels in preferences.

---

## 12. Analytics and administration (Phase 13)

### 12.1 Dashboard (P0 for counts)

- Totals: faculty, departments, classrooms, subjects, sections, generated timetables, published timetables, open scheduling conflicts.

### 12.2 Analytics (P1)

- Faculty workload distribution, room utilization, subject allocation, period utilization, faculty free periods, department-wise statistics, unallocated subjects, scheduling efficiency.
- Smart workload balancing suggestions (suggestion only; applied through normal edits).
- Results cached with TTL and refreshed on publish.

### 12.3 Admin (P1)

- Manage users, roles and permissions, institutions and academic configuration.
- Approve timetable publication; view all timetables; view system activity; manage reported conflicts; view and manage feedback.
- Session management and security events per user; force password reset; require MFA.
- Audit log: filter by actor, action, date, target; export.
- Monitoring: API errors, latency, generation durations and failures, queue depth and failed jobs; admin system page and a metrics endpoint.

---

## 13. Feedback and preferences (Phase 13, P1)

- Submit feedback; view own feedback; rate timetable quality; report scheduling problems; admin feedback management.
- User preferences: preferred working hours, preferred periods, timetable generation preferences, notification channels, theme.

---

## 14. Slotly AI assistant and RAG (Phase 14)

### 14.1 Assistant (P1)

- Chat inside the Blueprint (and an assistant panel in the Studio) with streaming replies; quick actions: explain flow, add section, check conflicts, optimize faculty load, explain conflicts, move a class; stop and clear.
- The model emits structured operations only. Blueprint operations pass through the same completion gates as human actions (a child under an incomplete parent is skipped with a reason). Studio operations pass through the move validator.
- Live preview: operations appear as a preview (not saved, not broadcast); the user accepts all or discards; skipped operations are listed with reasons.
- Tools call the engine validators for any claim about validity. The LLM never decides whether a schedule is valid.
- Interprets natural-language requirements into constraint suggestions; explains conflicts and generates change summaries.

### 14.2 RAG (P2)

- Upload institutional scheduling rules and policies (PDF, text, markdown); chunk, embed and retrieve per institution.
- Answers and conflict explanations can cite retrieved policy text.
- Chat history is saved in the background; per-user rate limits and token budgets.

---

## 15. Platform requirements

### 15.1 Security

- All authorization on the server; input validated on both sides; rate limiting on all APIs; secure headers; secrets never in code or logs.
- Audit log for important actions (auth, role changes, publish, deletes) written through a queue.

### 15.2 Performance and caching

- Redis cache-aside for: blueprint graph and completion status, institution structure, library lists, project settings, schedule versions, viewer timetables, analytics, user profile.
- Tag-based invalidation; stampede protection; Redis outages fall back to MongoDB.
- Critical writes are synchronous (auth, project creation, roles, build enqueue, publish, structural graph changes, validated schedule moves). Non-critical writes (node position drags, config autosave, chat history, audit log, last opened, notifications, analytics counters, emails) go to Redis first and are persisted by queue jobs that coalesce rapid edits, are idempotent, retry with backoff, and use a dead-letter queue.
- Before a build runs, pending background writes for that project must be flushed.

### 15.3 Reliability

- Graceful shutdown drains in-flight jobs; one active build per project; revision-based conflict detection; versioned import and export schemas.

### 15.4 Observability

- Request ids, latency and error metrics, queue health, generation metrics, structured logs.

### 15.5 Quality

- Unit tests for pure logic (gates, completion rules, constraints, solver, validators, state machines, cache); end-to-end smoke test: register → create project → complete blueprint → build → view board → move a cell.

### 15.6 Accessibility and localization (P2)

- Keyboard-only alternative to drag and drop, screen-reader labels, high-contrast support; multi-language UI later.

---

## 16. Later additions (Phase 15, P2)

- Passkeys (WebAuthn) and risk-based authentication.
- Substitution manager: leave requests, ranked qualified substitutes, admin approval.
- Exam timetable generator and invigilation duty allocation.
- What-if simulator on a temporary version with diff.
- Swap and change requests between faculty with approval.
- Calendar sync (iCal and Google Calendar), QR codes per room, push alerts, installable PWA with offline last-published view.
- Free room finder and common free-slot finder.
- Multi-institution tenancy under SUPER_ADMIN, SSO for school or college domains.
- Semester rollover and public API with webhooks.
- Student elective selection with seat limits.

---

## 17. Coverage map

| Section | Topic | Phase |
|---|---|---|
| 2 | Identity and access | 2 |
| 3 | Institution and academic management | 3 |
| 4 | Library | 4 |
| 5 | Projects | 5 |
| 6.1 to 6.3, 6.7, 6.10 to 6.12, 6.16 to 6.17 (server side) | Blueprint domain and gating | 5 |
| 6.4 to 6.7 (client), 6.12 | Blueprint canvas, sync, gating UX | 6 |
| 6.4, 6.8 to 6.20 | Blueprint advanced features | 7 |
| 6.15, 7 | Constraints and validation | 8 |
| 8 | Generation | 9 |
| 9 | Board and Studio | 10 |
| 10 | Versions and publishing | 11 |
| 11 | Viewers, export, notifications | 12 |
| 12, 13 | Analytics, admin, feedback | 13 |
| 14 | AI and RAG | 14 |
| 15 | Platform requirements | all phases |
| 16 | Later additions | 15 |

---

## Appendix A: Examples

### A.1 Conflict card

```
Conflict detected

Faculty:  Ramesh Kumar
Subject:  Data Structures
Section:  CSE-A

Problem:
Faculty is assigned to two classes during the same period.

Suggested solution:
Move Data Structures to Period 4.
```

### A.2 Subject configuration

```
Subject: Data Structures
Type: Theory
Weekly hours: 4
Faculty: Faculty A
Room: Classroom
Consecutive periods: 1
Preferred days: Monday, Wednesday

Subject: Java Lab
Type: Laboratory
Weekly hours: 3
Faculty: Faculty B
Room: Computer Lab
Consecutive periods: 3
```

### A.3 Graph validation summary

```
Graph Validation

OK       Institution configuration valid
OK       Department relationships valid
OK       Academic structure valid

Warning  Faculty assignment missing
Warning  Laboratory room not configured

Error    Duplicate faculty connection

[View errors]  [Fix automatically]
```

### A.4 Generation readiness

```
Generation Readiness

Sections: 4    Faculty: 18    Subjects: 24    Rooms: 12
Configuration: 92% complete

Missing:
- 2 faculty assignments
- 1 laboratory room

[Validate graph]  [Generate timetable]
```

### A.5 Graph export shape

```json
{
  "schemaVersion": 1,
  "nodes": [
    {
      "id": "subject-1",
      "type": "subjectAssignment",
      "parentId": "section-1",
      "position": { "x": 200, "y": 300 },
      "data": { "name": "Data Structures", "weeklyHours": 4 }
    }
  ],
  "edges": []
}
```

### A.6 Search result example

```
Search: Data Structures

Results:
- Subject: Data Structures
- Faculty: Ramesh Kumar
- Section: CSE-A
```

Clicking a result focuses and highlights the node.

### A.7 Recommendation example

```
Subject: Java Programming

Recommended faculty:
1. Faculty A
2. Faculty B

Recommended room:
Computer Lab 2

Reason:
Room supports the required laboratory equipment.
```