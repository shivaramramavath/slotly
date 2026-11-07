// Database repository managing semester.repository persistence.
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Semester, SemesterDocument } from '../schemas/semester.schema';

/** Constant representing semester repository. */
export const SEMESTER_REPOSITORY = Symbol('SEMESTER_REPOSITORY');

/** Interface defining structure for semester repository. */
export interface SemesterRepository extends BaseRepository<Semester> {
  findByAcademicYear(academicYearId: string): Promise<Semester[]>;
  findByInstitution(institutionId: string): Promise<Semester[]>;
  findByNumber(
    academicYearId: string,
    number: number,
  ): Promise<Semester | null>;
  softDelete(id: string): Promise<boolean>;
  countActiveByAcademicYear(academicYearId: string): Promise<number>;
  countActiveByInstitution(institutionId: string): Promise<number>;
}

/** Injectable service providing mongo semester repository logic. */
@Injectable()
export class MongoSemesterRepository
  extends MongoBaseRepository<Semester, SemesterDocument>
  implements SemesterRepository
{
  constructor(@InjectModel(Semester.name) model: Model<SemesterDocument>) {
    super(model);
  }

  async findByAcademicYear(academicYearId: string): Promise<Semester[]> {
    return this.model
      .find({ academicYearId, isDeleted: false })
      .sort({ number: 1 })
      .lean<Semester[]>()
      .exec();
  }

  async findByInstitution(institutionId: string): Promise<Semester[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ number: 1 })
      .lean<Semester[]>()
      .exec();
  }

  async findByNumber(
    academicYearId: string,
    number: number,
  ): Promise<Semester | null> {
    const doc = await this.model
      .findOne({ academicYearId, number, isDeleted: false })
      .lean<Semester>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }

  async countActiveByAcademicYear(academicYearId: string): Promise<number> {
    return this.model
      .countDocuments({ academicYearId, isDeleted: false })
      .exec();
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.model
      .countDocuments({ institutionId, isDeleted: false })
      .exec();
  }
}

/** Injectable service providing cached semester repository logic. */
@Injectable()
export class CachedSemesterRepository
  extends CachedRepository<Semester>
  implements SemesterRepository
{
  constructor(
    private readonly semesterRepo: SemesterRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(semesterRepo, cache, 'semester', 86400);
  }

  async findByAcademicYear(academicYearId: string): Promise<Semester[]> {
    return this.semesterRepo.findByAcademicYear(academicYearId);
  }

  async findByInstitution(institutionId: string): Promise<Semester[]> {
    const key = `slotly:institution:${institutionId}:semesters`;
    return this.cache.remember<Semester[]>(
      key,
      86400,
      () => this.semesterRepo.findByInstitution(institutionId),
      [`institution:${institutionId}`],
    );
  }

  async findByNumber(
    academicYearId: string,
    number: number,
  ): Promise<Semester | null> {
    return this.semesterRepo.findByNumber(academicYearId, number);
  }

  async softDelete(id: string): Promise<boolean> {
    const entity = await this.semesterRepo.findById(id);
    const success = await this.semesterRepo.softDelete(id);
    if (success && entity?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${entity.institutionId.toString()}`,
      );
    }
    return success;
  }

  async countActiveByAcademicYear(academicYearId: string): Promise<number> {
    return this.semesterRepo.countActiveByAcademicYear(academicYearId);
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.semesterRepo.countActiveByInstitution(institutionId);
  }

  override async create(doc: Partial<Semester>): Promise<Semester> {
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
    update: Partial<Semester>,
  ): Promise<Semester | null> {
    const updated = await super.update(id, update);
    if (updated?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${updated.institutionId.toString()}`,
      );
    }
    return updated;
  }
}
