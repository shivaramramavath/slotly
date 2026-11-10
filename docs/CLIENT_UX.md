# Slotly Client UI/UX Specification

Scope: every screen in the Next.js client (`client/src/app`), the shared patterns they use, and acceptance checks. Related files: `AGENTS.md` (build rules), `FEATURES.md` (scope), `ROUTES.md` (API names), `BLUEPRINT_RULES.md` (gating).

---

## 0. Canonical routes and migration from built routes

The route tree in this document is canonical. Some routes were built earlier under different names. Keep the old paths working with permanent redirects (`next.config` redirects) until links are updated.

| Built earlier | Canonical | Notes |
|---|---|---|
| `/dashboard` | `/home` | Role-aware home |
| `/institutions` | `/institution` | Tabs become sub-routes |
| `/blueprint-templates` | `/kits` | Starter kits and saved templates |
| `/projects/:id/editor` | `/projects/:id/studio` | Editable grid |
| `/users/me`, `/users/me/security`, `/sessions` | `/profile`, `/profile/security`, `/profile/sessions` | Keep API paths unchanged |
| `/mfa` | `/mfa` | Stays (auth challenge page) |
| Library at `/library` with tabs in state | `/library/faculty`, `/library/subjects`, `/library/rooms` | Tabs become routes |
| Blueprint sidebar tabs in state | `@sidebar` slot routes | `config`, `constraints`, `validation`, `history`, `ai` |

---

## 1. Design language

### 1.1 Principles

1. **Calm and dense.** Black and white, thin borders, small type. The data is the interface.
2. **Status is shown by shape and text first, color second.** Every status color is paired with an icon or label so color is never the only signal.
3. **The system explains itself.** Every disabled control has a reason on hover and focus. Every rejection says why and links to the fix.
4. **Instant feedback.** Reversible actions update the screen immediately; the server confirms afterwards.
5. **One obvious next step.** Each screen has one primary action (yellow) and at most one at a time.

### 1.2 Tokens (CSS variables, never hardcoded)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | Page background |
| `--bg-elevated` | `#0A0A0A` | App shell, panels |
| `--surface` | `#111111` | Cards, inputs, popovers |
| `--border` | `#232323` | All borders (1px) |
| `--border-strong` | `#3A3A3A` | Hover borders, selected rows |
| `--text` | `#FAFAFA` | Primary text |
| `--text-muted` | `#8A8A8A` | Labels, secondary text |
| `--accent` | `#FACC15` | Primary action, selection, current period |
| `--success` | `#22C55E` | Complete, valid, ready |
| `--danger` | `#EF4444` | Error, conflict, destructive |
| `--info` | `#3B82F6` | Links, informational only |

**Accent budget:** colored pixels stay under 5% of any screen. Colored fills are used only for small badges, dots, rings and one primary button. Large areas never use accent fills; selection uses a 1px accent border plus a 6% accent tint.

### 1.3 Typography

- Sans (UI text) and mono (labels, numbers, codes, times). Both loaded with `next/font`.
- Scale: 11 (mono labels, uppercase, +0.04em tracking), 12, 13 (table text), 14 (body), 16, 20 (section titles), 24 (page titles), 32 (landing only).
- Numbers in tables, scores and times use mono with tabular figures.

### 1.4 Spacing, shape, depth, motion

- 4px grid. Common gaps: 8, 12, 16, 24. Page padding 24 (16 on mobile), centered content column max-w-5xl (1016px).
- Radius: 6 (inputs, badges), 8 (nodes), 12 (dialogs, controls, select), 20 (grid surface cards).
- Tokens: `--radius-card: 20px`, `--radius-control: 12px`, `--card-padding: 24px`, `--header-height: 72px`, `--page-max-width: 1016px`.
- No shadows. Depth comes from `--surface` versus `--bg` and 1px borders. Dialogs use a dimmed backdrop. Surface cards hover border `--border-strong` (`#383838`), hover background `#161616`.
- Motion 120 to 200 ms ease-out. Allowed: fade, short slide for sheets, snap-back, status ring transitions. Disabled entirely under `prefers-reduced-motion` (replace with instant changes).
- Focus ring: 2px `--text` outline with 2px offset on every focusable element. Never removed. Surface cards use `focus-within:ring-2 focus-within:ring-[#FAFAFA]`.

### 1.5 Status vocabulary

| Meaning | Icon | Text | Color |
|---|---|---|---|
| Complete / ready / valid | check circle | "Complete" | success |
| Incomplete / draft / warning | dashed circle | "3 missing" | accent |
| Blocked | lock-ish slash circle | "Parent incomplete" | muted |
| Error / conflict | alert triangle | "Conflict" | danger |
| Building / pending | spinner or clock | "Building", "Pending approval" | accent |
| Published | check double | "Published" | success |
| Archived | archive | "Archived" | muted |

---

## 2. App shell

### 2.1 Top bar (`AppHeader`, 72px, all signed-in pages)

`Logo` (sys0 wordmark lockup: "slotly" with yellow "o", 16px divider, "Beta" mono tag linking to `/home`) · primary nav (`AppNav`: plain text links, 14px, muted hover to white, active is white with 1px underline offset 6px decoration-white/60) · notifications bell (plain icon button, yellow dot for unread) · user menu (`UserMenu`: 32px circular avatar dropdown with initials, role badge, Profile, Security, Active Sessions, Sign Out).

- Transparent background with sticky scroll-state blur and border after 12px scroll.
- No header CTA: creation button moves to the page header of Projects.
- Active nav item: white text with a 1px underline offset 6px in white at 60% opacity (never yellow). Others muted.
- Role-based nav: FACULTY and STUDENT see "My timetable" instead of Projects, Institution, Library, Kits.
- Below 768px the nav collapses into a menu sheet; the avatar and bell stay visible.
- Compact variant (`compact=true`, 56px height, full-bleed) for workspace views (Blueprint canvas, Studio).

### 2.2 Project header (48px, inside `/projects/[projectId]/*`, stays mounted)

