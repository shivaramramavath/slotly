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

### 5.5 Blueprint `/projects/[projectId]/blueprint` (Minimal Canvas, Floating Node Library & Issues Hover Card)

```
┌ 48px Header: ← Project Name [Draft] ──────── Autosave [85% Ready] [3 Issues] [Studio] [Build] ┐
├ Canvas (Full Bleed, Vertical Graph, 24px Faint Grid Lines) ────────┬ 360px Sidebar (Right) ───┤
│ [Floating Node Library Rail: 56px / 264px]                         │ Underlined Tabs:         │
│   [Collapse/Expand ‹/›]                                            │ Config | Rules | AI      │
│   [Institution] ── drag to canvas / click                          │                          │
│   [Department]  ── drag onto valid parent                          │ Summary: Type & Title    │
│   [Program]       [NodeIssuesCard (Portal): 256px]                 │ Inline 36px inputs       │
│   [Semester]        ┌────────────────────────────┐                 │                          │
│   [Section]         │ CSE-A • 2 issues           │                 │ Resource Pools:          │
│   [Batch]           │ ▎Code missing              │                 │ Faculty, Subjects, Rooms │
│   ...               │ ▎Strength not configured   │                 │ "Open in Library" cards  │
│                     │ [Fix auto] [Open in config]│                 │                          │
│                     └────────────────────────────┘                 │ Sticky Footer:           │
│             Compact Nodes (232px cards, 64px min-h, 12px radius)   │ [Reset]  [Apply Changes] │
│         [Ghost Next Step]                [MiniMap]                 │                          │
│   [Floating Toolbar Pill: Zoom | Fit | Layout ▾ | ↶ ↷ | ⌕ | ⋯]                                │
└────────────────────────────────────────────────────────────────────┴──────────────────────────┘
```

**Floating Vertical Node Library (`NodeLibraryPanel` & `NodeLibraryItem`):**
- Floating over the canvas on the left edge (`left-4 top-4`), max height `calc(100% - 32px)`, hidden scrollbar with edge fade.
- Container: 20px radius (`rounded-[20px]`), 1px border (`#232323`), 95% surface background with backdrop blur (`bg-[#111111]/95 backdrop-blur-md`), 8px padding.
- Two states with local UI persistence (`localStorage`):
  - **Collapsed (default < 1280px)**: 56px wide icon rail, 40px square icon buttons (radius 12px) stacked vertically with 4px gap. Hover or focus shows a right-side tooltip with node name and description.
  - **Expanded (default >= 1280px)**: 264px wide list. Each row is 56px high: 20px icon, 14px medium title, 12px muted description (1-line clamp), grouped under monospace section labels ("Hierarchy structure" and "Resources").
- **Drag and Drop onto Canvas**:
  - Every enabled item is draggable (`draggable="true"`), carrying MIME type `application/x-slotly-node` and `application/slotly-node-type`. Disabled items are not draggable (`draggable="false"`) and retain styled reason tooltips.
  - Drag preview: small ghost chip (icon + node name, 32px high, radius 12px, surface background, 1px border-strong `#383838`, 80% opacity) following pointer; library item dims to 50% opacity.
  - Drop on a node: adds the new node as child if valid using `onAddNode(type, targetNode.id)`. Valid target nodes display a 2px light ring (`border-strong` token); invalid targets display a not-allowed cursor and toast-like reason chip ("Drop onto a valid parent node. Needs a Program.").
  - Drop on empty canvas: allowed only for root types (`institution` when none exists, `faculty`, `room`), positioned at pointer drop location converted via `screenToFlowPosition`. For non-root types requiring a parent, rejected with cursor chip.
  - Drops respect canvas lock (rejected when locked) and Escape cancels dragging. Drops create exactly one undo/redo history entry and automatically select the new node with the Config tab opened.
