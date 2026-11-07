import type { ScheduleVersionDto } from '@slotly/contracts';

export const SCHEDULE_VERSION_REPOSITORY = Symbol(
  'SCHEDULE_VERSION_REPOSITORY',
);

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