```
Projects / Sem 5 CSE   [Draft]     Blueprint  Build  Board  Studio  Versions  Publish  Settings     ● Saved   (A)(B)   [Validate]
```

- Breadcrumb with inline rename (click name, Enter to save, optimistic).
- Status badge (see §1.5).
- Tabs are links to routes. A tab can be **unavailable** and shows a tooltip with the reason: Build ("Complete the blueprint first, 4 nodes missing"), Board ("Build a timetable first"), Studio ("No draft version yet"), Publish ("Validate the timetable first").
- Right side: save status chip, presence avatars (max 3 then "+N"), one contextual primary action: Validate → Build → Open Board → Request publish, based on project stage.

### 2.3 Command palette (⌘K / Ctrl+K)

- Searches projects, library items, institution entities, pages and actions ("New project", "Go to Library").
- Keyboard only: arrows, Enter, Escape. Results grouped with mono type labels. Recent items first.
- Role-aware: only shows what the user can open.

### 2.4 Responsive behavior

| Width | Behavior |
|---|---|
| ≥ 1280 | Full layouts, side panels docked |
| 768 to 1279 | Side panels collapsible, default collapsed in Studio |
| < 768 | Single column; panels become bottom sheets; Blueprint is pan/zoom plus edit-in-sheet; Board defaults to day view; Studio is read-focused with tap-to-edit sheet (no drag and drop) |

---

## 3. Global patterns

### 3.1 Loading and skeletons

- Every route segment and every slot has `loading.tsx` using a skeleton that matches the final layout and dimensions exactly (zero layout shift).
- Show skeletons after ~150 ms; once shown, keep for at least ~300 ms.
- Skeleton color `--surface` with a very subtle shimmer (disabled under reduced motion).
- Lists and tables use `keepPreviousData`: dim the existing rows to 60% opacity with a thin top progress line instead of blanking.
- Each Suspense boundary has an error boundary with a Retry button.

Skeleton catalog:

| Skeleton | Shape |
|---|---|
| `ListRowSkeleton` | 48px row: 32px avatar block, two text bars, right-aligned badge block |
| `TableSkeleton` | Header row plus 8 rows matching column widths |
| `CardGridSkeleton` | 3 to 6 cards, 120px tall, title bar, two text bars, footer chip |
| `FormSkeleton` | Label bar (60px) plus 40px input blocks, sticky footer buttons |
| `GraphSkeleton` | Dotted grid; 1 root node card, branching to 3 and 6 node cards connected with dashed lines |
| `TimetableSkeleton` | Day header row plus period column; 5×8 blocks, two blocks spanning rows (lab look) |
| `ChartSkeleton` | Axis lines plus 6 bars or a block with muted gridlines |
| `SidebarSkeleton` | Tab strip plus FormSkeleton |
| `TextSkeleton` | 1 to 4 bars, last bar 60% width |

### 3.2 Empty states

- Text only, no illustrations: a one-line title, one sentence of help, and one primary action.
- Examples: Projects → "No projects yet" / "Create one from a starter kit or from your institution structure" / [New project]. Library → "No faculty yet" / [Add faculty] [Import from Excel].
- Filtered-empty states say "No results for these filters" with a "Clear filters" action.

### 3.3 Errors

| Situation | Treatment |
|---|---|
| Field validation | Inline under the field, red text with icon, shown on blur and on submit |
| Action rejected by server | Toast with the human reason (see §8) plus **Go fix** or **Retry** |
| Page data failed | Error boundary card in place of the content with Retry; the rest of the page stays usable |
| Permission denied (403) | Inline "You don't have access to this" with the role needed; never a blank page |
| Not found | Standard page: "We can't find that" plus link home |
| Network offline | Persistent slim banner "Offline. Changes are saved locally and will sync." Socket shows reconnecting state |
| Revision conflict (409) | Conflict dialog: Keep mine / Take theirs / Review differences |

### 3.4 Optimistic updates and pending states

- Reversible actions apply instantly (see policy in `AGENTS.md`). The affected row or cell gets a subtle pending style (70% opacity, small spinner) until confirmed.
- On rejection the item snaps back (160ms), is outlined in red for 2 seconds, and a toast explains why with Undo or Retry.
- Irreversible or critical actions (publish, approve, role change, delete project, MFA/password/email changes) show a pending button state and wait for the server.

### 3.5 Dialogs, sheets, pages

| Use | For |
|---|---|
| Modal (intercepted route) | Create and edit with fewer than ~8 fields, confirmations |
| Drawer (right, 480px, intercepted route) | Detail views with context (faculty, notifications) |
| Bottom sheet | Mobile equivalent of drawers and side panels |
| Full page | Multi-step flows, import wizard, anything that needs a stable URL on hard navigation |

- Escape closes. Focus is trapped and returns to the trigger on close.
- Dirty forms ask "Discard changes?" before closing.
- Destructive confirmations require typing the name only for project deletion; otherwise a normal confirm.

### 3.6 Forms

- Validate on blur, then on change after the first error. Submit disabled only while submitting, never while invalid (invalid submit focuses the first error).
- Required fields marked with a small dot in the label. Helper text under the field in muted.
- Number inputs have steppers and units in mono ("45 min").
- Long forms keep a sticky footer with Cancel and Save and a dirty indicator.

### 3.7 Tables

- 13px text, 40px rows, sticky header, hover row border-strong.
- Sort by clicking the header; filters live in a toolbar above (search, chips, dropdowns). Active filters appear as removable chips.
- Row click opens the detail (drawer or page); row actions in a "⋯" menu; bulk selection shows a bottom action bar.
- Pagination footer shows "1–25 of 312" with page size selector; infinite scroll is not used for tables.

### 3.8 Permissions in the UI

- Actions the user can never do are hidden. Actions blocked by state are shown disabled with a reason tooltip.
- Read-only pages show a small "View only" badge in the header.
- The server is authoritative; the UI only mirrors it.

### 3.9 Save, presence, and concurrency

