// Administrative service listing all timetables, versions, and cross-project reported conflicts.
import { Injectable } from '@nestjs/common';
import type {
  AdminTimetableItemDto,
  AdminReportedConflictDto,
  ScheduleVersionDto,
} from '@slotly/contracts';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import { MongoScheduleVersionRepository } from '../../builds/repositories/mongo-schedule-version.repository';

/** Administrative service providing institutional visibility over all timetable projects and conflicts. */
@Injectable()
export class AdminTimetablesService {
  constructor(
    private readonly projectRepo: CachedProjectRepository,
    private readonly versionRepo: MongoScheduleVersionRepository,
  ) {}

  /**
   * Retrieves an overview of all timetables across the institution with version and conflict status.
   */
  async listTimetables(
    institutionId?: string,
  ): Promise<AdminTimetableItemDto[]> {
    const filter = institutionId ? { institutionId } : {};
    const projects = await this.projectRepo.find(filter);

    const items: AdminTimetableItemDto[] = [];

    for (const project of projects) {
      const pId = String(project.id ?? project._id);
      const versions: ScheduleVersionDto[] =
        await this.versionRepo.findByProjectId(pId);
      const published = versions.find((v) => v.status === 'published');
      const latest = versions[0];
      const targetVersion = published ?? latest;

      const pDoc = project as unknown as { updatedAt?: Date; createdAt?: Date };
      const vDoc = targetVersion as unknown as { updatedAt?: Date | string };

      items.push({
        projectId: pId,
        projectName: project.name,
        status: (project.status as AdminTimetableItemDto['status']) ?? 'draft',
        versionId: targetVersion?.id,
        versionNo: targetVersion?.versionNo,
        versionLabel: targetVersion?.label,
        publishedAt:
          published && vDoc?.updatedAt
            ? new Date(vDoc.updatedAt).toISOString()
            : undefined,
        conflictsCount: targetVersion?.conflicts?.length ?? 0,
        updatedAt: (pDoc.updatedAt
          ? new Date(pDoc.updatedAt)
          : new Date()
        ).toISOString(),
      });
    }

    return items;
  }

  /**
   * Retrieves all reported conflicts across institutional timetable versions.
   */
  async listReportedConflicts(
    institutionId?: string,
  ): Promise<AdminReportedConflictDto[]> {
    const filter = institutionId ? { institutionId } : {};
    const projects = await this.projectRepo.find(filter);
    const conflictsList: AdminReportedConflictDto[] = [];

    for (const project of projects) {
      const pId = String(project.id ?? project._id);
      const versions: ScheduleVersionDto[] =
        await this.versionRepo.findByProjectId(pId);

      for (const version of versions) {
        const vId = version.id;
        const vConflicts = version.conflicts ?? [];

        for (const [index, conf] of vConflicts.entries()) {
          const confObj = conf as {
            severity?: 'hard' | 'soft' | 'warning' | 'error';
            message?: string;
            description?: string;
          };
          conflictsList.push({
            id: `conf_${vId}_${index}`,
            projectId: pId,
            projectName: project.name,
            versionId: vId,
            severity: confObj.severity ?? 'hard',
            message:
              confObj.message ||
              confObj.description ||
              'Constraint violation in timetable version',
            reportedBy: 'System Solver',
            status: 'open',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return conflictsList;
  }
}
