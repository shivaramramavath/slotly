// Shared TypeScript contracts, Zod schemas, DTOs, and event constants.
import { z } from 'zod';

// ==========================================
// ERROR CONTRACT
// ==========================================
/** Zod schema validating api error response. */
export const ApiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
/** TypeScript type inferred from api error response Zod schema. */
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ==========================================
// PAGINATION CONTRACT
// ==========================================
/** Zod schema validating pagination query. */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});
/** TypeScript type inferred from pagination query Zod schema. */
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Interface defining structure for paginated result. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// REVISION & CONCURRENCY
// ==========================================
/** Zod schema validating revision conflict. */
export const RevisionConflictSchema = z.object({
  code: z.literal('REVISION_CONFLICT'),
  message: z.string(),
  currentRevision: z.number(),
  rejectedRevision: z.number(),
  currentState: z.unknown().optional(),
});
/** TypeScript type inferred from revision conflict Zod schema. */
export type RevisionConflict = z.infer<typeof RevisionConflictSchema>;

// ==========================================
// ROLES & PERMISSIONS
// ==========================================
/** Zod schema validating user role. */
export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'DESIGNER',
  'FACULTY',
  'STUDENT',
]);
/** TypeScript type inferred from user role Zod schema. */
export type UserRole = z.infer<typeof UserRoleSchema>;

/** Zod schema validating permission. */
export const PermissionSchema = z.enum([
  // Institution
  'INSTITUTION_READ',
  'INSTITUTION_MANAGE',
  // Department & Program
  'DEPARTMENT_READ',
  'DEPARTMENT_MANAGE',
  // Academic Structure
  'STRUCTURE_READ',
  'STRUCTURE_MANAGE',
  // Resources
  'FACULTY_READ',
  'FACULTY_MANAGE',
  'ROOM_READ',
  'ROOM_MANAGE',
  'SUBJECT_READ',
  'SUBJECT_MANAGE',
  // Projects
  'PROJECT_CREATE',
  'PROJECT_READ',
  'PROJECT_MANAGE',
  'PROJECT_DELETE',
  'PROJECT_ARCHIVE',
  // Blueprint
  'BLUEPRINT_READ',
  'BLUEPRINT_EDIT',
  'BLUEPRINT_BUILD',
  'BLUEPRINT_TEMPLATE_MANAGE',
  // Timetable
  'TIMETABLE_READ',
  'TIMETABLE_EDIT',
  'TIMETABLE_APPROVE',
  'TIMETABLE_PUBLISH',
  'TIMETABLE_EXPORT',
  // Admin & Audit
  'USER_MANAGE',
  'AUDIT_READ',
]);
/** TypeScript type inferred from permission Zod schema. */
export type Permission = z.infer<typeof PermissionSchema>;

/** Constant representing role permissions. */
export const RolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: Object.values(PermissionSchema.enum),
  ADMIN: [
    'INSTITUTION_READ',
    'INSTITUTION_MANAGE',
    'DEPARTMENT_READ',
    'DEPARTMENT_MANAGE',
    'STRUCTURE_READ',
    'STRUCTURE_MANAGE',
    'FACULTY_READ',
    'FACULTY_MANAGE',
    'ROOM_READ',
    'ROOM_MANAGE',
    'SUBJECT_READ',
    'SUBJECT_MANAGE',
    'PROJECT_CREATE',
    'PROJECT_READ',
    'PROJECT_MANAGE',
    'PROJECT_DELETE',
    'PROJECT_ARCHIVE',
    'BLUEPRINT_READ',
    'BLUEPRINT_EDIT',
    'BLUEPRINT_BUILD',
    'BLUEPRINT_TEMPLATE_MANAGE',
    'TIMETABLE_READ',
    'TIMETABLE_EDIT',
    'TIMETABLE_APPROVE',
    'TIMETABLE_PUBLISH',
    'TIMETABLE_EXPORT',
    'USER_MANAGE',
    'AUDIT_READ',
  ],
  DESIGNER: [
    'INSTITUTION_READ',
    'DEPARTMENT_READ',
    'STRUCTURE_READ',
    'FACULTY_READ',
    'FACULTY_MANAGE',
    'ROOM_READ',
    'ROOM_MANAGE',
    'SUBJECT_READ',
    'SUBJECT_MANAGE',
    'PROJECT_CREATE',
    'PROJECT_READ',
    'PROJECT_MANAGE',
    'PROJECT_ARCHIVE',
    'BLUEPRINT_READ',
    'BLUEPRINT_EDIT',
    'BLUEPRINT_BUILD',
    'BLUEPRINT_TEMPLATE_MANAGE',
    'TIMETABLE_READ',
    'TIMETABLE_EDIT',
    'TIMETABLE_EXPORT',
  ],
  FACULTY: ['INSTITUTION_READ', 'FACULTY_READ', 'ROOM_READ', 'SUBJECT_READ', 'TIMETABLE_READ', 'TIMETABLE_EXPORT'],
  STUDENT: ['INSTITUTION_READ', 'ROOM_READ', 'SUBJECT_READ', 'TIMETABLE_READ', 'TIMETABLE_EXPORT'],
};

// ==========================================
// AUTH & USER SCHEMAS & DTOS
// ==========================================
/** Zod schema validating user dto. */
export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  institutionId: z.string().optional(),
  departmentId: z.string().optional(),
  isEmailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  status: z.enum(['active', 'suspended', 'deactivated']).default('active'),
});
/** TypeScript type inferred from user dto Zod schema. */
export type UserDto = z.infer<typeof UserDtoSchema>;

/** Zod schema validating register dto. */
export const RegisterDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters').max(128),
  name: z.string().min(2),
  institutionName: z.string().optional(),
  institutionCode: z.string().optional(),
});
/** TypeScript type inferred from register dto Zod schema. */
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

/** Zod schema validating login dto. */
export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  code: z.string().optional(), // MFA code if logging in with 2FA
});
/** TypeScript type inferred from login dto Zod schema. */
export type LoginDto = z.infer<typeof LoginDtoSchema>;

/** Zod schema validating auth response. */
export const AuthResponseSchema = z.object({
  accessToken: z.string().optional(),
  user: UserDtoSchema.optional(),
  mfaRequired: z.boolean().optional(),
  mfaToken: z.string().optional(), // temporary token for MFA challenge
});
/** TypeScript type inferred from auth response Zod schema. */
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/** Zod schema validating verify email dto. */
export const VerifyEmailDtoSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});
/** TypeScript type inferred from verify email dto Zod schema. */
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>;

/** Zod schema validating resend email dto. */
export const ResendEmailDtoSchema = z.object({
  email: z.string().email(),
});
/** TypeScript type inferred from resend email dto Zod schema. */
export type ResendEmailDto = z.infer<typeof ResendEmailDtoSchema>;

/** Zod schema validating forgot password dto. */
export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email(),
});
/** TypeScript type inferred from forgot password dto Zod schema. */
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

/** Zod schema validating reset password dto. */
export const ResetPasswordDtoSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(12).max(128),
});
/** TypeScript type inferred from reset password dto Zod schema. */
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;

/** Zod schema validating change password dto. */
export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(12).max(128),
});
/** TypeScript type inferred from change password dto Zod schema. */
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

/** Zod schema validating mfa enroll response. */
export const MfaEnrollResponseSchema = z.object({
  secret: z.string(),
  qrCodeUrl: z.string(),
  recoveryCodes: z.array(z.string()),
});
/** TypeScript type inferred from mfa enroll response Zod schema. */
export type MfaEnrollResponse = z.infer<typeof MfaEnrollResponseSchema>;

/** Zod schema validating mfa verify dto. */
export const MfaVerifyDtoSchema = z.object({
  code: z.string().min(6),
  mfaToken: z.string().optional(),
});
/** TypeScript type inferred from mfa verify dto Zod schema. */
export type MfaVerifyDto = z.infer<typeof MfaVerifyDtoSchema>;

/** Zod schema validating mfa recovery dto. */
export const MfaRecoveryDtoSchema = z.object({
  email: z.string().email(),
  recoveryCode: z.string().min(8),
});
/** TypeScript type inferred from mfa recovery dto Zod schema. */
export type MfaRecoveryDto = z.infer<typeof MfaRecoveryDtoSchema>;

/** Zod schema validating step up dto. */
export const StepUpDtoSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
});
/** TypeScript type inferred from step up dto Zod schema. */
export type StepUpDto = z.infer<typeof StepUpDtoSchema>;

/** Zod schema validating session dto. */
export const SessionDtoSchema = z.object({
  sessionId: z.string(),
  device: z.string(),
  browser: z.string(),
  ip: z.string(),
  lastActiveAt: z.string(),
  createdAt: z.string(),
  isCurrent: z.boolean(),
});
/** TypeScript type inferred from session dto Zod schema. */
export type SessionDto = z.infer<typeof SessionDtoSchema>;

/** Zod schema validating device dto. */
export const DeviceDtoSchema = z.object({
  deviceId: z.string(),
  name: z.string(),
  browser: z.string(),
  os: z.string(),
  ip: z.string(),
  lastActiveAt: z.string(),
  isTrusted: z.boolean(),
});
/** TypeScript type inferred from device dto Zod schema. */
export type DeviceDto = z.infer<typeof DeviceDtoSchema>;

