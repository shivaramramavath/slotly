import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import {
  ElectiveGroup,
  ElectiveGroupDocument,
} from '../schemas/elective-group.schema';

export const ELECTIVE_GROUP_REPOSITORY = Symbol('ELECTIVE_GROUP_REPOSITORY');

export interface ElectiveGroupRepository extends BaseRepository<ElectiveGroup> {
  findByInstitution(institutionId: string): Promise<ElectiveGroup[]>;
  softDelete(id: string): Promise<boolean>;
}

@Injectable()
export class MongoElectiveGroupRepository
  extends MongoBaseRepository<ElectiveGroup, ElectiveGroupDocument>
  implements ElectiveGroupRepository
{
  constructor(
    @InjectModel(ElectiveGroup.name) model: Model<ElectiveGroupDocument>,
  ) {
    super(model);
  }

  async findByInstitution(institutionId: string): Promise<ElectiveGroup[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ name: 1 })
      .lean<ElectiveGroup[]>()
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
export class CachedElectiveGroupRepository
  extends CachedRepository<ElectiveGroup>
  implements ElectiveGroupRepository
{
  private readonly electiveRepo: MongoElectiveGroupRepository;

  constructor(
    repo: MongoElectiveGroupRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(repo, cache, 'elective-group', 3600);
    this.electiveRepo = repo;
  }

  async findByInstitution(institutionId: string): Promise<ElectiveGroup[]> {
    return this.cache.remember(
      `slotly:library:elective-group:${institutionId}:all`,
      3600,
      async () => this.electiveRepo.findByInstitution(institutionId),
      [`library:elective-groups:${institutionId}`, `library:${institutionId}`],
    );
  }

  async softDelete(id: string): Promise<boolean> {
    const item = await this.electiveRepo.findById(id);
    const ok = await this.electiveRepo.softDelete(id);
    if (ok && item?.institutionId) {
      await this.cache.invalidateTag(
        `library:elective-groups:${item.institutionId}`,
      );
      await this.cache.invalidateTag(`library:${item.institutionId}`);
    }
    return ok;
  }
}
