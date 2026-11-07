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
  'SINGLE_PARENT_VIOLATION',
  'INVALID_OPERATION',
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
export type BlueprintNodeType = z.infer<typeof BlueprintNodeTypeSchema>;

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

// ==========================================
// LIBRARY: FACULTY, SUBJECTS, ROOMS, ELECTIVE GROUPS
// ==========================================

export const SlotCoordinateSchema = z.object({
  day: z.number().int().min(0).max(6),
  period: z.number().int().min(0),
});
export type SlotCoordinate = z.infer<typeof SlotCoordinateSchema>;

// Faculty
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
export type FacultyDto = z.infer<typeof FacultyDtoSchema>;

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
export type CreateFacultyDto = z.infer<typeof CreateFacultyDtoSchema>;

export const UpdateFacultyDtoSchema = CreateFacultyDtoSchema.partial();
export type UpdateFacultyDto = z.infer<typeof UpdateFacultyDtoSchema>;

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
export type FacultyWorkloadDto = z.infer<typeof FacultyWorkloadDtoSchema>;

// Subject
export const SubjectTypeSchema = z.enum(['theory', 'lab', 'tutorial', 'seminar']);
export type SubjectType = z.infer<typeof SubjectTypeSchema>;

export const RoomTypeSchema = z.enum(['lecture', 'lab', 'seminar']);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const SubjectRequirementsSchema = z.object({
  roomType: RoomTypeSchema.default('lecture'),
  minCapacity: z.number().int().min(1).default(30),
  equipment: z.array(z.string()).default([]),
});
export type SubjectRequirements = z.infer<typeof SubjectRequirementsSchema>;

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
export type SubjectDto = z.infer<typeof SubjectDtoSchema>;

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
export type CreateSubjectDto = z.infer<typeof CreateSubjectDtoSchema>;

export const UpdateSubjectDtoSchema = CreateSubjectDtoSchema.partial();
export type UpdateSubjectDto = z.infer<typeof UpdateSubjectDtoSchema>;

// Elective Group
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
export type ElectiveGroupDto = z.infer<typeof ElectiveGroupDtoSchema>;

export const CreateElectiveGroupDtoSchema = z.object({
  institutionId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  name: z.string().min(1),
  subjectIds: z.array(z.string()).default([]),
  mustBeSimultaneous: z.boolean().default(true),
});
export type CreateElectiveGroupDto = z.infer<typeof CreateElectiveGroupDtoSchema>;

export const UpdateElectiveGroupDtoSchema = CreateElectiveGroupDtoSchema.partial();
export type UpdateElectiveGroupDto = z.infer<typeof UpdateElectiveGroupDtoSchema>;

// Room
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
export type RoomDto = z.infer<typeof RoomDtoSchema>;

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
export type CreateRoomDto = z.infer<typeof CreateRoomDtoSchema>;

export const UpdateRoomDtoSchema = CreateRoomDtoSchema.partial();
export type UpdateRoomDto = z.infer<typeof UpdateRoomDtoSchema>;

// Matchers & Strategies
export const RoomMatchRequestSchema = z.object({
  subjectId: z.string().optional(),
  requiredType: RoomTypeSchema.optional(),
  minCapacity: z.number().optional(),
  requiredEquipment: z.array(z.string()).optional(),
  day: z.number().int().min(0).max(6).optional(),
  period: z.number().int().min(0).optional(),
});
export type RoomMatchRequest = z.infer<typeof RoomMatchRequestSchema>;

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
export type RoomMatchResult = z.infer<typeof RoomMatchResultSchema>;

export const FacultyQualificationRequestSchema = z.object({
  subjectId: z.string(),
  day: z.number().int().min(0).max(6).optional(),
  period: z.number().int().min(0).optional(),
  currentDailyHours: z.number().optional(),
  currentWeeklyHours: z.number().optional(),
});
export type FacultyQualificationRequest = z.infer<typeof FacultyQualificationRequestSchema>;

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
export type FacultyQualificationResult = z.infer<typeof FacultyQualificationResultSchema>;

// Import & Export
export const ImportEntitySchema = z.enum(['faculty', 'subjects', 'rooms']);
export type ImportEntity = z.infer<typeof ImportEntitySchema>;