/** Zod schema validating security activity dto. */
export const SecurityActivityDtoSchema = z.object({
  id: z.string(),
  action: z.string(),
  ipAddress: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
/** TypeScript type inferred from security activity dto Zod schema. */
export type SecurityActivityDto = z.infer<typeof SecurityActivityDtoSchema>;

// ==========================================
// REASON CODES (BLUEPRINT_RULES.md - G8)
// ==========================================
/** Zod schema validating reason code. */
export const ReasonCodeSchema = z.enum([
  'PARENT_MISSING',
  'PARENT_INCOMPLETE',
  'PARENT_TYPE_NOT_ALLOWED',
  'DUPLICATE_NAME',
  'CAPACITY_EXCEEDED',
  'CYCLE',
  'ENDPOINT_INCOMPLETE',
  'NOT_QUALIFIED',
  'PROJECT_LOCKED',
  'PERMISSION_DENIED',
  'SINGLE_PARENT_VIOLATION',
  'INVALID_OPERATION',
  'REVISION_CONFLICT',
  'INSUFFICIENT_LAB_CAPACITY',
  'MISSING_ALLOCATION',
  'FACULTY_OVERLOAD',
  'INVALID_GRAPH',
]);
/** TypeScript type inferred from reason code Zod schema. */
export type ReasonCode = z.infer<typeof ReasonCodeSchema>;

/** Alias dictionary mapping alternative or legacy reason code variations to canonical codes. */
export const REASON_CODE_ALIASES: Record<string, ReasonCode> = {
  parent_missing: 'PARENT_MISSING',
  'parent-missing': 'PARENT_MISSING',
  parent_not_found: 'PARENT_MISSING',
  parentincomplete: 'PARENT_INCOMPLETE',
  parent_incomplete: 'PARENT_INCOMPLETE',
  'parent-incomplete': 'PARENT_INCOMPLETE',
  parent_type_invalid: 'PARENT_TYPE_NOT_ALLOWED',
  parent_type_not_allowed: 'PARENT_TYPE_NOT_ALLOWED',
  duplicate_code: 'DUPLICATE_NAME',
  duplicate_name: 'DUPLICATE_NAME',
  capacity_exceeded: 'CAPACITY_EXCEEDED',
  circular_dependency: 'CYCLE',
  cycle: 'CYCLE',
  endpoint_incomplete: 'ENDPOINT_INCOMPLETE',
  not_qualified: 'NOT_QUALIFIED',
  unqualified: 'NOT_QUALIFIED',
  project_locked: 'PROJECT_LOCKED',
  permission_denied: 'PERMISSION_DENIED',
  unauthorized: 'PERMISSION_DENIED',
  forbidden: 'PERMISSION_DENIED',
  single_parent_violation: 'SINGLE_PARENT_VIOLATION',
  invalid_operation: 'INVALID_OPERATION',
  stale_revision: 'REVISION_CONFLICT',
  revision_conflict: 'REVISION_CONFLICT',
  insufficient_lab_capacity: 'INSUFFICIENT_LAB_CAPACITY',
  missing_allocation: 'MISSING_ALLOCATION',
  faculty_overload: 'FACULTY_OVERLOAD',
  invalid_graph: 'INVALID_GRAPH',
};

/** User-friendly explanations for every canonical reason code. */
export const REASON_CODE_MESSAGES: Record<ReasonCode, string> = {
  PARENT_MISSING: 'Parent node is required before this item can be created.',
  PARENT_INCOMPLETE: 'Please complete all required fields on the parent node first.',
  PARENT_TYPE_NOT_ALLOWED: 'Connection between these types is not allowed in the hierarchy.',
  DUPLICATE_NAME: 'An item with this name or code already exists in this scope.',
  CAPACITY_EXCEEDED: 'The combined student count exceeds parent capacity.',
  CYCLE: 'Circular dependency detected in graph hierarchy.',
  ENDPOINT_INCOMPLETE: 'Both connected items must be fully configured.',
  NOT_QUALIFIED: 'Faculty lacks the required qualifications for this subject.',
  PROJECT_LOCKED: 'Project is locked or currently undergoing build generation.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  SINGLE_PARENT_VIOLATION: 'Node already has a parent and multiple parents are not permitted.',
  INVALID_OPERATION: 'The requested operation violates blueprint graph invariants.',
  REVISION_CONFLICT: 'The document was updated elsewhere. Please refresh to see latest changes.',
  INSUFFICIENT_LAB_CAPACITY: 'Lab capacity is insufficient for the assigned section strength.',
  MISSING_ALLOCATION: 'Required faculty or room allocation is missing for this subject.',
  FACULTY_OVERLOAD: 'Assigned teaching hours exceed maximum allowed faculty hours.',
  INVALID_GRAPH: 'Graph structure contains detached, cyclic, or invalid nodes.',
};

/** Normalizes any legacy, aliased, or formatted reason code string into its canonical enum representation. */
export function normalizeReasonCode(code: string): ReasonCode {
  if (!code) return 'INVALID_OPERATION';
  const clean = code.trim().toLowerCase().replace(/-/g, '_');
  if (REASON_CODE_ALIASES[clean]) {
    return REASON_CODE_ALIASES[clean];
  }
  const upper = code.trim().toUpperCase().replace(/-/g, '_');
  const valid = ReasonCodeSchema.safeParse(upper);
  if (valid.success) {
    return valid.data;
  }
  return 'INVALID_OPERATION';
}

/** Zod schema validating fix hint. */
export const FixHintSchema = z.object({
  nodeId: z.string(),
  field: z.string(),
});
/** TypeScript type inferred from fix hint Zod schema. */
export type FixHint = z.infer<typeof FixHintSchema>;

/** Zod schema validating gate failure. */
export const GateFailureSchema = z.object({
  code: ReasonCodeSchema,
  message: z.string(),
  fixHint: FixHintSchema.optional(),
});
/** TypeScript type inferred from gate failure Zod schema. */
export type GateFailure = z.infer<typeof GateFailureSchema>;

// ==========================================
// NODE STATUS & HIERARCHY
// ==========================================
/** Zod schema validating node status. */
export const NodeStatusSchema = z.enum(['empty', 'incomplete', 'complete', 'blocked']);
/** TypeScript type inferred from node status Zod schema. */
export type NodeStatus = z.infer<typeof NodeStatusSchema>;

/** Zod schema validating blueprint node type. */
export const BlueprintNodeTypeSchema = z.enum([
  'institution',
  'department',
  'program',
  'academicYear',
  'semester',
  'section',
  'batch',
  'subjectAssignment',
  'electiveGroup',
  'faculty',
  'room',
]);
/** TypeScript type inferred from blueprint node type Zod schema. */
export type BlueprintNodeType = z.infer<typeof BlueprintNodeTypeSchema>;

/** Zod schema validating node type. */
export const NodeTypeSchema = z.enum([
  'Institution',
  'Department',
  'Program',
  'AcademicYear',
  'Semester',
  'Section',
  'Batch',
  'Subject',
  'ElectiveGroup',
  'Faculty',
  'Room',
  'institution',
  'department',
  'program',
  'academicYear',
  'semester',
  'section',
  'batch',
  'subjectAssignment',
  'electiveGroup',
  'faculty',
  'room',
]);
/** TypeScript type inferred from node type Zod schema. */
export type NodeType = z.infer<typeof NodeTypeSchema>;

/** Zod schema validating missing field. */
export const MissingFieldSchema = z.object({
  field: z.string(),
  message: z.string(),
});
/** TypeScript type inferred from missing field Zod schema. */
export type MissingField = z.infer<typeof MissingFieldSchema>;

/** Zod schema validating node computed status. */
export const NodeComputedStatusSchema = z.object({
  status: NodeStatusSchema,
  missing: z.array(MissingFieldSchema),
});
/** TypeScript type inferred from node computed status Zod schema. */
export type NodeComputedStatus = z.infer<typeof NodeComputedStatusSchema>;

// ==========================================
// PROJECT LIFECYCLE
// ==========================================
/** Zod schema validating project lifecycle status. */
export const ProjectLifecycleStatusSchema = z.enum([
  'draft',
  'building',
  'ready',
  'pending_approval',
  'published',
  'archived',
]);
/** TypeScript type inferred from project lifecycle status Zod schema. */
export type ProjectLifecycleStatus = z.infer<typeof ProjectLifecycleStatusSchema>;

// ==========================================
// SOCKET EVENT NAMES (ROUTES.md)
// ==========================================
/** Constant representing socket events. */
export const SocketEvents = {
  // Server to client
  NODE_STATUS_CHANGED: 'node:status-changed',
  OPS_APPLIED: 'ops:applied',
  PRESENCE_CHANGED: 'presence:changed',
  NODE_LOCKED: 'node:locked',
  NODE_UNLOCKED: 'node:unlocked',
  REVISION_CONFLICT: 'revision:conflict',

  // Client to server
  JOIN_PROJECT: 'project:join',
  LEAVE_PROJECT: 'project:leave',
  LOCK_NODE: 'node:lock',
  UNLOCK_NODE: 'node:unlock',
  UPDATE_CURSOR: 'cursor:update',
  NODE_ADD: 'node:add',
  NODE_UPDATE: 'node:update',
  NODE_MOVE: 'node:move',
  NODE_DELETE: 'node:delete',
  EDGE_ADD: 'edge:add',
  EDGE_DELETE: 'edge:delete',
} as const;

// ==========================================
// HEALTH CONTRACT
// ==========================================
/** Zod schema validating health response. */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  service: z.string(),
  version: z.string(),
  uptime: z.number(),
  dependencies: z
    .object({
      mongodb: z.enum(['up', 'down', 'disabled']),
      redis: z.enum(['up', 'down', 'disabled']),
    })
    .optional(),
});
/** TypeScript type inferred from health response Zod schema. */
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ==========================================
// INSTITUTION & ACADEMIC HIERARCHY
// ==========================================
/** Zod schema validating period break. */
export const PeriodBreakSchema = z.object({
  name: z.string().min(1),
  afterPeriod: z.number().int().min(1),
  durationMinutes: z.number().int().min(5).max(120),
});
/** TypeScript type inferred from period break Zod schema. */
export type PeriodBreak = z.infer<typeof PeriodBreakSchema>;

/** Zod schema validating period config. */
export const PeriodConfigSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM (24h)'),
  periodDuration: z.number().int().min(30).max(180),
  periodsPerDay: z.number().int().min(1).max(14),
  breaks: z.array(PeriodBreakSchema).default([]),
});
/** TypeScript type inferred from period config Zod schema. */
export type PeriodConfig = z.infer<typeof PeriodConfigSchema>;

