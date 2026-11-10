# Blueprint v2 Specification & Migration Audit

Blueprint v2 transitions Slotly's timetable blueprint canvas from an 11-node mixed graph to a clean, **7-node strict hierarchy** where Faculty, Subjects, and Rooms are references managed in per-node **Resource Pools** rather than canvas nodes. Subject assignments (subject -> faculty -> room) reside directly inside Section (and Batch) node configurations. Layout is strictly vertical. Autosave is handled in real time over the `/blueprint` WebSocket namespace with write-behind persistence.

---

## 1. Feature Audit & Status Matrix

| Feature Checklist Item | Category | Status in Code | Current Code Location / Target Location | Notes & Required Changes |
| :--- | :--- | :--- | :--- | :--- |
| **7 Node Types** | Structure | Needs change | `server/.../model/node-type.registry.ts`, `packages/contracts/src/index.ts` | Retain `institution`, `department`, `program`, `academicYear`, `semester`, `section`, `batch`. Deprecate `subjectAssignment`, `electiveGroup`, `faculty`, `room`. |
| **Completion Rules v2** | Structure | Needs change | `server/.../rules/blueprint-completion.rules.ts` | Section completion now checks strength > 0, valid assignments, and for each resource type either non-empty effective pool or auto-fill enabled. |
| **Status Ring & Checklist** | Structure | Built | `client/.../canvas/node-factory.tsx`, `client/.../dialogs/readiness-dialog.tsx` | Adapt to 7 types; display missing fields and pool/assignment requirements. |
| **"+" Add-Child & "/" Menu** | Structure | Built | `client/.../canvas/node-factory.tsx`, `client/.../components/blueprint-workspace.tsx` | Limit creation targets strictly to valid child hierarchy types; add slash command palette. |
| **Containers for Groups** | Structure | Built | `client/.../canvas/blueprint-group-node.tsx` | Wraps departments, programs, semesters, sections in visual boundary boxes. |
| **Bulk Add Children** | Structure | Built | `client/.../dialogs/bulk-add-dialog.tsx` | Generates standard batches/sections under complete parents. |
| **Copy / Paste / Subtree Duplicate** | Structure | Needs change | `client/.../canvas/blueprint-context-menu.tsx`, `server/.../services/operation.service.ts` | Must carry per-node `data.pool` and `data.assignments` across copies. |
| **Lock, Hide, Focus Mode** | Structure | Built | `client/.../blueprint-workspace.tsx`, `client/.../store/blueprint.store.ts` | Fully operational; retains state per node. |
| **Select, Box Select, Align/Distribute**| Structure | Built | `client/.../canvas/blueprint-floating-align-bar.tsx` | Multi-select and snap align bars operational. |
| **Context Menu & Shortcuts Sheet** | Structure | Built | `client/.../canvas/blueprint-context-menu.tsx`, `client/.../dialogs/shortcuts-dialog.tsx` | Update node type actions; remove obsolete resource node actions. |
| **Undo / Redo (All Operations)** | Structure | Needs change | `client/.../store/blueprint.store.ts` | Extend undo/redo command stack to emit inverse socket operations for pool and assignment edits. |
| **Hierarchy-Only Gates (G1-G10)** | Gating | Needs change | `server/.../gates/blueprint-gates.ts` | Restrict connections strictly to parent-child hierarchy edges. |
| **Parent Regression & Blocked State** | Gating | Built | `server/.../services/completion.service.ts`, `client/.../parent-regression-banner.tsx` | Incomplete parent cascades `effectiveStatus = 'blocked'` to all descendants. |
| **Delete with Impact Preview** | Gating | Built | `client/.../dialogs/impact-preview-dialog.tsx`, `server/.../services/impact-analyzer.service.ts` | Extend to calculate impact on pool items in active section assignments. |
| **Build Gate (G5)** | Gating | Needs change | `server/.../gates/blueprint-gates.ts`, `server/.../services/readiness.service.ts` | Permit build when pools are empty if auto-fill mode is active. |
| **Batch Operations Cascade** | Gating | Built | `server/.../services/operation.service.ts` | Atomic transaction with topological ordering and skip cascade. |
| **Guided Mode ("Next step")** | Gating | Built | `client/.../hooks/use-guided-mode.ts` | Directs designer to next incomplete node in hierarchy. |
| **Constraint Inheritance & Overrides** | Gating | Built | `server/.../services/constraint-resolver.service.ts` | Inherited timing/constraint configs with local override badges. |
| **Canonical Reason Codes & Fix Hints** | Gating | Needs change | `packages/contracts/src/index.ts`, `server/.../gates/blueprint-gates.ts` | Add pool-specific codes (`POOL_ITEM_NOT_FOUND`, `POOL_ITEM_REQUIRED`, etc.). |
| **Resource Pools (Faculty, Subjects, Rooms)** | Pools | **New** | `packages/engine` (PoolResolver), `client/.../sidebar/tabs/blueprint-resources-tab.tsx` | Per-node pools referencing Library items; adds, excludes, requires, pins. |
| **Pool Inheritance (Effective vs Own)** | Pools | **New** | `packages/engine/src/pool/pool-resolver.ts` | `effectivePool(node) = effectivePool(parent) + own adds - own excludes`. Ancestor required items cannot be excluded. |
| **Origin Badges & Read-only Peeks** | Pools | **New** | `client/.../sidebar/tabs/blueprint-resources-tab.tsx` | Badges: "Inherited from X", "Added here", "Excluded here"; hover peek with Library link. |
| **Exclude, Restore, Require, Pin** | Pools | **New** | `server/.../gateways/blueprint.gateway.ts`, `packages/contracts/src/index.ts` | Granular pool operation mutations and gate checks. |
| **Bulk Pool Actions & Presets** | Pools | **New** | `client/.../sidebar/tabs/blueprint-resources-tab.tsx` | Bulk add department resources, lab rooms, or copy from sibling nodes. |
| **Merge / Detach Pool Choice** | Pools | **New** | `client/.../dialogs/pool-reparent-dialog.tsx` | When re-parenting, user selects whether to keep local additions as own or drop. |
| **Pool In-Use Impact Gate** | Pools | **New** | `server/.../gates/pool-impact.gate.ts` | Prevents removing or excluding pool items currently used by section assignments. |
| **Pool Warnings & Suggestions** | Pools | **New** | `client/.../sidebar/tabs/blueprint-resources-tab.tsx` | Flags missing qualified faculty, room capacity shortages, archived library items. |
| **Count Chips on Node Cards** | Pools | **New** | `client/.../canvas/node-factory.tsx` | Node footer chips: "F 12 • S 8 • R 4". |
| **"Where Used" Lens & Filter** | Pools | **New** | `client/.../toolbar/blueprint-search-filter.tsx`, `server/.../blueprint.controller.ts` | Highlights nodes in the canvas whose effective pool contains a selected resource. |
| **Section & Batch Subject Assignments** | Assignments | **New** | `server/.../schemas/blueprint.schema.ts`, `client/.../sidebar/tabs/blueprint-assignments-tab.tsx` | Assigns `subject -> faculty -> room` directly on Section/Batch picking from effective pool. |
| **Auto-Fill Modes & Engine** | Auto-fill | **New** | `packages/engine/src/autofill/resource-allocator.ts` | Modes: `off`, `same_department`, `allow_other_departments`. Build-time allocator. |
| **Auto-Fill Preview & Accept** | Auto-fill | **New** | `server/.../controllers/blueprint.controller.ts`, `client/.../dialogs/autofill-preview-dialog.tsx` | Per-node proposals with item-level accept/reject or "Accept all". |
| **Shortage & Borrowing Reports** | Auto-fill | **New** | `server/.../modules/builds/` | Detailed allocation breakdown, shortage report, and borrowing analytics. |
| **Vertical Layout Only** | Canvas | Needs change | `client/.../hooks/use-blueprint-layout.ts` | Remove horizontal/direction toggles (LR, BT, RL); preserve Hierarchical, Compact, Department-based algorithms. |
| **Minimal Design Node Card (220px)** | Canvas | **New** | `client/.../canvas/node-factory.tsx` | 220px wide card, 14px radius, 1px border, status dot, mono chips. |
| **Floating Bottom Toolbar Pill** | Canvas | **New** | `client/.../toolbar/blueprint-floating-toolbar.tsx` | Centered floating control: undo, redo, fit, layout menu, search. |
| **Right Drawer (360px)** | Canvas | Needs change | `client/.../sidebar/blueprint-sidebar.tsx` | 360px drawer with Details, Resources, Rules, Check, History, Assignments tabs. |
| **Socket Autosave Protocol** | Realtime | **New** | `server/.../gateways/blueprint.gateway.ts`, `client/.../services/blueprint-sync.service.ts` | Real-time WebSocket sync on `/blueprint` with write-behind persistence and op coalescing. |
| **Autosave State Machine & Status** | Realtime | **New** | `client/.../components/autosave-status.tsx` | States: `Saved`, `Saving`, `Offline (N pending)`, `Conflict`, `Error`. |
| **Offline Queue & Reconnect Replay** | Realtime | **New** | `client/.../services/blueprint-sync.service.ts` | In-memory pending queue replayed in order on reconnect with conflict detection. |
| **Templates & Starter Kits v2** | Templates | Needs change | `server/.../services/template.service.ts`, `client/.../dialogs/templates-dialog.tsx` | Rebound to 7 node types with embedded pool presets. |
| **Export (JSON, SVG, PNG) & Import** | IO | Needs change | `server/.../controllers/blueprint.controller.ts`, `client/.../dialogs/export-dialog.tsx` | Serializes and ingests node pools and section assignments. |

