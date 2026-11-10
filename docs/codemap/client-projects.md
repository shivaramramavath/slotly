# Client Projects Feature Code Map

### `client/src/features/projects/components/pin-button.tsx`
*React component rendering project pin toggle button with accessible aria states.*

- **Interface** `PinButtonProps` - Props for PinButton component.
- **Component** `PinButton({
  pinned = false,
  projectName,
  onToggle,
  disabled = false,
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/pin-button").PinButtonProps)` - React component rendering 32px pin toggle button matching sys0 monochrome guidelines.

### `client/src/features/projects/components/project-card.tsx`
*Project card component implementing sys0 visual language, stretched link overlay, and status indicators.*

- **Interface** `ProjectCardProps` - Props for ProjectCard component.
- **Function** `formatOpenedMeta(revision: number, lastOpenedAt: string | null | undefined)`: `string` - Formats opened date to compact visual format: "opened 9 Nov".
- **Function** `formatOpenedDate(lastOpenedAt: string | null | undefined)`: `string` - Formats only the date portion for responsive truncation.
- **Function** `getProjectDescription(project: { status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived"; id: string; name: string; institutionId: string; ownerId: string; term: { startDate: string; endDate: string; kind: "custom" | "odd" | "even"; academicYearLabel?: string | undefined; }; settings: { startTime: string; periodDuration: number; periodsPerDay: number; breaks: { name: string; afterPeriod: number; durationMinutes: number; }[]; days: number[]; perDayOverrides: Record<string, { startTime?: string | undefined; periods?: number | undefined; }>; }; strictness: "strict" | "flexible" | "relaxed"; revision: number; createdAt?: string | undefined; updatedAt?: string | undefined; lastOpenedAt?: string | undefined; blueprintProgress?: number | null | undefined; pinned?: boolean | undefined; pinnedAt?: string | null | undefined; })`: `string` - Helper generating fallback description text based on project configuration.
- **Function** `getStatusColorClass(status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived")`: `string` - Returns status label color token.
- **Component** `ProjectCard({
  project,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  isPending = false,
  density = 'normal',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-card").ProjectCardProps)` - React component rendering single academic project card with stretched link overlay and isolated action dropdown.
- **Component** `ProjectCardSkeleton({ density = 'normal' }: { density?: "normal" | "compact" | undefined; })` - Skeleton placeholder component matching ProjectCard structure and dimensions.

### `client/src/features/projects/components/project-collection.tsx`
*React component dispatching project collections across grid, list, and compact layouts.*

- **Interface** `ProjectCollectionProps` - Props for ProjectCollection component.
- **Type** `ProjectLayoutMode` - Supported layout view modes for project collections.
- **Component** `ProjectCollection({
  projects,
  layout,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  pendingProjectIds,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-collection").ProjectCollectionProps)` - React component rendering collection of academic projects in user-chosen layout.
- **Component** `ProjectCollectionSkeleton({
  layout = 'grid',
  count = 6,
}: { layout?: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-collection").ProjectLayoutMode | undefined; count?: number | undefined; })` - Skeleton placeholder for project collections matching active layout mode.

### `client/src/features/projects/components/project-row.tsx`
*React component rendering a single project as a compact horizontal list row.*

- **Interface** `ProjectRowProps` - Props for ProjectRow component.
- **Component** `ProjectRow({
  project,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  isPending = false,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-row").ProjectRowProps)` - React component rendering single academic project list row (72px height, 16px radius).
- **Component** `ProjectRowSkeleton()` - Skeleton placeholder component matching ProjectRow structure.

### `client/src/features/projects/components/project-section.tsx`
*React component rendering a single configurable project section slot with accessible header and collapse control.*

- **Interface** `ProjectSectionProps` - Props for ProjectSection component.
- **Component** `ProjectSection({
  config,
  projects,
  layout,
  isCollapsed = false,
  onToggleCollapse,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  pendingProjectIds,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-section").ProjectSectionProps)` - React component rendering single academic project section slot matching sys0 visual guidelines.

### `client/src/features/projects/components/project-sections.registry.ts`
*Registry defining standard project sections, filters, limits, and collapsible behavior.*

- **Interface** `ProjectSectionConfig` - Configuration interface for an academic project section slot.
- **Const** `FOURTEEN_DAYS_MS`: `number` - 14 days in milliseconds.
- **Const** `PROJECT_SECTIONS`: `import("E:/Shiva Ram/Projects/slotly/client/src...` - Default registry defining the canonical 4 project sections in order.

### `client/src/features/projects/components/project-selectors.ts`
*Pure selector functions filtering, sorting, and partitioning projects for sections and search queries.*