export const ImportRowErrorSchema = z.object({
  row: z.number(),
  field: z.string(),
  message: z.string(),
  rawValue: z.unknown().optional(),
});
export type ImportRowError = z.infer<typeof ImportRowErrorSchema>;

export const ImportValidationReportSchema = z.object({
  entity: ImportEntitySchema,
  totalRows: z.number(),
  validRows: z.number(),
  invalidRows: z.number(),
  errors: z.array(ImportRowErrorSchema),
  preview: z.array(z.record(z.unknown())),
});
export type ImportValidationReport = z.infer<typeof ImportValidationReportSchema>;

export const ImportJobStatusSchema = z.object({
  jobId: z.string(),
  entity: ImportEntitySchema,
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number(),
  totalRows: z.number(),
  importedCount: z.number(),
  errors: z.array(ImportRowErrorSchema),
});
export type ImportJobStatus = z.infer<typeof ImportJobStatusSchema>;

// ==========================================
// PROJECTS & SETTINGS
// ==========================================
export const TermKindSchema = z.enum(['odd', 'even', 'custom']);
export type TermKind = z.infer<typeof TermKindSchema>;

export const ProjectTermSchema = z.object({
  kind: TermKindSchema,
  startDate: z.string(),
  endDate: z.string(),
  academicYearLabel: z.string().optional(),
});
export type ProjectTerm = z.infer<typeof ProjectTermSchema>;

export const PerDayOverrideSchema = z.object({
  periods: z.number().int().min(1).max(14).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});
export type PerDayOverride = z.infer<typeof PerDayOverrideSchema>;

export const ProjectSettingsSchema = z.object({
  days: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  periodsPerDay: z.number().int().min(1).max(14).default(7),
  periodDuration: z.number().int().min(30).max(180).default(50),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('09:00'),
  breaks: z.array(PeriodBreakSchema).default([]),
  perDayOverrides: z.record(z.string(), PerDayOverrideSchema).optional().default({}),
});
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

export const ProjectStrictnessSchema = z.enum(['strict', 'flexible', 'relaxed']).default('strict');
export type ProjectStrictness = z.infer<typeof ProjectStrictnessSchema>;

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
export type ProjectDto = z.infer<typeof ProjectDtoSchema>;

export const CreateProjectDtoSchema = z.object({
  name: z.string().min(2),
  institutionId: z.string().optional(),
  term: ProjectTermSchema,
  settings: ProjectSettingsSchema.optional(),
  strictness: ProjectStrictnessSchema.optional(),
  source: z.enum(['empty', 'template', 'institution']).default('empty'),
  templateId: z.string().optional(),
});
export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;

export const UpdateProjectDtoSchema = CreateProjectDtoSchema.partial();
export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;

export const DuplicateProjectDtoSchema = z.object({
  name: z.string().min(2),
});
export type DuplicateProjectDto = z.infer<typeof DuplicateProjectDtoSchema>;

// ==========================================
// BLUEPRINT GRAPH MODEL
// ==========================================
export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type NodePosition = z.infer<typeof NodePositionSchema>;

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
export type BlueprintNodeDto = z.infer<typeof BlueprintNodeDtoSchema>;

export const BlueprintEdgeDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().default('default'),
});
export type BlueprintEdgeDto = z.infer<typeof BlueprintEdgeDtoSchema>;

export const BlueprintGraphDtoSchema = z.object({
  projectId: z.string(),
  revision: z.number().int(),
  nodes: z.array(BlueprintNodeDtoSchema),
  edges: z.array(BlueprintEdgeDtoSchema),
  updatedAt: z.string().optional(),
});
export type BlueprintGraphDto = z.infer<typeof BlueprintGraphDtoSchema>;

// ==========================================
// BLUEPRINT OPERATIONS & GATES
// ==========================================
export const BlueprintOpTypeSchema = z.enum([
  'add_node',
  'update_node',
  'delete_node',
  'add_edge',
  'delete_edge',
  'move_node',
]);
export type BlueprintOpType = z.infer<typeof BlueprintOpTypeSchema>;

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
export type BlueprintOp = z.infer<typeof BlueprintOpSchema>;

