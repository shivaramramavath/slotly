# Client App Routes Code Map

### `client/src/app/(auth)/auth/callback/page.tsx`
*React component for OAuth callback landing page handling token exchange verification and routing.*

- **Route Page:** `/auth/callback` -> renders `default`
- **Component** `OAuthCallbackPage()` - React component rendering OAuth callback page.

### `client/src/app/(auth)/forgot-password/page.tsx`
*React component for page.*

- **Route Page:** `/forgot-password` -> renders `default`
- **Component** `ForgotPasswordPage()` - React component rendering forgot password page.

### `client/src/app/(auth)/login/page.tsx`
*React component for login page supporting credentials and OAuth sign-in.*

- **Route Page:** `/login` -> renders `default`
- **Component** `LoginPage()` - React component rendering login page.

### `client/src/app/(auth)/mfa/page.tsx`
*React component for page.*

- **Route Page:** `/mfa` -> renders `default`
- **Component** `MfaChallengePage()` - React component rendering mfa challenge page.

### `client/src/app/(auth)/onboarding/page.tsx`
*React component for single-step onboarding page for users registered via social OAuth.*

- **Route Page:** `/onboarding` -> renders `default`
- **Component** `OnboardingPage()` - React component rendering single-step social onboarding page.

### `client/src/app/(auth)/register/page.tsx`
*React component for register page supporting credentials and OAuth sign-up.*

- **Route Page:** `/register` -> renders `default`
- **Component** `RegisterPage()` - React component rendering register page.

### `client/src/app/(auth)/reset-password/page.tsx`
*React component for page.*

- **Route Page:** `/reset-password` -> renders `default`
- **Component** `ResetPasswordPage()` - React component rendering reset password page.

### `client/src/app/(auth)/sessions/page.tsx`
*React component for page.*

- **Route Page:** `/sessions` -> renders `default`
- **Component** `SessionsPage()` - React component rendering sessions page.

### `client/src/app/(auth)/verify-email/page.tsx`
*React component for page.*

- **Route Page:** `/verify-email` -> renders `default`
- **Component** `VerifyEmailPage()` - React component rendering verify email page.

### `client/src/app/blueprint-templates/error.tsx`
*Route error boundary component for blueprint templates and kits.*

- **Error Boundary:** `/blueprint-templates` -> renders `default`
- **Component** `BlueprintTemplatesError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - Error boundary component for blueprint templates route.

### `client/src/app/blueprint-templates/loading.tsx`
*Route loading skeleton for blueprint templates and kits.*

- **Loading Boundary:** `/blueprint-templates` -> renders `default`
- **Component** `BlueprintTemplatesLoading()` - Loading skeleton for blueprint templates page matching sys0 grid and token spacing.

### `client/src/app/blueprint-templates/page.tsx`
*React component rendering blueprint templates and kits catalog page.*

- **Route Page:** `/blueprint-templates` -> renders `default`
- **Component** `BlueprintTemplatesPage()` - React component rendering blueprint templates page with Suspense wrapper.

### `client/src/app/dashboard/page.tsx`
*React component for page.*

- **Route Page:** `/dashboard` -> renders `default`
- **Component** `DashboardPage()` - React component rendering dashboard page.

### `client/src/app/home/page.tsx`
*React component for page.*

- **Route Page:** `/home` -> renders `default`
- **Component** `HomeShellPage()` - React component rendering home shell page.

### `client/src/app/institutions/academic-years/error.tsx`
*Error boundary component for Academic Years route.*

- **Error Boundary:** `/institutions/academic-years` -> renders `default`
- **Component** `AcademicYearsError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for academic years view.

### `client/src/app/institutions/academic-years/loading.tsx`
*Loading skeleton placeholder for Academic Years route.*

- **Loading Boundary:** `/institutions/academic-years` -> renders `default`
- **Component** `AcademicYearsLoading()` - React component rendering loading skeleton for academic years grid.

### `client/src/app/institutions/academic-years/page.tsx`
*Academic years view displaying cohort levels and semester term management.*

- **Route Page:** `/institutions/academic-years` -> renders `default`
- **Component** `AcademicYearsPage()` - React page component rendering academic years list and management cards.

### `client/src/app/institutions/calendar/error.tsx`
*Error boundary component for Calendar route.*

