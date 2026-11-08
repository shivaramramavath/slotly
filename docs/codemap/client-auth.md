# Client Auth Feature Code Map

### `client/src/features/auth/components/auth-provider.tsx`
*React component for auth-provider.*

- **Component** `AuthProvider({ children }: AuthProviderProps)` - React component rendering auth provider.

### `client/src/features/auth/components/can.tsx`
*React component for can.*

- **Component** `Can({
  permission,
  permissions,
  roles,
  matchAll = false,
  children,
  fallback = null,
}: CanProps)` - React component rendering can.

### `client/src/features/auth/components/step-up-dialog.tsx`
*React component for step-up-dialog.*

- **Component** `StepUpDialog()` - React component rendering step up dialog.

### `client/src/features/auth/hooks/use-permission.ts`
*Custom React hook for use-permission.*

- **Hook** `usePermission()`: `{ user: { status: "active" | "suspended" | "deactivated" | "pending_onboarding"; id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN" | "DESIGNER" | "FACULTY" | "STUDENT"; isEmailVerified: boolean; mfaEnabled: boolean; institutionId?: string | undefined; departmentId?: string | undefined; } | null; hasPermission: (permission: "INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ") => boolean; hasAnyPermission: (permissions: ("INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ")[]) => boolean; hasAllPermissions: (permissions: ("INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ")[]) => boolean; isRole: (...roles: ("SUPER_ADMIN" | "ADMIN" | "DESIGNER" | "FACULTY" | "STUDENT")[]) => boolean; }` - Custom React hook for use permission.

### `client/src/features/auth/index.ts`
*Core implementation for index in client/src/features/auth.*

*(No public exports)*

### `client/src/features/auth/services/auth.api.ts`
*Domain service orchestrating auth.api business logic.*

- **Interface** `SecurityOverview` - Interface defining structure for security overview.
- **Const** `authApi`: `{ register(dto: { email: string; name: string; ...` - Constant representing auth api.

### `client/src/features/auth/store/auth.store.ts`
*Zustand store managing application state for auth.store.*

- **Type** `AuthStatus` - Type alias for auth status.
- **Zustand Store** `useAuthStore` (actions: setAuth, setUser, clearAuth, setStatus, setMfaPending, clearMfaPending, setStepUpRequired) - Zustand store managing use auth store state.