---

## 2. Files to Remove or Change for the 4 Deprecated Node Types

The 4 deprecated node types (`subjectAssignment`, `electiveGroup`, `faculty`, `room`) will be maintained behind the `BLUEPRINT_V2` feature flag until Pass E cutover, at which point the legacy code and models will be deleted.

### Server Files Affected:
1. `server/src/modules/blueprint/model/node-type.registry.ts` (Remove 4 node registrations in v2).
2. `server/src/modules/blueprint/model/rules/blueprint-completion.rules.ts` (Remove completion rules for SubjectAssignment, Faculty, Room, ElectiveGroup).
3. `server/src/modules/blueprint/gates/blueprint-gates.ts` (Remove non-hierarchy edge validation for resource nodes; replace with pool gates).
4. `server/src/modules/blueprint/services/graph-from-institution.builder.ts` (Builder creates pools on Department/Section instead of resource canvas nodes).
5. `server/src/modules/blueprint/services/recommendations.service.ts` (Recommend additions to pools rather than graph node insertions).
6. `server/src/modules/blueprint/services/impact-analyzer.service.ts` (Analyze pool deletions instead of node deletions).
7. `server/src/modules/blueprint/schemas/blueprint.schema.ts` (Add `pool`, `assignments`, and `autoFill` fields to `BlueprintNodeSchema`).
8. `server/src/modules/blueprint/services/template.service.ts` (Update template serializer/deserializer to include pools).
9. `server/src/modules/engine/core/solver/task-builder.ts` (Build solver tasks from section assignments and effective pools).
10. `server/src/modules/engine/services/engine-validation.service.ts` (Validate section assignments against pool constraints).