/** Zod schema validating institution dto. */
export const InstitutionDtoSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  address: z.string().default(''),
  workingDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  defaultPeriodConfig: PeriodConfigSchema,
  isComplete: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from institution dto Zod schema. */
export type InstitutionDto = z.infer<typeof InstitutionDtoSchema>;

/** Zod schema validating create institution dto. */
export const CreateInstitutionDtoSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  address: z.string().optional().default(''),
  workingDays: z.array(z.number().int().min(0).max(6)).optional().default([1, 2, 3, 4, 5]),
  defaultPeriodConfig: PeriodConfigSchema.optional().default({
    startTime: '09:00',
    periodDuration: 50,
    periodsPerDay: 7,
    breaks: [{ name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 }],
  }),
});
/** TypeScript type inferred from create institution dto Zod schema. */
export type CreateInstitutionDto = z.infer<typeof CreateInstitutionDtoSchema>;

/** Zod schema validating update institution dto. */
export const UpdateInstitutionDtoSchema = CreateInstitutionDtoSchema.partial();
/** TypeScript type inferred from update institution dto Zod schema. */
export type UpdateInstitutionDto = z.infer<typeof UpdateInstitutionDtoSchema>;

/** Zod schema validating department dto. */
export const DepartmentDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  name: z.string().min(2),
  code: z.string().min(2).max(15),
  headFacultyId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from department dto Zod schema. */
export type DepartmentDto = z.infer<typeof DepartmentDtoSchema>;

/** Zod schema validating create department dto. */
export const CreateDepartmentDtoSchema = z.object({
  institutionId: z.string().optional(),
  name: z.string().min(2),
  code: z.string().min(2).max(15),
  headFacultyId: z.string().optional(),
});
/** TypeScript type inferred from create department dto Zod schema. */
export type CreateDepartmentDto = z.infer<typeof CreateDepartmentDtoSchema>;

/** Zod schema validating update department dto. */
export const UpdateDepartmentDtoSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(15).optional(),
  headFacultyId: z.string().optional(),
});
/** TypeScript type inferred from update department dto Zod schema. */
export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentDtoSchema>;

/** Zod schema validating program dto. */
export const ProgramDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  departmentId: z.string(),
  name: z.string().min(2),
  code: z.string().min(2).max(15),
  durationYears: z.number().int().min(1).max(6),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from program dto Zod schema. */
export type ProgramDto = z.infer<typeof ProgramDtoSchema>;

/** Zod schema validating create program dto. */
export const CreateProgramDtoSchema = z.object({
  institutionId: z.string().optional(),
  departmentId: z.string(),
  name: z.string().min(2),
  code: z.string().min(2).max(15),
  durationYears: z.number().int().min(1).max(6).default(4),
});
/** TypeScript type inferred from create program dto Zod schema. */
export type CreateProgramDto = z.infer<typeof CreateProgramDtoSchema>;

/** Zod schema validating update program dto. */
export const UpdateProgramDtoSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(15).optional(),
  durationYears: z.number().int().min(1).max(6).optional(),
});
/** TypeScript type inferred from update program dto Zod schema. */
export type UpdateProgramDto = z.infer<typeof UpdateProgramDtoSchema>;

/** Zod schema validating academic year dto. */
export const AcademicYearDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  programId: z.string(),
  yearNumber: z.number().int().min(1).max(6),
  label: z.string().min(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from academic year dto Zod schema. */
export type AcademicYearDto = z.infer<typeof AcademicYearDtoSchema>;

/** Zod schema validating create academic year dto. */
export const CreateAcademicYearDtoSchema = z.object({
  institutionId: z.string().optional(),
  programId: z.string(),
  yearNumber: z.number().int().min(1).max(6),
  label: z.string().min(1),
});
/** TypeScript type inferred from create academic year dto Zod schema. */
export type CreateAcademicYearDto = z.infer<typeof CreateAcademicYearDtoSchema>;

/** Zod schema validating update academic year dto. */
export const UpdateAcademicYearDtoSchema = z.object({
  yearNumber: z.number().int().min(1).max(6).optional(),
  label: z.string().min(1).optional(),
});
/** TypeScript type inferred from update academic year dto Zod schema. */
export type UpdateAcademicYearDto = z.infer<typeof UpdateAcademicYearDtoSchema>;

/** Zod schema validating semester dto. */
export const SemesterDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  programId: z.string(),
  academicYearId: z.string(),
  name: z.string().min(1),
  number: z.number().int().min(1).max(12),
  startDate: z.string(),
  endDate: z.string(),
  academicYearLabel: z.string(),
  active: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from semester dto Zod schema. */
export type SemesterDto = z.infer<typeof SemesterDtoSchema>;

/** Zod schema validating create semester dto. */
export const CreateSemesterDtoSchema = z.object({
  institutionId: z.string().optional(),
  programId: z.string().optional(),
  academicYearId: z.string(),
  name: z.string().min(1),
  number: z.number().int().min(1).max(12),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Format YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Format YYYY-MM-DD'),
  academicYearLabel: z.string().optional(),
  active: z.boolean().optional().default(true),
});
/** TypeScript type inferred from create semester dto Zod schema. */
export type CreateSemesterDto = z.infer<typeof CreateSemesterDtoSchema>;

/** Zod schema validating update semester dto. */
export const UpdateSemesterDtoSchema = CreateSemesterDtoSchema.partial();
/** TypeScript type inferred from update semester dto Zod schema. */
export type UpdateSemesterDto = z.infer<typeof UpdateSemesterDtoSchema>;

/** Zod schema validating batch dto. */
export const BatchDtoSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  size: z.number().int().min(1),
});
/** TypeScript type inferred from batch dto Zod schema. */
export type BatchDto = z.infer<typeof BatchDtoSchema>;