- **Error Boundary:** `/institutions/calendar` -> renders `default`
- **Component** `CalendarError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for calendar view.

### `client/src/app/institutions/calendar/loading.tsx`
*Loading skeleton placeholder for Calendar route.*

- **Loading Boundary:** `/institutions/calendar` -> renders `default`
- **Component** `CalendarLoading()` - React component rendering loading skeleton for calendar events grid.

### `client/src/app/institutions/calendar/page.tsx`
*Calendar events and holidays management route for the institution.*

- **Route Page:** `/institutions/calendar` -> renders `default`
- **Component** `CalendarPage()` - React page component rendering holidays and institutional calendar events.

### `client/src/app/institutions/departments/error.tsx`
*Error boundary component for Departments route.*

- **Error Boundary:** `/institutions/departments` -> renders `default`
- **Component** `DepartmentsError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for departments view.

### `client/src/app/institutions/departments/loading.tsx`
*Loading skeleton placeholder for Departments route.*

- **Loading Boundary:** `/institutions/departments` -> renders `default`
- **Component** `DepartmentsLoading()` - React component rendering loading skeleton for departments grid.

### `client/src/app/institutions/departments/page.tsx`
*Departments view displaying academic department cards and child program creation.*

- **Route Page:** `/institutions/departments` -> renders `default`
- **Component** `DepartmentsPage()` - React page component rendering departments list and management cards.

### `client/src/app/institutions/error.tsx`
*Error boundary component for Overview Tree route.*

- **Error Boundary:** `/institutions` -> renders `default`
- **Component** `OverviewError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for overview tree view.

### `client/src/app/institutions/layout.tsx`
*Shared layout for institution routes providing persistent header, stats row, tabs, and modals.*

- **Layout:** `/institutions` -> renders `default`
- **Component** `InstitutionLayout({ children }: { children: React.ReactNode; })` - Shared layout for institution sub-routes maintaining persistent header, stats, and tabs.

### `client/src/app/institutions/loading.tsx`
*Loading skeleton placeholder for Overview Tree route.*

- **Loading Boundary:** `/institutions` -> renders `default`
- **Component** `OverviewLoading()` - React component rendering loading skeleton for institution tree view.

### `client/src/app/institutions/page.tsx`
*Overview hierarchy tree page displaying the complete academic graph for the institution.*

- **Route Page:** `/institutions` -> renders `default`
- **Component** `OverviewTreePage()` - React page component rendering the Overview Tree tab for academic hierarchy.

### `client/src/app/institutions/programs/error.tsx`
*Error boundary component for Programs route.*

- **Error Boundary:** `/institutions/programs` -> renders `default`
- **Component** `ProgramsError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for programs view.

### `client/src/app/institutions/programs/loading.tsx`
*Loading skeleton placeholder for Programs route.*

- **Loading Boundary:** `/institutions/programs` -> renders `default`
- **Component** `ProgramsLoading()` - React component rendering loading skeleton for programs grid.

### `client/src/app/institutions/programs/page.tsx`
*Degree programs view displaying curriculum track cards and cohort creation.*

- **Route Page:** `/institutions/programs` -> renders `default`
- **Component** `ProgramsPage()` - React page component rendering degree programs list and management cards.

### `client/src/app/institutions/sections/error.tsx`
*Error boundary component for Sections route.*

- **Error Boundary:** `/institutions/sections` -> renders `default`
- **Component** `SectionsError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for sections view.

### `client/src/app/institutions/sections/loading.tsx`
*Loading skeleton placeholder for Sections route.*

- **Loading Boundary:** `/institutions/sections` -> renders `default`
- **Component** `SectionsLoading()` - React component rendering loading skeleton for sections grid.

### `client/src/app/institutions/sections/page.tsx`
*Sections and batches view displaying student cohorts and practical group divisions.*

- **Route Page:** `/institutions/sections` -> renders `default`
- **Component** `SectionsPage()` - React page component rendering sections and batches list and management cards.

### `client/src/app/institutions/semesters/error.tsx`
*Error boundary component for Semesters route.*

- **Error Boundary:** `/institutions/semesters` -> renders `default`
- **Component** `SemestersError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for semesters view.

### `client/src/app/institutions/semesters/loading.tsx`
*Loading skeleton placeholder for Semesters route.*

- **Loading Boundary:** `/institutions/semesters` -> renders `default`
- **Component** `SemestersLoading()` - React component rendering loading skeleton for semesters grid.

### `client/src/app/institutions/semesters/page.tsx`
*Instructional semesters view displaying term date ranges and section creation.*

- **Route Page:** `/institutions/semesters` -> renders `default`
- **Component** `SemestersPage()` - React page component rendering semesters list and management cards.

### `client/src/app/institutions/working-days/error.tsx`
*Error boundary component for Working Days route.*

