AUTH (replaces the earlier auth and session routes)
POST   /auth/register, /auth/login, /auth/logout, /auth/logout-all, /auth/refresh, /auth/revoke
POST   /auth/email/verify, /auth/email/resend
POST   /auth/password/forgot, /auth/password/reset
PATCH  /auth/password
GET    /auth/sessions        GET /auth/sessions/:sessionId
DELETE /auth/sessions/:sessionId        DELETE /auth/sessions   (all others)
POST   /auth/mfa/enroll, /auth/mfa/verify, /auth/mfa/enable, /auth/mfa/disable, /auth/mfa/recovery
DELETE /auth/mfa
POST   /auth/step-up            (re-authenticate for sensitive actions)
GET    /users/me/security, /users/me/security/activity, /users/me/security/devices
DELETE /users/me/security/devices/:deviceId

INSTITUTION & STRUCTURE
GET    /institution/structure
GET    /institution/departments
POST   /institution/departments
PUT    /institution/departments/:id
DELETE /institution/departments/:id
POST   /institution/programs
PUT    /institution/programs/:id
DELETE /institution/programs/:id
POST   /institution/academic-years
PUT    /institution/academic-years/:id
DELETE /institution/academic-years/:id
POST   /institution/semesters
PUT    /institution/semesters/:id
DELETE /institution/semesters/:id
POST   /institution/sections
PUT    /institution/sections/:id
DELETE /institution/sections/:id
GET    /institution/holidays
POST   /institution/holidays
DELETE /institution/holidays/:id

LIBRARY RESOURCES
GET    /library/faculty
POST   /library/faculty
GET    /library/faculty/:id
PUT    /library/faculty/:id
DELETE /library/faculty/:id
POST   /library/faculty/:id/archive
POST   /library/faculty/:id/restore
GET    /library/faculty/:id/workload
GET    /library/subjects
POST   /library/subjects
GET    /library/subjects/:id
PUT    /library/subjects/:id
DELETE /library/subjects/:id
POST   /library/subjects/:id/archive
POST   /library/subjects/:id/restore
GET    /library/rooms
POST   /library/rooms
GET    /library/rooms/:id
PUT    /library/rooms/:id
DELETE /library/rooms/:id
POST   /library/rooms/:id/archive
POST   /library/rooms/:id/restore
GET    /library/elective-groups
POST   /library/elective-groups
PUT    /library/elective-groups/:id
DELETE /library/elective-groups/:id
POST   /library/import
GET    /library/export
POST   /library/match/room
POST   /library/match/faculty

PROJECTS
POST   /projects
GET    /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId
POST   /projects/:projectId/duplicate

BLUEPRINT
GET    /projects/:projectId/blueprint
GET    /projects/:projectId/blueprint/readiness
GET    /projects/:projectId/blueprint/nodes/:nodeId/impact
POST   /projects/:projectId/blueprint/operations         batch ops, topological, per-op results
GET    /projects/:projectId/blueprint/history
GET    /projects/:projectId/blueprint/recommendations?nodeId=
GET    /projects/:projectId/blueprint/export?format=json|svg|png
POST   /projects/:projectId/blueprint/import
GET    /projects/:projectId/blueprint/nodes/:nodeId/comments
POST   /projects/:projectId/blueprint/nodes/:nodeId/comments
GET    /blueprint-templates
POST   /blueprint-templates                              save subtree as template
GET    /blueprint-templates/:templateId
POST   /blueprint-templates/:templateId/apply            body: { anchorNodeId }
POST   /blueprint-templates/:templateId/duplicate
GET    /blueprint-templates/:templateId/export
POST   /blueprint-templates/import

BUILDS & GENERATION
POST   /projects/:projectId/builds                       enqueue build generation (modes: fresh, regenerate, repair)
GET    /projects/:projectId/builds                       list generated schedule versions
GET    /projects/:projectId/builds/:versionId            get specific schedule version with slots, score, conflicts
POST   /projects/:projectId/builds/cancel                cancel in-flight build job

TIMETABLE & EDITOR (use If-Match: <revision> on all writes; 409 on mismatch)
GET    /versions/:versionId/slots                        query schedule entries by sectionId, facultyId, roomId, subjectId, day
PATCH  /versions/:versionId/slots/:slotId                edit slot details
POST   /versions/:versionId/slots/:slotId/move           move slot to target day, startPeriod, roomId, facultyId
POST   /versions/:versionId/slots/swap                   swap two slots atomically
POST   /versions/:versionId/slots/bulk                   bulk batch actions (atomic, validated together)
POST   /versions/:versionId/slots/:slotId/merge
POST   /versions/:versionId/slots/:slotId/split
DELETE /versions/:versionId/slots/:slotId                clear cell assignment
POST   /versions/:versionId/slots/lock                   lock or unlock cells, rows, days, or whole timetable
POST   /versions/:versionId/slots/validate-move          dry-run move validation against MoveValidator chain
POST   /versions/:versionId/slots/suggestions            smart suggestions for slot assignment
POST   /versions/:versionId/undo
POST   /versions/:versionId/redo
GET    /versions/:versionId/periods
PUT    /versions/:versionId/periods

VERSIONS, COMPARISON & PUBLISHING (FEATURES §10, Phase 11)
GET    /projects/:projectId/versions                     list schedule versions for a project
GET    /projects/:projectId/versions/:versionId          get specific schedule version details
PATCH  /versions/:versionId/label                        update version label
POST   /versions/:versionId/duplicate                    duplicate version as a new draft
POST   /versions/:versionId/restore                      restore an older version as a new draft
POST   /versions/:versionId/archive                      archive a version
GET    /versions/:leftVersionId/diff/:rightVersionId     compare two versions with slot, workload, conflict, and score diffs
POST   /versions/:versionId/publish-request              submit a publish request (DESIGNER)
GET    /projects/:projectId/publish-requests             list publish requests for a project
GET    /admin/approvals                                  list pending publish requests across projects (ADMIN)
POST   /publish-requests/:requestId/approve              admin approves publish request and executes atomic publication
POST   /publish-requests/:requestId/reject               admin rejects publish request with mandatory comment
POST   /versions/:versionId/publish                      admin direct publish in atomic transaction
POST   /versions/:versionId/rate                         submit timetable quality rating and feedback
GET    /versions/:versionId/ratings                      list quality ratings for a timetable version

SOCKET NAMESPACES & EVENTS
/blueprint:
  client -> server: project:join, project:leave, cursor:update, node:lock, node:unlock
  server -> client: node:status-changed, ops:applied, presence:changed,
                    node:locked, node:unlocked, revision:conflict

/builds:
  client -> server: join:project, leave:project
  server -> client: build:progress, build:completed, build:failed

/schedule:
  client -> server: schedule:join, schedule:leave
  server -> client: slot:moved, slot:updated, slot:locked, slot:cleared, revision:conflict, presence:changed

BULLMQ QUEUES & PROCESSORS
builds:
  concurrency: 2 (one active build per project enforced via Redis lock slotly:build:lock:{projectId})
  processors: BuildsProcessor -> BuildFacade -> TimetableSolver / AlternativesGenerator
write-behind:
  concurrency: 5
  coalesced write-behind persistence with jobId = {entity}:{id}
  flush barrier before builds
email:
  concurrency: 3
  direct delivery or transactional queued email dispatch via Brevo / SMTP
audit:
  concurrency: 5
  persists audit trail entries from memory / Redis to Mongo audit_logs collection
