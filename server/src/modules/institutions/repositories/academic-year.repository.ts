import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import {
  AcademicYear,
  AcademicYearDocument,
} from '../schemas/academic-year.schema';

export const ACADEMIC_YEAR_REPOSITORY = Symbol('ACADEMIC_YEAR_REPOSITORY');

export interface AcademicYearRepository extends BaseRepository<AcademicYear> {
  findByProgram(programId: string): Promise<AcademicYear[]>;
  findByInstitution(institutionId: string): Promise<AcademicYear[]>;
  findByYearNumber(
    programId: string,
    yearNumber: number,
  ): Promise<AcademicYear | null>;
  softDelete(id: string): Promise<boolean>;
  countActiveByProgram(programId: string): Promise<number>;
  countActiveByInstitution(institutionId: string): Promise<number>;
}

@Injectable()
export class MongoAcademicYearRepository
  extends MongoBaseRepository<AcademicYear, AcademicYearDocument>
  implements AcademicYearRepository
{
  constructor(
    @InjectModel(AcademicYear.name) model: Model<AcademicYearDocument>,
  ) {
    super(model);
  }

  async findByProgram(programId: string): Promise<AcademicYear[]> {
    return this.model
      .find({ programId, isDeleted: false })
      .sort({ yearNumber: 1 })
      .lean<AcademicYear[]>()
      .exec();
  }

  async findByInstitution(institutionId: string): Promise<AcademicYear[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ yearNumber: 1 })
      .lean<AcademicYear[]>()
      .exec();
  }

  async findByYearNumber(
    programId: string,
    yearNumber: number,
  ): Promise<AcademicYear | null> {
    const doc = await this.model
      .findOne({ programId, yearNumber, isDeleted: false })
      .lean<AcademicYear>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }

  async countActiveByProgram(programId: string): Promise<number> {
    return this.model.countDocuments({ programId, isDeleted: false }).exec();
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.model
      .countDocuments({ institutionId, isDeleted: false })
      .exec();
  }
}

@Injectable()
export class CachedAcademicYearRepository
  extends CachedRepository<AcademicYear>
  implements AcademicYearRepository
{
  constructor(
    private readonly yearRepo: AcademicYearRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(yearRepo, cache, 'academic_year', 86400);
  }

  async findByProgram(programId: string): Promise<AcademicYear[]> {
    return this.yearRepo.findByProgram(programId);
  }

  async findByInstitution(institutionId: string): Promise<AcademicYear[]> {
    const key = `slotly:institution:${institutionId}:academic_years`;
    return this.cache.remember<AcademicYear[]>(
      key,
      86400,
      () => this.yearRepo.findByInstitution(institutionId),
      [`institution:${institutionId}`],
    );
  }

  async findByYearNumber(
    programId: string,
    yearNumber: number,
  ): Promise<AcademicYear | null> {
    return this.yearRepo.findByYearNumber(programId, yearNumber);
  }

  async softDelete(id: string): Promise<boolean> {
    const entity = await this.yearRepo.findById(id);
    const success = await this.yearRepo.softDelete(id);
    if (success && entity?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${entity.institutionId.toString()}`,
      );
    }
    return success;
  }

  async countActiveByProgram(programId: string): Promise<number> {
    return this.yearRepo.countActiveByProgram(programId);
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.yearRepo.countActiveByInstitution(institutionId);
  }

  override async create(doc: Partial<AcademicYear>): Promise<AcademicYear> {
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
    update: Partial<AcademicYear>,
  ): Promise<AcademicYear | null> {
    const updated = await super.update(id, update);
    if (updated?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${updated.institutionId.toString()}`,
      );
    }
    return updated;
  }
}
