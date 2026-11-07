import { AuditProcessor } from '../audit.processor';
import type { Job } from 'bullmq';
import type { AuditPayload } from '../audit.service';

describe('AuditProcessor', () => {
  let processor: AuditProcessor;
  let mockModel: { create: jest.Mock };

  beforeEach(() => {
    mockModel = {
      create: jest.fn().mockResolvedValue({ id: 'audit_123' }),
    };
    processor = new AuditProcessor(mockModel as unknown as never);
  });

  it('should persist log-event jobs into MongoDB', async () => {
    const payload: AuditPayload = {
      action: 'PROJECT_CREATED',
      actorId: 'usr_1',
      targetType: 'project',
      targetId: 'proj_1',
      timestamp: new Date(),
    };

    const mockJob = {
      id: 'job_audit_1',
      name: 'log-event',
      data: payload,
    } as Job<AuditPayload>;

    const result = await processor.process(mockJob);
    expect(result).toEqual({ success: true });
    expect(mockModel.create).toHaveBeenCalledWith(payload);
  });
});
