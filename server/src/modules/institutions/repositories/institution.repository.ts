import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import {
  Institution,
  InstitutionDocument,
} from '../schemas/institution.schema';

export const INSTITUTION_REPOSITORY = Symbol('INSTITUTION_REPOSITORY');

export interface InstitutionRepository extends BaseRepository<Institution> {
  findByCode(code: string): Promise<Institution | null>;
  softDelete(id: string): Promise<boolean>;
}

@Injectable()
export class MongoInstitutionRepository
  extends MongoBaseRepository<Institution, InstitutionDocument>
  implements InstitutionRepository
{
  constructor(
    @InjectModel(Institution.name) model: Model<InstitutionDocument>,
  ) {
    super(model);
  }

  async findByCode(code: string): Promise<Institution | null> {
    const doc = await this.model
      .findOne({ code: code.toUpperCase().trim(), isDeleted: false })
      .lean<Institution>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }
}

@Injectable()
export class CachedInstitutionRepository
  extends CachedRepository<Institution>
  implements InstitutionRepository
{
  constructor(
    private readonly institutionRepo: InstitutionRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(institutionRepo, cache, 'institution', 86400);
  }

  async findByCode(code: string): Promise<Institution | null> {
    const key = `slotly:institution:code:${code.toUpperCase().trim()}`;
    return this.cache.remember<Institution | null>(
      key,
      86400,
      () => this.institutionRepo.findByCode(code),
      ['institution:all'],
    );
  }

  async softDelete(id: string): Promise<boolean> {
    const success = await this.institutionRepo.softDelete(id);
    if (success) {
      await this.cache.invalidateTag(`institution:${id}`);
      await this.cache.invalidateTag('institution:all');
    }
    return success;
  }

  override async update(
    id: string,
    update: Partial<Institution>,
  ): Promise<Institution | null> {
    const updated = await super.update(id, update);
    if (updated) {
      await this.cache.invalidateTag(`institution:${id}`);
      await this.cache.invalidateTag('institution:all');
    }
    return updated;
  }
}
