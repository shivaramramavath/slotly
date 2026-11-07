# Client Projects Feature Code Map

### `client/src/features/projects/components/project-status-badge.tsx`
*React component for project-status-badge.*

- **Interface** `ProjectStatusBadgeProps` - Interface defining structure for project status badge props.
- **Component** `ProjectStatusBadge({ status }: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-status-badge").ProjectStatusBadgeProps)` - React component rendering project status badge.

### `client/src/features/projects/services/blueprint.api.ts`
*Domain service orchestrating blueprint.api business logic.*

- **Const** `blueprintApi`: `{ getGraph(projectId: string): Promise<{ revisi...` - Constant representing blueprint api.

### `client/src/features/projects/services/projects.api.ts`
*Domain service orchestrating projects.api business logic.*

- **Const** `projectsApi`: `{ listProjects(params?: { status?: string | und...` - Constant representing projects api.