- Mobile (< 768px): Transforms into a 48px floating "Add node" icon button at the left edge that opens a bottom sheet with the full node list and large 48px touch targets; sheet closes on item addition.
- Keyboard navigation: Accessible `role="toolbar"` with roving tabindex (Tab enters once, Arrow Up/Down moves between items, Enter/Space adds, Home/End jumps to first/last, Escape returns focus to canvas). Global shortcut `/` expands and focuses the library panel.
- Disabled items: Stay visible at 50% opacity, focusable (`aria-disabled="true"`), displaying styled reason tooltip cards to the right (e.g. "Cannot add Academic Year under Institution. Needs a Program.").
- **Constraint-Driven Gated Addition & Drag Highlighting (`canAddChild`)**:
  - A node type in the library can be dragged or clicked only when allowed: a valid parent exists AND that parent is complete (`effectiveStatus === 'complete'`).
  - Item blocked states:
    - *Parent incomplete*: 50% opacity, small lock icon, reason "Complete <Parent name> first (N to fix)". Clicking selects the incomplete parent, pans to it, and opens its Config tab scrolled to the first issue.
    - *Parent type missing*: 50% opacity, reason "Add a <Parent type> first". Clicking focuses and highlights the missing type in the library.
    - *Cardinality / Locked*: 50% opacity with reason and quick-fix button.
  - Multi-parent count: Types valid in multiple places show count (e.g. "2 places"). Clicking when multiple parents exist and none is selected opens `AddUnderMenu`.
  - While dragging enabled type: valid complete parents get a 2px light ring (`border-strong`), incomplete potential parents get a 1px dashed muted ring with an "Incomplete" chip, and non-valid nodes dim to 60%.
  - Drop on empty canvas: root types created at drop position; child types with exactly 1 complete parent attach to it with a toast; multiple complete parents show "Drop onto the parent you want".
- **Connect-End Creation (`ConnectEndMenu`)**:
  - Dragging a connection handle out of a node and releasing on empty canvas opens `ConnectEndMenu` at the release point (232px width, radius 12px, surface background, 1px border).
  - Lists valid child types for that parent. Selecting a type calls `createChildNode(parentId, childType, position)` and connects it immediately.
  - If parent is incomplete, shows a lock badge with reason and "Open config" button. If parent is a leaf node, shows "No child types". Escape or outside click cancels with no dangling edge.
- **Parent-to-Child Inheritance**:
  - `createChildNode` copies inheritable fields (timing, working days, period duration, departmentId, pools) into the child's initial draft configuration snapshot. Identity fields (`name`, `label`, `code`, `id`) are never inherited.
  - In the Inspector, inherited fields show an "Inherited from <Parent>" label (clicking parent name navigates to parent). Editing changes the label to "Overridden" with a 28px "Reset to inherited" icon button (`RotateCcw`).
  - Single atomic undo/redo command removes/restores both node and edge.
- Viewport & Layout Inset: Layout algorithms and `fitViewOptions` account for a 72px left inset (56px collapsed rail + 16px margin) so nodes are never hidden behind the library panel on load, Fit, or Layout. `fitView` enforces `maxZoom: 1` so lone nodes never exceed 100% zoom.

**Compact Node Card (`NodeCard` — 232px width, 64px min height, 12px radius):**
- Restrained, calm aesthetic matching black-and-white visual tokens. Width 232px, min-height 64px, padding 12px, radius 12px, background surface (`#111111`), 1px border token (`#232323`).
- Row 1: 20px node-type icon (`#8A8A8A`), title (14px font-medium white, truncate with tooltip), subtitle (12px mono muted, e.g. "Campus root" or `Strength 60`).
- Top-Right Status: 16px yellow warning icon (`AlertTriangle`, `#FACC15`) with mono 12px count badge ("3") shown only when issues exist. Ready nodes display a small muted check icon (`Check`, `#8A8A8A`).
- Removed: Progress bar, percentage value, divider line above footer, large "3 missing" row, and chevron. Node dimensions remain strictly identical whether hovered, selected, or unselected (zero layout shift).
- Hover & Selection: Hover moves border to `border-strong` (`#383838`). Selection applies `border-[#FAFAFA]` with 1px outer ring in focus-ring token (`ring-1 ring-[#FAFAFA] ring-offset-2 ring-offset-[#0A0A0A]`). No thick double ring, no glow, no shadow.
- Connection Handles: 8px dots (`#383838` border, `#111111` fill) visible only on hover, selection, or active connection drag. Top target dot, bottom source dot.
- Screen Reader: `aria-describedby` links to a visually hidden summary of issues for full non-visual accessibility.