/** Zod schema validating section dto. */
export const SectionDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  semesterId: z.string(),
  academicYearId: z.string(),
  name: z.string().min(1),
  strength: z.number().int().min(1),
  batches: z.array(BatchDtoSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from section dto Zod schema. */
export type SectionDto = z.infer<typeof SectionDtoSchema>;

/** Zod schema validating create section dto. */
export const CreateSectionDtoSchema = z.object({
  institutionId: z.string().optional(),
  semesterId: z.string(),
  academicYearId: z.string().optional(),
  name: z.string().min(1),
  strength: z.number().int().min(1),
  batches: z.array(BatchDtoSchema).optional().default([]),
});
/** TypeScript type inferred from create section dto Zod schema. */
export type CreateSectionDto = z.infer<typeof CreateSectionDtoSchema>;

/** Zod schema validating update section dto. */
export const UpdateSectionDtoSchema = CreateSectionDtoSchema.partial();
/** TypeScript type inferred from update section dto Zod schema. */
export type UpdateSectionDto = z.infer<typeof UpdateSectionDtoSchema>;

/** Zod schema validating holiday dto. */
export const HolidayDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  type: z.enum(['holiday', 'exam', 'event', 'break']).default('holiday'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from holiday dto Zod schema. */
export type HolidayDto = z.infer<typeof HolidayDtoSchema>;

/** Zod schema validating create holiday dto. */
export const CreateHolidayDtoSchema = z.object({
  institutionId: z.string().optional(),
  name: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Format YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Format YYYY-MM-DD'),
  type: z.enum(['holiday', 'exam', 'event', 'break']).default('holiday'),
});
/** TypeScript type inferred from create holiday dto Zod schema. */
export type CreateHolidayDto = z.infer<typeof CreateHolidayDtoSchema>;

/** Zod schema validating update holiday dto. */
export const UpdateHolidayDtoSchema = CreateHolidayDtoSchema.partial();
/** TypeScript type inferred from update holiday dto Zod schema. */
export type UpdateHolidayDto = z.infer<typeof UpdateHolidayDtoSchema>;

// Hierarchical Tree Structures
/** Interface defining structure for section node. */
export interface SectionNode extends SectionDto {
  type: 'Section';
}

/** Interface defining structure for semester node. */
export interface SemesterNode extends SemesterDto {
  type: 'Semester';
  sections: SectionNode[];
}

/** Interface defining structure for academic year node. */
export interface AcademicYearNode extends AcademicYearDto {
  type: 'AcademicYear';
  semesters: SemesterNode[];
}

/** Interface defining structure for program node. */
export interface ProgramNode extends ProgramDto {
  type: 'Program';
  academicYears: AcademicYearNode[];
}

/** Interface defining structure for department node. */
export interface DepartmentNode extends DepartmentDto {
  type: 'Department';
  programs: ProgramNode[];
}

/** Interface defining structure for institution structure dto. */
export interface InstitutionStructureDto {
  institution: InstitutionDto;
  departments: DepartmentNode[];
  holidays: HolidayDto[];
  stats: {
    totalDepartments: number;
    totalPrograms: number;
    totalAcademicYears: number;
    totalSemesters: number;
    totalSections: number;
    totalStudents: number;
  };
}

// ==========================================
// LIBRARY: FACULTY, SUBJECTS, ROOMS, ELECTIVE GROUPS
// ==========================================

/** Zod schema validating slot coordinate. */
export const SlotCoordinateSchema = z.object({
  day: z.number().int().min(0).max(6),
  period: z.number().int().min(0),
});
/** TypeScript type inferred from slot coordinate Zod schema. */
export type SlotCoordinate = z.infer<typeof SlotCoordinateSchema>;

// Faculty
/** Zod schema validating faculty dto. */
export const FacultyDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  departmentId: z.string(),
  name: z.string(),
  email: z.string().email(),
  code: z.string(),
  designation: z.string(),
  availability: z.array(z.array(z.boolean())), // 7 days x N periods
  preferredPeriods: z.array(SlotCoordinateSchema).default([]),
  unavailableSlots: z.array(SlotCoordinateSchema).default([]),
  minHoursPerWeek: z.number().min(0).default(0),
  maxHoursPerDay: z.number().min(1).default(6),
  maxHoursPerWeek: z.number().min(1).default(20),
  subjectIds: z.array(z.string()).default([]), // Qualified subjects
  archived: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from faculty dto Zod schema. */
export type FacultyDto = z.infer<typeof FacultyDtoSchema>;

/** Function normalizing availability matrix dimensions according to days and periods per day. */
export function normalizeAvailabilityMatrix(
  matrix?: boolean[][] | null,
  daysCount = 5,
  periodsCount = 7,
): boolean[][] {
  const dCount = Math.max(daysCount, 1);
  const pCount = Math.max(periodsCount, 1);

  return Array.from({ length: dCount }, (_, d) => {
    const existingRow =
      matrix && Array.isArray(matrix[d]) ? matrix[d] : undefined;
    return Array.from({ length: pCount }, (_, p) => {
      if (existingRow && typeof existingRow[p] === 'boolean') {
        return existingRow[p];
      }
      return true;
    });
  });
}

/** Zod schema validating create faculty dto. */
export const CreateFacultyDtoSchema = z.object({
  institutionId: z.string().optional(),
  departmentId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  code: z.string().min(1),
  designation: z.string().default('Assistant Professor'),
  availability: z.array(z.array(z.boolean())).optional(),
  preferredPeriods: z.array(SlotCoordinateSchema).optional(),
  unavailableSlots: z.array(SlotCoordinateSchema).optional(),
  minHoursPerWeek: z.number().min(0).default(0),
  maxHoursPerDay: z.number().min(1).default(6),
  maxHoursPerWeek: z.number().min(1).default(20),
  subjectIds: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
});
/** TypeScript type inferred from create faculty dto Zod schema. */
export type CreateFacultyDto = z.infer<typeof CreateFacultyDtoSchema>;

/** Zod schema validating update faculty dto. */
export const UpdateFacultyDtoSchema = CreateFacultyDtoSchema.partial();
/** TypeScript type inferred from update faculty dto Zod schema. */
export type UpdateFacultyDto = z.infer<typeof UpdateFacultyDtoSchema>;

/** Zod schema validating faculty workload dto. */
export const FacultyWorkloadDtoSchema = z.object({
  facultyId: z.string(),
  facultyName: z.string(),
  assignedHours: z.number(),
  minHoursPerWeek: z.number(),
  maxHoursPerWeek: z.number(),
  maxHoursPerDay: z.number(),
  status: z.enum(['under', 'optimal', 'near', 'over']),
  percentage: z.number(),
});
/** TypeScript type inferred from faculty workload dto Zod schema. */
export type FacultyWorkloadDto = z.infer<typeof FacultyWorkloadDtoSchema>;

// Subject
/** Zod schema validating subject type. */
export const SubjectTypeSchema = z.enum(['theory', 'lab', 'tutorial', 'seminar']);
/** TypeScript type inferred from subject type Zod schema. */
export type SubjectType = z.infer<typeof SubjectTypeSchema>;

/** Zod schema validating room type. */
export const RoomTypeSchema = z.enum(['lecture', 'lab', 'seminar']);
/** TypeScript type inferred from room type Zod schema. */
export type RoomType = z.infer<typeof RoomTypeSchema>;

/** Zod schema validating subject requirements. */
export const SubjectRequirementsSchema = z.object({
  roomType: RoomTypeSchema.default('lecture'),
  minCapacity: z.number().int().min(1).default(30),
  equipment: z.array(z.string()).default([]),
});
/** TypeScript type inferred from subject requirements Zod schema. */
export type SubjectRequirements = z.infer<typeof SubjectRequirementsSchema>;

/** Zod schema validating subject dto. */
export const SubjectDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  departmentId: z.string(),
  programIds: z.array(z.string()).default([]),
  code: z.string(),
  name: z.string(),
  credits: z.number().min(0).default(3),
  type: SubjectTypeSchema.default('theory'),
  weeklyHours: z.number().min(1).default(3),
  labHours: z.number().min(0).default(0),
  consecutivePeriods: z.number().int().min(1).default(1),
  preferredDays: z.array(z.number().int().min(0).max(6)).default([]),
  requirements: SubjectRequirementsSchema,
  enrollment: z.number().int().min(0).default(0),
  dependsOn: z.array(z.string()).default([]),
  isElective: z.boolean().default(false),
  electiveGroupId: z.string().nullable().optional(),
  facultyIds: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from subject dto Zod schema. */
export type SubjectDto = z.infer<typeof SubjectDtoSchema>;

/** Zod schema validating create subject dto. */
export const CreateSubjectDtoSchema = z.object({
  institutionId: z.string().optional(),
  departmentId: z.string().min(1),
  programIds: z.array(z.string()).default([]),
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().min(0).default(3),
  type: SubjectTypeSchema.default('theory'),
  weeklyHours: z.number().min(1).default(3),
  labHours: z.number().min(0).default(0),
  consecutivePeriods: z.number().int().min(1).default(1),
  preferredDays: z.array(z.number().int().min(0).max(6)).default([]),
  requirements: SubjectRequirementsSchema.default({ roomType: 'lecture', minCapacity: 30, equipment: [] }),
  enrollment: z.number().int().min(0).default(0),
  dependsOn: z.array(z.string()).default([]),
  isElective: z.boolean().default(false),
  electiveGroupId: z.string().nullable().optional(),
  facultyIds: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
});
/** TypeScript type inferred from create subject dto Zod schema. */
export type CreateSubjectDto = z.infer<typeof CreateSubjectDtoSchema>;

/** Zod schema validating update subject dto. */
export const UpdateSubjectDtoSchema = CreateSubjectDtoSchema.partial();
/** TypeScript type inferred from update subject dto Zod schema. */
export type UpdateSubjectDto = z.infer<typeof UpdateSubjectDtoSchema>;

// Elective Group
/** Zod schema validating elective group dto. */
export const ElectiveGroupDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  departmentId: z.string().nullable().optional(),
  name: z.string(),
  subjectIds: z.array(z.string()).default([]),
  mustBeSimultaneous: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from elective group dto Zod schema. */
export type ElectiveGroupDto = z.infer<typeof ElectiveGroupDtoSchema>;

/** Zod schema validating create elective group dto. */
export const CreateElectiveGroupDtoSchema = z.object({
  institutionId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  name: z.string().min(1),
  subjectIds: z.array(z.string()).default([]),
  mustBeSimultaneous: z.boolean().default(true),
});
/** TypeScript type inferred from create elective group dto Zod schema. */
export type CreateElectiveGroupDto = z.infer<typeof CreateElectiveGroupDtoSchema>;

/** Zod schema validating update elective group dto. */
export const UpdateElectiveGroupDtoSchema = CreateElectiveGroupDtoSchema.partial();
/** TypeScript type inferred from update elective group dto Zod schema. */
export type UpdateElectiveGroupDto = z.infer<typeof UpdateElectiveGroupDtoSchema>;

// Room
/** Zod schema validating room dto. */
export const RoomDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  departmentId: z.string().nullable().optional(),
  name: z.string(),
  code: z.string(),
  type: RoomTypeSchema.default('lecture'),
  capacity: z.number().int().min(1),
  building: z.string(),
  equipment: z.array(z.string()).default([]),
  shared: z.boolean().default(true),
  availability: z.array(z.array(z.boolean())), // 7 days x N periods
  labFor: z.array(z.string()).default([]), // subject types or subject IDs
  archived: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from room dto Zod schema. */
export type RoomDto = z.infer<typeof RoomDtoSchema>;

/** Zod schema validating create room dto. */
export const CreateRoomDtoSchema = z.object({
  institutionId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  type: RoomTypeSchema.default('lecture'),
  capacity: z.number().int().min(1).default(40),
  building: z.string().min(1),
  equipment: z.array(z.string()).default([]),
  shared: z.boolean().default(true),
  availability: z.array(z.array(z.boolean())).optional(),
  labFor: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
});
/** TypeScript type inferred from create room dto Zod schema. */
export type CreateRoomDto = z.infer<typeof CreateRoomDtoSchema>;

/** Zod schema validating update room dto. */
export const UpdateRoomDtoSchema = CreateRoomDtoSchema.partial();
/** TypeScript type inferred from update room dto Zod schema. */
export type UpdateRoomDto = z.infer<typeof UpdateRoomDtoSchema>;

// Matchers & Strategies
/** Zod schema validating room match request. */
export const RoomMatchRequestSchema = z.object({
  subjectId: z.string().optional(),
  requiredType: RoomTypeSchema.optional(),
  minCapacity: z.number().optional(),
  requiredEquipment: z.array(z.string()).optional(),
  day: z.number().int().min(0).max(6).optional(),
  period: z.number().int().min(0).optional(),
});
/** TypeScript type inferred from room match request Zod schema. */
export type RoomMatchRequest = z.infer<typeof RoomMatchRequestSchema>;

/** Zod schema validating room match result. */
export const RoomMatchResultSchema = z.object({
  roomId: z.string(),
  roomName: z.string(),
  roomCode: z.string(),
  matched: z.boolean(),
  capacityFit: z.boolean(),
  typeFit: z.boolean(),
  equipmentFit: z.boolean(),
  availabilityFit: z.boolean(),
  missingEquipment: z.array(z.string()),
  score: z.number(),
});
/** TypeScript type inferred from room match result Zod schema. */
export type RoomMatchResult = z.infer<typeof RoomMatchResultSchema>;

/** Zod schema validating faculty qualification request. */
export const FacultyQualificationRequestSchema = z.object({
  subjectId: z.string(),
  day: z.number().int().min(0).max(6).optional(),
  period: z.number().int().min(0).optional(),
  currentDailyHours: z.number().optional(),
  currentWeeklyHours: z.number().optional(),
});
/** TypeScript type inferred from faculty qualification request Zod schema. */
export type FacultyQualificationRequest = z.infer<typeof FacultyQualificationRequestSchema>;

/** Zod schema validating faculty qualification result. */
export const FacultyQualificationResultSchema = z.object({
  facultyId: z.string(),
  facultyName: z.string(),
  facultyCode: z.string(),
  qualified: z.boolean(),
  hasSubjectQualification: z.boolean(),
  availabilityFit: z.boolean(),
  workloadWithinLimits: z.boolean(),
  isPreferredSlot: z.boolean(),
  reasons: z.array(z.string()),
  score: z.number(),
});
/** TypeScript type inferred from faculty qualification result Zod schema. */
export type FacultyQualificationResult = z.infer<typeof FacultyQualificationResultSchema>;

// Import & Export
/** Zod schema validating import entity. */
export const ImportEntitySchema = z.enum(['faculty', 'subjects', 'rooms']);
/** TypeScript type inferred from import entity Zod schema. */
export type ImportEntity = z.infer<typeof ImportEntitySchema>;

/** Zod schema validating import row error. */
export const ImportRowErrorSchema = z.object({
  row: z.number(),
  field: z.string(),
  message: z.string(),
  rawValue: z.unknown().optional(),
});
/** TypeScript type inferred from import row error Zod schema. */
export type ImportRowError = z.infer<typeof ImportRowErrorSchema>;

/** Zod schema validating import validation report. */
export const ImportValidationReportSchema = z.object({
  entity: ImportEntitySchema,
  totalRows: z.number(),
  validRows: z.number(),
  invalidRows: z.number(),
  errors: z.array(ImportRowErrorSchema),
  preview: z.array(z.record(z.unknown())),
});
/** TypeScript type inferred from import validation report Zod schema. */
export type ImportValidationReport = z.infer<typeof ImportValidationReportSchema>;

/** Zod schema validating import job status. */
export const ImportJobStatusSchema = z.object({
  jobId: z.string(),
  entity: ImportEntitySchema,
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number(),
  totalRows: z.number(),
  importedCount: z.number(),
  errors: z.array(ImportRowErrorSchema),
});
/** TypeScript type inferred from import job status Zod schema. */
export type ImportJobStatus = z.infer<typeof ImportJobStatusSchema>;

// ==========================================
// PROJECTS & SETTINGS
// ==========================================
/** Zod schema validating term kind. */
export const TermKindSchema = z.enum(['odd', 'even', 'custom']);
/** TypeScript type inferred from term kind Zod schema. */
export type TermKind = z.infer<typeof TermKindSchema>;

/** Zod schema validating project term. */
export const ProjectTermSchema = z.object({
  kind: TermKindSchema,
  startDate: z.string(),
  endDate: z.string(),
  academicYearLabel: z.string().optional(),
});
/** TypeScript type inferred from project term Zod schema. */
export type ProjectTerm = z.infer<typeof ProjectTermSchema>;

/** Zod schema validating per day override. */
export const PerDayOverrideSchema = z.object({
  periods: z.number().int().min(1).max(14).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});
/** TypeScript type inferred from per day override Zod schema. */
export type PerDayOverride = z.infer<typeof PerDayOverrideSchema>;

/** Zod schema validating project settings. */
export const ProjectSettingsSchema = z.object({
  days: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  periodsPerDay: z.number().int().min(1).max(14).default(7),
  periodDuration: z.number().int().min(30).max(180).default(50),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('09:00'),
  breaks: z.array(PeriodBreakSchema).default([]),
  perDayOverrides: z.record(z.string(), PerDayOverrideSchema).optional().default({}),
});
/** TypeScript type inferred from project settings Zod schema. */
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

/** Zod schema validating project strictness. */
export const ProjectStrictnessSchema = z.enum(['strict', 'flexible', 'relaxed']).default('strict');
/** TypeScript type inferred from project strictness Zod schema. */
export type ProjectStrictness = z.infer<typeof ProjectStrictnessSchema>;

/** Zod schema validating project dto. */
export const ProjectDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  ownerId: z.string(),
  name: z.string().min(2),
  term: ProjectTermSchema,
  status: ProjectLifecycleStatusSchema.default('draft'),
  settings: ProjectSettingsSchema,
  strictness: ProjectStrictnessSchema,
  lastOpenedAt: z.string().optional(),
  revision: z.number().int().default(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from project dto Zod schema. */
export type ProjectDto = z.infer<typeof ProjectDtoSchema>;

/** Zod schema validating create project dto. */
export const CreateProjectDtoSchema = z.object({
  name: z.string().min(2),
  institutionId: z.string().optional(),
  term: ProjectTermSchema,
  settings: ProjectSettingsSchema.optional(),
  strictness: ProjectStrictnessSchema.optional(),
  source: z.enum(['empty', 'template', 'institution']).default('empty'),
  templateId: z.string().optional(),
});
/** TypeScript type inferred from create project dto Zod schema. */
export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;

/** Zod schema validating update project dto. */
export const UpdateProjectDtoSchema = CreateProjectDtoSchema.partial();
/** TypeScript type inferred from update project dto Zod schema. */
export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;

/** Zod schema validating duplicate project dto. */
export const DuplicateProjectDtoSchema = z.object({
  name: z.string().min(2),
});
/** TypeScript type inferred from duplicate project dto Zod schema. */
export type DuplicateProjectDto = z.infer<typeof DuplicateProjectDtoSchema>;

// ==========================================
// BLUEPRINT GRAPH MODEL
// ==========================================
/** Zod schema validating node position. */
export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
/** TypeScript type inferred from node position Zod schema. */
export type NodePosition = z.infer<typeof NodePositionSchema>;

/** Zod schema validating blueprint node dto. */
export const BlueprintNodeDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: BlueprintNodeTypeSchema,
  refId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  position: NodePositionSchema,
  data: z.record(z.unknown()).default({}),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  groupId: z.string().optional(),
  createdBy: z.string().optional(),
  status: NodeStatusSchema.default('incomplete'),
  missing: z.array(MissingFieldSchema).default([]),
  effectiveStatus: NodeStatusSchema.default('incomplete'),
  constraints: z.record(z.unknown()).optional(),
});
/** TypeScript type inferred from blueprint node dto Zod schema. */
export type BlueprintNodeDto = z.infer<typeof BlueprintNodeDtoSchema>;

/** Zod schema validating blueprint edge dto. */
export const BlueprintEdgeDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().default('default'),
});
/** TypeScript type inferred from blueprint edge dto Zod schema. */
export type BlueprintEdgeDto = z.infer<typeof BlueprintEdgeDtoSchema>;

