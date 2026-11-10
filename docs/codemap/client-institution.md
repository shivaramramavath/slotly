# Client Institution Feature Code Map

### `client/src/features/institution/components/academic-year-dialog.tsx`
*React component for academic-year-dialog.*

- **Component** `AcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  programs,
  defaultProgramId,
  institutionId,
  onSuccess,
}: AcademicYearDialogProps)` - React component rendering academic year dialog.

### `client/src/features/institution/components/department-dialog.tsx`
*React component for department-dialog.*

- **Component** `DepartmentDialog({
  open,
  onOpenChange,
  department,
  institutionId,
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
  institutionId,
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
  institutionId,
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
  institutionId,
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
  institutionId,
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

### `client/src/features/institution/hooks/use-institution.ts`
*Custom React hooks for institution data fetching and cache management via TanStack Query.*

- **Hook** `useInstitutionStructure(institutionId: string | undefined)`: `import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<import("E:/Shiva Ram/Projects/slotly/packages/contracts/dist/index").InstitutionStructureDto, Error>` - Hook fetching the complete institution hierarchy structure with caching and revalidation.
- **Hook** `useDepartments(institutionId: string | undefined)`: `import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<{ code: string; id: string; name: string; institutionId: string; createdAt?: string | undefined; updatedAt?: string | undefined; headFacultyId?: string | undefined; }[], Error>` - Hook fetching the department list for an institution.
- **Hook** `useInstitution(institutionId: string | undefined)`: `import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseQueryResult<{ code: string; id: string; name: string; address: string; workingDays: number[]; defaultPeriodConfig: { startTime: string; periodDuration: number; periodsPerDay: number; breaks: { name: string; afterPeriod: number; durationMinutes: number; }[]; }; isComplete: boolean; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error>` - Hook fetching the institution profile.
- **Hook** `useInstitutionMutations()`: `{ createDepartment: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ code: string; id: string; name: string; institutionId: string; createdAt?: string | undefined; updatedAt?: string | undefined; headFacultyId?: string | undefined; }, Error, { code: string; name: string; institutionId?: string | undefined; headFacultyId?: string | undefined; }, unknown>; updateDepartment: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ code: string; id: string; name: string; institutionId: string; createdAt?: string | undefined; updatedAt?: string | undefined; headFacultyId?: string | undefined; }, Error, { id: string; dto: { code?: string | undefined; name?: string | undefined; headFacultyId?: string | undefined; }; }, unknown>; deleteDepartment: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ message: string; }, Error, string, unknown>; createProgram: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ code: string; id: string; name: string; institutionId: string; departmentId: string; durationYears: number; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { code: string; name: string; departmentId: string; durationYears: number; institutionId?: string | undefined; }, unknown>; updateProgram: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ code: string; id: string; name: string; institutionId: string; departmentId: string; durationYears: number; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { id: string; dto: { code?: string | undefined; name?: string | undefined; durationYears?: number | undefined; }; }, unknown>; deleteProgram: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ message: string; }, Error, string, unknown>; createAcademicYear: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ id: string; institutionId: string; programId: string; yearNumber: number; label: string; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { programId: string; yearNumber: number; label: string; institutionId?: string | undefined; }, unknown>; updateAcademicYear: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ id: string; institutionId: string; programId: string; yearNumber: number; label: string; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { id: string; dto: { yearNumber?: number | undefined; label?: string | undefined; }; }, unknown>; deleteAcademicYear: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ message: string; }, Error, string, unknown>; createSemester: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ number: number; id: string; name: string; institutionId: string; active: boolean; programId: string; academicYearId: string; startDate: string; endDate: string; academicYearLabel: string; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { number: number; name: string; active: boolean; academicYearId: string; startDate: string; endDate: string; institutionId?: string | undefined; programId?: string | undefined; academicYearLabel?: string | undefined; }, unknown>; updateSemester: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ number: number; id: string; name: string; institutionId: string; active: boolean; programId: string; academicYearId: string; startDate: string; endDate: string; academicYearLabel: string; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { id: string; dto: { number?: number | undefined; name?: string | undefined; institutionId?: string | undefined; active?: boolean | undefined; programId?: string | undefined; academicYearId?: string | undefined; startDate?: string | undefined; endDate?: string | undefined; academicYearLabel?: string | undefined; }; }, unknown>; deleteSemester: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ message: string; }, Error, string, unknown>; createSection: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ id: string; name: string; institutionId: string; academicYearId: string; semesterId: string; strength: number; batches: { name: string; size: number; id?: string | undefined; }[]; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { name: string; semesterId: string; strength: number; batches: { name: string; size: number; id?: string | undefined; }[]; institutionId?: string | undefined; academicYearId?: string | undefined; }, unknown>; updateSection: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ id: string; name: string; institutionId: string; academicYearId: string; semesterId: string; strength: number; batches: { name: string; size: number; id?: string | undefined; }[]; createdAt?: string | undefined; updatedAt?: string | undefined; }, Error, { id: string; dto: { name?: string | undefined; institutionId?: string | undefined; academicYearId?: string | undefined; semesterId?: string | undefined; strength?: number | undefined; batches?: { name: string; size: number; id?: string | undefined; }[] | undefined; }; }, unknown>; deleteSection: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/@tanstack+react-query@5.106_8012af4561150071001f81b2e0683ad3/node_modules/@tanstack/react-query/build/modern/types").UseMutationResult<{ message: string; }, Error, string, unknown>; invalidateStructure: () => Promise<void>; }` - Hook providing mutations for modifying institution structure with cache invalidation.
- **Const** `institutionKeys`: `{ all: readonly ["institution"]; structure: (id...` - Query key factory for institution domain cache.

### `client/src/features/institution/index.ts`
*Core implementation for index in client/src/features/institution.*

*(No public exports)*

### `client/src/features/institution/services/institution.api.ts`
*Domain service orchestrating institution.api business logic.*

- **Const** `institutionApi`: `{ getStructure(institutionId?: string | undefin...` - Constant representing institution api.

### `client/src/features/institution/store/institution.store.ts`
*Zustand store managing application state for institution.store.*

- **Zustand Store** `useInstitutionStore` (actions: setActiveTab, setSelectedDepartmentId, setSelectedProgramId, setSelectedAcademicYearId, setSelectedSemesterId, resetSelection) - Zustand store managing institution UI selection and tab state.