- Save chip: `Saving…` (spinner), `Saved` (check, muted), `Offline` (accent), `Failed. Retry` (danger).
- Presence avatars with initials, stable per-user color from a neutral grayscale-plus-single-hue palette; cursors shown only on the Blueprint canvas.
- Another user's lock on a node shows their avatar and "Editing" on the node; editing is disabled with a tooltip.

### 3.10 Accessibility

- Contrast: text and interactive elements meet WCAG AA against their backgrounds, including muted text (`--text-muted` is only used at 12px and above on `--bg`/`--surface`).
- Everything operable by keyboard. The timetable grid and Blueprint have keyboard alternatives for drag and drop (see §6.2 and §6.9).
- Grids use ARIA `grid` roles with roving tabindex; the canvas exposes a node list in the sidebar that is fully keyboard operable.
- Live regions announce toasts, save status changes and drag results ("Moved Data Structures to Wednesday, period 3").
- Respect `prefers-reduced-motion` and `prefers-contrast`.

### 3.11 Microcopy rules

- Sentence case. Short verbs ("Add section", not "Click here to add a new section").
- Errors say what happened and what to do next. Never blame the user.
- No exclamation marks, no emojis.

---

## 4. Auth screens (`(auth)` group)

Shared layout: centered card, 400px wide, logo above, links below. Mobile: full-width, no card border.

| Page | UI details |
|---|---|
| **Login** | Email, password (show/hide), "Forgot password?", Google button (secondary), submit (yellow). Generic error "Email or password is incorrect". If MFA is required, route to `/mfa`. Throttled state shows a countdown. |
| **Register** | Name, email, password with a length-based meter (12 to 128, no symbol rules), institution name or code. Meter text: "Longer is stronger". Breached-password rejection says "This password appears in known leaks. Choose another." |
| **Verify email** | Six-digit input: six boxes, paste support, auto-advance, backspace goes back. Resend with a visible 60s countdown. After 5 failed attempts show "Too many attempts. Try again in a few minutes." |
| **Forgot password** | Email only. Always shows "If an account exists for this email, instructions will be sent." |
| **Reset password** | New password and confirm; invalid or expired token shows a clear card with a link to request a new one. |
| **MFA challenge** | Authenticator code input; link "Use a recovery code" switches to a 10-character input; remember-device checkbox is not offered. |

States: AuthProvider restores the session before first paint of app routes with a shell skeleton, so signed-in users never see a login flash. Signed-out users are redirected once, without flicker.

---

## 5. Page specifications

Each page lists purpose, layout, key elements, states, interactions, and responsive notes. Loading uses the skeleton named in §3.1.

### 5.1 Landing `/`

- Purpose: explain the product and convert.
- Layout: top bar (Logo, Sign in, Get started), hero, how it works, feature grid, security note, footer.
- Hero: "Design your timetable as a graph." Subtext one line. Primary **Get started** (yellow), secondary **Sign in**. Right side: a vertical mini-graph that animates nodes turning from dashed (incomplete) to solid green in order, to show the parent-first rule. Static image when reduced motion is on.
- How it works: four steps with mono step numbers: Blueprint, Validate, Build, Edit and publish.
- Features: 6 compact cards. Footer: links, status.
- Performance: server-rendered, no heavy client JS.

### 5.2 Home `/home`

```
Good morning, Priya                          [New project]
┌ KPI strip (@stats) ────────────────────────────────────┐
│ Projects 12 | Building 1 | Awaiting approval 2 | Open conflicts 4 │
├ Continue (@recent) ───────────────────────┬ Activity (@status)────┤
│ Sem 5 CSE   72% ○  Next: Complete Section A│ Build finished …       │
│ Sem 3 ECE   100% ○ Next: Build             │ Approval requested …   │
└────────────────────────────────────────────┴────────────────────────┘
```

- Slots stream independently (each with skeleton and error boundary).
- "Continue" cards show a progress ring (blueprint completion), status badge, and the **next step** text computed from project stage (ties to guided mode).
- ADMIN also sees an approvals widget; DESIGNER sees "My projects"; FACULTY and STUDENT are redirected to `/timetables/me`.
- Empty (no projects): single card "Create your first project" with two options: From institution, From starter kit.

### 5.3 Projects list `/projects`

- Shell: `PageHeader` ("Academic Projects", description, quiet link "Templates and Kits" -> `/blueprint-templates`, single primary yellow button "New project" -> `/projects/new`).
- Filter bar: single row with search input (40px, rounded 12px, surface bg) and compact status select (40px, rounded 12px).
- Surface cards grid: 3-column responsive grid of `SurfaceCard` (20px radius, 24px padding, `#111111` surface, hover border `#383838`, hover bg `#161616`, focus-within white ring).
- Card anatomy (`ProjectCard`):
  - Primary stretched link overlay covering the card (`Link` to `/projects/:id/blueprint`).
  - Top row: 32px calendar glyph, status label with arrow (nudges 2px on hover), isolated "..." action menu button (`MoreHorizontal`, opens Settings, Duplicate, Archive dropdown without navigating).
  - Middle: title (20px, font-medium, clamp-2), subtitle (12px mono, term kind + dates), description (14px, 3-line clamp).
  - Footer row: left has 3-bar progress glyph (`ProgressBars`: 1 bar draft/archived, 2 bars yellow building/pending, 2 bars green ready, 3 bars green published) + monospace status label (`StatusIndicator`, e.g. "Draft · 40% set up"); right has revision number and opened date ("Rev 1 · opened 9 Nov").
- Concurrency & readiness: `ProjectDto.blueprintProgress` (0 to 100) computed server-side from cached Redis readiness without DB query.
- Optimistic: create, duplicate, archive.
- Loading: `ProjectCardSkeleton` × 6. Empty: `SurfaceCard` empty state with "New project" CTA. Error: `SurfaceCard` error state with Retry button.

### 5.4 New project (modal at `/projects/new`, full page on hard navigation)

Three steps with a stepper; Back/Next; progress is kept if the modal is dismissed accidentally (draft kept for the session).

