BLUEPRINT RULES: completion gating

STATUS (computed by the server, never trusted from the client)
- incomplete: some required fields are missing (this includes a node that was just
              created and has no configuration yet)
- complete:   all required fields valid
- blocked:    own data may be fine, but an ancestor is not complete (effectiveStatus)
Each node exposes {status, effectiveStatus, missing[]}. missing[] lists
{field, reason} entries. The Phase 0 draft also listed an "empty" status; the
implemented contract (NodeStatusSchema in packages/contracts) has only the three
values above, so treat "empty" as incomplete.

HIERARCHY AND COMPLETION (Blueprint v2: 7 Hierarchy Node Types)
Node            | Needs a COMPLETE parent of type | Is complete when
Institution     | none (root)                     | name, code, working days, period config
Department      | Institution                     | name, code
Program         | Department                      | name, duration in years
AcademicYear    | Program                         | year number, label
Semester        | AcademicYear                    | semester number, start and end dates
Section         | Semester                        | name, strength > 0, valid assignments, and for each resource type (faculty, subjects, rooms) either effective pool is non-empty or auto-fill is enabled
Batch           | Section                         | name, size; sum of batches <= section strength

NOTE ON RESOURCE NODES AND ASSIGNMENTS (Blueprint v2):
In Blueprint v2, `faculty`, `room`, `subjectAssignment`, and `electiveGroup` are no longer separate canvas nodes.
- Faculty, subjects, and rooms are held in per-node Resource Pools referencing Library items.
- Subject assignments live directly inside Section and Batch node configurations (`data.assignments`).
- Elective groups are represented as subject bundles or Section assignment sets.

RESOURCE POOLS AND INHERITANCE
Every node can define a resource pool (`data.pool`) with additions and exclusions:
  effectivePool(node) = effectivePool(parent) + own additions - own exclusions
- Inheritance is live and recursive down the vertical hierarchy.
- Required items: items marked `required: true` by an ancestor CANNOT be excluded by any descendant (`POOL_ITEM_REQUIRED`).
- Pinned items: items marked `pinned: true` survive on descendants even if an ancestor removes them from their pool additions.
- Read-only library view: pools store references to Library items. Node inspectors render read-only cards with an "Open in Library" link; items cannot be edited inside the Blueprint canvas.
- Auto-fill modes: Section nodes configure auto-fill for unassigned faculty/rooms at build time:
  - `off`: all assignments must have explicit faculty and room in the effective pool.
  - `same_department`: solver automatically assigns available faculty/rooms from the node's department pool.
  - `allow_other_departments`: solver can draw from institution-wide pools if department pool is exhausted.

RULES
G1 Creation gate: a node can be created only under a COMPLETE parent. Applies to
   palette drop, "Add child" button, context menu, paste, duplicate, template
   apply, import, and AI operations. Exceptions: the Institution root and
   independent resource nodes.
G2 Connection gate: an edge is allowed only if the type pair is allowed AND both
   endpoints are complete (and, for Faculty->Subject, the faculty is qualified).
G3 Parent regression: if an edit makes a parent incomplete, children are NOT
   deleted. They become "blocked": greyed out, shown with a badge
   "Parent incomplete", excluded from validation errors and from builds. They
   return to their own status when the parent is complete again.
G4 Delete with impact: deleting a node shows an impact preview (descendants,
   assignments, builds affected) and needs confirmation. Cascade delete is one
   undoable command.
G5 Build gate: Build is enabled only when every in-scope node is complete and
   there are zero errors. Blocked nodes make the build unavailable.
G6 Bulk operations (templates, import, AI) are applied in topological order.
   If an operation fails a gate, it is skipped with a reason code and all of its
   dependents are skipped too. The result lists applied, skipped and why.
G7 The server is authoritative. The same gate chain runs on the server; the
   client mirrors it only for UX (disabled palette items with a reason such as
   "Complete 'CSE Program' first", disabled "+" handles).