export const ApplyOperationsDtoSchema = z.object({
  clientRevision: z.number().int().optional(),
  operations: z.array(BlueprintOpSchema),
});
export type ApplyOperationsDto = z.infer<typeof ApplyOperationsDtoSchema>;

export const OperationResultAppliedSchema = z.object({
  opId: z.string(),
  type: BlueprintOpTypeSchema,
  targetId: z.string(),
});
export type OperationResultApplied = z.infer<typeof OperationResultAppliedSchema>;

export const OperationResultSkippedSchema = z.object({
  opId: z.string(),
  type: BlueprintOpTypeSchema,
  targetId: z.string(),
  reasonCode: ReasonCodeSchema,
  message: z.string(),
  fixHint: FixHintSchema.optional(),
});
export type OperationResultSkipped = z.infer<typeof OperationResultSkippedSchema>;

export const BatchOperationResultSchema = z.object({
  revision: z.number().int(),
  applied: z.array(OperationResultAppliedSchema),
  skipped: z.array(OperationResultSkippedSchema),
  graph: BlueprintGraphDtoSchema.optional(),
});
export type BatchOperationResult = z.infer<typeof BatchOperationResultSchema>;

// ==========================================
// READINESS, IMPACT, RECOMMENDATIONS
// ==========================================
export const BlueprintMissingItemSchema = z.object({
  nodeId: z.string(),
  nodeType: z.string(),
  nodeName: z.string(),
  field: z.string(),
  message: z.string(),
  fixHint: FixHintSchema,
});
export type BlueprintMissingItem = z.infer<typeof BlueprintMissingItemSchema>;

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
export type BlueprintReadinessDto = z.infer<typeof BlueprintReadinessDtoSchema>;

export const BlueprintImpactDtoSchema = z.object({
  nodeId: z.string(),
  descendantsCount: z.number().int(),
  descendantNodeIds: z.array(z.string()),
  subjectAssignmentsCount: z.number().int(),
  affectedBuildsCount: z.number().int(),
});
export type BlueprintImpactDto = z.infer<typeof BlueprintImpactDtoSchema>;

export const BlueprintRecommendationTypeSchema = z.enum([
  'faculty',
  'room',
  'missing_connection',
  'unused_resource',
]);
export type BlueprintRecommendationType = z.infer<typeof BlueprintRecommendationTypeSchema>;

export const BlueprintRecommendationDtoSchema = z.object({
  type: BlueprintRecommendationTypeSchema,
  title: z.string(),
  description: z.string(),
  nodeId: z.string().optional(),
  targetId: z.string().optional(),
  reason: z.string(),
  score: z.number().optional(),
});
export type BlueprintRecommendationDto = z.infer<typeof BlueprintRecommendationDtoSchema>;

// ==========================================
// TEMPLATES, SNAPSHOTS, HISTORY & COMMENTS
// ==========================================
export const GraphTemplateSubtreeSchema = z.object({
  nodes: z.array(BlueprintNodeDtoSchema.partial()),
  edges: z.array(BlueprintEdgeDtoSchema.partial()),
});
export type GraphTemplateSubtree = z.infer<typeof GraphTemplateSubtreeSchema>;

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
export type GraphTemplateDto = z.infer<typeof GraphTemplateDtoSchema>;

export const CreateGraphTemplateDtoSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  subtree: GraphTemplateSubtreeSchema,
  version: z.number().int().optional().default(1),
  visibility: z.enum(['public', 'institution', 'private']).optional().default('institution'),
  anchorNodeType: BlueprintNodeTypeSchema.optional(),
});
export type CreateGraphTemplateDto = z.infer<typeof CreateGraphTemplateDtoSchema>;

export const ApplyTemplateDtoSchema = z.object({
  anchorNodeId: z.string().optional(),
});
export type ApplyTemplateDto = z.infer<typeof ApplyTemplateDtoSchema>;

export const BlueprintHistoryEntryDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  revision: z.number().int(),
  operationType: z.string(),
  description: z.string(),
  userId: z.string(),
  timestamp: z.string(),
});
export type BlueprintHistoryEntryDto = z.infer<typeof BlueprintHistoryEntryDtoSchema>;

