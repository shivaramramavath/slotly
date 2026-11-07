# Client Institution Feature Code Map

### `client/src/features/institution/components/academic-year-dialog.tsx`
*(no description)*

- **Component** `AcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  programs,
  defaultProgramId,
  onSuccess,
}: AcademicYearDialogProps)`

### `client/src/features/institution/components/department-dialog.tsx`
*(no description)*

- **Component** `DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentDialogProps)`

### `client/src/features/institution/components/holiday-calendar.tsx`
*(no description)*

- **Component** `HolidayCalendar({
  holidays,
  onAddHoliday,
  onDeleteHoliday,
}: HolidayCalendarProps)`

### `client/src/features/institution/components/holiday-dialog.tsx`
*(no description)*

- **Component** `HolidayDialog({
  open,
  onOpenChange,
  onSuccess,
}: HolidayDialogProps)`

### `client/src/features/institution/components/program-dialog.tsx`
*(no description)*

- **Component** `ProgramDialog({
  open,
  onOpenChange,
  program,
  departments,
  defaultDepartmentId,
  onSuccess,
}: ProgramDialogProps)`

### `client/src/features/institution/components/section-dialog.tsx`
*(no description)*

- **Component** `SectionDialog({
  open,
  onOpenChange,
  section,
  semesters,
  defaultSemesterId,
  onSuccess,
}: SectionDialogProps)`

### `client/src/features/institution/components/semester-dialog.tsx`
*(no description)*

- **Component** `SemesterDialog({
  open,
  onOpenChange,
  semester,
  academicYears,
  defaultAcademicYearId,
  onSuccess,
}: SemesterDialogProps)`

### `client/src/features/institution/components/structure-tree.tsx`
*(no description)*

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
}: StructureTreeProps)`

### `client/src/features/institution/components/working-days-config.tsx`
*(no description)*

- **Component** `WorkingDaysConfig({ institution, onSuccess }: WorkingDaysConfigProps)`

### `client/src/features/institution/index.ts`
*(no description)*

*(No public exports)*

### `client/src/features/institution/services/institution.api.ts`
*(no description)*

- **Const** `institutionApi`: `{ getStructure(institutionId?: string | undefin...`

### `client/src/features/institution/store/institution.store.ts`
*(no description)*

- **Zustand Store** `useInstitutionStore` (actions: setStructure, setLoading, setActiveTab, setSelectedDepartmentId, setSelectedProgramId, setSelectedAcademicYearId, setSelectedSemesterId)