1. **Details and term:** name, term kind (odd, even, custom), academic year, dates, strictness (Strict recommended).
2. **Source:** three selectable cards: Blank, From institution (shows counts it will create), Starter kit (kit picker with mini-graph thumbnails).
3. **Timing:** working days toggles, periods per day, period duration, start time, breaks. Live preview strip of one day (periods and breaks as blocks).

Footer: summary line ("Odd term 2026–27, 6 days, 7 periods"). Primary **Create project** goes straight to the Blueprint.

### 5.5 Blueprint `/projects/[projectId]/blueprint` (Blueprint v2: Minimal Design & Resource Pools)

```
┌ Canvas (Vertical Graph) ─────────────────────────────┬ 360px Drawer (Right) ──────────┐
│ [Floating Toolbar Pill: ↶ ↷ | Fit | Layout ▾ | Search | Next Step | Saved ●]          │
│                                                      │ Tabs: Details | Resources     │
│             Hierarchy Nodes (220px cards)            │       Rules   | Check         │
│               [Institution: Slotly Univ]             │       History | Assignments   │
│                           │                          │                               │
│              [Department: Computer Science]          │ [Selected node form / pool]   │
│                           │                          │ Pool: + Add from Library      │
│                 [Program: B.Tech CSE]                │ Faculty (12) Subjects (8)     │
│                           │                          │ Required items, Pinned items  │
│                 [Semester: Semester 5]               │                               │
│                           │                          │ Assignments (Section only):   │
│                 [Section: CSE-A]                     │ OS (Prof. Smith, Room 301)    │
│               minimap                  Ready 85%     │ Auto-fill: Same Department    │
└──────────────────────────────────────────────────────┴───────────────────────────────┘
```

**Minimal Node Card (220px width, vertical flow):**
- Clean, restrained aesthetic matching the black-and-white visual spec. 1px border (`#232323`), surface bg (`#111111`), rounded 16px.
- Header: mono type indicator (e.g. `SECTION`), title (e.g. `CSE-A`), and status dot:
  - Complete: solid green dot (`#22C55E`)
  - Incomplete: dashed yellow border / amber dot (`#FACC15`) with "N missing"
  - Blocked: muted grey dot (`#8A8A8A`) with "Parent incomplete"
- Body chips: key counts and metrics (student strength, pool count chips: `12 faculty`, `8 subjects`, `3 rooms`).
- Add-child "+" handle: anchored at the bottom edge, active only when node is complete; opens child creation menu.
- Selection: high-contrast white ring or subtle yellow border with no layout shift.

**Floating Toolbar Pill (top center of canvas):**
- Floating pill: Undo (`⌘Z`), Redo (`⇧⌘Z`), Fit view, Layout Algorithm (Hierarchical TB, Compact, Department-based — strictly vertical layout, no direction toggles), Search (`⌘F`), **Next step** (guided mode), and real-time Autosave status indicator.

**Autosave Status Indicator:**
- `Saved`: muted mono text with subtle green dot (`● Saved`).
- `Saving`: pulsing amber dot (`● Saving…`).
- `Offline (N pending)`: amber badge showing pending write-behind operations (`● Offline (3 pending)`).
- `Conflict`: red indicator with prompt to resolve stale revisions (`● Conflict [Review]`).
- `Error`: red indicator with retry action (`● Error [Retry]`).

**360px Right Drawer (slide-over panel with granular tabs):**
| Tab | Content & Functionality |
|---|---|
| Details | Node core attributes (name, code, strength, duration, dates). Direct inline editing with debounced socket autosave. |
| Resources | Per-node Resource Pool: tabs for Faculty, Subjects, and Rooms. Search library items, Add to pool, Exclude inherited items, Mark Required (ancestors), Mark Pinned. Read-only item inspection cards with "Open in Library" links. |
| Assignments | (Active for Section and Batch nodes): Subject assignments table/list. Assign faculty, room, periods/week, lab toggle. Auto-fill selector: `Off`, `Same Department`, `Allow Other Departments`. |
| Rules | Constraint configuration & inheritance. Shows inherited constraints from ancestors with clear override toggles. |
| Check | Node readiness & validation checklist. Lists missing fields and warnings with one-click "Go fix" jump links. |
| History | Live audit trail of changes made to this node; operation history. |

**Resource Pool Cards & Library Navigation:**
- Pool cards within the inspector are strictly read-only representations of Library items.
- Cards show status tags (`Inherited from CSE Dept`, `Required`, `Pinned`, `Excluded`).
- Clicking an item opens a quick preview with an external link "Open in Library" (`/library/faculty?id=...`); items cannot be mutated directly within the Blueprint workspace.

**Canvas Interactions:**
- Drag & Drop: Vertical connections only. Type hierarchy strictly enforced by `BLUEPRINT_RULES.md`.
- Keyboard navigation: Arrow keys navigate between connected nodes in hierarchy order. `Enter` opens drawer. `N` triggers Guided Mode next step. `Delete` opens impact preview dialog.
- Guided Mode: Automatically finds the top-most incomplete node and opens drawer with focused missing field.

### 5.6 Build `/projects/[projectId]/build`

Single column with state-driven main card:

| State | UI |
|---|---|
| **Blocked** | Title "Blueprint isn't ready". List of incomplete or blocked nodes with type, name, what's missing, and **Go fix** per row; summary count; no Build button. |
| **Ready** | Settings card: alternatives (1 to 5), weight profile (Balanced, Preference-first, Room-efficient), preferences summary link, estimated time. Primary **Start build**. |
| **Queued / Running** | Optimistic "Queued" badge, then a stepper (Preparing, Solving, Optimizing, Saving) with percent and a mono live log; **Cancel** button. Page does not re-render beyond the log and progress. |
| **Done** | Alternative cards: rank, score ring, hard conflicts (0 in green), soft score, faculty balance, room use. Select two for side-by-side compare. Actions: **Open in Board**, Open in Studio, Regenerate. |
| **Failed** | Reason, which step failed, **Retry** and link to logs. Project status remains valid. |

### 5.7 Board `/projects/[projectId]/board` and `/[sectionId]`

