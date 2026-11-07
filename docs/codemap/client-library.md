# Client Library Feature Code Map

### `client/src/features/library/components/availability-grid.tsx`
*(no description)*

- **Component** `AvailabilityGrid({
  value,
  onChange,
  daysCount = 7,
  periodsCount = 8,
  readOnly = false,
}: AvailabilityGridProps)`

### `client/src/features/library/components/elective-group-dialog.tsx`
*(no description)*

- **Component** `ElectiveGroupDialog({
  open,
  onOpenChange,
  group,
  subjects,
  onSuccess,
}: ElectiveGroupDialogProps)`

### `client/src/features/library/components/faculty-dialog.tsx`
*(no description)*

- **Component** `FacultyDialog({
  open,
  onOpenChange,
  faculty,
  departments,
  subjects,
  defaultDepartmentId,
  onSuccess,
}: FacultyDialogProps)`

### `client/src/features/library/components/import-wizard-dialog.tsx`
*(no description)*

- **Component** `ImportWizardDialog({
  open,
  onOpenChange,
  defaultEntity = 'faculty',
  onSuccess,
}: ImportWizardDialogProps)`

### `client/src/features/library/components/room-dialog.tsx`
*(no description)*

- **Component** `RoomDialog({
  open,
  onOpenChange,
  room,
  onSuccess,
}: RoomDialogProps)`

### `client/src/features/library/components/subject-dialog.tsx`
*(no description)*

- **Component** `SubjectDialog({
  open,
  onOpenChange,
  subject,
  departments,
  electiveGroups,
  defaultDepartmentId,
  onSuccess,
}: SubjectDialogProps)`

### `client/src/features/library/components/workload-bar.tsx`
*(no description)*

- **Component** `WorkloadBar({
  assignedHours,
  maxHours,
  minHours = 0,
  showDetails = true,
}: WorkloadBarProps)`

### `client/src/features/library/services/library.api.ts`
*(no description)*

- **Const** `libraryApi`: `{ listFaculty(params?: { departmentId?: string ...`

