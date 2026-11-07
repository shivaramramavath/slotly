import type { EngineSubject, Slot, SlotType, Violation } from '../types';
import type {
  BuildProfile,
  ScheduleVersionKind,
  ScheduleVersionStats,
} from '@slotly/contracts';

export interface SolverOptions {
  seed?: number | undefined;
  timeLimitMs?: number | undefined;
  profile?: BuildProfile | undefined;
  maxBacktrackSteps?: number | undefined;
  swapIterations?: number | undefined;
}

export interface SolveTask {
  taskId: string;
  subjectId: string;
  sectionId: string;
  batchId?: string | undefined;
  type: SlotType;
  span: number;
  facultyIds: string[];
  electiveGroupId?: string | undefined;
  requirements?: EngineSubject['requirements'] | undefined;
  preferredDays?: number[] | undefined;
  hardness: number;
}

export interface ElectiveTaskBundle {
  bundleId: string;
  electiveGroupId: string;
  tasks: SolveTask[];
  hardness: number;
}

export interface SolverResult {
  slots: Slot[];
  score: number;
  violations: Violation[];
  stats: ScheduleVersionStats;
  durationMs: number;
  isFeasible: boolean;
  unplacedTasksCount: number;
}

export interface AlternativeResult {
  id: string;
  versionNo: number;
  label: string;
  slots: Slot[];
  conflicts: Violation[];
  stats: ScheduleVersionStats;
  score: number;
  kind: ScheduleVersionKind;
  revision: number;
  status: 'ready' | 'draft';
  profile: BuildProfile;
}
