// Database repository managing schedule-occupancy.repository persistence.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import {
  ScheduleOccupancy,
  ScheduleOccupancyDocument,
} from '../schemas/schedule-occupancy.schema';
import type { ScheduleResourceType } from '@slotly/contracts';

/** Interface defining query filter for schedule occupancies. */
export interface OccupancyFilter {
  versionId: string;
  resourceType?: ScheduleResourceType | undefined;
  resourceId?: string | undefined;
  day?: number | undefined;
  period?: number | undefined;
  entryId?: string | undefined;
}

/** Interface defining structure for schedule occupancy repository. */
export interface IScheduleOccupancyRepository {
  findByVersion(versionId: string): Promise<ScheduleOccupancy[]>;
  findByFilter(filter: OccupancyFilter): Promise<ScheduleOccupancy[]>;
  createMany(
    occupancies: Array<Partial<ScheduleOccupancy>>,
    session?: ClientSession,
  ): Promise<ScheduleOccupancy[]>;
  deleteByEntryId(entryId: string, session?: ClientSession): Promise<number>;
  deleteByVersion(versionId: string, session?: ClientSession): Promise<number>;
}

/** Injectable repository providing schedule occupancy persistence. */
@Injectable()
export class ScheduleOccupancyRepository
  extends MongoBaseRepository<ScheduleOccupancy, ScheduleOccupancyDocument>
  implements IScheduleOccupancyRepository
{
  constructor(
    @InjectModel(ScheduleOccupancy.name)
    model: Model<ScheduleOccupancyDocument>,
  ) {
    super(model);
  }

  async findByVersion(versionId: string): Promise<ScheduleOccupancy[]> {
    return this.model.find({ versionId }).lean<ScheduleOccupancy[]>().exec();
  }

  async findByFilter(filter: OccupancyFilter): Promise<ScheduleOccupancy[]> {
    const q: Record<string, unknown> = { versionId: filter.versionId };
    if (filter.resourceType) q['resourceType'] = filter.resourceType;
    if (filter.resourceId) q['resourceId'] = filter.resourceId;
    if (filter.day !== undefined) q['day'] = filter.day;
    if (filter.period !== undefined) q['period'] = filter.period;
    if (filter.entryId) q['entryId'] = filter.entryId;

    return this.model.find(q).lean<ScheduleOccupancy[]>().exec();
  }

  async createMany(
    occupancies: Array<Partial<ScheduleOccupancy>>,
    session?: ClientSession,
  ): Promise<ScheduleOccupancy[]> {
    const created = session
      ? await this.model.insertMany(
          occupancies as ScheduleOccupancyDocument[],
          { session },
        )
      : await this.model.insertMany(occupancies as ScheduleOccupancyDocument[]);
    return (
      created as unknown as Array<
        { toObject?: () => ScheduleOccupancy } & ScheduleOccupancy
      >
    ).map((doc) =>
      typeof doc.toObject === 'function'
        ? doc.toObject()
        : (doc as ScheduleOccupancy),
    );
  }

  async deleteByEntryId(
    entryId: string,
    session?: ClientSession,
  ): Promise<number> {
    const options = session ? { session } : undefined;
    const res = await this.model.deleteMany({ entryId }, options).exec();
    return res.deletedCount || 0;
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