**Compact Node Issues Hover & Focus Card (`NodeIssuesCard` — 256px width):**
- Appears after 150ms pointer hover on a node, on keyboard focus, or on touch tap. Closes 100ms after pointer leaves both the node and the card (shared hover bridge allows moving pointer into the card to interact with action buttons).
- Dismisses on Escape (returning focus to the node) or on clicking the empty canvas; automatically hides during node dragging or canvas panning.
- Rendered in a React portal in screen space. Anchored to the node's DOM rectangle (256px width, max 90vw), preferring right of node, then left, then below, automatically flipping and shifting within safe canvas bounds.
- Content:
  - Header: Node title (13px medium, truncate) and total count ("3 issues", mono 12px muted) on one line. No close button.
  - Group labels: 12px muted group labels ("Errors (N)", "Requirements (N)") shown only when both errors and warnings are present; omitted when only one group exists.
  - Rows: Compact 8px vertical padding, 12px message, raw key in mono 12px muted, 2px red left indicator for errors, 2px yellow for warnings, no red or yellow background fill.
  - Internal scroll (`max-h-[200px]`) with "+N more" indicator if more than 4 issues are present.
  - Actions row:
    - "Fix automatically": 28px outline button applying safe defaults for missing fields (`getSafeDefaultsForNodeType`).
    - "Open in config": 28px outline button selecting the node and switching to the Config tab in the right sidebar.

**Floating Toolbar Pill (`FloatingToolbar` — centered at bottom):**
- 44px height, 16px radius, 16px from canvas bottom, 1px border (`#232323`), 95% surface background with backdrop blur.
- Contains:
  - Zoom group: 32px zoom-out icon button, 56px tabular zoom percent (`w-14 text-center font-mono text-[11px]`), 32px zoom-in icon button.
  - Fit & Layout group: Fit view button (`fitView` with `maxZoom: 1`), Layout Algorithm dropdown (Hierarchical TB, Compact, Department-based, plus Reset — strictly vertical layout).
  - History group: 32px Undo (`⌘Z`) and Redo (`⇧⌘Z`) icon buttons (disabled at 40% opacity).
  - Search toggle with inline type-ahead drawer.
  - More menu (`ToolbarMenu`).
- Accessible tooltips with keyboard shortcuts and visible focus rings on all controls.

**More Menu (`ToolbarMenu` — 248px width, anchored above More button):**
- Anchored to More button (`side="top" align="end" sideOffset={8}`), 248px width, max height bounded to viewport available space (`max-h-[calc(100vh-80px)]`) so it is never clipped on 1440, 1024, or 768px viewports.
- No scroll arrows; thin native scrollbar with first and last items fully visible when scrolled to ends.
- Rows: 32px high, 13px label, 16px icon, right-aligned mono 12px muted shortcuts, on-off switch state aligned in the right column.
- Sections with 12px muted labels and 1px dividers: View (Minimap, Dim Inactive, Fullscreen, Lock Canvas), Edit (Bulk Add, Copy Subtree, Paste, Duplicate), History (Revision History, Snapshots), Data & Templates (Export, Import, Save as Template, Starter Kits), Collaboration (Comments, Submit for Approval), Help (Shortcuts). Escape returns focus to More button.

**Single 48px Header (`BlueprintHeader`):**
- Left: Back arrow (`/projects`), project name queried asynchronously from API (displays skeleton during fetch, never exposes DB id), Draft status pill.
- Right:
  - Autosave status: `Saved • rev X` (muted check), `Saving…`, `Offline`.
  - Single readiness chip: circular progress ring with `% ready` (green when 100%, white when in progress).
  - Issues chip: displayed only when open issues > 0 (red dot with issue count).
  - Primary action: yellow `Build` button (`/projects/:id/build`).
  - Studio top-bar button removed to eliminate visual clutter and ensure clean single-row alignment at >= 1024px. Studio route remains active at `/projects/:id/editor`.

**Right Inspector Sidebar (`InspectorPanel` & `BlueprintSidebar`):**
- Docked panel on the right side of the canvas: `--inspector-width: 360px` (≥ 1280px), 320px (1024px to 1279px).
- Responsive behavior:
  - Below 1024px: Transforms into an off-canvas slide-over drawer with dark scrim (`bg-black/50`), escape key dismissal, and focus trap.
  - Below 768px: Transforms into a bottom sheet with snap heights (45% peek and 90% full height).
