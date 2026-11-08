// Facade service orchestrating export job dispatch, storage, signed tokens, and status polling.
import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  GoneException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import type { CreateExportDto, ExportJobDto } from '@slotly/contracts';
import { ExporterFactory } from './exporter.factory';
import {
  STORAGE_PROVIDER,
  type IStorageProvider,
} from '../adapters/storage-provider.interface';
import { ViewerService } from '../../viewer/services/viewer.service';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

interface SignedExportTicket {
  jobId: string;
  storageKey: string;
  userId: string;
  mimeType: string;
  fileName: string;
  expiresAt: string;
}

/** Facade service coordinating timetable exports across strategy, queue, and storage layers. */
@Injectable()
export class ExportFacade {
  private readonly logger = new Logger(ExportFacade.name);

  constructor(
    private readonly exporterFactory: ExporterFactory,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    private readonly viewerService: ViewerService,
    private readonly projectRepo: CachedProjectRepository,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
    @Optional()
    @InjectQueue('exports')
    private readonly exportQueue?: Queue,
  ) {}

  /** Enqueues an export job for asynchronous generation. */
  async enqueueExport(
    projectId: string,
    userId: string,
    dto: CreateExportDto,
  ): Promise<ExportJobDto> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project "${projectId}" not found`);
    }

    const jobId = `exp_${crypto.randomUUID().replace(/-/g, '')}`;
    const initialJob: ExportJobDto = {
      id: jobId,
      projectId,
      userId,
      format: dto.format,
      entityType: dto.entityType,
      entityId: dto.entityId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await this.cache.set(`slotly:export:job:${jobId}`, initialJob, 86400);

    if (this.exportQueue) {
      await this.exportQueue.add(
        'generate-export',
        { jobId, projectId, userId, dto },
        {
          attempts: 2,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } else {
      // Direct execution fallback if queue worker is synchronous / local
      void this.executeExport(jobId, projectId, userId, dto);
    }

    return initialJob;
  }

  /** Executes the export strategy, saves to storage, and generates signed download ticket. */
  async executeExport(
    jobId: string,
    projectId: string,
    userId: string,
    dto: CreateExportDto,
  ): Promise<ExportJobDto> {
    try {
      await this.updateJobStatus(jobId, { status: 'processing' });

      const timetable = await this.viewerService.getTimetable(projectId, {
        type: dto.entityType,
        targetId: dto.entityId,
        day: dto.day,
      });

      const exporter = this.exporterFactory.getExporter(dto.format);
      const buffer = await exporter.export({
        title: `${timetable.entityName} Timetable`,
        projectName: timetable.versionLabel || 'Academic Term',
        entityType: dto.entityType,
        entityName: timetable.entityName,
        settings: timetable.settings,
        entries: timetable.entries,
        day: dto.day,
      });

      const storageKey = `${jobId}.${exporter.fileExtension}`;
      await this.storage.save(storageKey, buffer, exporter.mimeType);

      // Issue signed download token (24h validity)
      const downloadToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      const fileName = `${timetable.entityName.replace(/[^a-zA-Z0-9_-]/g, '_')}_timetable.${exporter.fileExtension}`;

      const ticket: SignedExportTicket = {
        jobId,
        storageKey,
        userId,
        mimeType: exporter.mimeType,
        fileName,
        expiresAt,
      };

      await this.cache.set(
        `slotly:export:signed:${downloadToken}`,
        ticket,
        86400,
      );

      const completedJob: ExportJobDto = {
        id: jobId,
        projectId,
        userId,
        format: dto.format,
        entityType: dto.entityType,
        entityId: dto.entityId,
        status: 'completed',
        downloadUrl: `/exports/download/${downloadToken}`,
        expiresAt,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      await this.cache.set(`slotly:export:job:${jobId}`, completedJob, 86400);
      return completedJob;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Export execution failed for job "${jobId}": ${errMsg}`,
      );

      const failedJob: ExportJobDto = {
        id: jobId,
        projectId,
        userId,
        format: dto.format,
        entityType: dto.entityType,
        entityId: dto.entityId,
        status: 'failed',
        error: errMsg,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      await this.cache.set(`slotly:export:job:${jobId}`, failedJob, 86400);
      return failedJob;
    }
  }

  /** Polling query to check export job status. */
  async getJobStatus(jobId: string, userId: string): Promise<ExportJobDto> {
    const job = await this.cache.get<ExportJobDto>(
      `slotly:export:job:${jobId}`,
    );
    if (!job) {
      throw new NotFoundException(`Export job "${jobId}" not found`);
    }

    if (job.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this export job',
      );
    }

    return job;
  }

  /** Resolves and streams download buffer via expiring signed ticket with ownership check. */
  async resolveDownload(
    token: string,
    requestingUserId?: string,
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const ticket = await this.cache.get<SignedExportTicket>(
      `slotly:export:signed:${token}`,
    );

    if (!ticket) {
      throw new GoneException({
        message: 'This export download link has expired or is invalid.',
        code: 'EXPORT_EXPIRED',
      });
    }

    if (requestingUserId && ticket.userId !== requestingUserId) {
      throw new ForbiddenException(
        'You do not have permission to download this export',
      );
    }

    const file = await this.storage.get(ticket.storageKey);
    if (!file) {
      throw new NotFoundException('Export file artifact not found in storage');
    }

    return {
      buffer: file.buffer,
      mimeType: ticket.mimeType,
      fileName: ticket.fileName,
    };
  }

  private async updateJobStatus(
    jobId: string,
    partial: Partial<ExportJobDto>,
  ): Promise<void> {
    const existing = await this.cache.get<ExportJobDto>(
      `slotly:export:job:${jobId}`,
    );
    if (existing) {
      await this.cache.set(
        `slotly:export:job:${jobId}`,
        { ...existing, ...partial },
        86400,
      );
    }
  }
}
