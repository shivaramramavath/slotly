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

BLUEPRINT ADDITIONS
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

EDITOR ADDITIONS (use If-Match: <revision> on all writes; 409 on mismatch)
POST   /versions/:versionId/slots/bulk
POST   /versions/:versionId/slots/:slotId/merge
POST   /versions/:versionId/slots/:slotId/split
DELETE /versions/:versionId/slots/:slotId                clear cell
POST   /versions/:versionId/undo
POST   /versions/:versionId/redo
GET    /versions/:versionId/periods
PUT    /versions/:versionId/periods

SOCKET ADDITIONS (/blueprint)
server -> client: node:status-changed, ops:applied, presence:changed,
                  node:locked, node:unlocked, revision:conflict