// Unit tests validating feedback submission, user listing, and administrative updates.
import { NotFoundException } from '@nestjs/common';
import { FeedbackService } from '../services/feedback.service';
import type {
  FeedbackRepository,
  FeedbackFilterOptions,
} from '../repositories/feedback.repository';
import type { Feedback } from '../schemas/feedback.schema';
import type { CreateFeedbackDto, UpdateFeedbackDto } from '@slotly/contracts';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockRepo: jest.Mocked<FeedbackRepository>;

  const sampleFeedback: Feedback = {
    id: 'fb-1',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    institutionId: 'inst-1',
    type: 'problem',
    message: 'Found an issue with period timing',
    rating: 4,
    status: 'open',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      findByFilter: jest.fn(),
      countByFilter: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<FeedbackRepository>;

    service = new FeedbackService(mockRepo);
  });

  it('submits a new feedback item', async () => {
    const dto: CreateFeedbackDto = {
      type: 'idea',
      message: 'Add dark mode contrast toggle',
      rating: 5,
    };

    mockRepo.create.mockResolvedValueOnce({
      ...sampleFeedback,
      id: 'fb-2',
      type: 'idea',
      message: dto.message,
      rating: 5,
    });

    const result = await service.submitFeedback(
      'user-1',
      'John Doe',
      'john@example.com',
      'inst-1',
      dto,
    );

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'idea',
        message: 'Add dark mode contrast toggle',
        rating: 5,
        status: 'open',
      }),
    );
    expect(result.id).toBe('fb-2');
    expect(result.status).toBe('open');
  });

  it('retrieves user feedback items', async () => {
    mockRepo.findByUser.mockResolvedValueOnce([sampleFeedback]);

    const items = await service.getUserFeedback('user-1');
    expect(items.length).toBe(1);
    expect(items[0]?.id).toBe('fb-1');
    expect(items[0]?.message).toBe(sampleFeedback.message);
  });

  it('lists feedback for admin with pagination and status filter', async () => {
    mockRepo.findByFilter.mockResolvedValueOnce([sampleFeedback]);
    mockRepo.countByFilter.mockResolvedValueOnce(1);

    const result = await service.listFeedback({
      status: 'open',
      page: 1,
      limit: 10,
    });

    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
    expect(mockRepo.findByFilter).toHaveBeenCalledWith(
      expect.objectContaining<FeedbackFilterOptions>({
        status: 'open',
        limit: 10,
        offset: 0,
      }),
    );
  });

  it('updates feedback status and attaches admin reply', async () => {
    mockRepo.findById.mockResolvedValueOnce(sampleFeedback);
    mockRepo.update.mockResolvedValueOnce({
      ...sampleFeedback,
      status: 'resolved',
      adminReply: 'Fixed in version 1.2',
      repliedBy: 'admin-1',
    });

    const dto: UpdateFeedbackDto = {
      status: 'resolved',
      adminReply: 'Fixed in version 1.2',
    };

    const updated = await service.updateFeedback('fb-1', 'admin-1', dto);

    expect(mockRepo.update).toHaveBeenCalledWith(
      'fb-1',
      expect.objectContaining({
        status: 'resolved',
        adminReply: 'Fixed in version 1.2',
        repliedBy: 'admin-1',
      }),
    );
    expect(updated.status).toBe('resolved');
    expect(updated.adminReply).toBe('Fixed in version 1.2');
  });

  it('throws NotFoundException when updating non-existent feedback', async () => {
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(
      service.updateFeedback('fb-999', 'admin-1', { status: 'resolved' }),
    ).rejects.toThrow(NotFoundException);
  });
});
