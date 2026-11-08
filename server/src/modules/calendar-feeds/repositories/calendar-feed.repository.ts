// Database repository managing calendar feed persistence and queries.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CalendarFeed,
  CalendarFeedDocument,
} from '../schemas/calendar-feed.schema';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';

/** Repository managing calendar feed persistence. */
@Injectable()
export class CalendarFeedRepository extends MongoBaseRepository<
  CalendarFeed,
  CalendarFeedDocument
> {
  constructor(
    @InjectModel(CalendarFeed.name)
    model: Model<CalendarFeedDocument>,
  ) {
    super(model);
  }

  /** Finds a calendar feed by its hashed token. */
  async findByTokenHash(tokenHash: string): Promise<CalendarFeed | null> {
    return this.model.findOne({ tokenHash }).lean<CalendarFeed>().exec();
  }

  /** Finds active calendar feeds for a project. */
  async findByProject(projectId: string): Promise<CalendarFeed[]> {
    return this.model
      .find({ projectId, isActive: true })
      .sort({ createdAt: -1 })
      .lean<CalendarFeed[]>()
      .exec();
  }

  /** Marks a calendar feed inactive. */
  async revoke(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id } as any, {
        $set: { isActive: false, updatedAt: new Date() },
      })
      .exec();
    return res.modifiedCount > 0;
  }

  /** Records feed access time. */
  async touchAccess(id: string): Promise<void> {
    await this.model
      .updateOne({ _id: id } as any, { $set: { lastAccessedAt: new Date() } })
      .exec();
  }
}
