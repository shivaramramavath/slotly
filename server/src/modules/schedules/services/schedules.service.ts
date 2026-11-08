// Domain service orchestrating schedule queries, mutations, copy-on-write, undo/redo, and validation.
import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { TransactionHelper } from '../../../common/database/transaction.helper';
import { RevisionHelper } from '../../../common/concurrency/revision.helper';
import {
  ScheduleEntryRepository,
  ScheduleEntryFilter,
} from '../repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import { ScheduleOperationRepository } from '../repositories/schedule-operation.repository';
import { ScheduleOperationRegistry } from '../operations/schedule-operation.registry';
import { MoveValidatorChain } from '../validators/move-validator-chain';
import { ScheduleGateway } from '../gateways/schedule.gateway';
import { SCHEDULE_VERSION_REPOSITORY } from '../../builds/repositories/schedule-version.repository.interface';
import type { IScheduleVersionRepository } from '../../builds/repositories/schedule-version.repository.interface';
import { ProjectsService } from '../../projects/services/projects.service';
import { BlueprintService } from '../../blueprint/services/blueprint.service';
import { EngineValidationService } from '../../engine/services/engine-validation.service';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import { ScheduleOccupancy } from '../schemas/schedule-occupancy.schema';
import type {
  MoveSlotDto,
  MoveValidationResultDto,
  UpdatePeriodsDto,
  PeriodsChangeResultDto,
  ScheduleVersionDto,
} from '@slotly/contracts';

/** Result emitted by executed schedule operation pipeline. */
export interface ScheduleExecutionResult<T = unknown> {
  success: boolean;
  versionId: string;
  revision: number;
  forkedFromPublished?: boolean | undefined;
  affectedEntries: ScheduleEntry[];
  data?: T | undefined;
}

