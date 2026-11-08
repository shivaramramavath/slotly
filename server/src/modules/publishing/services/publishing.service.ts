// Domain service orchestrating timetable publication, state transitions, admin reviews, and atomic transactions.
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  PublishRequestDto,
  RequestPublishDto,
  ReviewPublishDto,
} from '@slotly/contracts';
import {
  ScheduleVersion,
  ScheduleVersionDocument,
} from '../../builds/schemas/schedule-version.schema';
import {
  Project,
  ProjectDocument,
} from '../../projects/schemas/project.schema';
import {
  PublishRequest,
  PublishRequestDocument,
} from '../schemas/publish-request.schema';
import { PublishRequestRepository } from '../repositories/publish-request.repository';
import { PublishStateMachine } from '../state-machine/publish-state-machine';
import { TransactionHelper } from '../../../common/database/transaction.helper';
import { AuditService } from '../../../common/audit/audit.service';
import { EventBus } from '../../../common/events/event-bus.service';
import { BlueprintService } from '../../blueprint/services/blueprint.service';
import {
  SCHEDULE_VERSION_REPOSITORY,
  type IScheduleVersionRepository,
} from '../../builds/repositories/schedule-version.repository.interface';

/** Result object returned from atomic publish transaction. */
export interface PublishResult {
  success: boolean;
  publishedVersionId: string;
  previousArchivedVersionId?: string | undefined;
}

/** Injectable service coordinating timetable publication workflow, requests, and transactional immutability. */
@Injectable()
export class PublishingService {
  constructor(
    @InjectModel(ScheduleVersion.name)
    private readonly versionModel: Model<ScheduleVersionDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(PublishRequest.name)
    private readonly publishRequestModel: Model<PublishRequestDocument>,
    private readonly publishRequestRepo: PublishRequestRepository,
    private readonly transactionHelper: TransactionHelper,
    private readonly auditService: AuditService,
    @Inject(SCHEDULE_VERSION_REPOSITORY)
    private readonly versionRepo: IScheduleVersionRepository,
    @Optional()
    private readonly eventBus?: EventBus,
    @Optional()
    private readonly blueprintService?: BlueprintService,
  ) {}

