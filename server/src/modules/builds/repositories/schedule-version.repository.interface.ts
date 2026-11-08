// Database repository managing schedule-version.repository.interface persistence.
import type { ScheduleVersionDto } from '@slotly/contracts';

/** Constant representing schedule version repository. */
export const SCHEDULE_VERSION_REPOSITORY = Symbol(
  'SCHEDULE_VERSION_REPOSITORY',
);

/** Interface defining structure for schedule version repository. */
export interface IScheduleVersionRepository {
  create(data: Partial<ScheduleVersionDto>): Promise<ScheduleVersionDto>;
  findById(id: string): Promise<ScheduleVersionDto | null>;
  findByProjectId(projectId: string): Promise<ScheduleVersionDto[]>;
  findLatestByProjectId(projectId: string): Promise<ScheduleVersionDto | null>;
  countByProjectId(projectId: string): Promise<number>;
  update(
    id: string,
    data: Partial<ScheduleVersionDto>,
  ): Promise<ScheduleVersionDto | null>;
  delete(id: string): Promise<boolean>;
}