### Client Files Affected:
1. `client/src/features/blueprint/components/canvas/node-factory.tsx` (Render new 220px minimal node cards for 7 types; retire legacy node views).
2. `client/src/features/blueprint/components/palette/blueprint-palette.tsx` (Retire palette or reduce to valid 7 hierarchy types).
3. `client/src/features/blueprint/components/sidebar/blueprint-sidebar.tsx` (Add Resources tab and Assignments block; retire standalone resource node inspector).
4. `client/src/features/blueprint/components/toolbar/blueprint-search-filter.tsx` (Update node type filter pills to 7 types; add "where-used" pool filter).
5. `client/src/features/blueprint/hooks/use-blueprint-layout.ts` (Remove direction toggles; keep vertical only).
6. `client/src/features/blueprint/hooks/use-guided-mode.ts` (Update next-step workflow for 7 hierarchy nodes).
7. `client/src/features/blueprint/hooks/use-gate-validation.ts` (Mirror pool and assignment validation client-side).
8. `client/src/features/blueprint/components/dialogs/bulk-add-dialog.tsx` (Support section assignments in bulk generation).

### Contracts & Engine Packages Affected:
1. `packages/contracts/src/index.ts` (Add `PoolEntry`, `NodePool`, `Assignment`, `AutoFillMode`, `ResolvedPool`, new reason codes, socket events).
2. `packages/engine/src/types.ts` (Support input mapping from resolved pools and section assignments).
