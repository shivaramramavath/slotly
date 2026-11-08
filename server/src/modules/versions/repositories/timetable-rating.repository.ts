// Database repository managing timetable-rating persistence in MongoDB.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import {
  TimetableRating,
  TimetableRatingDocument,
} from '../schemas/timetable-rating.schema';

/** Interface defining structure for timetable rating repository operations. */
export interface ITimetableRatingRepository {
  findByVersionId(versionId: string): Promise<TimetableRating[]>;
  findByProjectId(projectId: string): Promise<TimetableRating[]>;
  create(data: Partial<TimetableRating>): Promise<TimetableRating>;
}

/** Injectable repository providing persistence for timetable quality ratings. */
@Injectable()
export class TimetableRatingRepository
  extends MongoBaseRepository<TimetableRating, TimetableRatingDocument>
  implements ITimetableRatingRepository
{
  constructor(
    @InjectModel(TimetableRating.name)
    model: Model<TimetableRatingDocument>,
  ) {
    super(model);
  }

  /** Finds all ratings submitted for a timetable version. */
  async findByVersionId(versionId: string): Promise<TimetableRating[]> {
    const docs = await this.model
      .find({ versionId })
      .sort({ createdAt: -1 })
      .lean<TimetableRating[]>()
      .exec();
    return docs;
  }

  /** Finds all ratings submitted across versions for a project. */
  async findByProjectId(projectId: string): Promise<TimetableRating[]> {
    const docs = await this.model
      .find({ projectId })
      .sort({ createdAt: -1 })
      .lean<TimetableRating[]>()
      .exec();
    return docs;
  }
}