/** Zod schema validating blueprint graph dto. */
export const BlueprintGraphDtoSchema = z.object({
  projectId: z.string(),
  revision: z.number().int(),
  nodes: z.array(BlueprintNodeDtoSchema),
  edges: z.array(BlueprintEdgeDtoSchema),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from blueprint graph dto Zod schema. */
export type BlueprintGraphDto = z.infer<typeof BlueprintGraphDtoSchema>;

// ==========================================
// BLUEPRINT OPERATIONS & GATES
// ==========================================
/** Zod schema validating blueprint op type. */
export const BlueprintOpTypeSchema = z.enum([
  'add_node',
  'update_node',
  'delete_node',
  'add_edge',
  'delete_edge',
  'move_node',
]);
/** TypeScript type inferred from blueprint op type Zod schema. */
export type BlueprintOpType = z.infer<typeof BlueprintOpTypeSchema>;

/** Zod schema validating blueprint op. */
export const BlueprintOpSchema = z.object({
  opId: z.string(),
  type: BlueprintOpTypeSchema,
  targetId: z.string(),
  node: BlueprintNodeDtoSchema.partial().optional(),
  edge: BlueprintEdgeDtoSchema.partial().optional(),
  position: NodePositionSchema.optional(),
  data: z.record(z.unknown()).optional(),
  parentId: z.string().nullable().optional(),
});
/** TypeScript type inferred from blueprint op Zod schema. */
export type BlueprintOp = z.infer<typeof BlueprintOpSchema>;

/** Zod schema validating apply operations dto. */
export const ApplyOperationsDtoSchema = z.object({
  clientRevision: z.number().int().optional(),
  operations: z.array(BlueprintOpSchema),
});
/** TypeScript type inferred from apply operations dto Zod schema. */
export type ApplyOperationsDto = z.infer<typeof ApplyOperationsDtoSchema>;

/** Zod schema validating operation result applied. */
export const OperationResultAppliedSchema = z.object({
  opId: z.string(),
  type: BlueprintOpTypeSchema,
  targetId: z.string(),
});
/** TypeScript type inferred from operation result applied Zod schema. */
export type OperationResultApplied = z.infer<typeof OperationResultAppliedSchema>;

/** Zod schema validating operation result skipped. */
export const OperationResultSkippedSchema = z.object({
  opId: z.string(),
  type: BlueprintOpTypeSchema,
  targetId: z.string(),
  reasonCode: ReasonCodeSchema,
  message: z.string(),
  fixHint: FixHintSchema.optional(),
});
/** TypeScript type inferred from operation result skipped Zod schema. */
export type OperationResultSkipped = z.infer<typeof OperationResultSkippedSchema>;

/** Zod schema validating batch operation result. */
export const BatchOperationResultSchema = z.object({
  revision: z.number().int(),
  applied: z.array(OperationResultAppliedSchema),
  skipped: z.array(OperationResultSkippedSchema),
  graph: BlueprintGraphDtoSchema.optional(),
});
/** TypeScript type inferred from batch operation result Zod schema. */
export type BatchOperationResult = z.infer<typeof BatchOperationResultSchema>;

// ==========================================
// READINESS, IMPACT, RECOMMENDATIONS
// ==========================================
/** Zod schema validating blueprint missing item. */
export const BlueprintMissingItemSchema = z.object({
  nodeId: z.string(),
  nodeType: z.string(),
  nodeName: z.string(),
  field: z.string(),
  message: z.string(),
  fixHint: FixHintSchema,
});
/** TypeScript type inferred from blueprint missing item Zod schema. */
export type BlueprintMissingItem = z.infer<typeof BlueprintMissingItemSchema>;

/** Zod schema validating blueprint readiness dto. */
export const BlueprintReadinessDtoSchema = z.object({
  totalNodes: z.number().int(),
  completedCount: z.number().int(),
  incompleteCount: z.number().int(),
  blockedCount: z.number().int(),
  percentComplete: z.number(),
  missingItems: z.array(BlueprintMissingItemSchema),
  healthScore: z.number(),
  isReadyForBuild: z.boolean(),
});
/** TypeScript type inferred from blueprint readiness dto Zod schema. */
export type BlueprintReadinessDto = z.infer<typeof BlueprintReadinessDtoSchema>;

/** Zod schema validating blueprint impact dto. */
export const BlueprintImpactDtoSchema = z.object({
  nodeId: z.string(),
  descendantsCount: z.number().int(),
  descendantNodeIds: z.array(z.string()),
  subjectAssignmentsCount: z.number().int(),
  affectedBuildsCount: z.number().int(),
});
/** TypeScript type inferred from blueprint impact dto Zod schema. */
export type BlueprintImpactDto = z.infer<typeof BlueprintImpactDtoSchema>;

/** Zod schema validating blueprint recommendation type. */
export const BlueprintRecommendationTypeSchema = z.enum([
  'faculty',
  'room',
  'missing_connection',
  'unused_resource',
]);
/** TypeScript type inferred from blueprint recommendation type Zod schema. */
export type BlueprintRecommendationType = z.infer<typeof BlueprintRecommendationTypeSchema>;

/** Zod schema validating blueprint recommendation dto. */
export const BlueprintRecommendationDtoSchema = z.object({
  type: BlueprintRecommendationTypeSchema,
  title: z.string(),
  description: z.string(),
  nodeId: z.string().optional(),
  targetId: z.string().optional(),
  reason: z.string(),
  score: z.number().optional(),
});
/** TypeScript type inferred from blueprint recommendation dto Zod schema. */
export type BlueprintRecommendationDto = z.infer<typeof BlueprintRecommendationDtoSchema>;

// ==========================================
// TEMPLATES, SNAPSHOTS, HISTORY & COMMENTS
// ==========================================
/** Zod schema validating graph template subtree. */
export const GraphTemplateSubtreeSchema = z.object({
  nodes: z.array(BlueprintNodeDtoSchema.partial()),
  edges: z.array(BlueprintEdgeDtoSchema.partial()),
});
/** TypeScript type inferred from graph template subtree Zod schema. */
export type GraphTemplateSubtree = z.infer<typeof GraphTemplateSubtreeSchema>;

/** Zod schema validating graph template dto. */
export const GraphTemplateDtoSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  category: z.string().min(2),
  subtree: GraphTemplateSubtreeSchema,
  version: z.number().int().default(1),
  visibility: z.enum(['public', 'institution', 'private']).default('public'),
  institutionId: z.string().optional(),
  createdById: z.string().optional(),
  anchorNodeType: BlueprintNodeTypeSchema.optional(),
  createdAt: z.string().optional(),
});
/** TypeScript type inferred from graph template dto Zod schema. */
export type GraphTemplateDto = z.infer<typeof GraphTemplateDtoSchema>;