- **Error Boundary:** `/institutions/working-days` -> renders `default`
- **Component** `WorkingDaysError({
  error,
  reset,
}: { error: Error & { digest?: string | undefined; }; reset: () => void; })` - React error boundary component for working days view.

### `client/src/app/institutions/working-days/loading.tsx`
*Loading skeleton placeholder for Working Days route.*

- **Loading Boundary:** `/institutions/working-days` -> renders `default`
- **Component** `WorkingDaysLoading()` - React component rendering loading skeleton for working days form.

### `client/src/app/institutions/working-days/page.tsx`
*Working days and period schedule configuration route for the institution.*

- **Route Page:** `/institutions/working-days` -> renders `default`
- **Component** `WorkingDaysPage()` - React page component rendering working days and period timing configuration view.

### `client/src/app/kits/error.tsx`
*Route error boundary component for kits.*

- **Error Boundary:** `/kits` -> renders `default`

### `client/src/app/kits/loading.tsx`
*Route loading skeleton for kits.*

- **Loading Boundary:** `/kits` -> renders `default`

### `client/src/app/kits/page.tsx`
*React component for page.*

- **Route Page:** `/kits` -> renders `default`
- **Component** `KitsPage()` - React component rendering kits page.

### `client/src/app/layout.tsx`
*React component for layout.*

- **Layout:** `/` -> renders `default`
- **Component** `RootLayout({ children }: { children: React.ReactNode; })` - React component rendering root layout.
- **Const** `metadata`: `import("E:/Shiva Ram/Projects/slotly/node_modul...` - Constant representing metadata.

### `client/src/app/library/faculty/error.tsx`
*Error component handling runtime exceptions in faculty directory view.*

- **Error Boundary:** `/library/faculty` -> renders `default`
- **Component** `FacultyLibraryError({ error, reset }: FacultyLibraryErrorProps)` - Error component for faculty library route.

### `client/src/app/library/faculty/loading.tsx`
*Loading component rendering zero layout shift table skeleton for faculty directory.*

- **Loading Boundary:** `/library/faculty` -> renders `default`
- **Component** `FacultyLibraryLoading()` - Loading component for faculty library route.

### `client/src/app/library/faculty/page.tsx`
*React component rendering the faculty directory table, workload indicators, and resource actions.*

- **Route Page:** `/library/faculty` -> renders `default`
- **Component** `FacultyLibraryPage()` - React component rendering faculty library directory view.

### `client/src/app/library/layout.tsx`
*Shared application layout for resource library routes providing persistent header, tabs, and filter toolbar.*

- **Layout:** `/library` -> renders `default`
- **Component** `LibraryLayout({ children }: { children: React.ReactNode; })` - Shared layout for library sub-routes maintaining persistent header, tabs, and filter controls.

### `client/src/app/library/page.tsx`
*Server component redirecting base /library route to default /library/faculty route.*

- **Route Page:** `/library` -> renders `default`
- **Component** `LibraryIndexPage()` - Server component redirecting /library to /library/faculty.

### `client/src/app/library/room/page.tsx`
*Server component redirecting singular /library/room route to /library/rooms.*

- **Route Page:** `/library/room` -> renders `default`
- **Component** `LibraryRoomRedirectPage()` - Server component redirecting /library/room to /library/rooms.

### `client/src/app/library/rooms/error.tsx`
*Error component handling runtime exceptions in rooms directory view.*

- **Error Boundary:** `/library/rooms` -> renders `default`
- **Component** `RoomsLibraryError({ error, reset }: RoomsLibraryErrorProps)` - Error component for rooms library route.

### `client/src/app/library/rooms/loading.tsx`
*Loading component rendering zero layout shift table skeleton for rooms directory.*

- **Loading Boundary:** `/library/rooms` -> renders `default`
- **Component** `RoomsLibraryLoading()` - Loading component for rooms library route.

### `client/src/app/library/rooms/page.tsx`
*React component rendering the facilities and rooms directory table, equipment, and resource actions.*

- **Route Page:** `/library/rooms` -> renders `default`
- **Component** `RoomsLibraryPage()` - React component rendering rooms library facilities view.

### `client/src/app/library/subject/page.tsx`
*Server component redirecting singular /library/subject route to /library/subjects.*

- **Route Page:** `/library/subject` -> renders `default`
- **Component** `LibrarySubjectRedirectPage()` - Server component redirecting /library/subject to /library/subjects.

### `client/src/app/library/subjects/error.tsx`
*Error component handling runtime exceptions in subject catalog view.*

