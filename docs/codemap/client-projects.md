# Client Projects Feature Code Map

### `client/src/features/projects/components/project-status-badge.tsx`
*React component for project-status-badge.*

- **Interface** `ProjectStatusBadgeProps` - Interface defining structure for project status badge props.
- **Component** `ProjectStatusBadge({ status }: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-status-badge").ProjectStatusBadgeProps)` - React component rendering project status badge.

### `client/src/features/projects/services/blueprint.api.ts`
*Re-export of blueprintApi for backward compatibility. Canonical location: features/blueprint/services/blueprint.api.ts*

*(No public exports)*

### `client/src/features/projects/services/projects.api.ts`
*Domain service orchestrating projects.api business logic.*

- **Const** `projectsApi`: `{ listProjects(params?: { status?: string | und...` - Constant representing projects api.