/** Zod schema validating create graph template dto. */
export const CreateGraphTemplateDtoSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  subtree: GraphTemplateSubtreeSchema,
  version: z.number().int().optional().default(1),
  visibility: z.enum(['public', 'institution', 'private']).optional().default('institution'),
  anchorNodeType: BlueprintNodeTypeSchema.optional(),
});
/** TypeScript type inferred from create graph template dto Zod schema. */
export type CreateGraphTemplateDto = z.infer<typeof CreateGraphTemplateDtoSchema>;

/** Zod schema validating apply template dto. */
export const ApplyTemplateDtoSchema = z.object({
  anchorNodeId: z.string().optional(),
});
/** TypeScript type inferred from apply template dto Zod schema. */
export type ApplyTemplateDto = z.infer<typeof ApplyTemplateDtoSchema>;

/** Zod schema validating blueprint history entry dto. */
export const BlueprintHistoryEntryDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  revision: z.number().int(),
  operationType: z.string(),
  description: z.string(),
  userId: z.string(),
  timestamp: z.string(),
});
/** TypeScript type inferred from blueprint history entry dto Zod schema. */
export type BlueprintHistoryEntryDto = z.infer<typeof BlueprintHistoryEntryDtoSchema>;

/** Zod schema validating blueprint snapshot dto. */
export const BlueprintSnapshotDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  revision: z.number().int(),
  label: z.string(),
  graph: BlueprintGraphDtoSchema,
  createdAt: z.string(),
});
/** TypeScript type inferred from blueprint snapshot dto Zod schema. */
export type BlueprintSnapshotDto = z.infer<typeof BlueprintSnapshotDtoSchema>;

/** Zod schema validating create blueprint snapshot dto. */
export const CreateBlueprintSnapshotDtoSchema = z.object({
  label: z.string().min(1),
});
/** TypeScript type inferred from create blueprint snapshot dto Zod schema. */
export type CreateBlueprintSnapshotDto = z.infer<typeof CreateBlueprintSnapshotDtoSchema>;

/** Zod schema validating blueprint comment dto. */
export const BlueprintCommentDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  nodeId: z.string(),
  userId: z.string(),
  userName: z.string(),
  text: z.string(),
  createdAt: z.string(),
});
/** TypeScript type inferred from blueprint comment dto Zod schema. */
export type BlueprintCommentDto = z.infer<typeof BlueprintCommentDtoSchema>;

/** Zod schema validating create blueprint comment dto. */
export const CreateBlueprintCommentDtoSchema = z.object({
  text: z.string().min(1),
});
/** TypeScript type inferred from create blueprint comment dto Zod schema. */
export type CreateBlueprintCommentDto = z.infer<typeof CreateBlueprintCommentDtoSchema>;

// ==========================================
// SOCKET CONTRACT (/blueprint)
// ==========================================
/** Zod schema validating project join payload. */
export const ProjectJoinPayloadSchema = z.object({
  projectId: z.string(),
});
/** TypeScript type inferred from project join payload Zod schema. */
export type ProjectJoinPayload = z.infer<typeof ProjectJoinPayloadSchema>;

/** Zod schema validating project leave payload. */
export const ProjectLeavePayloadSchema = z.object({
  projectId: z.string(),
});
/** TypeScript type inferred from project leave payload Zod schema. */
export type ProjectLeavePayload = z.infer<typeof ProjectLeavePayloadSchema>;

/** Zod schema validating cursor update payload. */
export const CursorUpdatePayloadSchema = z.object({
  projectId: z.string(),
  x: z.number(),
  y: z.number(),
});
/** TypeScript type inferred from cursor update payload Zod schema. */
export type CursorUpdatePayload = z.infer<typeof CursorUpdatePayloadSchema>;

/** Zod schema validating node lock payload. */
export const NodeLockPayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
});
/** TypeScript type inferred from node lock payload Zod schema. */
export type NodeLockPayload = z.infer<typeof NodeLockPayloadSchema>;

/** Zod schema validating node unlock payload. */
export const NodeUnlockPayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
});
/** TypeScript type inferred from node unlock payload Zod schema. */
export type NodeUnlockPayload = z.infer<typeof NodeUnlockPayloadSchema>;

/** Zod schema validating presence user. */
export const PresenceUserSchema = z.object({
  userId: z.string(),
  name: z.string(),
  color: z.string(),
  activeNodeId: z.string().optional(),
  cursor: z.object({ x: z.number(), y: z.number() }).optional(),
});
/** TypeScript type inferred from presence user Zod schema. */
export type PresenceUser = z.infer<typeof PresenceUserSchema>;

/** Zod schema validating presence changed payload. */
export const PresenceChangedPayloadSchema = z.object({
  users: z.array(PresenceUserSchema),
});
/** TypeScript type inferred from presence changed payload Zod schema. */
export type PresenceChangedPayload = z.infer<typeof PresenceChangedPayloadSchema>;

/** Zod schema validating node status changed payload. */
export const NodeStatusChangedPayloadSchema = z.object({
  nodeId: z.string(),
  status: NodeStatusSchema,
  missing: z.array(MissingFieldSchema),
  effectiveStatus: NodeStatusSchema,
});
/** TypeScript type inferred from node status changed payload Zod schema. */
export type NodeStatusChangedPayload = z.infer<typeof NodeStatusChangedPayloadSchema>;

/** Zod schema validating ops applied payload. */
export const OpsAppliedPayloadSchema = z.object({
  revision: z.number().int(),
  applied: z.array(OperationResultAppliedSchema),
  skipped: z.array(OperationResultSkippedSchema).optional(),
});
/** TypeScript type inferred from ops applied payload Zod schema. */
export type OpsAppliedPayload = z.infer<typeof OpsAppliedPayloadSchema>;

/** Zod schema validating node locked payload. */
export const NodeLockedPayloadSchema = z.object({
  nodeId: z.string(),
  userId: z.string(),
  userName: z.string(),
});
/** TypeScript type inferred from node locked payload Zod schema. */
export type NodeLockedPayload = z.infer<typeof NodeLockedPayloadSchema>;

/** Zod schema validating node unlocked payload. */
export const NodeUnlockedPayloadSchema = z.object({
  nodeId: z.string(),
});
/** TypeScript type inferred from node unlocked payload Zod schema. */
export type NodeUnlockedPayload = z.infer<typeof NodeUnlockedPayloadSchema>;

/** Zod schema validating revision conflict payload. */
export const RevisionConflictPayloadSchema = z.object({
  currentRevision: z.number().int(),
  rejectedRevision: z.number().int(),
  message: z.string(),
});
/** TypeScript type inferred from revision conflict payload Zod schema. */
export type RevisionConflictPayload = z.infer<typeof RevisionConflictPayloadSchema>;

/** Zod schema validating node move payload. */
export const NodeMovePayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
  position: NodePositionSchema,
});
/** TypeScript type inferred from node move payload Zod schema. */
export type NodeMovePayload = z.infer<typeof NodeMovePayloadSchema>;

