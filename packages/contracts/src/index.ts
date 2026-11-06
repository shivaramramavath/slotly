import { z } from 'zod';

// ==========================================
// ERROR CONTRACT
// ==========================================
export const ApiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ==========================================
// PAGINATION CONTRACT
// ==========================================
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

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
export const RevisionConflictSchema = z.object({
  code: z.literal('REVISION_CONFLICT'),
  message: z.string(),
  currentRevision: z.number(),
  rejectedRevision: z.number(),
  currentState: z.unknown().optional(),
});
export type RevisionConflict = z.infer<typeof RevisionConflictSchema>;

// ==========================================
// ROLES & PERMISSIONS
// ==========================================
export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'DESIGNER',
  'FACULTY',
  'STUDENT',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

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
  // Projects
  'PROJECT_CREATE',
  'PROJECT_READ',
  'PROJECT_MANAGE',
  'PROJECT_DELETE',
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
export type Permission = z.infer<typeof PermissionSchema>;

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
    'PROJECT_CREATE',
    'PROJECT_READ',
    'PROJECT_MANAGE',
    'PROJECT_DELETE',
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
    'ROOM_READ',
    'PROJECT_CREATE',
    'PROJECT_READ',
    'PROJECT_MANAGE',
    'BLUEPRINT_READ',
    'BLUEPRINT_EDIT',
    'BLUEPRINT_BUILD',
    'BLUEPRINT_TEMPLATE_MANAGE',
    'TIMETABLE_READ',
    'TIMETABLE_EDIT',
    'TIMETABLE_EXPORT',
  ],
  FACULTY: ['INSTITUTION_READ', 'FACULTY_READ', 'TIMETABLE_READ', 'TIMETABLE_EXPORT'],
  STUDENT: ['INSTITUTION_READ', 'TIMETABLE_READ', 'TIMETABLE_EXPORT'],
};

// ==========================================
// AUTH & USER SCHEMAS & DTOS
// ==========================================
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
export type UserDto = z.infer<typeof UserDtoSchema>;

export const RegisterDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters').max(128),
  name: z.string().min(2),
  institutionName: z.string().optional(),
  institutionCode: z.string().optional(),
});
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  code: z.string().optional(), // MFA code if logging in with 2FA
});
export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string().optional(),
  user: UserDtoSchema.optional(),
  mfaRequired: z.boolean().optional(),
  mfaToken: z.string().optional(), // temporary token for MFA challenge
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const VerifyEmailDtoSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>;

export const ResendEmailDtoSchema = z.object({
  email: z.string().email(),
});
export type ResendEmailDto = z.infer<typeof ResendEmailDtoSchema>;

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

export const ResetPasswordDtoSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(12).max(128),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(12).max(128),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

export const MfaEnrollResponseSchema = z.object({
  secret: z.string(),
  qrCodeUrl: z.string(),
  recoveryCodes: z.array(z.string()),
});
export type MfaEnrollResponse = z.infer<typeof MfaEnrollResponseSchema>;

export const MfaVerifyDtoSchema = z.object({
  code: z.string().min(6),
  mfaToken: z.string().optional(),
});
export type MfaVerifyDto = z.infer<typeof MfaVerifyDtoSchema>;

export const MfaRecoveryDtoSchema = z.object({
  email: z.string().email(),
  recoveryCode: z.string().min(8),
});
export type MfaRecoveryDto = z.infer<typeof MfaRecoveryDtoSchema>;

export const StepUpDtoSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
});
export type StepUpDto = z.infer<typeof StepUpDtoSchema>;

export const SessionDtoSchema = z.object({
  sessionId: z.string(),
  device: z.string(),
  browser: z.string(),
  ip: z.string(),
  lastActiveAt: z.string(),
  createdAt: z.string(),
  isCurrent: z.boolean(),
});
export type SessionDto = z.infer<typeof SessionDtoSchema>;

export const DeviceDtoSchema = z.object({
  deviceId: z.string(),
  name: z.string(),
  browser: z.string(),
  os: z.string(),
  ip: z.string(),
  lastActiveAt: z.string(),
  isTrusted: z.boolean(),
});
export type DeviceDto = z.infer<typeof DeviceDtoSchema>;

export const SecurityActivityDtoSchema = z.object({
  id: z.string(),
  action: z.string(),
  ipAddress: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type SecurityActivityDto = z.infer<typeof SecurityActivityDtoSchema>;

// ==========================================
// REASON CODES (BLUEPRINT_RULES.md - G8)
// ==========================================
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
]);
export type ReasonCode = z.infer<typeof ReasonCodeSchema>;

export const FixHintSchema = z.object({
  nodeId: z.string(),
  field: z.string(),
});
export type FixHint = z.infer<typeof FixHintSchema>;

export const GateFailureSchema = z.object({
  code: ReasonCodeSchema,
  message: z.string(),
  fixHint: FixHintSchema.optional(),
});
export type GateFailure = z.infer<typeof GateFailureSchema>;

// ==========================================
// NODE STATUS & HIERARCHY
// ==========================================
export const NodeStatusSchema = z.enum(['empty', 'incomplete', 'complete', 'blocked']);
export type NodeStatus = z.infer<typeof NodeStatusSchema>;

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
]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const MissingFieldSchema = z.object({
  field: z.string(),
  message: z.string(),
});
export type MissingField = z.infer<typeof MissingFieldSchema>;

export const NodeComputedStatusSchema = z.object({
  status: NodeStatusSchema,
  missing: z.array(MissingFieldSchema),
});
export type NodeComputedStatus = z.infer<typeof NodeComputedStatusSchema>;

// ==========================================
// PROJECT LIFECYCLE
// ==========================================
export const ProjectLifecycleStatusSchema = z.enum([
  'draft',
  'building',
  'ready',
  'pending_approval',
  'published',
  'archived',
]);
export type ProjectLifecycleStatus = z.infer<typeof ProjectLifecycleStatusSchema>;