- **Function** `isFilteringActive(search: string, statusFilter: string)`: `boolean` - Determines if search or status filtering is currently active.
- **Function** `selectSectionProjects(projects: { status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived"; id: string; name: string; institutionId: string; ownerId: string; term: { startDate: string; endDate: string; kind: "custom" | "odd" | "even"; academicYearLabel?: string | undefined; }; settings: { startTime: string; periodDuration: number; periodsPerDay: number; breaks: { name: string; afterPeriod: number; durationMinutes: number; }[]; days: number[]; perDayOverrides: Record<string, { startTime?: string | undefined; periods?: number | undefined; }>; }; strictness: "strict" | "flexible" | "relaxed"; revision: number; createdAt?: string | undefined; updatedAt?: string | undefined; lastOpenedAt?: string | undefined; blueprintProgress?: number | null | undefined; pinned?: boolean | undefined; pinnedAt?: string | null | undefined; }[], config: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-sections.registry").ProjectSectionConfig)`: `{ status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived"; id: string; name: string; institutionId: string; ownerId: string; term: { startDate: string; endDate: string; kind: "custom" | "odd" | "even"; academicYearLabel?: string | undefined; }; settings: { startTime: string; periodDuration: number; periodsPerDay: number; breaks: { name: string; afterPeriod: number; durationMinutes: number; }[]; days: number[]; perDayOverrides: Record<string, { startTime?: string | undefined; periods?: number | undefined; }>; }; strictness: "strict" | "flexible" | "relaxed"; revision: number; createdAt?: string | undefined; updatedAt?: string | undefined; lastOpenedAt?: string | undefined; blueprintProgress?: number | null | undefined; pinned?: boolean | undefined; pinnedAt?: string | null | undefined; }[]` - Filters and limits projects for a specific section slot based on its configuration.
- **Function** `selectFlatResults(projects: { status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived"; id: string; name: string; institutionId: string; ownerId: string; term: { startDate: string; endDate: string; kind: "custom" | "odd" | "even"; academicYearLabel?: string | undefined; }; settings: { startTime: string; periodDuration: number; periodsPerDay: number; breaks: { name: string; afterPeriod: number; durationMinutes: number; }[]; days: number[]; perDayOverrides: Record<string, { startTime?: string | undefined; periods?: number | undefined; }>; }; strictness: "strict" | "flexible" | "relaxed"; revision: number; createdAt?: string | undefined; updatedAt?: string | undefined; lastOpenedAt?: string | undefined; blueprintProgress?: number | null | undefined; pinned?: boolean | undefined; pinnedAt?: string | null | undefined; }[], search: string, statusFilter: string)`: `{ status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived"; id: string; name: string; institutionId: string; ownerId: string; term: { startDate: string; endDate: string; kind: "custom" | "odd" | "even"; academicYearLabel?: string | undefined; }; settings: { startTime: string; periodDuration: number; periodsPerDay: number; breaks: { name: string; afterPeriod: number; durationMinutes: number; }[]; days: number[]; perDayOverrides: Record<string, { startTime?: string | undefined; periods?: number | undefined; }>; }; strictness: "strict" | "flexible" | "relaxed"; revision: number; createdAt?: string | undefined; updatedAt?: string | undefined; lastOpenedAt?: string | undefined; blueprintProgress?: number | null | undefined; pinned?: boolean | undefined; pinnedAt?: string | null | undefined; }[]` - Filters projects into a flat list when search or status filter is active.

### `client/src/features/projects/components/project-status-badge.tsx`
*React component for project-status-badge.*

- **Interface** `ProjectStatusBadgeProps` - Interface defining structure for project status badge props.
- **Component** `ProjectStatusBadge({ status }: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/project-status-badge").ProjectStatusBadgeProps)` - React component rendering project status badge.

### `client/src/features/projects/components/projects-sections.tsx`
*React component coordinating project section slots or flat search results dispatching.*

- **Interface** `ProjectsSectionsProps` - Props for ProjectsSections coordinator component.
- **Component** `ProjectsSections({
  projects,
  layout,
  search,
  statusFilter,
  visibleSections,
  collapsedSections,
  onToggleCollapse,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  pendingProjectIds,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/projects-sections").ProjectsSectionsProps)` - React component rendering organized project slots or single flat filtered result list.

### `client/src/features/projects/components/view-menu.tsx`
*React component rendering View settings popover menu with layout mode radios and section toggles.*

- **Interface** `ViewSettings` - Interface defining view settings persisted in localStorage and query params.
- **Interface** `ViewMenuProps` - Props for ViewMenu component.
- **Component** `ViewMenu({
  layout,
  onLayoutChange,
  visibleSections,
  onToggleSection,
  onResetView,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/projects/components/view-menu").ViewMenuProps)` - React component rendering 40px View menu popover button and configuration panel.

### `client/src/features/projects/services/blueprint.api.ts`
*Re-export of blueprintApi for backward compatibility. Canonical location: features/blueprint/services/blueprint.api.ts*

*(No public exports)*

### `client/src/features/projects/services/projects.api.ts`
*Domain service orchestrating projects.api business logic.*

- **Const** `projectsApi`: `{ listProjects(params?: { status?: string | und...` - Constant representing projects api.