/** Zod schema validating node update payload. */
export const NodeUpdatePayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
  data: z.record(z.unknown()),
});
/** TypeScript type inferred from node update payload Zod schema. */
export type NodeUpdatePayload = z.infer<typeof NodeUpdatePayloadSchema>;

/** Zod schema validating node add payload. */
export const NodeAddPayloadSchema = z.object({
  projectId: z.string(),
  node: BlueprintNodeDtoSchema,
  parentId: z.string().nullable().optional(),
});
/** TypeScript type inferred from node add payload Zod schema. */
export type NodeAddPayload = z.infer<typeof NodeAddPayloadSchema>;

/** Zod schema validating node delete payload. */
export const NodeDeletePayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
});
/** TypeScript type inferred from node delete payload Zod schema. */
export type NodeDeletePayload = z.infer<typeof NodeDeletePayloadSchema>;

/** Zod schema validating edge add payload. */
export const EdgeAddPayloadSchema = z.object({
  projectId: z.string(),
  edge: BlueprintEdgeDtoSchema,
});
/** TypeScript type inferred from edge add payload Zod schema. */
export type EdgeAddPayload = z.infer<typeof EdgeAddPayloadSchema>;

/** Zod schema validating edge delete payload. */
export const EdgeDeletePayloadSchema = z.object({
  projectId: z.string(),
  edgeId: z.string(),
});
/** TypeScript type inferred from edge delete payload Zod schema. */
export type EdgeDeletePayload = z.infer<typeof EdgeDeletePayloadSchema>;

// ==========================================
// CONSTRAINT ENGINE & VALIDATION MODEL
// ==========================================

/** Zod schema validating slot type. */
export const SlotTypeSchema = z.enum([
  'theory',
  'lab',
  'tutorial',
  'seminar',
  'break',
  'free',
  'exam',
  'event',
  'empty',
]);
/** TypeScript type inferred from slot type Zod schema. */
export type SlotType = z.infer<typeof SlotTypeSchema>;

/** Zod schema validating slot dto. */
export const SlotDtoSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  batchId: z.string().optional(),
  day: z.number().int().min(0).max(6),
  period: z.number().int().min(1),
  type: SlotTypeSchema,
  subjectId: z.string().optional(),
  facultyId: z.string().optional(),
  roomId: z.string().optional(),
  span: z.number().int().min(1).default(1),
  isLocked: z.boolean().default(false),
});
/** TypeScript type inferred from slot dto Zod schema. */
export type SlotDto = z.infer<typeof SlotDtoSchema>;

/** Zod schema validating violation severity. */
export const ViolationSeveritySchema = z.enum(['error', 'warning', 'info']);
/** TypeScript type inferred from violation severity Zod schema. */
export type ViolationSeverity = z.infer<typeof ViolationSeveritySchema>;

/** Zod schema validating violation suggestion. */
export const ViolationSuggestionSchema = z.object({
  type: z.enum(['period', 'room', 'faculty', 'swap']),
  description: z.string(),
  day: z.number().int().optional(),
  period: z.number().int().optional(),
  roomId: z.string().optional(),
  facultyId: z.string().optional(),
  score: z.number().optional(),
});
/** TypeScript type inferred from violation suggestion Zod schema. */
export type ViolationSuggestion = z.infer<typeof ViolationSuggestionSchema>;

/** Zod schema validating violation dto. */
export const ViolationDtoSchema = z.object({
  id: z.string(),
  constraintId: z.string(),
  severity: ViolationSeveritySchema,
  type: z.enum(['hard', 'soft']),
  message: z.string(),
  facultyId: z.string().optional(),
  roomId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  slotRefs: z.array(z.string()).default([]),
  suggestions: z.array(ViolationSuggestionSchema).default([]),
});
/** TypeScript type inferred from violation dto Zod schema. */
export type ViolationDto = z.infer<typeof ViolationDtoSchema>;

/** Zod schema validating pre build check error. */
export const PreBuildCheckErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fixHint: z.object({
    nodeId: z.string().optional(),
    field: z.string().optional(),
  }).optional(),
  details: z.record(z.unknown()).optional(),
});
/** TypeScript type inferred from pre build check error Zod schema. */
export type PreBuildCheckError = z.infer<typeof PreBuildCheckErrorSchema>;

/** Zod schema validating validation report dto. */
export const ValidationReportDtoSchema = z.object({
  valid: z.boolean(),
  score: z.number(),
  hardViolationsCount: z.number(),
  softViolationsCount: z.number(),
  violations: z.array(ViolationDtoSchema),
  preBuildErrors: z.array(PreBuildCheckErrorSchema),
  validatedAt: z.string(),
});
/** TypeScript type inferred from validation report dto Zod schema. */
export type ValidationReportDto = z.infer<typeof ValidationReportDtoSchema>;

/** Zod schema validating validate project dto. */
export const ValidateProjectDtoSchema = z.object({
  slots: z.array(SlotDtoSchema).optional(),
});
/** TypeScript type inferred from validate project dto Zod schema. */
export type ValidateProjectDto = z.infer<typeof ValidateProjectDtoSchema>;

/** Zod schema validating validate version dto. */
export const ValidateVersionDtoSchema = z.object({
  slots: z.array(SlotDtoSchema).optional(),
});
/** TypeScript type inferred from validate version dto Zod schema. */
export type ValidateVersionDto = z.infer<typeof ValidateVersionDtoSchema>;

/** Zod schema validating constraint scope. */
export const ConstraintScopeSchema = z.enum(['institution', 'department', 'program', 'section']);
/** TypeScript type inferred from constraint scope Zod schema. */
export type ConstraintScope = z.infer<typeof ConstraintScopeSchema>;

/** Zod schema validating hard constraints config. */
export const HardConstraintsConfigSchema = z.object({
  facultyNoDoubleBooking: z.boolean().default(true),
  roomNoDoubleBooking: z.boolean().default(true),
  sectionNoDoubleBooking: z.boolean().default(true),
  facultyAvailability: z.boolean().default(true),
  roomAvailability: z.boolean().default(true),
  sectionAvailability: z.boolean().default(true),
  maxHoursPerDay: z.number().int().min(1).max(12).default(4),
  maxHoursPerWeek: z.number().int().min(1).max(50).default(18),
  minHoursPerWeek: z.number().int().min(0).max(40).default(10),
  maxClassesPerDay: z.number().int().min(1).max(10).default(5),
  minBreaks: z.number().int().min(0).max(5).default(1),
  roomCapacityFitsSection: z.boolean().default(true),
  roomTypeMatchesSubject: z.boolean().default(true),
  equipmentMatch: z.boolean().default(true),
  labConsecutiveBlock: z.boolean().default(true),
  electiveSimultaneity: z.boolean().default(true),
  holidayExclusion: z.boolean().default(true),
  weeklyHoursMet: z.boolean().default(true),
  missingAllocation: z.boolean().default(true),
  breakNotOverwritable: z.boolean().default(true),
});
/** TypeScript type inferred from hard constraints config Zod schema. */
export type HardConstraintsConfig = z.infer<typeof HardConstraintsConfigSchema>;

/** Zod schema validating soft constraints config. */
export const SoftConstraintsConfigSchema = z.object({
  facultyPreferredPeriods: z.number().int().min(0).max(10).default(5),
  spreadSubjectsAcrossDays: z.number().int().min(0).max(10).default(8),
  limitConsecutiveSameSubject: z.number().int().min(0).max(10).default(6),
  balanceFacultyLoad: z.number().int().min(0).max(10).default(5),
  labsInAfternoon: z.number().int().min(0).max(10).default(7),
  minimizeRoomChanges: z.number().int().min(0).max(10).default(4),
  departmentRules: z.number().int().min(0).max(10).default(5),
});
/** TypeScript type inferred from soft constraints config Zod schema. */
export type SoftConstraintsConfig = z.infer<typeof SoftConstraintsConfigSchema>;

/** Zod schema validating constraint group config. */
export const ConstraintGroupConfigSchema = z.object({
  scope: ConstraintScopeSchema,
  scopeId: z.string(),
  hard: HardConstraintsConfigSchema.partial(),
  soft: SoftConstraintsConfigSchema.partial(),
  overrides: z.array(z.string()).default([]),
});
/** TypeScript type inferred from constraint group config Zod schema. */
export type ConstraintGroupConfig = z.infer<typeof ConstraintGroupConfigSchema>;

// ============================================================================
// Phase 9: Builds & Schedule Versions
// ============================================================================

/** Zod schema validating schedule version kind. */
export const ScheduleVersionKindSchema = z.enum(['auto', 'regenerate', 'manual']);
/** TypeScript type inferred from schedule version kind Zod schema. */
export type ScheduleVersionKind = z.infer<typeof ScheduleVersionKindSchema>;

/** Zod schema validating schedule version status. */
export const ScheduleVersionStatusSchema = z.enum(['draft', 'ready', 'published', 'archived']);
/** TypeScript type inferred from schedule version status Zod schema. */
export type ScheduleVersionStatus = z.infer<typeof ScheduleVersionStatusSchema>;

/** Zod schema validating schedule version stats. */
export const ScheduleVersionStatsSchema = z.object({
  totalSlots: z.number().int().default(0),
  occupiedSlots: z.number().int().default(0),
  roomUtilizationPct: z.number().min(0).max(100).default(0),
  facultyLoadBalanceScore: z.number().min(0).max(100).default(0),
  afternoonLabPct: z.number().min(0).max(100).default(0),
});
/** TypeScript type inferred from schedule version stats Zod schema. */
export type ScheduleVersionStats = z.infer<typeof ScheduleVersionStatsSchema>;

