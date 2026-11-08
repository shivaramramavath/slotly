// Service managing feedback submissions, user listing, and administrative triage.
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  CreateFeedbackDto,
  FeedbackDto,
  UpdateFeedbackDto,
  FeedbackStatus,
  FeedbackType,
} from '@slotly/contracts';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
  type FeedbackFilterOptions,
} from '../repositories/feedback.repository';
import type { Feedback } from '../schemas/feedback.schema';

/** Business service handling user feedback and issue reports. */
@Injectable()
export class FeedbackService {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepo: FeedbackRepository,
  ) {}

  /**
   * Submits a new user feedback item.
   */
  async submitFeedback(
    userId: string,
    userName: string,
    userEmail: string,
    institutionId: string | undefined,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    const feedbackData: Partial<Feedback> = {
      userId,
      userName,
      userEmail,
      type: dto.type,
      message: dto.message,
      status: 'open',
    };
    if (institutionId) feedbackData.institutionId = institutionId;
    if (dto.rating !== undefined) feedbackData.rating = dto.rating;
    if (dto.projectId) feedbackData.projectId = dto.projectId;
    if (dto.versionId) feedbackData.versionId = dto.versionId;

    const feedback = await this.feedbackRepo.create(feedbackData);
    return this.mapToDto(feedback);
  }

  /**
   * Retrieves all feedback submitted by the calling user.
   */
  async getUserFeedback(userId: string): Promise<FeedbackDto[]> {
    const items = await this.feedbackRepo.findByUser(userId);
    return items.map((f) => this.mapToDto(f));
  }

  /**
   * Retrieves paginated feedback items with administrative filters.
   */
  async listFeedback(filter: {
    status?: FeedbackStatus | undefined;
    type?: FeedbackType | undefined;
    institutionId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }): Promise<{ items: FeedbackDto[]; total: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 50;
    const offset = (page - 1) * limit;

    const queryFilter: FeedbackFilterOptions = {
      status: filter.status,
      type: filter.type,
      institutionId: filter.institutionId,
      limit,
      offset,
    };

    const [items, total] = await Promise.all([
      this.feedbackRepo.findByFilter(queryFilter),
      this.feedbackRepo.countByFilter(queryFilter),
    ]);

    return {
      items: items.map((f) => this.mapToDto(f)),
      total,
    };
  }

  /**
   * Updates feedback status and attaches an administrative reply.
   */
  async updateFeedback(
    id: string,
    adminId: string,
    dto: UpdateFeedbackDto,
  ): Promise<FeedbackDto> {
    const existing = await this.feedbackRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Feedback ${id} not found`);
    }

    const updates: Partial<Feedback> = {};
    if (dto.status) updates.status = dto.status;
    if (dto.adminReply !== undefined) {
      updates.adminReply = dto.adminReply;
      updates.repliedBy = adminId;
      updates.repliedAt = new Date().toISOString();
    }

    const updated = await this.feedbackRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundException(`Feedback ${id} not found`);
    }

    return this.mapToDto(updated);
  }

  /**
   * Maps internal feedback database document to contracts DTO.
   */
  private mapToDto(doc: Feedback): FeedbackDto {
    const result: FeedbackDto = {
      id: String(doc.id ?? doc._id),
      userId: doc.userId,
      userName: doc.userName,
      userEmail: doc.userEmail,
      type: doc.type,
      message: doc.message,
      status: doc.status,
      createdAt: (doc.createdAt
        ? new Date(doc.createdAt)
        : new Date()
      ).toISOString(),
      updatedAt: (doc.updatedAt
        ? new Date(doc.updatedAt)
        : new Date()
      ).toISOString(),
    };
    if (doc.rating !== undefined) result.rating = doc.rating;
    if (doc.projectId !== undefined) result.projectId = doc.projectId;
    if (doc.versionId !== undefined) result.versionId = doc.versionId;
    if (doc.adminReply !== undefined) result.adminReply = doc.adminReply;

    return result;
  }
}
