AUTH & OAUTH (replaces the earlier auth and session routes)
POST /auth/register, /auth/login, /auth/logout, /auth/logout-all, /auth/refresh, /auth/revoke
POST /auth/email/verify, /auth/email/resend
POST /auth/password/forgot, /auth/password/reset
PATCH /auth/password
GET /auth/sessions GET /auth/sessions/:sessionId
DELETE /auth/sessions/:sessionId DELETE /auth/sessions (all others)
POST /auth/mfa/enroll, /auth/mfa/verify, /auth/mfa/enable, /auth/mfa/disable, /auth/mfa/recovery
DELETE /auth/mfa
POST /auth/step-up (re-authenticate for sensitive actions: password, totp, or email_otp)
POST /auth/step-up/email/send (dispatch email OTP for step-up on passwordless/MFA-less accounts)
GET /auth/oauth/providers (public list of enabled OAuth providers, cached)
GET /auth/oauth/:provider/start?mode=login|link&next= (start OAuth authorization flow, link mode requires recent step-up)
GET /auth/oauth/:provider/callback (OAuth authorization code callback and redirection)
POST /auth/onboarding (complete institution setup for pending_onboarding users)
GET /users/me/security, /users/me/security/activity, /users/me/security/devices
DELETE /users/me/security/devices/:deviceId
GET /users/me/security/connections (list connected OAuth provider identities)
DELETE /users/me/security/connections/:provider (disconnect OAuth provider with step-up verification)

INSTITUTION & STRUCTURE
GET /institution/structure
GET /institution/departments
POST /institution/departments
PUT /institution/departments/:id
DELETE /institution/departments/:id
POST /institution/programs
PUT /institution/programs/:id
DELETE /institution/programs/:id
POST /institution/academic-years
PUT /institution/academic-years/:id
DELETE /institution/academic-years/:id
POST /institution/semesters
PUT /institution/semesters/:id
DELETE /institution/semesters/:id
POST /institution/sections
PUT /institution/sections/:id
DELETE /institution/sections/:id
GET /institution/holidays
POST /institution/holidays
DELETE /institution/holidays/:id

LIBRARY RESOURCES
GET /library/faculty
POST /library/faculty
GET /library/faculty/:id
PUT /library/faculty/:id
DELETE /library/faculty/:id
POST /library/faculty/:id/archive
POST /library/faculty/:id/restore
GET /library/faculty/:id/workload
GET /library/subjects
POST /library/subjects
GET /library/subjects/:id
PUT /library/subjects/:id
DELETE /library/subjects/:id
POST /library/subjects/:id/archive
POST /library/subjects/:id/restore
GET /library/rooms
POST /library/rooms
GET /library/rooms/:id
PUT /library/rooms/:id
DELETE /library/rooms/:id
POST /library/rooms/:id/archive
POST /library/rooms/:id/restore
GET /library/elective-groups
POST /library/elective-groups
PUT /library/elective-groups/:id
DELETE /library/elective-groups/:id
POST /library/import
GET /library/export
POST /library/match/room
POST /library/match/faculty

PROJECTS
POST /projects
GET /projects
GET /projects/:projectId
PATCH /projects/:projectId
DELETE /projects/:projectId
POST /projects/:projectId/duplicate

BLUEPRINT
GET /projects/:projectId/blueprint
GET /projects/:projectId/blueprint/readiness
GET /projects/:projectId/blueprint/nodes/:nodeId/impact
POST /projects/:projectId/blueprint/operations batch ops, topological, per-op results
GET /projects/:projectId/blueprint/history
GET /projects/:projectId/blueprint/recommendations?nodeId=
GET /projects/:projectId/blueprint/export?format=json|svg|png
POST /projects/:projectId/blueprint/import
GET /projects/:projectId/blueprint/nodes/:nodeId/comments
POST /projects/:projectId/blueprint/nodes/:nodeId/comments
GET /blueprint-templates
POST /blueprint-templates save subtree as template
GET /blueprint-templates/:templateId
POST /blueprint-templates/:templateId/apply body: { anchorNodeId }
POST /blueprint-templates/:templateId/duplicate
GET /blueprint-templates/:templateId/export
POST /blueprint-templates/import

BUILDS & GENERATION
POST /projects/:projectId/builds enqueue build generation (modes: fresh, regenerate, repair)
GET /projects/:projectId/builds list generated schedule versions
GET /projects/:projectId/builds/:versionId get specific schedule version with slots, score, conflicts
POST /projects/:projectId/builds/cancel cancel in-flight build job

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

VIEWERS, EXPORTS, SHARING & NOTIFICATIONS (FEATURES §11, Phase 12)
GET    /viewer/projects/:projectId/timetable             published timetable view for faculty, section, room, subject with current period
GET    /viewer/me                                        landing timetable view for current logged-in faculty/student
POST   /exports/projects/:projectId                      enqueue timetable export job (PDF, Excel, PNG, ICS)
GET    /exports/:jobId                                   poll export job progress and status
GET    /exports/download/:token                          download exported file via signed token
POST   /calendar-feeds/projects/:projectId               create revocable calendar feed token
GET    /calendar-feeds/projects/:projectId               list active calendar feeds
DELETE /calendar-feeds/:feedId                           revoke calendar feed token
GET    /public/calendar/:feedToken.ics                   unauthenticated RFC 5545 calendar subscription feed
POST   /shares/projects/:projectId                       create revocable public share link
GET    /shares/projects/:projectId                       list share links for a project
DELETE /shares/:shareId                                  revoke public share link
GET    /public/shares/:token                             unauthenticated rate-limited view of published timetable
GET    /notifications                                    list user notifications (paginated, unread & type filters)
PATCH  /notifications/:notificationId/read               mark single notification as read
POST   /notifications/read-all                           mark all notifications as read
GET    /notifications/preferences                        get notification channel preferences
PUT    /notifications/preferences                        update notification channel preferences
POST   /announcements                                    admin broadcast announcement to target audience

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

/notifications:
  client -> server: subscribe, mark_read
  server -> client: notification:received, announcement:received

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
notifications:
concurrency: 5
processors: NotificationsFanOutProcessor, EmailProcessor with retry and dead letter
exports:
concurrency: 2
processors: ExportProcessor -> ExportFacade -> StorageProvider (local disk)

REDIS CACHE KEYS & TAGS (Phase 12)
slotly:viewer:{projectId}:{type}:{targetId}[:day] - cached published timetable view (TTL 24h, tag project:{projectId}:viewer)
slotly:public:share:{tokenHash}                   - cached public share metadata & timetable (TTL 1h)
slotly:export:signed:{token}                      - expiring signed export download ticket (TTL 24h)
slotly:feed:token:{tokenHash}                     - cached calendar feed token mapping (TTL 24h)