- Collapse/expand: 32px collapse icon button (`PanelRightClose` / `PanelRightOpen`) in the tab bar collapses panel to 0 width; floating 32px open button appears at canvas right edge. Collapsed state persisted in `localStorage`.
- Tab strip: 36px SegmentedControl tabs (`Config`, `Constraints`, `Slotly AI`) with counts where applicable.
- Loading & Error states: Form skeleton shown after 150ms delay (kept >= 300ms); network/data failures show shared error panel with Retry button.
- **Config Tab**:
  - Sticky header: 20px node type icon, 14px font-medium title, mono 12px subtitle (`Node code` / `type`), status chip ("Ready" check or "Incomplete" with yellow text, 16px warning icon, count "N to fix"), comment button.
  - Blueprint Overview (when no node is selected): project name, Draft status chip, 4px segmented readiness bar, resource count cards (nodes, connections, faculty, rooms, subjects), "Needs attention" list (node name + issue count, clicking pans and selects node). Multi-selection shows batch count, node type chips, and batch Delete action.
  - Issues Summary (`IssuesSummary`): Alert card with 2px yellow left indicator (no yellow background fill), "Fix automatically" outline button (28px) applying safe defaults, plain-language issue labels (`issue-label.ts`) with mono raw keys, click-to-jump targets that scroll and focus basic fields or expand relevant resource accordion sections.
  - Basic fields: 13px label + "Required" text (muted, no colored asterisk), 40px input (`h-10`), radius 12px, surface background, standard light neutral focus ring (`ring-1 ring-[#FAFAFA]`, not yellow).
  - Resource sections (`InspectorSection` accordion: Faculty, Rooms, Subjects, Times, More — rendered only when applicable to node type):
    - Faculty, Rooms, Subjects: 44px rows (`ResourceRow`) with initials/glyph avatar, name, meta (workload/capacity/code), 32px remove button. Removal immediately shows a 5-second inline "Removed. Undo" banner before committing deletion. "+" button in section header opens Popover combobox picker (`ResourcePicker`) with live search, multi-select, currently assigned items checked first, "Done" button, empty state linking to Library, and ineligible items disabled with reason tooltip.
    - Times editor (`TimesEditor`): 7 working-day toggles (40px, `aria-pressed`, active state highlighted), start time input, period duration input, daily periods count, break slots editor with add/remove rows.
    - More section: Collapsed by default, description textarea, tags input, node database ID with one-click copy button, Duplicate node button, and Delete node button (opens confirmation dialog).
  - Sticky footer: 64px height, "N unsaved changes" indicator, "Reset" ghost button (40px), "Apply changes" solid white button (`#FAFAFA` with black text `#000000`, 40px, radius 12px, check icon — NOT yellow, disabled until valid changes exist, loading spinner while saving, keyboard shortcut `Mod+Enter` applies).
- **Slotly AI Tab (`AiChatPanel` — Whole Blueprint Chat)**:
  - Full blueprint AI assistant powered by `POST /projects/:projectId/blueprint/ai/chat` (rate-limited, Redis-cached context summary capped < 3500 chars).
  - Context bar: "Whole blueprint" chip + "Include selected node" toggle chip, "New chat" icon button.
  - Chat log: Accessible `role="log"` container with auto-scroll pinning to latest message, "Jump to latest" floating pill when scrolled up, copy message button, sanitized markdown rendering with formatted lists and bolding.
  - Empty state: Clean prompt suggestion cards ("Check for timetable bottlenecks", "Suggest break and period timings", "Summarize faculty allocations", "What is missing to make this blueprint ready?").
  - Auto-growing composer: 1 to 5 lines textarea, Enter to send, Shift+Enter for new line, Stop button during streaming generation.
- **Keyboard & Canvas Safety**:
  - Typing in inspector inputs, textareas, search pickers, or the AI composer never triggers canvas-level hotkeys (Delete, Backspace, F, Z, C, V, D) via explicit `stopPropagation` handling on editable targets.

**First-Run Hint (`FirstRunHint`):**
- Floating card for new/empty canvas (single Institution node), guiding the user to click the bottom `+` handle to add their first Department. Dismissible with localStorage persistence via `useSyncExternalStore`.

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