  private toPublishRequestDto(doc: PublishRequest): PublishRequestDto {
    return {
      id: doc._id?.toString() || doc.id || '',
      projectId: doc.projectId?.toString(),
      versionId: doc.versionId?.toString(),
      requestedBy: doc.requestedBy?.toString(),
      status: doc.status,
      reviewer: doc.reviewer?.toString() || undefined,
      comment: doc.comment || undefined,
      createdAt: doc.createdAt
        ? doc.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: doc.updatedAt
        ? doc.updatedAt.toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * Designer submits a publish request for an existing schedule version.
   */
  async requestPublish(
    versionId: string,
    userId: string,
    dto?: RequestPublishDto,
  ): Promise<PublishRequestDto> {
    const version = await this.versionModel.findById(versionId).exec();
    if (!version) {
      throw new NotFoundException(`Schedule version "${versionId}" not found`);
    }

    // Verify 0 hard conflicts
    const hardConflicts = (version.conflicts || []).filter(
      (c) => c.severity === 'error' || (c.severity as string) === 'hard',
    );
    if (hardConflicts.length > 0) {
      throw new BadRequestException({
        message: `Cannot request publish: ${hardConflicts.length} hard conflict(s) remain unresolved.`,
        code: 'HARD_CONFLICTS_EXIST',
      });
    }

    // Verify blueprint completeness
    let isBlueprintComplete = true;
    if (this.blueprintService) {
      const readiness = await this.blueprintService.getReadiness(
        version.projectId,
      );
      isBlueprintComplete = readiness.isReadyForBuild;
      if (!isBlueprintComplete) {
        throw new BadRequestException({
          message:
            'Cannot request publish: Blueprint graph hierarchy is incomplete.',
          code: 'INVALID_STATE_TRANSITION',
        });
      }
    }

    const sm = new PublishStateMachine(version.status);
    if (
      sm.getStatus() === 'draft' ||
      sm.getStatus() === 'editing' ||
      sm.getStatus() === 'ready'
    ) {
      sm.transition('validated', {
        isBlueprintComplete,
        conflicts: version.conflicts,
      });
    }
    sm.transition('pending_approval');

    version.status = 'pending_approval';
    await version.save();

    // Invalidate version caches
    await this.versionRepo.update(versionId, { status: 'pending_approval' });

    // Update project lifecycle status
    await this.projectModel
      .findByIdAndUpdate(version.projectId, {
        $set: { status: 'pending_approval', updatedAt: new Date() },
      })
      .exec();

    // Create publish request record
    const createdReq = await this.publishRequestRepo.create({
      projectId: version.projectId,
      versionId,
      requestedBy: userId,
      status: 'pending',
      comment: dto?.comment?.trim() || null,
    });

    await this.auditService.log(
      'timetable.publish_requested',
      userId,
      {
        type: 'PublishRequest',
        id: createdReq._id?.toString() || createdReq.id || '',
      },
      {
        projectId: version.projectId,
        versionId,
        comment: dto?.comment,
      },
    );

    if (this.eventBus) {
      await this.eventBus.publish('timetable.publish_requested', {
        projectId: version.projectId,
        versionId,
        requestedBy: userId,
      });
    }

    return this.toPublishRequestDto(createdReq);
  }

  /**
   * Retrieves all publish requests for a specific project.
   */
  async getProjectPublishRequests(
    projectId: string,
  ): Promise<PublishRequestDto[]> {
    const docs = await this.publishRequestRepo.findByProjectId(projectId);
    return docs.map((d) => this.toPublishRequestDto(d));
  }

  /**
   * Retrieves all pending publish requests across the institution (for admin review inbox).
   */
  async getPendingApprovals(): Promise<PublishRequestDto[]> {
    const docs = await this.publishRequestRepo.findPending();
    return docs.map((d) => this.toPublishRequestDto(d));
  }

  /**
   * Admin approves a publication request and seals the version in an atomic MongoDB transaction.
   */
  async approvePublishRequest(
    requestId: string,
    adminId: string,
    dto: ReviewPublishDto,
  ): Promise<PublishResult> {
    const req = await this.publishRequestRepo.findById(requestId);
    if (!req) {
      throw new NotFoundException(`Publish request "${requestId}" not found`);
    }

    return this.executePublishTransaction(
      req.versionId,
      adminId,
      requestId,
      dto.comment,
    );
  }

  /**
   * Admin rejects a publication request with a mandatory comment, returning timetable to editing state.
   */
  async rejectPublishRequest(
    requestId: string,
    adminId: string,
    dto: ReviewPublishDto,
  ): Promise<PublishRequestDto> {
    if (!dto.comment || dto.comment.trim().length === 0) {
      throw new BadRequestException({
        message:
          'Rejection requires a mandatory review comment explaining why it was rejected.',
        code: 'INVALID_STATE_TRANSITION',
      });
    }

    const req = await this.publishRequestRepo.findById(requestId);
    if (!req) {
      throw new NotFoundException(`Publish request "${requestId}" not found`);
    }

    const version = await this.versionModel.findById(req.versionId).exec();
    if (!version) {
      throw new NotFoundException(
        `Schedule version "${req.versionId}" not found`,
      );
    }

    const sm = new PublishStateMachine(version.status);
    sm.transition('editing', { comment: dto.comment });

    version.status = 'editing';
    await version.save();

    await this.versionRepo.update(req.versionId, { status: 'editing' });

    // Reset project status back to draft
    await this.projectModel
      .findByIdAndUpdate(req.projectId, {
        $set: { status: 'draft', updatedAt: new Date() },
      })
      .exec();

    const updatedReq = await this.publishRequestRepo.update(requestId, {
      status: 'rejected',
      reviewer: adminId,
      comment: dto.comment.trim(),
    });

    await this.auditService.log(
      'timetable.publish_rejected',
      adminId,
      { type: 'PublishRequest', id: requestId },
      {
        projectId: req.projectId,
        versionId: req.versionId,
        comment: dto.comment,
      },
    );

    if (this.eventBus) {
      await this.eventBus.publish('timetable.rejected', {
        projectId: req.projectId,
        versionId: req.versionId,
        reviewerId: adminId,
        comment: dto.comment,
      });
    }

    return this.toPublishRequestDto(updatedReq!);
  }

  /**
   * Admin direct publish in an atomic transaction.
   */
  async publishDirect(
    versionId: string,
    adminId: string,
  ): Promise<PublishResult> {
    return this.executePublishTransaction(versionId, adminId);
  }

  /**
   * Executes atomic MongoDB publication transaction:
   * 1. Seals new version as immutable published
   * 2. Archives previous published version
   * 3. Updates project status to published
   * 4. Updates publish request if present
   * 5. Writes audit entries
   * 6. Emits domain events
   * Failure at any point rolls back all MongoDB writes.
   */
  async executePublishTransaction(
    versionId: string,
    adminId: string,
    publishRequestId?: string,
    reviewComment?: string,
  ): Promise<PublishResult> {
    return this.transactionHelper.withTransaction(async (session) => {
      // 1. Fetch version inside session
      const version = await this.versionModel
        .findById(versionId)
        .session(session)
        .exec();
      if (!version) {
        throw new NotFoundException(
          `Schedule version "${versionId}" not found`,
        );
      }

      // 2. Validate guards
      const hardConflicts = (version.conflicts || []).filter(
        (c) => c.severity === 'error' || (c.severity as string) === 'hard',
      );
      if (hardConflicts.length > 0) {
        throw new BadRequestException({
          message: `Cannot publish timetable version: ${hardConflicts.length} hard conflict(s) remain unresolved.`,
          code: 'HARD_CONFLICTS_EXIST',
        });
      }

      // Check complete blueprint if blueprint service available
      if (this.blueprintService) {
        const readiness = await this.blueprintService.getReadiness(
          version.projectId,
        );
        if (!readiness.isReadyForBuild) {
          throw new BadRequestException({
            message:
              'Cannot publish timetable version: Blueprint graph hierarchy is incomplete.',
            code: 'INVALID_STATE_TRANSITION',
          });
        }
      }

      // 3. State machine validation
      const sm = new PublishStateMachine(version.status);
      if (sm.canTransitionTo('approved')) {
        sm.transition('approved');
      }
      sm.transition('published');

      // 4. Seal target version immutable
      version.status = 'published';
      await version.save({ session });

      // 5. Archive previous published version for this project
      const prevPublished = await this.versionModel
        .findOne({
          projectId: version.projectId,
          status: 'published',
          _id: { $ne: version._id },
        })
        .session(session)
        .exec();

      if (prevPublished) {
        prevPublished.status = 'archived';
        await prevPublished.save({ session });
      }

      // 6. Update Project lifecycle status to published
      await this.projectModel
        .findByIdAndUpdate(
          version.projectId,
          { $set: { status: 'published', updatedAt: new Date() } },
          { session },
        )
        .exec();

      // 7. Update publish request status if present
      if (publishRequestId) {
        await this.publishRequestRepo.update(
          publishRequestId,
          {
            status: 'approved',
            reviewer: adminId,
            comment: reviewComment || null,
          },
          session,
        );
      } else {
        const pendingReq = await this.publishRequestModel
          .findOne({ versionId, status: 'pending' })
          .session(session)
          .exec();
        if (pendingReq) {
          pendingReq.status = 'approved';
          pendingReq.reviewer = adminId;
          pendingReq.comment = reviewComment || null;
          await pendingReq.save({ session });
        }
      }

      // 8. Write audit logs
      await this.auditService.log(
        'timetable.published',
        adminId,
        { type: 'ScheduleVersion', id: versionId },
        {
          projectId: version.projectId,
          versionNo: version.versionNo,
          previousPublishedVersionId: prevPublished?._id?.toString(),
        },
      );

      if (prevPublished) {
        await this.auditService.log(
          'timetable.archived',
          adminId,
          { type: 'ScheduleVersion', id: prevPublished._id.toString() },
          {
            projectId: version.projectId,
            versionNo: prevPublished.versionNo,
          },
        );
      }

      // 9. Emit domain events
      if (this.eventBus) {
        await this.eventBus.publish('timetable.published', {
          projectId: version.projectId,
          versionId,
          adminId,
        });
        if (prevPublished) {
          await this.eventBus.publish('timetable.archived', {
            projectId: version.projectId,
            versionId: prevPublished._id.toString(),
            adminId,
          });
        }
      }

      return {
        success: true,
        publishedVersionId: versionId,
        previousArchivedVersionId: prevPublished?._id?.toString(),
      };
    });
  }
}
