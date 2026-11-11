// Type definitions for write-behind persistence payloads and statuses.

/** Persistence lifecycle status for write-behind updates. */
export type PersistenceStatus = 'pending' | 'persisted' | 'failed';

/** Interface defining structure for typed write-behind job data. */
export interface WriteBehindJobPayload<T = unknown> {
  entity: string;
  id: string;
  payload: T;
  revision?: number | undefined;
  projectId?: string | undefined;
  timestamp: number;
  _persistence?: PersistenceStatus | undefined;
}
