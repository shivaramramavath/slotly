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

### `client/src/app/blueprint-templates/page.tsx`
*React component for page.*

- **Route Page:** `/blueprint-templates` -> renders `default`
- **Component** `BlueprintTemplatesPage()` - React component rendering blueprint templates page.

### `client/src/app/dashboard/page.tsx`
*React component for page.*

- **Route Page:** `/dashboard` -> renders `default`
- **Component** `DashboardPage()` - React component rendering dashboard page.

### `client/src/app/home/page.tsx`
*React component for page.*

- **Route Page:** `/home` -> renders `default`
- **Component** `HomeShellPage()` - React component rendering home shell page.

### `client/src/app/institutions/page.tsx`
*React component for page.*

- **Route Page:** `/institutions` -> renders `default`
- **Component** `InstitutionsPage()` - React component rendering institutions page.

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
*React component for page.*

- **Route Page:** `/` -> renders `default`
- **Component** `HomePage()` - React component rendering home page.

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