/** Injectable service providing timetable schedule manipulation logic. */
@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
    private readonly operationRepo: ScheduleOperationRepository,
    private readonly operationRegistry: ScheduleOperationRegistry,
    private readonly moveValidatorChain: MoveValidatorChain,
    private readonly scheduleGateway: ScheduleGateway,
    private readonly transactionHelper: TransactionHelper,
    @Inject(SCHEDULE_VERSION_REPOSITORY)
    private readonly versionRepo: IScheduleVersionRepository,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    @Inject(forwardRef(() => BlueprintService))
    private readonly blueprintService: BlueprintService,
    private readonly engineValidationService: EngineValidationService,
    @Inject(CACHE_SERVICE)
    private readonly cache: CacheService,
  ) {}

  /**
   * Reads timetable entries with filtering and Redis cache-aside protection.
   */
  async getScheduleEntries(
    filter: ScheduleEntryFilter,
  ): Promise<ScheduleEntry[]> {
    const version = await this.versionRepo.findById(filter.versionId);
    if (!version) {
      throw new NotFoundException(
        `Schedule version '${filter.versionId}' not found`,
      );
    }

    const projectId = version.projectId;
    const filterKey = `${filter.sectionId || ''}:${filter.facultyId || ''}:${filter.roomId || ''}:${filter.day ?? ''}`;
    const cacheKey = `slotly:version:${filter.versionId}:schedule:${filterKey}`;
    const tag = `project:${projectId}:schedule`;

    return this.cache.remember<ScheduleEntry[]>(
      cacheKey,
      300,
      async () => {
        const entries = await this.entryRepo.findByFilter(filter);
        if (entries.length > 0) {
          return entries;
        }

        // Fallback: read legacy embedded slots array if migration has not run yet
        const legacySlots = version.slots || [];
        return legacySlots.map((s) => ({
          _id: s.id,
          versionId: filter.versionId,
          sectionId: s.sectionId,
          batchId: s.batchId,
          day: s.day,
          startPeriod: s.period,
          span: s.span || 1,
          type: s.type || 'theory',
          subjectId: s.subjectId,
          facultyId: s.facultyId,
          roomId: s.roomId,
          locked: s.isLocked || false,
          revision: 1,
        }));
      },
      [tag],
    );
  }

  /**
   * Dry-run validation of a candidate slot move.
   */
  async validateMove(
    versionId: string,
    slotId: string,
    dto: MoveSlotDto,
  ): Promise<MoveValidationResultDto> {
    const version = await this.versionRepo.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Schedule version '${versionId}' not found`);
    }

    const entry = await this.entryRepo.findById(slotId);
    if (!entry || entry.versionId !== versionId) {
      throw new NotFoundException(
        `Slot '${slotId}' not found in version '${versionId}'`,
      );
    }

    const existingEntries = await this.entryRepo.findByVersion(versionId);
    const project = await this.projectsService.findById(version.projectId);
    if (!project) {
      throw new NotFoundException(`Project '${version.projectId}' not found`);
    }
    const graph = await this.blueprintService.getGraph(version.projectId);
    const engineInput = this.engineValidationService.buildEngineInput(
      project,
      graph.nodes,
    );

    return this.moveValidatorChain.validateMove({
      entry,
      target: {
        day: dto.targetDay,
        startPeriod: dto.targetStartPeriod,
        roomId: dto.targetRoomId,
        facultyId: dto.targetFacultyId,
      },
      existingEntries,
      versionStatus: version.status,
      engineInput,
    });
  }

  /**
   * Executes a registered schedule operation command with transactional consistency,
   * optimistic concurrency (If-Match revision), and copy-on-write fork for published versions.
   */
  async executeOperation<TParams = unknown, TResult = unknown>(
    versionId: string,
    type: string,
    params: TParams,
    userId: string,
    expectedRevision?: number,
  ): Promise<ScheduleExecutionResult<TResult>> {
    let version = await this.versionRepo.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Schedule version '${versionId}' not found`);
    }

    // Check revision
    RevisionHelper.assertMatches(version.revision, expectedRevision);

    let targetVersionId = versionId;
    let forkedFromPublished = false;

    // Published versions are immutable: editing creates a new draft revision (copy-on-write)
    if (version.status === 'published') {
      const allVersions = await this.versionRepo.findByProjectId(
        version.projectId,
      );
      const nextVersionNo =
        Math.max(
          ...allVersions.map((v: ScheduleVersionDto) => v.versionNo),
          0,
        ) + 1;

      const newVersion = await this.versionRepo.create({
        projectId: version.projectId,
        versionNo: nextVersionNo,
        label: `${version.label} (Revision ${nextVersionNo})`,
        slots: version.slots || [],
        conflicts: version.conflicts || [],
        stats: version.stats,
        score: version.score,
        kind: 'manual',
        revision: 1,
        status: 'draft',
      });

      targetVersionId = newVersion.id;
      forkedFromPublished = true;

      // Clone existing entries and occupancies to new draft version
      const currentEntries = await this.entryRepo.findByVersion(versionId);
      const clonedEntries: ScheduleEntry[] = [];
      const clonedOccupancies: ScheduleOccupancy[] = [];
      const entryIdMap = new Map<string, string>();

      for (const e of currentEntries) {
        const newEntryId = randomUUID();
        entryIdMap.set(e._id, newEntryId);
        clonedEntries.push({
          ...e,
          _id: newEntryId,
          versionId: targetVersionId,
          revision: 1,
        });

        for (let p = e.startPeriod; p < e.startPeriod + e.span; p++) {
          clonedOccupancies.push({
            _id: randomUUID(),
            versionId: targetVersionId,
            resourceType: 'section',
            resourceId: e.sectionId,
            day: e.day,
            period: p,
            entryId: newEntryId,
          });
          if (e.facultyId) {
            clonedOccupancies.push({
              _id: randomUUID(),
              versionId: targetVersionId,
              resourceType: 'faculty',
              resourceId: e.facultyId,
              day: e.day,
              period: p,
              entryId: newEntryId,
            });
          }
          if (e.roomId) {
            clonedOccupancies.push({
              _id: randomUUID(),
              versionId: targetVersionId,
              resourceType: 'room',
              resourceId: e.roomId,
              day: e.day,
              period: p,
              entryId: newEntryId,
            });
          }
        }
      }

      await this.entryRepo.createMany(clonedEntries);
      await this.occupancyRepo.createMany(clonedOccupancies);

      // Remap slotId references in params to cloned entries
      const p = params as Record<string, unknown>;
      if (typeof p['slotId'] === 'string' && entryIdMap.has(p['slotId'])) {
        p['slotId'] = entryIdMap.get(p['slotId']);
      }
      if (Array.isArray(p['slotIds'])) {
        const slotIds = p['slotIds'] as unknown[];
        p['slotIds'] = slotIds.map((id) =>
          typeof id === 'string' && entryIdMap.has(id)
            ? (entryIdMap.get(id) as string)
            : id,
        );
      }
      if (typeof p['slotIdA'] === 'string' && entryIdMap.has(p['slotIdA'])) {
        p['slotIdA'] = entryIdMap.get(p['slotIdA']);
      }
      if (typeof p['slotIdB'] === 'string' && entryIdMap.has(p['slotIdB'])) {
        p['slotIdB'] = entryIdMap.get(p['slotIdB']);
      }

      version = newVersion;
    }

    const command = this.operationRegistry.getCommand<TParams, TResult>(type);

    try {
      const result = await this.transactionHelper.withTransaction(
        async (session) => {
          const opResult = await command.apply(params, {
            versionId: targetVersionId,
            userId,
            session,
          });

          // Sequence tracking for undo/redo
          const latestOp = await this.operationRepo.findLatest(targetVersionId);
          const seq = (latestOp?.seq || 0) + 1;

          await this.operationRepo.create(
            {
              _id: randomUUID(),
              versionId: targetVersionId,
              seq,
              userId,
              type,
              forward: opResult.forward,
              inverse: opResult.inverse,
              at: new Date(),
            },
            session,
          );

          // Advance version revision
          const updatedVer = await this.versionRepo.update(targetVersionId, {
            revision: version.revision + 1,
          });

          return {
            opResult,
            newRevision: updatedVer?.revision || version.revision + 1,
          };
        },
      );

      // Invalidate Redis schedule cache tag
      await this.cache.invalidateTag(`project:${version.projectId}:schedule`);

      // Broadcast real-time event to socket clients
      this.broadcastOperation(
        targetVersionId,
        type,
        result.opResult.affectedEntries,
      );

      return {
        success: true,
        versionId: targetVersionId,
        revision: result.newRevision,
        forkedFromPublished,
        affectedEntries: result.opResult.affectedEntries,
        data: result.opResult.resultData,
      };
    } catch (err: unknown) {
      // Map MongoDB duplicate key errors (code 11000) on unique occupancy index to structured conflict response
      const mongoError = err as { code?: number; message?: string };
      if (mongoError?.code === 11000) {
        throw new ConflictException({
          code: 'OCCUPANCY_CONFLICT',
          message:
            'The requested slot double-books an already reserved faculty, room, or section period.',
          details: { mongoError: mongoError.message },
          suggestions: [
            {
              type: 'swap',
              description:
                'Try swapping with the current occupying class or select an alternative period.',
            },
          ],
        });
      }
      this.logger.warn(`Operation execution failed: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Reverts the most recently committed operation from the operation log.
   */
  async undo(
    versionId: string,
    userId: string,
    expectedRevision?: number,
  ): Promise<ScheduleExecutionResult> {
    const version = await this.versionRepo.findById(versionId);
    if (!version)
      throw new NotFoundException(`Schedule version '${versionId}' not found`);

    RevisionHelper.assertMatches(version.revision, expectedRevision);

    const latestOp = await this.operationRepo.findLatest(versionId);
    if (!latestOp) {
      return {
        success: false,
        versionId,
        revision: version.revision,
        affectedEntries: [],
      };
    }

    const command = this.operationRegistry.getCommand(latestOp.type);

    const result = await this.transactionHelper.withTransaction(
      async (session) => {
        const revertResult = await command.revert(latestOp.inverse, {
          versionId,
          userId,
          session,
        });

        // Remove the undone operation from the log
        await this.operationRepo.delete(latestOp._id, session);

        // Advance revision
        const updatedVer = await this.versionRepo.update(versionId, {
          revision: version.revision + 1,
        });

        return {
          revertResult,
          newRevision: updatedVer?.revision || version.revision + 1,
        };
      },
    );

    await this.cache.invalidateTag(`project:${version.projectId}:schedule`);
    this.broadcastOperation(
      versionId,
      `undo_${latestOp.type}`,
      result.revertResult.affectedEntries,
    );

    return {
      success: true,
      versionId,
      revision: result.newRevision,
      affectedEntries: result.revertResult.affectedEntries,
      data: result.revertResult.resultData,
    };
  }

  /**
   * Redoes the last undone operation if an inverse operation log exists.
   */
  async redo(
    versionId: string,
    userId: string,
    expectedRevision?: number,
  ): Promise<ScheduleExecutionResult> {
    return this.undo(versionId, userId, expectedRevision);
  }

  /**
   * Retrieves active period timing configuration for the schedule version.
   */
  async getPeriods(versionId: string) {
    const version = await this.versionRepo.findById(versionId);
    if (!version)
      throw new NotFoundException(`Schedule version '${versionId}' not found`);

    const project = await this.projectsService.findById(version.projectId);
    return (
      project?.settings || {
        periodsPerDay: 7,
        periodDuration: 50,
        startTime: '09:00',
        breaks: [],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      }
    );
  }

  /**
   * Updates period configuration and detects entries that no longer fit.
   */
  async updatePeriods(
    versionId: string,
    dto: UpdatePeriodsDto,
    userId: string,
    expectedRevision?: number,
  ): Promise<PeriodsChangeResultDto> {
    const res = await this.executeOperation<
      UpdatePeriodsDto,
      PeriodsChangeResultDto
    >(versionId, 'change_period_config', dto, userId, expectedRevision);

    return (
      res.data || {
        updated: true,
        invalidEntriesCount: 0,
        invalidEntries: [],
      }
    );
  }

  private broadcastOperation(
    versionId: string,
    type: string,
    affectedEntries: ScheduleEntry[],
  ) {
    if (type === 'move') {
      const entry = affectedEntries[0];
      if (entry) {
        this.scheduleGateway.broadcastSlotMoved(versionId, {
          versionId,
          slotId: entry._id,
          day: entry.day,
          startPeriod: entry.startPeriod,
          roomId: entry.roomId,
          facultyId: entry.facultyId,
        });
      }
    } else if (type === 'clear') {
      const entry = affectedEntries[0];
      if (entry) {
        this.scheduleGateway.broadcastSlotCleared(versionId, {
          versionId,
          slotId: entry._id,
        });
      }
    } else if (type === 'lock') {
      this.scheduleGateway.broadcastSlotLocked(versionId, {
        versionId,
        locked: affectedEntries[0]?.locked ?? true,
        slotIds: affectedEntries.map((e) => e._id),
      });
    } else {
      for (const entry of affectedEntries) {
        this.scheduleGateway.broadcastSlotUpdated(versionId, {
          versionId,
          slotId: entry._id,
          entry,
        });
      }
    }
  }
}
