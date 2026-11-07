import type {
  SlotType,
  SlotDto,
  ViolationSeverity,
  ViolationSuggestion,
  ViolationDto,
  PreBuildCheckError,
  ValidationReportDto,
  HardConstraintsConfig,
  SoftConstraintsConfig,
} from '@slotly/contracts';

export type {
  SlotType,
  ViolationSeverity,
  ViolationSuggestion,
  PreBuildCheckError,
  ValidationReportDto,
  HardConstraintsConfig,
  SoftConstraintsConfig,
};

export type Slot = SlotDto;
export type Violation = ViolationDto;

export interface EngineSection {
  id: string;
  name: string;
  strength: number;
  departmentId?: string | undefined;
  programId?: string | undefined;
  academicYearId?: string | undefined;
  semesterId?: string | undefined;
  workingDays?: number[] | undefined;
}

export interface EngineBatch {
  id: string;
  sectionId: string;
  name: string;
  size: number;
}

export interface EngineFaculty {
  id: string;
  name: string;
  code: string;
  availability?: boolean[][] | undefined;
  unavailableSlots?: Array<{ day: number; period: number }> | undefined;
  preferredPeriods?: Array<{ day: number; period: number }> | undefined;
  minHoursPerWeek?: number | undefined;
  maxHoursPerDay?: number | undefined;
  maxHoursPerWeek?: number | undefined;
  departmentId?: string | undefined;
  qualifications?: string[] | undefined;
}

export interface EngineRoom {
  id: string;
  name: string;
  type: 'lecture' | 'lab' | 'seminar';
  capacity: number;
  equipment?: string[] | undefined;
  availability?: boolean[][] | undefined;
  unavailableSlots?: Array<{ day: number; period: number }> | undefined;
  departmentId?: string | undefined;
  shared?: boolean | undefined;
}

export interface EngineSubject {
  id: string;
  code: string;
  name: string;
  type: 'theory' | 'lab' | 'tutorial' | 'seminar';
  weeklyHours: number;
  consecutivePeriods?: number | undefined;
  preferredDays?: number[] | undefined;
  requirements?:
    | {
        roomType?: string | undefined;
        minCapacity?: number | undefined;
        equipment?: string[] | undefined;
      }
    | undefined;
  isElective?: boolean | undefined;
  electiveGroupId?: string | undefined;
  facultyIds?: string[] | undefined;
  departmentId?: string | undefined;
}

export interface EngineElectiveGroup {
  id: string;
  name: string;
  subjectIds: string[];
  mustBeSimultaneous: boolean;
}

export interface EngineBreak {
  day?: number | undefined;
  period: number;
  name?: string | undefined;
}

export interface EngineSettings {
  days: string[];
  periodsPerDay: number;
  periodDuration: number;
  startTime?: string | undefined;
  breaks: EngineBreak[];
  perDayOverrides?: Record<string, { periodsCount?: number | undefined; breaks?: number[] | undefined }> | undefined;
}

export interface EngineCalendar {
  holidays: Array<{ date: string; name: string }>;
  events?: Array<{ date: string; name: string }> | undefined;
}

export interface EngineInput {
  settings: EngineSettings;
  perDayConfig?: Record<string, { periodsCount: number; breaks: number[] }> | undefined;
  calendar: EngineCalendar;
  sections: EngineSection[];
  batches: EngineBatch[];
  faculty: EngineFaculty[];
  rooms: EngineRoom[];
  subjects: EngineSubject[];
  electiveGroups: EngineElectiveGroup[];
  lockedSlots: Slot[];
  effectiveConstraints?: Partial<HardConstraintsConfig & SoftConstraintsConfig> | undefined;
  preferences?: Record<string, unknown> | undefined;
}

export interface Move {
  slot: Slot;
  target: {
    day: number;
    period: number;
    roomId?: string | undefined;
    facultyId?: string | undefined;
  };
  source?:
    | {
        day: number;
        period: number;
        roomId?: string | undefined;
        facultyId?: string | undefined;
      }
    | undefined;
}
