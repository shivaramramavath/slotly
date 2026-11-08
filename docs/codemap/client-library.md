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

### `client/src/features/library/components/room-dialog.tsx`
*React component for room-dialog.*

- **Component** `RoomDialog({ open, onOpenChange, room, onSuccess }: RoomDialogProps)` - React component rendering room dialog.

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