- **Error Boundary:** `/library/subjects` -> renders `default`
- **Component** `SubjectsLibraryError({ error, reset }: SubjectsLibraryErrorProps)` - Error component for subjects library route.

### `client/src/app/library/subjects/loading.tsx`
*Loading component rendering zero layout shift table skeleton for subjects catalog.*

- **Loading Boundary:** `/library/subjects` -> renders `default`
- **Component** `SubjectsLibraryLoading()` - Loading component for subjects library route.

### `client/src/app/library/subjects/page.tsx`
*React component rendering the academic subject catalog table, requirements, and resource actions.*

- **Route Page:** `/library/subjects` -> renders `default`
- **Component** `SubjectsLibraryPage()` - React component rendering subjects library catalog view.

### `client/src/app/page.tsx`
*Server component rendering the public marketing landing page and enforcing session redirect.*

- **Route Page:** `/` -> renders `default`
- **Component** `HomePage()` - React server component rendering landing page or redirecting active authenticated sessions to dashboard.

### `client/src/app/projects/[projectId]/blueprint/export/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/blueprint/export` -> renders `default`
- **Component** `BlueprintExportPage({
  params,
}: { params: Promise<{ projectId: string; }>; })` - React component rendering blueprint export page.

### `client/src/app/projects/[projectId]/blueprint/history/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/blueprint/history` -> renders `default`
- **Component** `BlueprintHistoryPage({
  params,
}: { params: Promise<{ projectId: string; }>; })` - React component rendering blueprint history page.

### `client/src/app/projects/[projectId]/blueprint/import/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/blueprint/import` -> renders `default`
- **Component** `BlueprintImportPage({
  params,
}: { params: Promise<{ projectId: string; }>; })` - React component rendering blueprint import page.

### `client/src/app/projects/[projectId]/blueprint/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/blueprint` -> renders `default`
- **Component** `BlueprintPage({
  params,
}: { params: Promise<{ projectId: string; }>; })` - React component rendering blueprint page.

### `client/src/app/projects/[projectId]/blueprint/readiness/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/blueprint/readiness` -> renders `default`
- **Component** `ReadinessPage({
  params,
}: { params: Promise<{ projectId: string; }>; })` - React component rendering readiness page.

### `client/src/app/projects/[projectId]/build/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/build` -> renders `default`
- **Component** `BuildPage({ params }: BuildPageProps)` - React component rendering build page.

### `client/src/app/projects/[projectId]/editor/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/editor` -> renders `default`
- **Component** `StudioEditorPage({
  params,
}: { params: Promise<{ projectId: string; }>; })` - React component rendering studio editor page.

### `client/src/app/projects/[projectId]/settings/page.tsx`
*React component for page.*

- **Route Page:** `/projects/[projectId]/settings` -> renders `default`
- **Component** `ProjectSettingsPage({
  params,
}: { params: Promise<{ projectId: string; }>; })` - React component rendering project settings page.

### `client/src/app/projects/new/page.tsx`
*React component for page.*

- **Route Page:** `/projects/new` -> renders `default`
- **Component** `NewProjectWizardPage()` - React component rendering new project wizard page.

### `client/src/app/projects/page.tsx`
*React component rendering academic projects list with sys0 cards, filters, and lifecycle dialogs.*

- **Route Page:** `/projects` -> renders `default`
- **Component** `ProjectsPage()` - React component rendering projects page matching sys0 visual guidelines.

### `client/src/app/templates/error.tsx`
*Route error boundary component for templates.*

- **Error Boundary:** `/templates` -> renders `default`

### `client/src/app/templates/loading.tsx`
*Route loading skeleton for templates.*

- **Loading Boundary:** `/templates` -> renders `default`

### `client/src/app/templates/page.tsx`
*React component rendering templates and kits page.*

- **Route Page:** `/templates` -> renders `default`
- **Component** `TemplatesPage()` - React component rendering templates page.

### `client/src/app/users/me/page.tsx`
*React component for page.*

- **Route Page:** `/users/me` -> renders `default`
- **Component** `ProfilePage()` - React component rendering profile page.

### `client/src/app/users/me/security/page.tsx`
*React component for page.*

- **Route Page:** `/users/me/security` -> renders `default`
- **Component** `SecuritySettingsPage()` - React component rendering security settings page.

### `client/src/app/versions/[versionId]/periods/page.tsx`
*React component for page.*

- **Route Page:** `/versions/[versionId]/periods` -> renders `default`
- **Component** `PeriodsConfigurationPage({
  params,
}: { params: Promise<{ versionId: string; }>; })` - React component rendering periods configuration page.

