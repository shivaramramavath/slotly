// Core implementation for types in server/src/modules/engine/core/solver.
import type { EngineSubject, Slot, SlotType, Violation } from '@slotly/engine';
import type {
  BuildProfile,
  ScheduleVersionKind,
  ScheduleVersionStats,
} from '@slotly/contracts';

/** Interface defining structure for solver options. */
export interface SolverOptions {
  seed?: number | undefined;
  timeLimitMs?: number | undefined;
  profile?: BuildProfile | undefined;
  maxBacktrackSteps?: number | undefined;
  swapIterations?: number | undefined;
}

/** Interface defining structure for solve task. */
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

/** Interface defining structure for elective task bundle. */
export interface ElectiveTaskBundle {
  bundleId: string;
  electiveGroupId: string;
  tasks: SolveTask[];
  hardness: number;
}

/** Interface defining structure for solver result. */
export interface SolverResult {
  slots: Slot[];
  score: number;
  violations: Violation[];
  stats: ScheduleVersionStats;
  durationMs: number;
  isFeasible: boolean;
  unplacedTasksCount: number;
}

/** Interface defining structure for alternative result. */
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
