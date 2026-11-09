# Client Projects Feature Code Map

### `client/src/features/projects/components/project-card.tsx`
*Project card component implementing sys0 visual language, stretched link overlay, and status indicators.*

- **Interface** `ProjectCardProps` - Props for ProjectCard component.
- **Function** `formatOpenedMeta(revision: number, lastOpenedAt: string | null | undefined)`: `string` - Formats opened date to compact visual format: "opened 9 Nov".
- **Function** `getProjectDescription(project: { status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived"; id: string; name: string; institutionId: string; ownerId: string; term: { startDate: string; endDate: string; kind: "custom" | "odd" | "even"; academicYearLabel?: string | undefined; }; settings: { startTime: string; periodDuration: number; periodsPerDay: number; breaks: { name: string; afterPeriod: number; durationMinutes: number; }[]; days: number[]; perDayOverrides: Record<string, { startTime?: string | undefined; periods?: number | undefined; }>; }; strictness: "strict" | "flexible" | "relaxed"; revision: number; createdAt?: string | undefined; updatedAt?: string | undefined; lastOpenedAt?: string | undefined; blueprintProgress?: number | null | undefined; })`: `string` - Helper generating fallback description text based on project configuration.
- **Function** `getStatusColorClass(status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived")`: `string` - Returns status label color token.
- **Component** `ProjectCard({
  project,
  onDuplicate,
  onArchive,
  isPending = false,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-card").ProjectCardProps)` - React component rendering single academic project card with stretched link overlay and isolated action dropdown.
- **Component** `ProjectCardSkeleton()` - Skeleton placeholder component matching ProjectCard structure and dimensions.

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

