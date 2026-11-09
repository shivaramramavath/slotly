# Client Library Feature Code Map

### `client/src/features/library/components/availability-grid.tsx`
*React component for availability-grid.*

- **Component** `AvailabilityGrid({
  value,
  onChange,
  daysCount = 5,
  periodsCount = 7,
  readOnly = false,
}: AvailabilityGridProps)` - React component rendering availability grid.

### `client/src/features/library/components/elective-group-dialog.tsx`
*React component for elective-group-dialog.*

- **Component** `ElectiveGroupDialog({
  open,
  onOpenChange,
  group,
  subjects,
  onSuccess,
}: ElectiveGroupDialogProps)` - React component rendering elective group dialog.

### `client/src/features/library/components/faculty-dialog.tsx`
*React component for faculty-dialog.*

- **Component** `FacultyDialog({
  open,
  onOpenChange,
  faculty,
  departments,
  subjects,
  defaultDepartmentId,
  onSuccess,
}: FacultyDialogProps)` - React component rendering faculty dialog.

### `client/src/features/library/components/import-wizard-dialog.tsx`
*React component for import-wizard-dialog.*

- **Component** `ImportWizardDialog({
  open,
  onOpenChange,
  defaultEntity = 'faculty',
  onSuccess,
}: ImportWizardDialogProps)` - React component rendering import wizard dialog.

### `client/src/features/library/components/library-context.tsx`
*Unified context provider managing library filters, tab counts, mutation actions, and modal dialogs.*

- **Interface** `LibraryContextValue` - Context state interface for library feature.
- **Interface** `LibraryProviderProps` - Props for LibraryProvider component.
- **Component** `LibraryProvider({ children }: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-context").LibraryProviderProps)` - React component providing library context and hosting dialog instances.
- **Hook** `useLibrary()`: `import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-context").LibraryContextValue` - Hook to consume library context state and actions.

### `client/src/features/library/components/library-empty-state.tsx`
*Empty state component displaying clean empty messaging with primary create and import action shortcuts.*

- **Interface** `LibraryEmptyStateProps` - Props for LibraryEmptyState component.
- **Function** `getLibraryEmptyMessage(entity: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-tabs").LibraryTabKey)`: `string` - Formats user-facing empty state message corresponding to library resource entity.
- **Function** `getLibraryAddLabel(entity: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-tabs").LibraryTabKey)`: `string` - Returns primary button label for adding new entity.
- **Component** `LibraryEmptyState({
  entity,
  onAdd,
  onImport,
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-empty-state").LibraryEmptyStateProps)` - React component rendering standard 48px vertical padded empty state panel for library tables.

### `client/src/features/library/components/library-error-panel.tsx`
*Error panel component displaying isolated library route error state, retry trigger, and return navigation link.*

- **Interface** `LibraryErrorPanelProps` - Props for LibraryErrorPanel component.
- **Component** `LibraryErrorPanel({
  error,
  onRetry,
  entityName = 'resources',
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-error-panel").LibraryErrorPanelProps)` - React component rendering error state card with retry trigger and return link for library views.

### `client/src/features/library/components/library-export-dropdown.tsx`
*Export dropdown component supporting keyboard accessible Excel and CSV downloads for library resources.*

- **Interface** `LibraryExportDropdownProps` - Props for LibraryExportDropdown component.
- **Component** `LibraryExportDropdown({
  entity,
  disabled = false,
  institutionId,
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-export-dropdown").LibraryExportDropdownProps)` - React component rendering single export dropdown button with Excel and CSV options.

### `client/src/features/library/components/library-header-actions.tsx`
*Header actions component rendering the single export dropdown, import trigger, and active tab primary button.*

- **Interface** `LibraryHeaderActionsProps` - Props for LibraryHeaderActions component.
- **Component** `LibraryHeaderActions({ className = '' }: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-header-actions").LibraryHeaderActionsProps)` - React component rendering library header actions slot in PageHeader.

### `client/src/features/library/components/library-table-skeleton.tsx`
*Table skeleton component matching library table dimensions and column widths with zero layout shift.*

- **Interface** `LibraryColumnSpec` - Column specification for library table skeleton.
- **Interface** `LibraryTableSkeletonProps` - Props for LibraryTableSkeleton component.
- **Component** `LibraryTableSkeleton({
  columns,
  rows = 8,
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-table-skeleton").LibraryTableSkeletonProps)` - React component rendering zero-layout-shift table skeleton for library resource pages.
- **Const** `FACULTY_COLUMNS`: `import("E:/Shiva Ram/Projects/slotly/client/src...` - Standard column specs for Faculty directory table.
- **Const** `SUBJECT_COLUMNS`: `import("E:/Shiva Ram/Projects/slotly/client/src...` - Standard column specs for Subjects catalog table.
- **Const** `ROOM_COLUMNS`: `import("E:/Shiva Ram/Projects/slotly/client/src...` - Standard column specs for Rooms directory table.

### `client/src/features/library/components/library-tabs.tsx`
*Segmented link tabs component for library navigation with real URLs, query preservation, and count skeletons.*

- **Interface** `LibraryTabItem` - Interface defining tab item configuration.
- **Interface** `LibraryTabsProps` - Props for LibraryTabs component.
- **Type** `LibraryTabKey` - Tab keys representing the three library resources.
- **Function** `getActiveLibraryTab(pathname: string)`: `import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-tabs").LibraryTabKey` - Pure helper determining active library tab from pathname.
- **Function** `getLibraryTabHref(target: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-tabs").LibraryTabKey, currentFilters: { search?: string | null | undefined; department?: string | null | undefined; archived?: string | null | undefined; })`: `string` - Computes destination href preserving search, active, and applicable department query params.
- **Component** `LibraryTabs({ counts = {}, className = '' }: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-tabs").LibraryTabsProps)` - React component rendering segmented link navigation tabs for library sections.
- **Const** `LIBRARY_TABS`: `import("E:/Shiva Ram/Projects/slotly/client/src...` - Standard tabs list for the library section.

### `client/src/features/library/components/library-toolbar.tsx`
*Toolbar component rendering unified search, department selector, and active-only toggle controls.*

- **Interface** `LibraryToolbarProps` - Props for LibraryToolbar component.
- **Component** `LibraryToolbar({
  activeTab,
  search,
  onSearchChange,
  selectedDeptId,
  onDeptChange,
  showArchived,
  onArchivedToggle,
  departments = [],
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/library/components/library-toolbar").LibraryToolbarProps)` - React component rendering search and filter controls on plain background without nested boxes.

### `client/src/features/library/components/room-dialog.tsx`
*React component for room-dialog.*

- **Component** `RoomDialog({
  open,
  onOpenChange,
  room,
  onSuccess,
}: RoomDialogProps)` - React component rendering room dialog.

### `client/src/features/library/components/subject-dialog.tsx`
*React component for subject-dialog.*

- **Component** `SubjectDialog({
  open,
  onOpenChange,
  subject,
  departments,
  electiveGroups,
  defaultDepartmentId,
  onSuccess,
}: SubjectDialogProps)` - React component rendering subject dialog.

### `client/src/features/library/components/workload-bar.tsx`
*React component for workload-bar.*

- **Component** `WorkloadBar({
  assignedHours,
  maxHours,
  minHours = 0,
  showDetails = true,
}: WorkloadBarProps)` - React component rendering workload bar.

### `client/src/features/library/services/library.api.ts`
*Domain service orchestrating library.api business logic.*

- **Const** `libraryApi`: `{ listFaculty(params?: { departmentId?: string ...` - Constant representing library api.

