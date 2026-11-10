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
*Component rendering calendar events and holidays list matching sys0 styling.*

- **Interface** `HolidayCalendarProps` - Props for HolidayCalendar component.
- **Component** `HolidayCalendar({
  holidays,
  onAddHoliday,
  onDeleteHoliday,
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/holiday-calendar").HolidayCalendarProps)` - React component rendering calendar events and holidays grid.

### `client/src/features/institution/components/holiday-dialog.tsx`
*React component for holiday-dialog.*

- **Component** `HolidayDialog({
  open,
  onOpenChange,
  institutionId,
  onSuccess,
}: HolidayDialogProps)` - React component rendering holiday dialog.

### `client/src/features/institution/components/institution-context.tsx`
*React context provider managing institution hierarchy data, dialog states, and delete operations.*

- **Interface** `InstitutionContextValue` - Interface defining institution context state and actions.
- **Interface** `InstitutionProviderProps` - Props for InstitutionProvider component.
- **Component** `InstitutionProvider({ children }: import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/institution-context").InstitutionProviderProps)` - React provider wrapping institution sub-routes to retain hierarchy state and dialog control.
- **Hook** `useInstitutionContext()`: `import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/institution-context").InstitutionContextValue` - Hook to access institution hierarchy context data and modal dialog actions.

### `client/src/features/institution/components/institution-empty-state.tsx`
*Reusable empty state card for institution views matching sys0 visual guidelines.*

- **Interface** `InstitutionEmptyStateProps` - Props for InstitutionEmptyState component.
- **Component** `InstitutionEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/institution-empty-state").InstitutionEmptyStateProps)` - React component rendering monochrome centered empty state card with neutral outline button.

### `client/src/features/institution/components/institution-header-actions.tsx`
*Component rendering route-aware header actions enforcing the single yellow accent rule.*

- **Component** `InstitutionHeaderActions()` - React component rendering header action controls dynamically based on active institution tab.

### `client/src/features/institution/components/institution-stats-row.tsx`
*Component rendering the 6-stat card summary row for academic institutions matching sys0 guidelines.*

- **Interface** `InstitutionStatsRowProps` - Props for InstitutionStatsRow component.
- **Component** `InstitutionStatsRow({ className = '' }: import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/institution-stats-row").InstitutionStatsRowProps)` - React component rendering 6-item monochrome statistics cards row.

### `client/src/features/institution/components/institution-tabs.tsx`
*Segmented link tabs component for institution navigation with real URLs and keyboard support.*

- **Interface** `InstitutionTabItem` - Interface defining an institution tab item.
- **Interface** `InstitutionTabsProps` - Props for InstitutionTabs component.
- **Function** `getActiveInstitutionTab(pathname: string)`: `string` - Pure helper to determine which institution tab is currently active.
- **Component** `InstitutionTabs({ className = '' }: import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/institution-tabs").InstitutionTabsProps)` - React component rendering 40px high accessible segmented navigation tabs for institution section.
- **Const** `INSTITUTION_TABS`: `import("E:/Shiva Ram/Projects/slotly/client/src...` - The 8 canonical tabs for the institution section.

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
*Hierarchical tree view for academic institution structure with clean vertical padding, indent connectors, and monochrome styling.*

- **Interface** `StructureTreeProps` - Props for StructureTree component.
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
}: import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/structure-tree").StructureTreeProps)` - React component rendering polished academic hierarchy tree with collapse toggles and connectors.

### `client/src/features/institution/components/working-days-config.tsx`
*Working days and timing matrix configuration form with monochrome pill selection and sys0 styling.*

- **Interface** `WorkingDaysConfigProps` - Props for WorkingDaysConfig component.
- **Component** `WorkingDaysConfig({ institution, onSuccess }: import("E:/Shiva Ram/Projects/slotly/client/src/features/institution/components/working-days-config").WorkingDaysConfigProps)` - React component rendering working days and period timing configuration form.

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

