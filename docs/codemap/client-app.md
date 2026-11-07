# Client App Routes Code Map

### `client/src/app/(auth)/forgot-password/page.tsx`
*(no description)*

- **Route Page:** `/forgot-password` -> renders `default`
- **Component** `ForgotPasswordPage()`

### `client/src/app/(auth)/login/page.tsx`
*(no description)*

- **Route Page:** `/login` -> renders `default`
- **Component** `LoginPage()`

### `client/src/app/(auth)/mfa/page.tsx`
*(no description)*

- **Route Page:** `/mfa` -> renders `default`
- **Component** `MfaChallengePage()`

### `client/src/app/(auth)/register/page.tsx`
*(no description)*

- **Route Page:** `/register` -> renders `default`
- **Component** `RegisterPage()`

### `client/src/app/(auth)/reset-password/page.tsx`
*(no description)*

- **Route Page:** `/reset-password` -> renders `default`
- **Component** `ResetPasswordPage()`

### `client/src/app/(auth)/sessions/page.tsx`
*(no description)*

- **Route Page:** `/sessions` -> renders `default`
- **Component** `SessionsPage()`

### `client/src/app/(auth)/verify-email/page.tsx`
*(no description)*

- **Route Page:** `/verify-email` -> renders `default`
- **Component** `VerifyEmailPage()`

### `client/src/app/blueprint-templates/page.tsx`
*(no description)*

- **Route Page:** `/blueprint-templates` -> renders `default`
- **Component** `BlueprintTemplatesPage()`

### `client/src/app/dashboard/page.tsx`
*(no description)*

- **Route Page:** `/dashboard` -> renders `default`
- **Component** `DashboardPage()`

### `client/src/app/home/page.tsx`
*(no description)*

- **Route Page:** `/home` -> renders `default`
- **Component** `HomeShellPage()`

### `client/src/app/institutions/page.tsx`
*(no description)*

- **Route Page:** `/institutions` -> renders `default`
- **Component** `InstitutionsPage()`

### `client/src/app/kits/page.tsx`
*(no description)*

- **Route Page:** `/kits` -> renders `default`
- **Component** `KitsPage()`

### `client/src/app/layout.tsx`
*(no description)*

- **Layout:** `/` -> renders `default`
- **Component** `RootLayout({ children }: { children: React.ReactNode; })`
- **Const** `metadata`: `import("E:/Shiva Ram/Projects/slotly/node_modul...`

### `client/src/app/library/page.tsx`
*(no description)*

- **Route Page:** `/library` -> renders `default`
- **Component** `LibraryPage()`

### `client/src/app/page.tsx`
*(no description)*

- **Route Page:** `/` -> renders `default`
- **Component** `HomePage()`

### `client/src/app/projects/[projectId]/blueprint/export/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/blueprint/export` -> renders `default`
- **Component** `BlueprintExportPage({
  params,
}: { params: Promise<{ projectId: string; }>; })`

### `client/src/app/projects/[projectId]/blueprint/history/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/blueprint/history` -> renders `default`
- **Component** `BlueprintHistoryPage({
  params,
}: { params: Promise<{ projectId: string; }>; })`

### `client/src/app/projects/[projectId]/blueprint/import/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/blueprint/import` -> renders `default`
- **Component** `BlueprintImportPage({
  params,
}: { params: Promise<{ projectId: string; }>; })`

### `client/src/app/projects/[projectId]/blueprint/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/blueprint` -> renders `default`
- **Component** `BlueprintPage({
  params,
}: { params: Promise<{ projectId: string; }>; })`

### `client/src/app/projects/[projectId]/blueprint/readiness/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/blueprint/readiness` -> renders `default`
- **Component** `ReadinessPage({
  params,
}: { params: Promise<{ projectId: string; }>; })`

### `client/src/app/projects/[projectId]/build/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/build` -> renders `default`
- **Component** `BuildPage({ params }: BuildPageProps)`

### `client/src/app/projects/[projectId]/editor/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/editor` -> renders `default`
- **Component** `StudioEditorPage({
  params,
}: { params: Promise<{ projectId: string; }>; })`

### `client/src/app/projects/[projectId]/settings/page.tsx`
*(no description)*

- **Route Page:** `/projects/[projectId]/settings` -> renders `default`
- **Component** `ProjectSettingsPage({
  params,
}: { params: Promise<{ projectId: string; }>; })`

### `client/src/app/projects/new/page.tsx`
*(no description)*

- **Route Page:** `/projects/new` -> renders `default`
- **Component** `NewProjectWizardPage()`

### `client/src/app/projects/page.tsx`
*(no description)*

- **Route Page:** `/projects` -> renders `default`
- **Component** `ProjectsPage()`

### `client/src/app/users/me/page.tsx`
*(no description)*

- **Route Page:** `/users/me` -> renders `default`
- **Component** `ProfilePage()`

### `client/src/app/users/me/security/page.tsx`
*(no description)*

- **Route Page:** `/users/me/security` -> renders `default`
- **Component** `SecuritySettingsPage()`

### `client/src/app/versions/[versionId]/periods/page.tsx`
*(no description)*

- **Route Page:** `/versions/[versionId]/periods` -> renders `default`
- **Component** `PeriodsConfigurationPage({
  params,
}: { params: Promise<{ versionId: string; }>; })`