export const BlueprintSnapshotDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  revision: z.number().int(),
  label: z.string(),
  graph: BlueprintGraphDtoSchema,
  createdAt: z.string(),
});
export type BlueprintSnapshotDto = z.infer<typeof BlueprintSnapshotDtoSchema>;

export const CreateBlueprintSnapshotDtoSchema = z.object({
  label: z.string().min(1),
});
export type CreateBlueprintSnapshotDto = z.infer<typeof CreateBlueprintSnapshotDtoSchema>;

export const BlueprintCommentDtoSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  nodeId: z.string(),
  userId: z.string(),
  userName: z.string(),
  text: z.string(),
  createdAt: z.string(),
});
export type BlueprintCommentDto = z.infer<typeof BlueprintCommentDtoSchema>;

export const CreateBlueprintCommentDtoSchema = z.object({
  text: z.string().min(1),
});
export type CreateBlueprintCommentDto = z.infer<typeof CreateBlueprintCommentDtoSchema>;

// ==========================================
// SOCKET CONTRACT (/blueprint)
// ==========================================
export const ProjectJoinPayloadSchema = z.object({
  projectId: z.string(),
});
export type ProjectJoinPayload = z.infer<typeof ProjectJoinPayloadSchema>;

export const ProjectLeavePayloadSchema = z.object({
  projectId: z.string(),
});
export type ProjectLeavePayload = z.infer<typeof ProjectLeavePayloadSchema>;

export const CursorUpdatePayloadSchema = z.object({
  projectId: z.string(),
  x: z.number(),
  y: z.number(),
});
export type CursorUpdatePayload = z.infer<typeof CursorUpdatePayloadSchema>;

export const NodeLockPayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
});
export type NodeLockPayload = z.infer<typeof NodeLockPayloadSchema>;

export const NodeUnlockPayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
});
export type NodeUnlockPayload = z.infer<typeof NodeUnlockPayloadSchema>;

export const PresenceUserSchema = z.object({
  userId: z.string(),
  name: z.string(),
  color: z.string(),
  activeNodeId: z.string().optional(),
  cursor: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type PresenceUser = z.infer<typeof PresenceUserSchema>;

export const PresenceChangedPayloadSchema = z.object({
  users: z.array(PresenceUserSchema),
});
export type PresenceChangedPayload = z.infer<typeof PresenceChangedPayloadSchema>;

export const NodeStatusChangedPayloadSchema = z.object({
  nodeId: z.string(),
  status: NodeStatusSchema,
  missing: z.array(MissingFieldSchema),
  effectiveStatus: NodeStatusSchema,
});
export type NodeStatusChangedPayload = z.infer<typeof NodeStatusChangedPayloadSchema>;

export const OpsAppliedPayloadSchema = z.object({
  revision: z.number().int(),
  applied: z.array(OperationResultAppliedSchema),
  skipped: z.array(OperationResultSkippedSchema).optional(),
});
export type OpsAppliedPayload = z.infer<typeof OpsAppliedPayloadSchema>;

export const NodeLockedPayloadSchema = z.object({
  nodeId: z.string(),
  userId: z.string(),
  userName: z.string(),
});
export type NodeLockedPayload = z.infer<typeof NodeLockedPayloadSchema>;

export const NodeUnlockedPayloadSchema = z.object({
  nodeId: z.string(),
});
export type NodeUnlockedPayload = z.infer<typeof NodeUnlockedPayloadSchema>;

export const RevisionConflictPayloadSchema = z.object({
  currentRevision: z.number().int(),
  rejectedRevision: z.number().int(),
  message: z.string(),
});
export type RevisionConflictPayload = z.infer<typeof RevisionConflictPayloadSchema>;

export const NodeMovePayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
  position: NodePositionSchema,
});
export type NodeMovePayload = z.infer<typeof NodeMovePayloadSchema>;

export const NodeUpdatePayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
  data: z.record(z.unknown()),
});
export type NodeUpdatePayload = z.infer<typeof NodeUpdatePayloadSchema>;

export const NodeAddPayloadSchema = z.object({
  projectId: z.string(),
  node: BlueprintNodeDtoSchema,
  parentId: z.string().nullable().optional(),
});
export type NodeAddPayload = z.infer<typeof NodeAddPayloadSchema>;