```
┌ @picker (260px) ──┬ Toolbar: Section ▾ Week|Day  Density  Fields ▾  Zoom  Print  Fullscreen   Version v3 ▾
│ search            ├───────────────────────────────────────────────────────────
│ CSE               │        Mon       Tue       Wed      Thu      Fri      Sat
│  Year 2           │ P1 09:00  DS        DBMS      …
│   Sem 3           │ P2 10:00  …
│    ● Section A    │ Break (hatched)
│    ○ Section B    │ P3 11:15  Java Lab (spans 3 periods)
└───────────────────┴───────────────────────────────────────────────────────────
```

- Section picker is a persistent slot with search and a tree (Program › Year › Semester › Section). Dots show conflict state (red) or none. It stays mounted and cached when changing sections.
- Views: Section, Faculty, Room, Subject; Week and Day.
- **Cell anatomy:** subject code (bold), faculty short name, room (mono). Type tags: `LAB`, `TUT`, `SEM`, `E` (elective) in a small mono tag, not color. Conflict marker: small red triangle top right. Locked: lock icon. Break rows hatched grey.
- Lab blocks render as one tall merged cell.
- Fields menu toggles faculty, room, code, credits. Density: Compact, Comfortable.
- Sticky day header and period column; horizontal scroll with shadows-free edge fade.
- Print stylesheet: single section per page, black text on white, no controls.
- Loading: `TimetableSkeleton`. Empty (no version): "No timetable yet" plus **Go to Build**.
- Mobile: Day view default with a day switcher; picker becomes a top dropdown.
- Read-only banner for published versions with **Create new revision** for permitted roles.

### 5.8 Studio `/projects/[projectId]/studio`

Same layout as Board plus a right panel (collapsible, 340px) with tabs **Cell**, **Suggestions**, **Conflicts**, **History**.

**Toolbar additions:** undo, redo, select mode, copy, paste, duplicate, merge, split, lock, bulk edit, validate, save version, save chip.

**Selecting and editing**
- Click selects a cell; Shift or Ctrl extends; click a day or period header selects the whole day or row; `Ctrl+A` selects all. Marquee selection by dragging on empty space with Shift.
- Double-click or Enter opens the Cell tab. Tabs inside the editor: General, Timing, Assignment, Constraints, Validation.
- Searchable faculty and room pickers show availability and workload hints per option ("Free, 14/18 h").

**Drag and drop**
- Lifting a class: card gets an accent border; the original position shows a dashed placeholder.
- While dragging, every cell is classified: valid targets get a dashed green outline with 6% green tint; invalid get a red outline. Hovering an invalid cell shows a tooltip with the exact reason ("Ramesh Kumar is teaching CSE-B at this time").
- Drop on a valid cell: the move applies instantly (optimistic). Drop on an occupied valid cell offers **Swap** or **Cancel** inline.
- Server rejection: the class snaps back (160 ms), the target cell outlines in red, and a toast shows the reason with the top suggestion as a button ("Move to Wed P4").
- Lab blocks move as one unit; the drop preview covers all spanned periods.
- Keyboard alternative: select a cell, press `M` to enter move mode, arrows choose the target (valid targets are announced), Enter confirms, Escape cancels.

**Bulk edit:** selecting multiple cells shows a bottom bar with Assign faculty, Assign room, Change subject, Clear, Lock. A preview dialog lists each affected cell and any problems before applying; applying is atomic.

**Merge and split:** merge enabled only for consecutive free-compatible periods; the control explains why when disabled.

**Locking:** lock a cell, row, day or the whole timetable; locked cells show a lock icon and refuse edits with a tooltip. Locked cells are kept by regenerate.

**Conflicts tab:** `ConflictCard` list with **Apply suggestion** buttons; selecting a conflict highlights its cells on the grid.

**Save and concurrency:** autosave chip, revision conflict dialog on 409, undo and redo persisted on the server.

**Shortcuts:** Enter edit, Escape cancel, Delete clear, Ctrl+C/V copy and paste, Ctrl+D duplicate, Ctrl+Z/Y undo and redo, Ctrl+S save version, arrows navigate, Shift+arrows extend, `M` move mode, `L` lock. Text inputs always keep priority.

**Mobile:** read-focused: tap a cell opens the editor sheet; no drag and drop; a banner suggests using a larger screen for bulk edits.

### 5.9 Versions `/projects/[projectId]/versions` and `/compare`

- List: version number (mono), label (inline edit), kind badge (Generated, Manual), score, conflicts, created by and when, status badge. Actions: Open in Board, Duplicate, Restore as draft, Compare.
- Compare: two selectors at the top; `@left` and `@right` slots load independently. Diff grid colors: added (green outline), removed (red outline with strikethrough text), changed (yellow dot and before/after on hover). Summary strip: "12 added, 3 removed, 9 changed". Metrics table (score, conflicts, faculty balance, room use) with deltas.

### 5.10 Publish `/projects/[projectId]/publish` (also an intercepted modal)

- Checklist with live status: Blueprint complete, Validation passed, Zero hard conflicts, All sections have a timetable. Each failing item links to the place that fixes it.
- Designer: **Request publish** with an optional note; shows state Pending with who will review.
- Admin: review card showing the version, diff against the current published version, and **Approve** or **Reject** (rejection requires a comment). Approve then **Publish** are pessimistic with pending states.
- After publishing: immutable banner, link to share and export, and **Create new revision**.

### 5.11 Project settings

Tabs: General, Term, Timing and breaks, Danger zone. Timing editor shows a day strip preview that updates as you change periods, plus a per-day overrides table (for example short Saturday). Changing periods warns how many existing entries would no longer fit. Danger zone: Archive (confirm), Delete (type the project name).

### 5.12 Institution `/institutions`

- **Routes & Sub-routes:**
  - 8 distinct sub-routes sharing a persistent layout:
    - `/institutions` -> Overview Tree
    - `/institutions/departments` -> Departments list and management
    - `/institutions/programs` -> Degree Programs list
    - `/institutions/academic-years` -> Academic Year cohorts
    - `/institutions/semesters` -> Instructional Semesters
    - `/institutions/sections` -> Sections and Batches
    - `/institutions/calendar` -> Calendar Events and Holidays
    - `/institutions/working-days` -> Working Days and Period Timing
  - Deep-linkable with full browser back/forward and keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
