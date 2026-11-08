// Core interface defining Command pattern operations with apply and revert lifecycle.
import { ClientSession } from 'mongoose';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';

/** Execution context passed to schedule operations. */
export interface ScheduleOperationContext {
  versionId: string;
  userId: string;
  session?: ClientSession | undefined;
}

/** Result emitted by an executed schedule operation. */
export interface ScheduleOperationResult<T = unknown> {
  type: string;
  forward: Record<string, unknown>;
  inverse: Record<string, unknown>;
  affectedEntries: ScheduleEntry[];
  resultData?: T | undefined;
}

/** Command pattern interface for timetable schedule mutations. */
export interface IScheduleCommand<TParams = unknown, TResult = unknown> {
  readonly type: string;
  apply(
    params: TParams,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<TResult>>;
  revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<TResult>>;
}
