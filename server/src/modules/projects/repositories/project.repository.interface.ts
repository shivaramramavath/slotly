// Database repository managing project.repository.interface persistence.
import type { BaseRepository } from '../../../common/database/base.repository';
import type { Project } from '../schemas/project.schema';

/** Interface defining structure for find projects filter. */
export interface FindProjectsFilter {
  institutionId?: string | undefined;
  ownerId?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
}

/** Interface defining structure for project repository. */
export interface IProjectRepository extends BaseRepository<Project> {
  findProjects(
    filter: FindProjectsFilter,
    skip?: number,
    limit?: number,
  ): Promise<{ items: Project[]; total: number }>;
  findByInstitution(institutionId: string): Promise<Project[]>;
  updateLastOpened(id: string): Promise<void>;
  incrementRevision(
    id: string,
    expectedRevision?: number,
  ): Promise<Project | null>;
}
