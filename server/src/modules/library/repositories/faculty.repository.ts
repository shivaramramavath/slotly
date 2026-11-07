// Database repository managing faculty.repository persistence.
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Faculty, FacultyDocument } from '../schemas/faculty.schema';

/** Constant representing faculty repository. */
export const FACULTY_REPOSITORY = Symbol('FACULTY_REPOSITORY');

/** Interface defining structure for faculty filter options. */
export interface FacultyFilterOptions {
  departmentId?: string;
  archived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/** Interface defining structure for faculty repository. */
export interface FacultyRepository extends BaseRepository<Faculty> {
  findByInstitution(
    institutionId: string,
    options?: FacultyFilterOptions,
  ): Promise<{ items: Faculty[]; total: number }>;
  findByCode(institutionId: string, code: string): Promise<Faculty | null>;
  findByDepartment(
    institutionId: string,
    departmentId: string,
  ): Promise<Faculty[]>;
  setArchived(id: string, archived: boolean): Promise<Faculty | null>;
  softDelete(id: string): Promise<boolean>;
  countByInstitution(institutionId: string): Promise<number>;
}

/** Injectable service providing mongo faculty repository logic. */
@Injectable()
export class MongoFacultyRepository
  extends MongoBaseRepository<Faculty, FacultyDocument>
  implements FacultyRepository
{
  constructor(@InjectModel(Faculty.name) model: Model<FacultyDocument>) {
    super(model);
  }

  async findByInstitution(
    institutionId: string,
    options: FacultyFilterOptions = {},
  ): Promise<{ items: Faculty[]; total: number }> {
    const { departmentId, archived, search, page = 1, limit = 50 } = options;

    const query: Record<string, unknown> = {
      institutionId,
      isDeleted: false,
    };

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (typeof archived === 'boolean') {
      query.archived = archived;
    }

    if (search && search.trim().length > 0) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: reg },
        { code: reg },
        { email: reg },
        { designation: reg },
      ];
    }

    const total = await this.model.countDocuments(query).exec();
    const items = await this.model
      .find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Faculty[]>()
      .exec();

    return { items, total };
  }

  async findByCode(
    institutionId: string,
    code: string,
  ): Promise<Faculty | null> {
    const doc = await this.model
      .findOne({
        institutionId,
        code: code.toUpperCase().trim(),
        isDeleted: false,
      })
      .lean<Faculty>()
      .exec();
    return doc ?? null;
  }

  async findByDepartment(
    institutionId: string,
    departmentId: string,
  ): Promise<Faculty[]> {
    return this.model
      .find({
        institutionId,
        departmentId,
        isDeleted: false,
      })
      .sort({ name: 1 })
      .lean<Faculty[]>()
      .exec();
  }

  async setArchived(id: string, archived: boolean): Promise<Faculty | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { archived }, { new: true })
      .lean<Faculty>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }

  async countByInstitution(institutionId: string): Promise<number> {
    return this.model
      .countDocuments({ institutionId, isDeleted: false })
      .exec();
  }
}

/** Injectable service providing cached faculty repository logic. */
@Injectable()
export class CachedFacultyRepository
  extends CachedRepository<Faculty>
  implements FacultyRepository
{
  private readonly facultyRepo: MongoFacultyRepository;

  constructor(
    repo: MongoFacultyRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(repo, cache, 'faculty', 3600);
    this.facultyRepo = repo;
  }

  async findByInstitution(
    institutionId: string,
    options?: FacultyFilterOptions,
  ): Promise<{ items: Faculty[]; total: number }> {
    const isDefault =
      !options?.search &&
      !options?.departmentId &&
      options?.archived === undefined &&
      (!options?.page || options.page === 1);

    if (isDefault) {
      return this.cache.remember(
        `slotly:library:faculty:${institutionId}:all`,
        3600,
        async () => this.facultyRepo.findByInstitution(institutionId, options),
        [`library:faculty:${institutionId}`, `library:${institutionId}`],
      );
    }

    return this.facultyRepo.findByInstitution(institutionId, options);
  }

  async findByCode(
    institutionId: string,
    code: string,
  ): Promise<Faculty | null> {
    return this.facultyRepo.findByCode(institutionId, code);
  }

  async findByDepartment(
    institutionId: string,
    departmentId: string,
  ): Promise<Faculty[]> {
    return this.facultyRepo.findByDepartment(institutionId, departmentId);
  }

  async setArchived(id: string, archived: boolean): Promise<Faculty | null> {
    const res = await this.facultyRepo.setArchived(id, archived);
    if (res?.institutionId) {
      await this.cache.invalidateTag(`library:faculty:${res.institutionId}`);
      await this.cache.invalidateTag(`library:${res.institutionId}`);
    }
    return res;
  }

  async softDelete(id: string): Promise<boolean> {
    const item = await this.facultyRepo.findById(id);
    const ok = await this.facultyRepo.softDelete(id);
    if (ok && item?.institutionId) {
      await this.cache.invalidateTag(`library:faculty:${item.institutionId}`);
      await this.cache.invalidateTag(`library:${item.institutionId}`);
    }
    return ok;
  }

  async countByInstitution(institutionId: string): Promise<number> {
    return this.facultyRepo.countByInstitution(institutionId);
  }
}
