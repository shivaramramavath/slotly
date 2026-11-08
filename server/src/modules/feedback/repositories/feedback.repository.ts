// Database repository providing persistence operations for user feedback.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { Feedback, FeedbackDocument } from '../schemas/feedback.schema';
import type { FeedbackStatus, FeedbackType } from '@slotly/contracts';

/** Dependency injection token for feedback repository. */
export const FEEDBACK_REPOSITORY = Symbol('FEEDBACK_REPOSITORY');

/** Filter parameters for querying feedback items. */
export interface FeedbackFilterOptions {
  status?: FeedbackStatus | undefined;
  type?: FeedbackType | undefined;
  userId?: string | undefined;
  institutionId?: string | undefined;
  projectId?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

/** Interface defining operations for feedback repository. */
export interface FeedbackRepository extends BaseRepository<Feedback> {
  findByUser(userId: string): Promise<Feedback[]>;
  findByFilter(filter: FeedbackFilterOptions): Promise<Feedback[]>;
  countByFilter(filter: FeedbackFilterOptions): Promise<number>;
}

/** Mongoose implementation of feedback repository. */
@Injectable()
export class MongoFeedbackRepository
  extends MongoBaseRepository<Feedback, FeedbackDocument>
  implements FeedbackRepository
{
  constructor(@InjectModel(Feedback.name) model: Model<FeedbackDocument>) {
    super(model);
  }

  /**
   * Retrieves all feedback submitted by a specific user.
   */
  async findByUser(userId: string): Promise<Feedback[]> {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean<Feedback[]>()
      .exec();
  }

  /**
   * Retrieves feedback items matching administrative filters.
   */
  async findByFilter(filter: FeedbackFilterOptions): Promise<Feedback[]> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.type) query.type = filter.type;
    if (filter.userId) query.userId = filter.userId;
    if (filter.institutionId) query.institutionId = filter.institutionId;
    if (filter.projectId) query.projectId = filter.projectId;

    const q = this.model.find(query).sort({ createdAt: -1 });
    if (filter.offset) q.skip(filter.offset);
    if (filter.limit) q.limit(filter.limit);

    return q.lean<Feedback[]>().exec();
  }

  /**
   * Counts feedback matching administrative query filters.
   */
  async countByFilter(filter: FeedbackFilterOptions): Promise<number> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.type) query.type = filter.type;
    if (filter.userId) query.userId = filter.userId;
    if (filter.institutionId) query.institutionId = filter.institutionId;
    if (filter.projectId) query.projectId = filter.projectId;

    return this.model.countDocuments(query).exec();
  }
}
