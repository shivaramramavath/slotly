# Client App Routes Code Map

### `client/src/app/(auth)/forgot-password/page.tsx`
*React component for page.*

- **Route Page:** `/forgot-password` -> renders `default`
- **Component** `ForgotPasswordPage()` - React component rendering forgot password page.

### `client/src/app/(auth)/login/page.tsx`
*React component for page.*

- **Route Page:** `/login` -> renders `default`
- **Component** `LoginPage()` - React component rendering login page.

### `client/src/app/(auth)/mfa/page.tsx`
*React component for page.*

- **Route Page:** `/mfa` -> renders `default`
- **Component** `MfaChallengePage()` - React component rendering mfa challenge page.

### `client/src/app/(auth)/register/page.tsx`
*React component for page.*

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

### `client/src/app/library/page.tsx`
*React component for page.*

- **Route Page:** `/library` -> renders `default`
- **Component** `LibraryPage()` - React component rendering library page.

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
*React component for page.*

- **Route Page:** `/projects` -> renders `default`
- **Component** `ProjectsPage()` - React component rendering projects page.

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

