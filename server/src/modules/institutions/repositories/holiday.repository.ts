import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Holiday, HolidayDocument } from '../schemas/holiday.schema';

export const HOLIDAY_REPOSITORY = Symbol('HOLIDAY_REPOSITORY');

export interface HolidayRepository extends BaseRepository<Holiday> {
  findByInstitution(institutionId: string): Promise<Holiday[]>;
  softDelete(id: string): Promise<boolean>;
}

@Injectable()
export class MongoHolidayRepository
  extends MongoBaseRepository<Holiday, HolidayDocument>
  implements HolidayRepository
{
  constructor(@InjectModel(Holiday.name) model: Model<HolidayDocument>) {
    super(model);
  }

  async findByInstitution(institutionId: string): Promise<Holiday[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ startDate: 1 })
      .lean<Holiday[]>()
      .exec();
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }
}

@Injectable()
export class CachedHolidayRepository
  extends CachedRepository<Holiday>
  implements HolidayRepository
{
  constructor(
    private readonly holidayRepo: HolidayRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(holidayRepo, cache, 'holiday', 86400);
  }

  async findByInstitution(institutionId: string): Promise<Holiday[]> {
    const key = `slotly:institution:${institutionId}:holidays`;
    return this.cache.remember<Holiday[]>(
      key,
      86400,
      () => this.holidayRepo.findByInstitution(institutionId),
      [`institution:${institutionId}`],
    );
  }

  async softDelete(id: string): Promise<boolean> {
    const entity = await this.holidayRepo.findById(id);
    const success = await this.holidayRepo.softDelete(id);
    if (success && entity?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${entity.institutionId.toString()}`,
      );
    }
    return success;
  }

  override async create(doc: Partial<Holiday>): Promise<Holiday> {
    const created = await super.create(doc);
    if (created?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${created.institutionId.toString()}`,
      );
    }
    return created;
  }

  override async update(
    id: string,
    update: Partial<Holiday>,
  ): Promise<Holiday | null> {
    const updated = await super.update(id, update);
    if (updated?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${updated.institutionId.toString()}`,
      );
    }
    return updated;
  }
}
