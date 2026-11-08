// Domain service orchestrating build.facade business logic.
import {
  Injectable,
  Optional,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import type { CreateBuildDto, ScheduleVersionDto } from '@slotly/contracts';
import { WriteBehindService } from '../../../common/queue/write-behind.service';
import { BlueprintService } from '../../blueprint/services/blueprint.service';
import { ReadinessService } from '../../blueprint/services/readiness.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { EngineValidationService } from '../../engine/services/engine-validation.service';
import { PreBuildChecker } from '@slotly/engine';
import { generateAlternatives } from '../../engine/core/solver/alternatives-generator';
import { SCHEDULE_VERSION_REPOSITORY } from '../repositories/schedule-version.repository.interface';
import type { IScheduleVersionRepository } from '../repositories/schedule-version.repository.interface';
import { EventBus } from '../../../common/events/event-bus.service';
import { AuditService } from '../../../common/audit/audit.service';
import { TransactionHelper } from '../../../common/database/transaction.helper';
import { ScheduleEntryRepository } from '../../schedules/repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from '../../schedules/repositories/schedule-occupancy.repository';
import { ScheduleEntry } from '../../schedules/schemas/schedule-entry.schema';
import { ScheduleOccupancy } from '../../schedules/schemas/schedule-occupancy.schema';
import { randomUUID } from 'crypto';

/** Injectable service providing build facade logic. */
@Injectable()
export class BuildFacade {
  private readonly logger = new Logger(BuildFacade.name);
  private readonly preBuildChecker = new PreBuildChecker();

  constructor(
    private readonly writeBehindService: WriteBehindService,
    @Inject(forwardRef(() => BlueprintService))
    private readonly blueprintService: BlueprintService,
    private readonly readinessService: ReadinessService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly engineValidationService: EngineValidationService,
    @Inject(SCHEDULE_VERSION_REPOSITORY)
    private readonly versionRepo: IScheduleVersionRepository,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    @Optional() private readonly entryRepo?: ScheduleEntryRepository,
    @Optional() private readonly occupancyRepo?: ScheduleOccupancyRepository,
    @Optional() private readonly transactionHelper?: TransactionHelper,
  ) {}

  /**
   * Executes the full academic timetable build pipeline.
   * Flushes writes -> checks Gate G5 -> runs pre-build checks -> solves -> saves versions.
   */
  async build(
    projectId: string,
    dto: CreateBuildDto,
    userId: string = 'system',
    progressCallback?: (
      progress: number,
      step: string,
      message: string,
    ) => void,
  ): Promise<ScheduleVersionDto[]> {
    this.logger.log(
      `Starting build for project "${projectId}" (mode: ${dto.mode || 'fresh'})`,
    );

    // 1. Consistency Barrier: flush or await write-behind queue for this project
    progressCallback?.(
      10,
      'BARRIER',
      'Flushing pending write-behind jobs for project...',
    );
    await this.writeBehindService.flushOrAwaitPendingWrites(projectId, 5000);

    // 2. Load Project and Blueprint Graph
    progressCallback?.(
      25,
      'VALIDATE_G5',
      'Checking Blueprint Gate G5 readiness...',
    );
    const project = await this.projectsService.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project "${projectId}" not found`);
    }

    const graph = await this.blueprintService.getGraph(projectId);
    const readiness = this.readinessService.computeReadiness(graph.nodes);

    // Gate G5: Build enabled only when every in-scope node is complete with 0 blocked/incomplete nodes
    if (!readiness.isReadyForBuild) {
      throw new BadRequestException({
        code: 'GATE_G5_FAILED',
        message:
          'Cannot build timetable: blueprint contains incomplete or blocked nodes.',
        readiness,
        missingItems: readiness.missingItems,
      });
    }

    // 3. Map to EngineInput and execute pre-build checks
    progressCallback?.(
      40,
      'PRE_BUILD',
      'Compiling engine input and running structural integrity checks...',
    );
    const input = this.engineValidationService.buildEngineInput(
      project,
      graph.nodes,
    );

    const preBuildErrors = this.preBuildChecker.check(input);
    if (preBuildErrors.length > 0) {
      throw new BadRequestException({
        code: 'PRE_BUILD_FAILED',
        message: 'Pre-build checks failed with structural or capacity errors.',
        preBuildErrors,
      });
    }

    // 4. Handle "regenerate" mode: preserve user locked slots
    if (dto.mode === 'regenerate') {
      const latestVersion =
        await this.versionRepo.findLatestByProjectId(projectId);
      if (latestVersion && latestVersion.slots) {
        const lockedSlots = latestVersion.slots.filter((s) =>
          Boolean((s as unknown as { isLocked?: boolean }).isLocked),
        );
        input.lockedSlots = lockedSlots;
      }
    }

    // 5. Solve & Generate Alternatives
    progressCallback?.(
      65,
      'SOLVING',
      'Executing constraint solver across sections with heuristic search...',
    );
    const alternatives = generateAlternatives(input, dto.alternatives || 3, {
      profile: dto.profile,
      seed: dto.seed,
      timeLimitMs: dto.timeLimitMs || 8000,
    });

    // 6. Save ScheduleVersion records to DB
    progressCallback?.(
      85,
      'SAVING',
      'Persisting generated schedule versions and metrics...',
    );
    const existingCount = await this.versionRepo.countByProjectId(projectId);
    const savedVersions: ScheduleVersionDto[] = [];

    for (let i = 0; i < alternatives.length; i++) {
      const alt = alternatives[i]!;
      const versionNo = existingCount + i + 1;

      const created = await this.versionRepo.create({
        projectId,
        versionNo,
        label: alt.label,
        slots: alt.slots,
        conflicts: alt.conflicts,
        stats: alt.stats,
        score: alt.score,
        kind: dto.mode === 'regenerate' ? 'regenerate' : 'auto',
        revision: 1,
        status: 'ready',
      });

      // Persist ScheduleEntry and ScheduleOccupancy records in DB
      if (
        this.entryRepo &&
        this.occupancyRepo &&
        alt.slots &&
        alt.slots.length > 0
      ) {
        const entries: ScheduleEntry[] = [];
        const occupancies: ScheduleOccupancy[] = [];

        for (const slot of alt.slots) {
          const entryId = slot.id || randomUUID();
          const span = slot.span || 1;
          const sectionId = slot.sectionId;
          const batchId = slot.batchId;
          const facultyId = slot.facultyId;
          const roomId = slot.roomId;
          const day = slot.day;
          const startPeriod = slot.period;

          entries.push({
            _id: entryId,
            versionId: created.id,
            sectionId,
            batchId,
            day,
            startPeriod,
            span,
            type: slot.type || 'theory',
            subjectId: slot.subjectId,
            facultyId,
            roomId,
            locked: slot.isLocked || false,
            revision: 1,
          });

          for (let p = startPeriod; p < startPeriod + span; p++) {
            occupancies.push({
              _id: randomUUID(),
              versionId: created.id,
              resourceType: 'section',
              resourceId: sectionId,
              day,
              period: p,
              entryId,
            });

            if (batchId) {
              occupancies.push({
                _id: randomUUID(),
                versionId: created.id,
                resourceType: 'batch',
                resourceId: batchId,
                day,
                period: p,
                entryId,
              });
            }

            if (facultyId) {
              occupancies.push({
                _id: randomUUID(),
                versionId: created.id,
                resourceType: 'faculty',
                resourceId: facultyId,
                day,
                period: p,
                entryId,
              });
            }

            if (roomId) {
              occupancies.push({
                _id: randomUUID(),
                versionId: created.id,
                resourceType: 'room',
                resourceId: roomId,
                day,
                period: p,
                entryId,
              });
            }
          }
        }

        try {
          if (this.transactionHelper) {
            await this.transactionHelper.withTransaction(async (session) => {
              await this.entryRepo!.createMany(entries, session);
              await this.occupancyRepo!.createMany(occupancies, session);
            });
          } else {
            await this.entryRepo.createMany(entries);
            await this.occupancyRepo.createMany(occupancies);
          }
        } catch (err) {
          this.logger.warn(
            `Transaction write failed for entries/occupancies, falling back: ${(err as Error).message}`,
          );
          await this.entryRepo.createMany(entries);
          await this.occupancyRepo.createMany(occupancies);
        }
      }

      savedVersions.push(created);
    }

    // 7. Update Project status to ready
    if (savedVersions.length > 0 && savedVersions[0]) {
      await this.projectsService.updateStatus(projectId, 'ready');
    }

    // 8. Emit domain event and audit log
    progressCallback?.(100, 'COMPLETED', 'Build completed successfully.');
    void this.eventBus.publish('build.completed', {
      projectId,
      versionIds: savedVersions.map((v) => v.id),
      topScore: savedVersions[0]?.score || 0,
    });

    await this.auditService.log(
      'BUILD_COMPLETED',
      userId,
      { type: 'project', id: projectId },
      {
        alternativesCount: savedVersions.length,
        mode: dto.mode || 'fresh',
        topScore: savedVersions[0]?.score || 0,
      },
    );

    this.logger.log(
      `Build succeeded for project "${projectId}". Created ${savedVersions.length} schedule versions.`,
    );

    return savedVersions;
  }
}