G8 Reason codes. The source of truth is ReasonCodeSchema in packages/contracts.
   Codes are canonical strings; legacy spellings are accepted only through
   REASON_CODE_ALIASES / normalizeReasonCode and are never emitted by the server.
   Human-readable text lives in REASON_CODE_MESSAGES (the client toast maps every
   code). Gate codes:
     PARENT_NOT_FOUND         (legacy alias: PARENT_MISSING)
     PARENT_INCOMPLETE
     PARENT_TYPE_NOT_ALLOWED
     SINGLE_PARENT_VIOLATION
     CYCLE_DETECTED           (legacy alias: CYCLE)
     DUPLICATE_NAME
     CAPACITY_EXCEEDED
     ENDPOINT_INCOMPLETE
     NOT_QUALIFIED
     PROJECT_LOCKED
     UNAUTHORIZED             (legacy alias: PERMISSION_DENIED)
     INVALID_OPERATION
   Blueprint v2 pool and assignment gate codes:
     POOL_ITEM_NOT_FOUND      referenced Library item does not exist
     POOL_ITEM_ARCHIVED       referenced Library item is archived
     POOL_ITEM_REQUIRED       item marked required by ancestor cannot be excluded
     POOL_ITEM_IN_USE         cannot remove/exclude item while in active section assignments
     POOL_DEPARTMENT_FORBIDDEN item belongs to another department and cross-dept is disabled
     POOL_DUPLICATE           item already exists in this node's pool additions
     ASSIGNMENT_NOT_IN_POOL   assigned subject/faculty/room missing from section's effective pool
   Codes added by later phases (same schema; confirm the exact list in contracts):
     REVISION_CONFLICT        stale revision (HTTP 409 with current state)
     OCCUPANCY_CONFLICT       double-booking caught by the unique occupancy index
     VERSION_IMMUTABLE        write to a published or archived version
     INVALID_STATE_TRANSITION illegal publish or project state change
     HARD_CONFLICTS_EXIST     publish or validation blocked by hard conflicts
   Each gate rejection also returns fixHint {nodeId, field} so the UI can jump to
   the field that needs completing.
G9 Constraint and pool inheritance: scheduling constraints and resource pools set on
   Institution, Department, Program or Section are inherited by descendants and can be
   overridden lower down. effectiveConstraints(node) merges ancestors.
   effectivePool(node) = effectivePool(parent) + own additions - own exclusions.
G10 Guided mode: a "Next step" button finds the first incomplete node in
   hierarchy order and focuses it, opening its configuration at the first
   missing field.
G11 Pool mutation gates:
   - PoolItemExistsGate: verified against the Library item repository.
   - PoolItemActiveGate: verified item is active (not archived).
   - PoolDepartmentGate: verified item matches department scope unless cross-dept permitted.
   - PoolRequiredGate: verified ancestor required items are preserved.
   - PoolImpactGate: verified in-use items are not excluded without cascade.
   - PoolDuplicateGate: verified item is not already added.
   - AssignmentInPoolGate: verified section subject/faculty/room exist in effective pool (or auto-fill enabled).

IMPLEMENTATION NOTES (from the code, for reference)
- Gate chain order: ProjectNotLocked, Permission, ParentExists, ParentTypeAllowed,
  ParentComplete, SingleParent, NoCycle, DuplicateName, Capacity, ConnectionEndpoint,
  Qualification, PoolItemExists, PoolItemActive, PoolDepartment, PoolRequired,
  PoolImpact, PoolDuplicate, AssignmentInPool. Each returns {allowed, reasonCode, message, fixHint}.
- Batch operations (OperationService) apply in topological order; a failed operation
  skips its dependents with a reason code (G6) and returns {revision, applied[],
  skipped[]}.
- Writes carry the blueprint revision; a stale revision returns 409 REVISION_CONFLICT
  with currentRevision, rejectedRevision and the current graph.
- Constraint inheritance (G9) is resolved by ConstraintResolverService; pool inheritance is
  resolved by PoolResolverService.