/** Zod schema validating schedule version dto. */
export const ScheduleVersionDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  versionNo: z.number().int(),
  label: z.string(),
  slots: z.array(SlotDtoSchema),
  conflicts: z.array(ViolationDtoSchema).default([]),
  stats: ScheduleVersionStatsSchema,
  score: z.number().min(0).max(100).default(100),
  kind: ScheduleVersionKindSchema.default('auto'),
  revision: z.number().int().default(1),
  status: ScheduleVersionStatusSchema.default('ready'),
  createdAt: z.string(),
  updatedAt: z.string(),
});
/** TypeScript type inferred from schedule version dto Zod schema. */
export type ScheduleVersionDto = z.infer<typeof ScheduleVersionDtoSchema>;

/** Zod schema validating build profile. */
export const BuildProfileSchema = z.enum([
  'standard',
  'workload-balanced',
  'preference-first',
  'room-efficient',
]);
/** TypeScript type inferred from build profile Zod schema. */
export type BuildProfile = z.infer<typeof BuildProfileSchema>;

/** Zod schema validating build mode. */
export const BuildModeSchema = z.enum(['fresh', 'regenerate']);
/** TypeScript type inferred from build mode Zod schema. */
export type BuildMode = z.infer<typeof BuildModeSchema>;

/** Zod schema validating create build dto. */
export const CreateBuildDtoSchema = z.object({
  alternatives: z.number().int().min(1).max(5).default(3),
  profile: BuildProfileSchema.default('standard'),
  mode: BuildModeSchema.default('fresh'),
  seed: z.number().int().optional(),
  timeLimitMs: z.number().int().min(1000).max(60000).default(10000),
});
/** TypeScript type inferred from create build dto Zod schema. */
export type CreateBuildDto = z.infer<typeof CreateBuildDtoSchema>;

/** Zod schema validating build job status. */
export const BuildJobStatusSchema = z.enum([
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
]);
/** TypeScript type inferred from build job status Zod schema. */
export type BuildJobStatus = z.infer<typeof BuildJobStatusSchema>;

/** Zod schema validating build progress payload. */
export const BuildProgressPayloadSchema = z.object({
  projectId: z.string(),
  buildId: z.string().optional(),
  status: BuildJobStatusSchema,
  progress: z.number().min(0).max(100),
  step: z.string(),
  message: z.string(),
  versions: z.array(ScheduleVersionDtoSchema).optional(),
  error: z.string().optional(),
  missing: z.array(z.unknown()).optional(),
});
/** TypeScript type inferred from build progress payload Zod schema. */
export type BuildProgressPayload = z.infer<typeof BuildProgressPayloadSchema>;



// ============================================================================
// Phase 10: Board & Studio Schedules
// ============================================================================

/** Zod schema validating schedule resource type. */
export const ScheduleResourceTypeSchema = z.enum(['faculty', 'room', 'section', 'batch']);
/** TypeScript type inferred from schedule resource type Zod schema. */
export type ScheduleResourceType = z.infer<typeof ScheduleResourceTypeSchema>;

/** Zod schema validating schedule entry dto. */
export const ScheduleEntryDtoSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  sectionId: z.string(),
  batchId: z.string().optional(),
  day: z.number().int().min(0).max(6),
  startPeriod: z.number().int().min(1),
  span: z.number().int().min(1).default(1),
  type: SlotTypeSchema,
  subjectId: z.string().optional(),
  facultyId: z.string().optional(),
  roomId: z.string().optional(),
  locked: z.boolean().default(false),
  revision: z.number().int().default(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
/** TypeScript type inferred from schedule entry dto Zod schema. */
export type ScheduleEntryDto = z.infer<typeof ScheduleEntryDtoSchema>;

/** Zod schema validating schedule occupancy dto. */
export const ScheduleOccupancyDtoSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  resourceType: ScheduleResourceTypeSchema,
  resourceId: z.string(),
  day: z.number().int().min(0).max(6),
  period: z.number().int().min(1),
  entryId: z.string(),
});
/** TypeScript type inferred from schedule occupancy dto Zod schema. */
export type ScheduleOccupancyDto = z.infer<typeof ScheduleOccupancyDtoSchema>;

/** Zod schema validating schedule operation dto. */
export const ScheduleOperationDtoSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  seq: z.number().int(),
  userId: z.string(),
  type: z.string(),
  forward: z.record(z.unknown()),
  inverse: z.record(z.unknown()),
  at: z.string(),
});
/** TypeScript type inferred from schedule operation dto Zod schema. */
export type ScheduleOperationDto = z.infer<typeof ScheduleOperationDtoSchema>;

/** Zod schema validating move slot dto. */
export const MoveSlotDtoSchema = z.object({
  targetDay: z.number().int().min(0).max(6),
  targetStartPeriod: z.number().int().min(1),
  targetRoomId: z.string().optional(),
  targetFacultyId: z.string().optional(),
});
/** TypeScript type inferred from move slot dto Zod schema. */
export type MoveSlotDto = z.infer<typeof MoveSlotDtoSchema>;

/** Zod schema validating swap slots dto. */
export const SwapSlotsDtoSchema = z.object({
  slotIdA: z.string(),
  slotIdB: z.string(),
});
/** TypeScript type inferred from swap slots dto Zod schema. */
export type SwapSlotsDto = z.infer<typeof SwapSlotsDtoSchema>;

/** Zod schema validating edit slot dto. */
export const EditSlotDtoSchema = z.object({
  slotId: z.string().optional(),
  subjectId: z.string().optional(),
  facultyId: z.string().optional(),
  roomId: z.string().optional(),
  type: SlotTypeSchema.optional(),
  batchId: z.string().optional(),
  span: z.number().int().min(1).optional(),
});
/** TypeScript type inferred from edit slot dto Zod schema. */
export type EditSlotDto = z.infer<typeof EditSlotDtoSchema>;

/** Zod schema validating bulk slot action type. */
export const BulkSlotActionTypeSchema = z.enum([
  'assign_faculty',
  'assign_room',
  'change_subject',
  'clear',
  'lock',
  'unlock',
  'copy_paste',
]);
/** TypeScript type inferred from bulk slot action type Zod schema. */
export type BulkSlotActionType = z.infer<typeof BulkSlotActionTypeSchema>;

/** Zod schema validating bulk slots dto. */
export const BulkSlotsDtoSchema = z.object({
  action: BulkSlotActionTypeSchema,
  slotIds: z.array(z.string()).min(1),
  facultyId: z.string().optional(),
  roomId: z.string().optional(),
  subjectId: z.string().optional(),
  copyPasteMode: z.enum(['full', 'subject_only', 'faculty_only', 'room_only']).optional(),
  targetSlotIds: z.array(z.string()).optional(),
});
/** TypeScript type inferred from bulk slots dto Zod schema. */
export type BulkSlotsDto = z.infer<typeof BulkSlotsDtoSchema>;

/** Zod schema validating merge slot dto. */
export const MergeSlotDtoSchema = z.object({
  span: z.number().int().min(2),
});
/** TypeScript type inferred from merge slot dto Zod schema. */
export type MergeSlotDto = z.infer<typeof MergeSlotDtoSchema>;

/** Zod schema validating split slot dto. */
export const SplitSlotDtoSchema = z.object({
  splitIntoSpans: z.array(z.number().int().min(1)).optional(),
});
/** TypeScript type inferred from split slot dto Zod schema. */
export type SplitSlotDto = z.infer<typeof SplitSlotDtoSchema>;

/** Zod schema validating lock scope. */
export const LockScopeSchema = z.enum(['cell', 'row', 'day', 'timetable']);
/** TypeScript type inferred from lock scope Zod schema. */
export type LockScope = z.infer<typeof LockScopeSchema>;

/** Zod schema validating lock slot dto. */
export const LockSlotDtoSchema = z.object({
  scope: LockScopeSchema,
  locked: z.boolean(),
  slotId: z.string().optional(),
  day: z.number().int().min(0).max(6).optional(),
  period: z.number().int().min(1).optional(),
  sectionId: z.string().optional(),
});
/** TypeScript type inferred from lock slot dto Zod schema. */
export type LockSlotDto = z.infer<typeof LockSlotDtoSchema>;

/** Zod schema validating update periods dto. */
export const UpdatePeriodsDtoSchema = z.object({
  periodsPerDay: z.number().int().min(1).max(16),
  periodDuration: z.number().int().min(15).max(180),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('09:00'),
  breaks: z.array(z.object({
    period: z.number().int().min(1),
    name: z.string().min(1),
  })).default([]),
  days: z.array(z.string()).min(1).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  dryRun: z.boolean().optional(),
});
/** TypeScript type inferred from update periods dto Zod schema. */
export type UpdatePeriodsDto = z.infer<typeof UpdatePeriodsDtoSchema>;

/** Zod schema validating periods change result dto. */
export const PeriodsChangeResultDtoSchema = z.object({
  updated: z.boolean(),
  invalidEntriesCount: z.number().int(),
  invalidEntries: z.array(z.object({
    id: z.string(),
    day: z.number().int(),
    startPeriod: z.number().int(),
    span: z.number().int(),
    reason: z.string(),
  })),
});
/** TypeScript type inferred from periods change result dto Zod schema. */
export type PeriodsChangeResultDto = z.infer<typeof PeriodsChangeResultDtoSchema>;

/** Zod schema validating move validation result dto. */
export const MoveValidationResultDtoSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  code: z.string().optional(),
  suggestions: z.array(ViolationSuggestionSchema).default([]),
});
/** TypeScript type inferred from move validation result dto Zod schema. */
export type MoveValidationResultDto = z.infer<typeof MoveValidationResultDtoSchema>;

/** Constant socket events for schedule namespace. */
export const ScheduleSocketEvents = {
  JOIN_SCHEDULE: 'schedule:join',
  LEAVE_SCHEDULE: 'schedule:leave',
  SLOT_MOVED: 'slot:moved',
  SLOT_UPDATED: 'slot:updated',
  SLOT_LOCKED: 'slot:locked',
  SLOT_CLEARED: 'slot:cleared',
  REVISION_CONFLICT: 'revision:conflict',
  PRESENCE_CHANGED: 'presence:changed',
} as const;
