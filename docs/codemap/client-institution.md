# Client Institution Feature Code Map

### `client/src/features/institution/components/academic-year-dialog.tsx`
*React component for academic-year-dialog.*

- **Component** `AcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  programs,
  defaultProgramId,
  onSuccess,
}: AcademicYearDialogProps)` - React component rendering academic year dialog.

### `client/src/features/institution/components/department-dialog.tsx`
*React component for department-dialog.*

- **Component** `DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentDialogProps)` - React component rendering department dialog.

### `client/src/features/institution/components/holiday-calendar.tsx`
*React component for holiday-calendar.*

- **Component** `HolidayCalendar({
  holidays,
  onAddHoliday,
  onDeleteHoliday,
}: HolidayCalendarProps)` - React component rendering holiday calendar.

### `client/src/features/institution/components/holiday-dialog.tsx`
*React component for holiday-dialog.*

- **Component** `HolidayDialog({
  open,
  onOpenChange,
  onSuccess,
}: HolidayDialogProps)` - React component rendering holiday dialog.

### `client/src/features/institution/components/program-dialog.tsx`
*React component for program-dialog.*

- **Component** `ProgramDialog({
  open,
  onOpenChange,
  program,
  departments,
  defaultDepartmentId,
  onSuccess,
}: ProgramDialogProps)` - React component rendering program dialog.

### `client/src/features/institution/components/section-dialog.tsx`
*React component for section-dialog.*

- **Component** `SectionDialog({
  open,
  onOpenChange,
  section,
  semesters,
  defaultSemesterId,
  onSuccess,
}: SectionDialogProps)` - React component rendering section dialog.

### `client/src/features/institution/components/semester-dialog.tsx`
*React component for semester-dialog.*

- **Component** `SemesterDialog({
  open,
  onOpenChange,
  semester,
  academicYears,
  defaultAcademicYearId,
  onSuccess,
}: SemesterDialogProps)` - React component rendering semester dialog.

### `client/src/features/institution/components/structure-tree.tsx`
*React component for structure-tree.*

- **Component** `StructureTree({
  departments,
  onAddDepartment,
  onAddProgram,
  onAddYear,
  onAddSemester,
  onAddSection,
  onDeleteDepartment,
  onDeleteProgram,
  onDeleteYear,
  onDeleteSemester,
  onDeleteSection,
}: StructureTreeProps)` - React component rendering structure tree.

### `client/src/features/institution/components/working-days-config.tsx`
*React component for working-days-config.*

- **Component** `WorkingDaysConfig({ institution, onSuccess }: WorkingDaysConfigProps)` - React component rendering working days config.

### `client/src/features/institution/index.ts`
*Core implementation for index in client/src/features/institution.*

*(No public exports)*

### `client/src/features/institution/services/institution.api.ts`
*Domain service orchestrating institution.api business logic.*

- **Const** `institutionApi`: `{ getStructure(institutionId?: string | undefin...` - Constant representing institution api.

### `client/src/features/institution/store/institution.store.ts`
*Zustand store managing application state for institution.store.*

- **Zustand Store** `useInstitutionStore` (actions: setStructure, setLoading, setActiveTab, setSelectedDepartmentId, setSelectedProgramId, setSelectedAcademicYearId, setSelectedSemesterId) - Zustand store managing use institution store state.