- **Shared Layout (`app/institutions/layout.tsx`):**
  - Renders inside `PageContainer` (max width 1016px, 24px horizontal padding, 16px mobile, 64px bottom padding).
  - Stays mounted across tab switches (zero flicker or re-mounting of header, stats, tabs, or modal dialogs).
  - `PageHeader`: Title displays institution name (fallback "Institution Settings") with an inline monospace badge reading "Main", muted description below.
  - Quick Statistics Row: 6 cards on desktop (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`), radius 16px (`--radius-stat: 16px`, `rounded-[16px]`), surface background (`#111111`), 1px border (`#232323`). Numbers are monochrome tabular figures (28 to 32px, `#FAFAFA`, never yellow) with muted mono labels below (12px, `#8A8A8A`).
  - Navigation Tabs: 40px high segmented link control (`rounded-[12px]`, surface `#111111`, 1px border `#232323`).
- **Single Yellow Accent Rule:**
  - Exactly ONE yellow element on screen: the primary action of the active tab placed in the PageHeader's action slot on the right (`+ Add Department`, `+ Add Program`, `+ Add Academic Year`, `+ Add Semester`, `+ Add Section`, `+ Add Holiday`, or neutral outline `Refresh Tree`).
  - Empty states across all tabs use `SurfaceCard variant="static"`, 32px monochrome glyphs, and neutral OUTLINE action buttons (never yellow).
- **Tree View Polish (`/institutions`):**
  - 12px vertical padding per item, 24px indent per depth level, 1px connector lines (`#232323`), clean monospace badges for node codes ("CS", "CSE-BTech"), status pills, and action buttons.

### 5.13 Library `/library/faculty`, `/library/subjects`, `/library/rooms`

- **Routes & Redirects:**
  - Three distinct routes: `/library/faculty`, `/library/subjects`, `/library/rooms`.
  - Automatic redirects: `/library` redirects to `/library/faculty`; singular aliases `/library/subject` and `/library/room` redirect to `/library/subjects` and `/library/rooms`.
  - Deep-linkable with browser back/forward support.
  - Query parameter preservation rule: Search and active-only filters are preserved across all tabs. Department filter is preserved between Faculty and Subjects, but excluded from Rooms as rooms are institution-level facilities without department assignments.
- **Shared Layout (`app/library/layout.tsx`):**
  - Renders inside `PageContainer` (max width 1016px, 24px horizontal padding, 16px mobile, 64px bottom padding).
  - Renders once and stays mounted while switching tabs (zero re-mounting of header, tabs, or toolbar).
  - Strict spacing scale:
    - nav to PageHeader: PageContainer top padding.
    - PageHeader to tabs: 40px (`mb-10`).
    - tabs to toolbar: 16px (`mb-4`).
    - toolbar to table card: 16px (`mb-4`).
    - table card to page bottom: 64px (`pb-16`).
  - Structure top to bottom:
    1. `PageHeader`: Title "Resource Library", catalog description, `LibraryHeaderActions` slot on the right.
    2. `LibraryTabs`: Segmented link tabs (`Link` with `usePathname` and `aria-current="page"`). Height 40px, radius 12px (`--radius-control`), surface background (`#181818`) and 1px border (`#232323`) for active tab, muted text for inactive. Displays loaded counts (e.g. "Faculty 12", "Subjects 24", "Rooms & Facilities 8") or a skeleton bar while data is loading.
    3. `LibraryToolbar`: Plain controls on page background (no outer bordered box!). Search input (40px, rounded 12px, surface bg), Department select (40px, rounded 12px, hidden on Rooms tab), Active-only toggle button (40px, rounded 12px).
    4. `{children}`: Table surface card for the active route segment.
- **Header Actions (`LibraryHeaderActions`):**
  - Single `LibraryExportDropdown` button (40px high, outline style, Download icon + ChevronDown) offering "Excel (.xlsx)" and "CSV (.csv)". Keyboard accessible (Enter/Space opens, arrow keys navigate, Escape closes with focus return).
  - "Import" outline button (40px high).
  - "Elective Groups" outline button on Subjects tab (40px high).
  - Single yellow primary button matching active tab: "Add faculty", "Add subject", or "Add room" (the only yellow element on the page besides the wordmark "o" and unread bell dot).
- **Table Surface (`SurfaceCard` flush):**
  - Static 20px radius card (`flush={true}`) with no outer table padding so borders reach the edges.
  - Header row padding: 12px vertical, 16px horizontal (`px-4 py-3`, `bg-[#111111]`, `border-b border-[#232323]`).
  - Body row padding: 12px vertical, 16px horizontal (`px-4 py-3`, `divide-y divide-[#232323]`).
  - Fixed min-widths preventing wrap at 1024px: Teaching Workload (`min-w-[220px]`), Qualified Subjects (`min-w-[140px]`).
  - Table scrolls horizontally inside the card below 1024px; page never scrolls horizontally at 390px.
- **Loading & Error Files per Route:**
  - `loading.tsx`: Renders `LibraryTableSkeleton` (flush card, header row + 8 body rows matching column widths, delayed 150ms, reduced-motion respected).
  - `error.tsx`: Renders `LibraryErrorPanel` (SurfaceCard with error icon, heading, error message, Retry button calling `reset()`, and text link to `/library/faculty`).
  - Empty state: Renders `LibraryEmptyState` (centered panel inside table card with 48px vertical padding, action button, and import link).

### 5.14 Timetable viewers `/timetables/*`

- `/timetables/me` for FACULTY: top strip **Now** ("Period 3 · Data Structures · CSE-A · Room 204 · ends 12:15") and **Next**. Below, a weekly grid with the current period outlined in yellow. Day/Week toggle.
- Section, faculty and room viewers share the Board grid in read-only mode with an export menu (PDF, Excel, PNG) and share button.
- STUDENT lands on their section's viewer with the same Now/Next strip.

### 5.15 Analytics `/analytics`

- Filter bar: version, department.
- Cards (each streams independently): Faculty workload distribution (bar chart), Room utilization (heatmap), Period utilization (bar), Free periods (table), Unallocated subjects (list), Scheduling efficiency (single value with explanation).
- Every chart has a "View as table" toggle for accessibility. Charts are monochrome with accent only for threshold markers.

### 5.16 Admin `/admin/*`

| Page | Key UI |
|---|---|
| Users | Table with role chip, status, last seen; change role (confirm, step-up if required); suspend, reactivate, force password reset, require MFA; per-user drawer with sessions and security events |
| Roles | Role × permission matrix (read-only for built-in roles) |
| Approvals | Inbox with version diff summary, Approve/Reject with comment |
| Conflicts | Reported problems with status workflow |
| Feedback | Table with ratings, triage status, reply |
| Audit logs | Filters (actor, action, date, target), expandable rows with metadata, Export |
| System | Health cards (API, MongoDB, Redis), queue depths, failed jobs with retry, request latency sparkline |

### 5.17 Profile `/profile`

- Overview: name, email, role, institution.
- **Security:** MFA setup wizard (QR code, manual key with copy, verify code, recovery codes with Download and Copy and a required "I saved them" checkbox); change password (step-up); active sessions list (current device tagged "This device", Terminate, Logout all others); trusted devices; security activity timeline.
- Preferences: preferred working hours, preferred periods, notification channels.

### 5.18 Blueprint Templates & Kits `/templates` (aliases `/blueprint-templates`, `/kits`)

- Shell: `PageHeader` ("Blueprint Templates and Kits", description in 15px sans muted text max-w-[660px], quiet link "Projects" with arrow -> `/projects`, single primary yellow button "New project" -> `/projects/new`).
- Toolbar: 40px high `CategoryFilter` segmented control (`SegmentedControl` in `components/ui/segmented-control.tsx`) displaying categories "All 3", "K-12 School", "University", "Vocational and STEM" with real counts, horizontally scrollable on mobile without visible scrollbar.
- Surface cards grid: Responsive grid of `SurfaceCard` (20px radius, 24px padding, min-h 270px, equal heights, footer pinned to bottom). 3 columns at >=1024px, 2 at 640-1023px, 1 below 640px, 16px gap (`gap-4`).
- Card anatomy (`KitCard`):
  - Top row: 32px monochrome glyph in 32px rounded box (GraduationCap for K-12, Landmark for University, FlaskConical for Vocational & STEM, Layers fallback); category label with right arrow (nudges 2px right on hover); 32px "more" button (visible on hover, touch, focus-within) with duplicate kit action.
  - Content: 20px medium white title (clamp 2 lines), mono 12px muted subtitle (`Subtree · N nodes · M connections`), 14px description with 22px line height (clamp 3 lines; uses custom description or generated fallback "Includes Node1, Node2 and X more."). Tag chips omitted from card face.
  - Pinned footer: 1px top border; left mono 12px version ("v1"); right actions: quiet "Inspect" text button with Eye icon, and outline "Use kit" button (1px border, 32px high, radius 12px, white text, small arrow icon). Never yellow.
  - Single yellow rule: The only yellow element on the entire page is the "New project" primary button in the header (plus wordmark "o" and unread bell dot when present).
  - Interaction overlay: Full card clickable via stretched link/button overlay opening the non-destructive Inspect Subtree dialog. Action triggers sit at higher z-index.
- States:
  - Loading: 6 `KitCardSkeleton` items with identical dimensions, PageHeader skeleton, and SegmentedControl skeleton.
  - Empty: SurfaceCard panel with "No template kits found", description, and "Clear filter" button when a category is selected.
  - Error: SurfaceCard panel with retry button; route-level `error.tsx` boundary.



### 5.19 Notifications

- Bell opens a drawer (intercepted route `/notifications`): grouped Today/Earlier, unread dot, click navigates to the relevant page, "Mark all read" (optimistic). Full inbox page at `/notifications` for hard navigation with filters by type.

### 5.20 Help and feedback

- Help: searchable short articles plus keyboard shortcut sheet. Feedback: type (idea, problem, rating), message, optional screenshot, submit (optimistic) with a "Thanks" inline state.

### 5.21 Public share `/s/[token]`

- Minimal chrome: institution name, section or faculty selector limited to the token's scope, read-only grid, Download PDF, "Powered by Slotly" footer.
- Expired or revoked token shows a plain page: "This link is no longer active." with no data leaked.
- Server-rendered with revalidation; no login prompts.

---

## 6. Interaction details

### 6.1 Gating UX (Blueprint)

| Event | Feedback |
|---|---|
| Hover disabled palette item | Tooltip with reason and the node to complete |
| Click disabled "+" or drop invalid | Shake (120ms), toast with reason, **Go fix** |
| Parent becomes incomplete | Top banner with count of blocked descendants, blocked nodes grey out |
| Parent becomes complete again | Banner closes; nodes return to their own status; toast "4 nodes unblocked" |
| Next step pressed | Camera moves to the first incomplete node, the sidebar opens at the first missing field with a short highlight on the field |
| Build pressed with gaps | Opens readiness panel listing the gaps |

### 6.2 Keyboard alternatives for drag and drop

- Blueprint: add from palette with Enter; move focus between nodes with arrows; connect with `C` then choose target in a list.
- Studio: `M` move mode as described in §5.8.
- All drag results are announced via a live region.

### 6.3 Toasts

- Bottom-right, max 3 visible, 5s for success, persistent for errors until dismissed.
- Variants: neutral (default), success (check icon), error (red icon), with optional action button.
- Reason toasts follow the copy in §8.

---

## 7. Component inventory

Status refers to what exists in the repository as of Phase 8; confirm in code.

| Component | Purpose | Status |
|---|---|---|
| Button, Input, Select, Combobox, Checkbox, Switch, Card, Badge, Dialog, ConfirmDialog, Sheet, Tabs, Table, Tooltip, Skeleton, Toast, EmptyState, Kbd, Logo | Primitives | Built |
| AvailabilityGrid, WorkloadBar | Library visuals | Built |
| ConflictCard, ValidationPanel, ShortcutsDialog, RevisionConflictDialog, ImpactPreviewDialog, ParentRegressionBanner | Blueprint and engine UI | Built |
| Skeleton family (§3.1), Boundary (Suspense + ErrorBoundary + Retry) | Loading and error | To build |
| AppHeader, AppNav, UserMenu, PageContainer, PageHeader | App shell & page layout (sys0 visual spec) | Built |
| SurfaceCard, ProgressBars, StatusIndicator, ProjectCard | Project grid & status indicators (sys0 visual spec) | Built |
| LibraryTabs, LibraryToolbar, LibraryExportDropdown, LibraryHeaderActions | Library navigation, toolbar & actions (split routes) | Built |
| LibraryTableSkeleton, LibraryErrorPanel, LibraryEmptyState, LibraryProvider | Library table loading, error, empty states & state provider | Built |
| SegmentedControl, KitCard, KitCardSkeleton, CategoryFilter | Templates & Kits UI (sys0 visual spec) | Built |
| StatusBadge, ProgressRing, ScorePill | Status visuals | Partly built |
| SaveStatusChip, PresenceAvatars | Collaboration | To build or consolidate |
| ReasonToast + GoFixLink | Gate rejection feedback | To build |
| MissingChecklist | Incomplete nodes and Build blocked state | To build |
| CommandPalette | Global search | To build |
| DataTable (sort, filters, bulk bar, keepPreviousData) | Lists | To build (shared) |
| StepperWizard | New project, import | Partly built |
| NodeCard (11 types) | Blueprint | Built |
| TimetableCell, TimetableGrid, SectionPicker, DragOverlay | Board and Studio | Phase 10 |
| DiffCell, MetricDelta | Compare | Phase 11 |
| NowNextStrip | Viewers | Phase 12 |

---

## 8. Human copy for gate reason codes

The contracts currently contain two spellings for some codes (for example `PARENT_MISSING` and `PARENT_NOT_FOUND`, `CYCLE` and `CYCLE_DETECTED`, `PERMISSION_DENIED` and `UNAUTHORIZED`). The client maps all of them; align the contracts on one set when convenient.

| Code(s) | Message | Action |
|---|---|---|
| `PARENT_MISSING`, `PARENT_NOT_FOUND` | "Choose a parent first." | Select parent |
| `PARENT_INCOMPLETE` | "Finish '{parent}' before adding things under it." | Go fix |
| `PARENT_TYPE_NOT_ALLOWED` | "A {child} can't go under a {parent}." | Show allowed types |
| `SINGLE_PARENT_VIOLATION` | "This item can only have one parent." | none |
| `CYCLE`, `CYCLE_DETECTED` | "That connection would create a loop." | none |
| `DUPLICATE_NAME` | "'{name}' already exists here. Pick a different name." | Rename |
| `CAPACITY_EXCEEDED` | "Batches add up to {n}, more than the section strength of {m}." | Go fix |
| `ENDPOINT_INCOMPLETE` | "Finish both items before connecting them." | Go fix |
| `NOT_QUALIFIED` | "{faculty} isn't set up to teach {subject}." | Open faculty |
| `PROJECT_LOCKED` | "This project is {status} and can't be edited." | Create revision (if allowed) |
| `PERMISSION_DENIED`, `UNAUTHORIZED` | "You don't have permission to do that." | none |
| `INVALID_OPERATION` | "That change isn't valid right now." | none |
| `REVISION_CONFLICT` | "Someone else changed this first." | Review changes |
| `VERSION_IMMUTABLE` | "Published timetables can't be edited. Create a new revision." | Create revision |

Schedule rejections show entity names, for example "Ramesh Kumar is already teaching CSE-B in period 3 on Monday" with the top suggestion as the action.

---

## 9. Keyboard map

| Scope | Keys |
|---|---|
| Global | `⌘K` command palette, `?` shortcuts, `g` then `h/p/l/i` go to Home, Projects, Library, Institution |
| Blueprint | `⌘F` search, `Ctrl+Z/Y` undo/redo, `Delete` delete, `Ctrl+D` duplicate, `Ctrl+C/V` copy/paste, `Ctrl+A` select all, `L` lock, `H` hide, `F` focus mode, `Shift+drag` marquee, `F11` fullscreen, `N` next step |
| Studio | See §5.8 |
| Dialogs | `Escape` close, `Enter` primary action, `Tab` cycles inside |

---

## 10. Acceptance checklist

**Global**
- No layout shift when content replaces a skeleton (CLS under 0.05).
- Every route and slot has loading, error and (for slots) default files.
- Every interactive element is reachable by keyboard and shows the focus ring.
- Every disabled control has a reason tooltip.
- Reduced motion removes all non-essential animation.
- Colored area stays under 5% on every screen; status is never color-only.

**Blueprint**
- Palette items and "+" handles obey the gates and explain why.
- A rejected action gives a toast with Go fix that selects the right node and field.
- Making a parent incomplete blocks descendants live in all open tabs.
- Dragging 100 nodes stays smooth; a 500-node graph stays responsive.
- Sidebar tab changes do not re-render the canvas.

**Build**
- Blocked state lists every incomplete node with a working Go fix link.
- Progress updates without re-rendering the page shell.

**Board and Studio**
- Changing section does not remount or refetch the picker.
- Editing one cell re-renders one cell.
- Invalid drop targets show the exact reason on hover; rejected drops snap back with a suggestion.
- Keyboard-only users can move a class and hear the result.

**Library, Projects, Institution**
- Create, edit and archive feel instant and roll back cleanly on failure.
- Create and edit dialogs open over the list with a URL and work on hard refresh.

**Security and admin**
- Sensitive actions request step-up and show a pending state; no optimistic role or MFA changes.
- Revoked sessions are signed out on their next action.