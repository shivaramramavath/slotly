// Unit tests verifying Designer publish requests and Admin review approve/reject workflows.
import { PublishingService } from '../services/publishing.service';
import { BadRequestException } from '@nestjs/common';
import type { PublishRequestRepository } from '../repositories/publish-request.repository';
import type { TransactionHelper } from '../../../common/database/transaction.helper';
import type { AuditService } from '../../../common/audit/audit.service';
import type { EventBus } from '../../../common/events/event-bus.service';
import type { IScheduleVersionRepository } from '../../builds/repositories/schedule-version.repository.interface';
import type { Model } from 'mongoose';
import type { ScheduleVersionDocument } from '../../builds/schemas/schedule-version.schema';
import type { ProjectDocument } from '../../projects/schemas/project.schema';
import type {
  PublishRequest,
  PublishRequestDocument,
} from '../schemas/publish-request.schema';

interface MockVersion {
  _id: string;
  projectId: string;
  versionNo: number;
  label: string;
  status: string;
  conflicts: unknown[];
  save: jest.Mock<Promise<boolean>, []>;
}

describe('Publishing Workflow (Requests & Admin Reviews)', () => {
  let service: PublishingService;
  let versionModelMock: Partial<Model<ScheduleVersionDocument>>;
  let projectModelMock: Partial<Model<ProjectDocument>>;
  let publishRequestModelMock: Partial<Model<PublishRequestDocument>>;
  let publishRequestRepoMock: Partial<PublishRequestRepository>;
  let transactionHelperMock: Partial<TransactionHelper>;
  let auditServiceMock: Partial<AuditService>;
  let eventBusMock: Partial<EventBus>;
  let versionRepoMock: Partial<IScheduleVersionRepository>;

  const mockVersion: MockVersion = {
    _id: 'v_draft',
    projectId: 'proj_1',
    versionNo: 1,
    label: 'Term 1 Draft',
    status: 'draft',
    conflicts: [],
    save: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
  };

  const mockPublishRequest: PublishRequest = {
    id: 'req_123',
    _id: 'req_123',
    projectId: 'proj_1',
    versionId: 'v_draft',
    requestedBy: 'user_designer',
    status: 'pending',
  };

  beforeEach(() => {
    versionModelMock = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVersion),
      }),
    };

    projectModelMock = {
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: 'proj_1' }),
      }),
    };

    publishRequestModelMock = {
      findOne: jest.fn(),
    };

    publishRequestRepoMock = {
      create: jest.fn().mockResolvedValue(mockPublishRequest),
      findById: jest.fn().mockResolvedValue(mockPublishRequest),
      update: jest.fn().mockResolvedValue({
        ...mockPublishRequest,
        status: 'rejected',
        reviewer: 'admin_1',
        comment: 'Room conflicts on Tuesday',
      }),
      findByProjectId: jest.fn().mockResolvedValue([mockPublishRequest]),
      findPending: jest.fn().mockResolvedValue([mockPublishRequest]),
    };

    transactionHelperMock = {
      withTransaction: jest.fn(),
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

  it('should allow designer to request publish when 0 hard conflicts exist', async () => {
    const res = await service.requestPublish('v_draft', 'user_designer', {
      comment: 'Ready for admin approval',
    });

    expect(res).toBeDefined();
    expect(res.status).toBe('pending');
    expect(mockVersion.status).toBe('pending_approval');
    expect(mockVersion.save).toHaveBeenCalled();

    expect(projectModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'proj_1',
      expect.anything(),
    );

    expect(publishRequestRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_1',
        versionId: 'v_draft',
        requestedBy: 'user_designer',
        status: 'pending',
        comment: 'Ready for admin approval',
      }),
    );

    expect(auditServiceMock.log).toHaveBeenCalledWith(
      'timetable.publish_requested',
      'user_designer',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should block publish request if hard conflicts remain', async () => {
    const versionWithConflict: MockVersion = {
      ...mockVersion,
      conflicts: [{ severity: 'hard' }],
    };

    versionModelMock.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(versionWithConflict),
    });

    await expect(
      service.requestPublish('v_draft', 'user_designer'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow admin to reject a publish request with a mandatory comment and return version to editing', async () => {
    mockVersion.status = 'pending_approval';

    const res = await service.rejectPublishRequest('req_123', 'admin_1', {
      approved: false,
      comment: 'Room conflicts on Tuesday',
    });

    expect(res.status).toBe('rejected');
    expect(mockVersion.status).toBe('editing');
    expect(mockVersion.save).toHaveBeenCalled();

    // Project status reset to draft
    expect(projectModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'proj_1',
      expect.anything(),
    );

    expect(publishRequestRepoMock.update).toHaveBeenCalledWith(
      'req_123',
      expect.objectContaining({
        status: 'rejected',
        reviewer: 'admin_1',
        comment: 'Room conflicts on Tuesday',
      }),
    );
  });

  it('should reject rejection attempt if comment is missing or whitespace', async () => {
    await expect(
      service.rejectPublishRequest('req_123', 'admin_1', {
        approved: false,
        comment: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
