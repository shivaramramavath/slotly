BLUEPRINT RULES: completion gating

STATUS (computed by the server, never trusted from the client)
- empty:      just created, no configuration yet
- incomplete: some required fields are missing
- complete:   all required fields valid
- blocked:    own data may be fine, but an ancestor is not complete
Each node exposes {status, missing[]}. missing[] lists field names with messages.

HIERARCHY AND COMPLETION
Node            | Needs a COMPLETE parent of type | Is complete when
Institution     | none (root)                     | name, code, working days, period config
Department      | Institution                     | name, code
Program         | Department                      | name, duration in years
AcademicYear    | Program                         | year number, label
Semester        | AcademicYear                    | semester number, start and end dates
Section         | Semester                        | name, strength > 0
Batch           | Section                         | name, size; sum of batches <= section strength
SubjectAssign.  | Section                         | subject, type, weekly hours, faculty, room requirement met
ElectiveGroup   | Semester                        | at least 2 subjects, simultaneity flag set
Faculty (res.)  | none (independent)              | availability, max hours per day and week
Room (res.)     | none (independent)              | type, capacity

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
G8 Reason codes (stable strings): PARENT_MISSING, PARENT_INCOMPLETE,
   PARENT_TYPE_NOT_ALLOWED, DUPLICATE_NAME, CAPACITY_EXCEEDED, CYCLE,
   ENDPOINT_INCOMPLETE, NOT_QUALIFIED, PROJECT_LOCKED, PERMISSION_DENIED.
   Each rejection also returns fixHint {nodeId, field} so the UI can jump to
   the field that needs completing.
G9 Constraint inheritance: scheduling constraints set on Institution,
   Department, Program or Section are inherited by descendants and can be
   overridden lower down. effectiveConstraints(node) merges ancestors.
G10 Guided mode: a "Next step" button finds the first incomplete node in
   hierarchy order and focuses it, opening its configuration at the first
   missing field.