# Client Auth Feature Code Map

### `client/src/features/auth/components/auth-provider.tsx`
*(no description)*

- **Component** `AuthProvider({ children }: AuthProviderProps)`

### `client/src/features/auth/components/can.tsx`
*(no description)*

- **Component** `Can({
  permission,
  permissions,
  roles,
  matchAll = false,
  children,
  fallback = null,
}: CanProps)`

### `client/src/features/auth/components/step-up-dialog.tsx`
*(no description)*

- **Component** `StepUpDialog()`

### `client/src/features/auth/hooks/use-permission.ts`
*(no description)*

- **Hook** `usePermission()`: `{ user: { status: "active" | "suspended" | "deactivated"; id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN" | "DESIGNER" | "FACULTY" | "STUDENT"; isEmailVerified: boolean; mfaEnabled: boolean; institutionId?: string | undefined; departmentId?: string | undefined; } | null; hasPermission: (permission: "INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ") => boolean; hasAnyPermission: (permissions: ("INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ")[]) => boolean; hasAllPermissions: (permissions: ("INSTITUTION_READ" | "INSTITUTION_MANAGE" | "DEPARTMENT_READ" | "DEPARTMENT_MANAGE" | "STRUCTURE_READ" | "STRUCTURE_MANAGE" | "FACULTY_READ" | "FACULTY_MANAGE" | "ROOM_READ" | "ROOM_MANAGE" | "SUBJECT_READ" | "SUBJECT_MANAGE" | "PROJECT_CREATE" | "PROJECT_READ" | "PROJECT_MANAGE" | "PROJECT_DELETE" | "PROJECT_ARCHIVE" | "BLUEPRINT_READ" | "BLUEPRINT_EDIT" | "BLUEPRINT_BUILD" | "BLUEPRINT_TEMPLATE_MANAGE" | "TIMETABLE_READ" | "TIMETABLE_EDIT" | "TIMETABLE_APPROVE" | "TIMETABLE_PUBLISH" | "TIMETABLE_EXPORT" | "USER_MANAGE" | "AUDIT_READ")[]) => boolean; isRole: (...roles: ("SUPER_ADMIN" | "ADMIN" | "DESIGNER" | "FACULTY" | "STUDENT")[]) => boolean; }`

### `client/src/features/auth/index.ts`
*(no description)*

*(No public exports)*

### `client/src/features/auth/services/auth.api.ts`
*(no description)*

- **Interface** `SecurityOverview`
- **Const** `authApi`: `{ register(dto: { email: string; name: string; ...`

### `client/src/features/auth/store/auth.store.ts`
*(no description)*

- **Type** `AuthStatus`
- **Zustand Store** `useAuthStore` (actions: setAuth, setUser, clearAuth, setStatus, setMfaPending, clearMfaPending, setStepUpRequired)