// ==========================================
// SOCKET EVENT NAMES (ROUTES.md)
// ==========================================
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
} as const;

// ==========================================
// HEALTH CONTRACT
// ==========================================
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
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ==========================================
// INSTITUTION & ACADEMIC HIERARCHY
// ==========================================
export const PeriodBreakSchema = z.object({
  name: z.string().min(1),
  afterPeriod: z.number().int().min(1),
  durationMinutes: z.number().int().min(5).max(120),
});
export type PeriodBreak = z.infer<typeof PeriodBreakSchema>;

export const PeriodConfigSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM (24h)'),
  periodDuration: z.number().int().min(30).max(180),
  periodsPerDay: z.number().int().min(1).max(14),
  breaks: z.array(PeriodBreakSchema).default([]),
});
export type PeriodConfig = z.infer<typeof PeriodConfigSchema>;

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
export type InstitutionDto = z.infer<typeof InstitutionDtoSchema>;

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
export type CreateInstitutionDto = z.infer<typeof CreateInstitutionDtoSchema>;

export const UpdateInstitutionDtoSchema = CreateInstitutionDtoSchema.partial();
export type UpdateInstitutionDto = z.infer<typeof UpdateInstitutionDtoSchema>;

export const DepartmentDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  name: z.string().min(2),
  code: z.string().min(2).max(15),
  headFacultyId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type DepartmentDto = z.infer<typeof DepartmentDtoSchema>;

export const CreateDepartmentDtoSchema = z.object({
  institutionId: z.string().optional(),
  name: z.string().min(2),
  code: z.string().min(2).max(15),
  headFacultyId: z.string().optional(),
});
export type CreateDepartmentDto = z.infer<typeof CreateDepartmentDtoSchema>;

export const UpdateDepartmentDtoSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(15).optional(),
  headFacultyId: z.string().optional(),
});
export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentDtoSchema>;

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
export type ProgramDto = z.infer<typeof ProgramDtoSchema>;

export const CreateProgramDtoSchema = z.object({
  institutionId: z.string().optional(),
  departmentId: z.string(),
  name: z.string().min(2),
  code: z.string().min(2).max(15),
  durationYears: z.number().int().min(1).max(6).default(4),
});
export type CreateProgramDto = z.infer<typeof CreateProgramDtoSchema>;

export const UpdateProgramDtoSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(15).optional(),
  durationYears: z.number().int().min(1).max(6).optional(),
});
export type UpdateProgramDto = z.infer<typeof UpdateProgramDtoSchema>;

export const AcademicYearDtoSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  programId: z.string(),
  yearNumber: z.number().int().min(1).max(6),
  label: z.string().min(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type AcademicYearDto = z.infer<typeof AcademicYearDtoSchema>;

export const CreateAcademicYearDtoSchema = z.object({
  institutionId: z.string().optional(),
  programId: z.string(),
  yearNumber: z.number().int().min(1).max(6),
  label: z.string().min(1),
});
export type CreateAcademicYearDto = z.infer<typeof CreateAcademicYearDtoSchema>;

export const UpdateAcademicYearDtoSchema = z.object({
  yearNumber: z.number().int().min(1).max(6).optional(),
  label: z.string().min(1).optional(),
});
export type UpdateAcademicYearDto = z.infer<typeof UpdateAcademicYearDtoSchema>;

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
export type SemesterDto = z.infer<typeof SemesterDtoSchema>;

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
export type CreateSemesterDto = z.infer<typeof CreateSemesterDtoSchema>;

export const UpdateSemesterDtoSchema = CreateSemesterDtoSchema.partial();
export type UpdateSemesterDto = z.infer<typeof UpdateSemesterDtoSchema>;

export const BatchDtoSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  size: z.number().int().min(1),
});
export type BatchDto = z.infer<typeof BatchDtoSchema>;

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
export type SectionDto = z.infer<typeof SectionDtoSchema>;

export const CreateSectionDtoSchema = z.object({
  institutionId: z.string().optional(),
  semesterId: z.string(),
  academicYearId: z.string().optional(),
  name: z.string().min(1),
  strength: z.number().int().min(1),
  batches: z.array(BatchDtoSchema).optional().default([]),
});
export type CreateSectionDto = z.infer<typeof CreateSectionDtoSchema>;

export const UpdateSectionDtoSchema = CreateSectionDtoSchema.partial();
export type UpdateSectionDto = z.infer<typeof UpdateSectionDtoSchema>;

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
export type HolidayDto = z.infer<typeof HolidayDtoSchema>;

export const CreateHolidayDtoSchema = z.object({
  institutionId: z.string().optional(),
  name: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Format YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Format YYYY-MM-DD'),
  type: z.enum(['holiday', 'exam', 'event', 'break']).default('holiday'),
});
export type CreateHolidayDto = z.infer<typeof CreateHolidayDtoSchema>;

export const UpdateHolidayDtoSchema = CreateHolidayDtoSchema.partial();
export type UpdateHolidayDto = z.infer<typeof UpdateHolidayDtoSchema>;

// Hierarchical Tree Structures
export interface SectionNode extends SectionDto {
  type: 'Section';
}

export interface SemesterNode extends SemesterDto {
  type: 'Semester';
  sections: SectionNode[];
}

export interface AcademicYearNode extends AcademicYearDto {
  type: 'AcademicYear';
  semesters: SemesterNode[];
}

export interface ProgramNode extends ProgramDto {
  type: 'Program';
  academicYears: AcademicYearNode[];
}

export interface DepartmentNode extends DepartmentDto {
  type: 'Department';
  programs: ProgramNode[];
}

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