export const NodeDeletePayloadSchema = z.object({
  projectId: z.string(),
  nodeId: z.string(),
});
export type NodeDeletePayload = z.infer<typeof NodeDeletePayloadSchema>;

export const EdgeAddPayloadSchema = z.object({
  projectId: z.string(),
  edge: BlueprintEdgeDtoSchema,
});
export type EdgeAddPayload = z.infer<typeof EdgeAddPayloadSchema>;

export const EdgeDeletePayloadSchema = z.object({
  projectId: z.string(),
  edgeId: z.string(),
});
export type EdgeDeletePayload = z.infer<typeof EdgeDeletePayloadSchema>;

// ==========================================
// CONSTRAINT ENGINE & VALIDATION MODEL
// ==========================================

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
export type SlotType = z.infer<typeof SlotTypeSchema>;

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
export type SlotDto = z.infer<typeof SlotDtoSchema>;

export const ViolationSeveritySchema = z.enum(['error', 'warning', 'info']);
export type ViolationSeverity = z.infer<typeof ViolationSeveritySchema>;

export const ViolationSuggestionSchema = z.object({
  type: z.enum(['period', 'room', 'faculty', 'swap']),
  description: z.string(),
  day: z.number().int().optional(),
  period: z.number().int().optional(),
  roomId: z.string().optional(),
  facultyId: z.string().optional(),
  score: z.number().optional(),
});
export type ViolationSuggestion = z.infer<typeof ViolationSuggestionSchema>;

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
export type ViolationDto = z.infer<typeof ViolationDtoSchema>;

export const PreBuildCheckErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fixHint: z.object({
    nodeId: z.string().optional(),
    field: z.string().optional(),
  }).optional(),
  details: z.record(z.unknown()).optional(),
});
export type PreBuildCheckError = z.infer<typeof PreBuildCheckErrorSchema>;

export const ValidationReportDtoSchema = z.object({
  valid: z.boolean(),
  score: z.number(),
  hardViolationsCount: z.number(),
  softViolationsCount: z.number(),
  violations: z.array(ViolationDtoSchema),
  preBuildErrors: z.array(PreBuildCheckErrorSchema),
  validatedAt: z.string(),
});
export type ValidationReportDto = z.infer<typeof ValidationReportDtoSchema>;

export const ValidateProjectDtoSchema = z.object({
  slots: z.array(SlotDtoSchema).optional(),
});
export type ValidateProjectDto = z.infer<typeof ValidateProjectDtoSchema>;

export const ValidateVersionDtoSchema = z.object({
  slots: z.array(SlotDtoSchema).optional(),
});
export type ValidateVersionDto = z.infer<typeof ValidateVersionDtoSchema>;

export const ConstraintScopeSchema = z.enum(['institution', 'department', 'program', 'section']);
export type ConstraintScope = z.infer<typeof ConstraintScopeSchema>;

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
export type HardConstraintsConfig = z.infer<typeof HardConstraintsConfigSchema>;

export const SoftConstraintsConfigSchema = z.object({
  facultyPreferredPeriods: z.number().int().min(0).max(10).default(5),
  spreadSubjectsAcrossDays: z.number().int().min(0).max(10).default(8),
  limitConsecutiveSameSubject: z.number().int().min(0).max(10).default(6),
  balanceFacultyLoad: z.number().int().min(0).max(10).default(5),
  labsInAfternoon: z.number().int().min(0).max(10).default(7),
  minimizeRoomChanges: z.number().int().min(0).max(10).default(4),
  departmentRules: z.number().int().min(0).max(10).default(5),
});
export type SoftConstraintsConfig = z.infer<typeof SoftConstraintsConfigSchema>;

export const ConstraintGroupConfigSchema = z.object({
  scope: ConstraintScopeSchema,
  scopeId: z.string(),
  hard: HardConstraintsConfigSchema.partial(),
  soft: SoftConstraintsConfigSchema.partial(),
  overrides: z.array(z.string()).default([]),
});
export type ConstraintGroupConfig = z.infer<typeof ConstraintGroupConfigSchema>;

