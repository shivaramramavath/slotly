// Database repository managing section.repository persistence.
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Section, SectionDocument } from '../schemas/section.schema';

/** Constant representing section repository. */
export const SECTION_REPOSITORY = Symbol('SECTION_REPOSITORY');

/** Interface defining structure for section repository. */
export interface SectionRepository extends BaseRepository<Section> {
  findBySemester(semesterId: string): Promise<Section[]>;
  findByInstitution(institutionId: string): Promise<Section[]>;
  findByName(semesterId: string, name: string): Promise<Section | null>;
  softDelete(id: string): Promise<boolean>;
  countActiveBySemester(semesterId: string): Promise<number>;
  countActiveByInstitution(institutionId: string): Promise<number>;
}

/** Injectable service providing mongo section repository logic. */
@Injectable()
export class MongoSectionRepository
  extends MongoBaseRepository<Section, SectionDocument>
  implements SectionRepository
{
  constructor(@InjectModel(Section.name) model: Model<SectionDocument>) {
    super(model);
  }

  async findBySemester(semesterId: string): Promise<Section[]> {
    return this.model
      .find({ semesterId, isDeleted: false })
      .sort({ name: 1 })
      .lean<Section[]>()
      .exec();
  }

  async findByInstitution(institutionId: string): Promise<Section[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ name: 1 })
      .lean<Section[]>()
      .exec();
  }

  async findByName(semesterId: string, name: string): Promise<Section | null> {
    const doc = await this.model
      .findOne({ semesterId, name: name.trim(), isDeleted: false })
      .lean<Section>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }

  async countActiveBySemester(semesterId: string): Promise<number> {
    return this.model.countDocuments({ semesterId, isDeleted: false }).exec();
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.model
      .countDocuments({ institutionId, isDeleted: false })
      .exec();
  }
}

/** Injectable service providing cached section repository logic. */
@Injectable()
export class CachedSectionRepository
  extends CachedRepository<Section>
  implements SectionRepository
{
  constructor(
    private readonly sectionRepo: SectionRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(sectionRepo, cache, 'section', 86400);
  }

  async findBySemester(semesterId: string): Promise<Section[]> {
    return this.sectionRepo.findBySemester(semesterId);
  }

  async findByInstitution(institutionId: string): Promise<Section[]> {
    const key = `slotly:institution:${institutionId}:sections`;
    return this.cache.remember<Section[]>(
      key,
      86400,
      () => this.sectionRepo.findByInstitution(institutionId),
      [`institution:${institutionId}`],
    );
  }

  async findByName(semesterId: string, name: string): Promise<Section | null> {
    return this.sectionRepo.findByName(semesterId, name);
  }

  async softDelete(id: string): Promise<boolean> {
    const entity = await this.sectionRepo.findById(id);
    const success = await this.sectionRepo.softDelete(id);
    if (success && entity?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${entity.institutionId.toString()}`,
      );
    }
    return success;
  }

  async countActiveBySemester(semesterId: string): Promise<number> {
    return this.sectionRepo.countActiveBySemester(semesterId);
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.sectionRepo.countActiveByInstitution(institutionId);
  }

  override async create(doc: Partial<Section>): Promise<Section> {
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
    update: Partial<Section>,
  ): Promise<Section | null> {
    const updated = await super.update(id, update);
    if (updated?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${updated.institutionId.toString()}`,
      );
    }
    return updated;
  }
}
