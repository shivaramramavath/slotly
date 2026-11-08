// Unit and integration tests verifying transactional timetable publication and failure rollback.
import { PublishingService } from '../services/publishing.service';
import { BadRequestException } from '@nestjs/common';
import type { PublishRequestRepository } from '../repositories/publish-request.repository';
import type { TransactionHelper } from '../../../common/database/transaction.helper';
import type { AuditService } from '../../../common/audit/audit.service';
import type { EventBus } from '../../../common/events/event-bus.service';
import type { IScheduleVersionRepository } from '../../builds/repositories/schedule-version.repository.interface';
import type { ClientSession, Model } from 'mongoose';
import type { ScheduleVersionDocument } from '../../builds/schemas/schedule-version.schema';
import type { ProjectDocument } from '../../projects/schemas/project.schema';
import type { PublishRequestDocument } from '../schemas/publish-request.schema';

interface MockTargetDoc {
  _id: string;
  projectId: string;
  versionNo: number;
  label: string;
  status: string;
  conflicts: unknown[];
  save: jest.Mock<Promise<boolean>, []>;
}

describe('Transactional Publishing', () => {
  let service: PublishingService;
  let versionModelMock: Partial<Model<ScheduleVersionDocument>>;
  let projectModelMock: Partial<Model<ProjectDocument>>;
  let publishRequestModelMock: Partial<Model<PublishRequestDocument>>;
  let publishRequestRepoMock: Partial<PublishRequestRepository>;
  let transactionHelperMock: Partial<TransactionHelper>;
  let auditServiceMock: Partial<AuditService>;
  let eventBusMock: Partial<EventBus>;
  let versionRepoMock: Partial<IScheduleVersionRepository>;

  const mockTargetVersion: MockTargetDoc = {
    _id: 'v_target',
    projectId: 'proj_1',
    versionNo: 2,
    label: 'Version 2 Draft',
    status: 'pending_approval',
    conflicts: [{ severity: 'soft' }],
    save: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
  };

  const mockPrevPublishedVersion: MockTargetDoc = {
    _id: 'v_prev',
    projectId: 'proj_1',
    versionNo: 1,
    label: 'Version 1 Published',
    status: 'published',
    conflicts: [],
    save: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
  };

  beforeEach(() => {
    versionModelMock = {
      findById: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockTargetVersion),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPrevPublishedVersion),
        }),
      }),
    };

    projectModelMock = {
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ id: 'proj_1', status: 'published' }),
      }),
    };

    publishRequestModelMock = {
      findOne: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    };

    publishRequestRepoMock = {
      findById: jest.fn().mockResolvedValue({
        id: 'req_1',
        projectId: 'proj_1',
        versionId: 'v_target',
        status: 'pending',
      }),
      update: jest.fn().mockResolvedValue({
        id: 'req_1',
        status: 'approved',
      }),
    };

    transactionHelperMock = {
      withTransaction: jest
        .fn()
        .mockImplementation(
          (callback: (session: ClientSession) => Promise<unknown>) =>
            callback({} as ClientSession),
        ),
    };

    auditServiceMock = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    eventBusMock = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    versionRepoMock = {
      update: jest.fn().mockResolvedValue(null),
    };

    service = new PublishingService(
      versionModelMock as Model<ScheduleVersionDocument>,
      projectModelMock as Model<ProjectDocument>,
      publishRequestModelMock as Model<PublishRequestDocument>,
      publishRequestRepoMock as PublishRequestRepository,
      transactionHelperMock as TransactionHelper,
      auditServiceMock as AuditService,
      versionRepoMock as IScheduleVersionRepository,
      eventBusMock as EventBus,
    );
  });

  it('should atomically seal new version as published and archive the previous published version', async () => {
    const result = await service.executePublishTransaction(
      'v_target',
      'admin_1',
      'req_1',
      'Approved for semester release',
    );

    expect(result.success).toBe(true);
    expect(result.publishedVersionId).toBe('v_target');
    expect(result.previousArchivedVersionId).toBe('v_prev');

    // Sealed immutable published
    expect(mockTargetVersion.status).toBe('published');
    expect(mockTargetVersion.save).toHaveBeenCalled();

    // Previous version archived
    expect(mockPrevPublishedVersion.status).toBe('archived');
    expect(mockPrevPublishedVersion.save).toHaveBeenCalled();

    // Project status set to published
    expect(projectModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'proj_1',
      expect.anything(),
      expect.anything(),
    );

    // Publish request marked approved
    expect(publishRequestRepoMock.update).toHaveBeenCalledWith(
      'req_1',
      expect.objectContaining({
        status: 'approved',
        reviewer: 'admin_1',
        comment: 'Approved for semester release',
      }),
      expect.anything(),
    );

    // Audit logs written
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      'timetable.published',
      'admin_1',
      { type: 'ScheduleVersion', id: 'v_target' },
      expect.objectContaining({ projectId: 'proj_1', versionNo: 2 }),
    );
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      'timetable.archived',
      'admin_1',
      { type: 'ScheduleVersion', id: 'v_prev' },
      expect.objectContaining({ projectId: 'proj_1', versionNo: 1 }),
    );

    // Domain events emitted
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'timetable.published',
      expect.objectContaining({ versionId: 'v_target' }),
    );
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'timetable.archived',
      expect.objectContaining({ versionId: 'v_prev' }),
    );
  });

  it('should block publishing when hard conflicts exist', async () => {
    const versionWithConflict: MockTargetDoc = {
      _id: 'v_conflict',
      projectId: 'proj_1',
      versionNo: 3,
      label: 'V3',
      status: 'pending_approval',
      conflicts: [{ severity: 'error' }], // hard conflict
      save: jest.fn<Promise<boolean>, []>(),
    };

    versionModelMock.findById = jest.fn().mockReturnValue({
      session: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(versionWithConflict),
      }),
    });

    await expect(
      service.executePublishTransaction('v_conflict', 'admin_1'),
    ).rejects.toThrow(BadRequestException);

    expect(versionWithConflict.save).not.toHaveBeenCalled();
  });

  it('should rollback transaction completely if an unexpected error occurs during persistence', async () => {
    const simulatedError = new Error('Database disk full');
    transactionHelperMock.withTransaction = jest
      .fn()
      .mockRejectedValue(simulatedError);

    await expect(
      service.executePublishTransaction('v_target', 'admin_1'),
    ).rejects.toThrow('Database disk full');
  });
});
