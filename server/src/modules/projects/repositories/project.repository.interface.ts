import type { BaseRepository } from '../../../common/database/base.repository';
import type { Project } from '../schemas/project.schema';

export interface FindProjectsFilter {
  institutionId?: string | undefined;
  ownerId?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
}

export interface IProjectRepository extends BaseRepository<Project> {
  findProjects(
    filter: FindProjectsFilter,
    skip?: number,
    limit?: number,
  ): Promise<{ items: Project[]; total: number }>;
  findByInstitution(institutionId: string): Promise<Project[]>;
  updateLastOpened(id: string): Promise<void>;
  incrementRevision(id: string, expectedRevision?: number): Promise<Project | null>;
}
