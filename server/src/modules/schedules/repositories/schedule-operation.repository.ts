// Database repository managing schedule-operation.repository persistence.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import {
  ScheduleOperation,
  ScheduleOperationDocument,
} from '../schemas/schedule-operation.schema';

/** Interface defining structure for schedule operation repository. */
export interface IScheduleOperationRepository {
  findLatest(versionId: string): Promise<ScheduleOperation | null>;
  findBySeq(versionId: string, seq: number): Promise<ScheduleOperation | null>;
  findHistory(versionId: string, limit?: number): Promise<ScheduleOperation[]>;
  create(
    op: Partial<ScheduleOperation>,
    session?: ClientSession,
  ): Promise<ScheduleOperation>;
  delete(id: string, session?: ClientSession): Promise<boolean>;
  deleteByVersion(versionId: string, session?: ClientSession): Promise<number>;
}

/** Injectable repository providing schedule operation persistence. */
@Injectable()
export class ScheduleOperationRepository
  extends MongoBaseRepository<ScheduleOperation, ScheduleOperationDocument>
  implements IScheduleOperationRepository
{
  constructor(
    @InjectModel(ScheduleOperation.name)
    model: Model<ScheduleOperationDocument>,
  ) {
    super(model);
  }

  async findLatest(versionId: string): Promise<ScheduleOperation | null> {
    const doc = await this.model
      .findOne({ versionId })
      .sort({ seq: -1 })
      .lean<ScheduleOperation>()
      .exec();
    return doc ?? null;
  }

  async findBySeq(
    versionId: string,
    seq: number,
  ): Promise<ScheduleOperation | null> {
    const doc = await this.model
      .findOne({ versionId, seq })
      .lean<ScheduleOperation>()
      .exec();
    return doc ?? null;
  }

  async findHistory(
    versionId: string,
    limit: number = 50,
  ): Promise<ScheduleOperation[]> {
    return this.model
      .find({ versionId })
      .sort({ seq: -1 })
      .limit(limit)
      .lean<ScheduleOperation[]>()
      .exec();
  }

  override async create(
    op: Partial<ScheduleOperation>,
    session?: ClientSession,
  ): Promise<ScheduleOperation> {
    if (session) {
      const created = await this.model.create(
        [op as ScheduleOperationDocument],
        { session },
      );
      const first = created[0];
      if (!first) {
        throw new Error('Failed to create schedule operation');
      }
      return first.toObject() as ScheduleOperation;
    }
    return super.create(op);
  }

  override async delete(id: string, session?: ClientSession): Promise<boolean> {
    const options = session ? { session } : undefined;
    const res = await this.model.findByIdAndDelete(id, options).exec();
    return res !== null;
  }

  async deleteByVersion(
    versionId: string,
    session?: ClientSession,
  ): Promise<number> {
    const options = session ? { session } : undefined;
    const res = await this.model.deleteMany({ versionId }, options).exec();
    return res.deletedCount || 0;
  }
}
