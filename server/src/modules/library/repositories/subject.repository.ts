import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Subject, SubjectDocument } from '../schemas/subject.schema';

export const SUBJECT_REPOSITORY = Symbol('SUBJECT_REPOSITORY');

export interface SubjectFilterOptions {
  departmentId?: string;
  type?: string;
  archived?: boolean;
  search?: string;
  isElective?: boolean;
  electiveGroupId?: string;
  page?: number;
  limit?: number;
}

export interface SubjectRepository extends BaseRepository<Subject> {
  findByInstitution(
    institutionId: string,
    options?: SubjectFilterOptions,
  ): Promise<{ items: Subject[]; total: number }>;
  findByCode(institutionId: string, code: string): Promise<Subject | null>;
  findByDepartment(
    institutionId: string,
    departmentId: string,
  ): Promise<Subject[]>;
  findByIds(ids: string[]): Promise<Subject[]>;
  setArchived(id: string, archived: boolean): Promise<Subject | null>;
  softDelete(id: string): Promise<boolean>;
  countByInstitution(institutionId: string): Promise<number>;
}

@Injectable()
export class MongoSubjectRepository
  extends MongoBaseRepository<Subject, SubjectDocument>
  implements SubjectRepository
{
  constructor(@InjectModel(Subject.name) model: Model<SubjectDocument>) {
    super(model);
  }

  async findByInstitution(
    institutionId: string,
    options: SubjectFilterOptions = {},
  ): Promise<{ items: Subject[]; total: number }> {
    const {
      departmentId,
      type,
      archived,
      search,
      isElective,
      electiveGroupId,
      page = 1,
      limit = 50,
    } = options;

    const query: Record<string, unknown> = {
      institutionId,
      isDeleted: false,
    };

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (type) {
      query.type = type;
    }

    if (typeof archived === 'boolean') {
      query.archived = archived;
    }

    if (typeof isElective === 'boolean') {
      query.isElective = isElective;
    }

    if (electiveGroupId) {
      query.electiveGroupId = electiveGroupId;
    }

    if (search && search.trim().length > 0) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { code: reg }];
    }

    const total = await this.model.countDocuments(query).exec();
    const items = await this.model
      .find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Subject[]>()
      .exec();

    return { items, total };
  }

  async findByCode(
    institutionId: string,
    code: string,
  ): Promise<Subject | null> {
    const doc = await this.model
      .findOne({
        institutionId,
        code: code.toUpperCase().trim(),
        isDeleted: false,
      })
      .lean<Subject>()
      .exec();
    return doc ?? null;
  }

  async findByDepartment(
    institutionId: string,
    departmentId: string,
  ): Promise<Subject[]> {
    return this.model
      .find({
        institutionId,
        departmentId,
        isDeleted: false,
      })
      .sort({ name: 1 })
      .lean<Subject[]>()
      .exec();
  }

  async findByIds(ids: string[]): Promise<Subject[]> {
    if (ids.length === 0) return [];
    return this.model
      .find({
        _id: { $in: ids },
        isDeleted: false,
      })
      .sort({ name: 1 })
      .lean<Subject[]>()
      .exec();
  }

  async setArchived(id: string, archived: boolean): Promise<Subject | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { archived }, { new: true })
      .lean<Subject>()
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

@Injectable()
export class CachedSubjectRepository
  extends CachedRepository<Subject>
  implements SubjectRepository
{
  private readonly subjectRepo: MongoSubjectRepository;

  constructor(
    repo: MongoSubjectRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(repo, cache, 'subject', 3600);
    this.subjectRepo = repo;
  }

  async findByInstitution(
    institutionId: string,
    options?: SubjectFilterOptions,
  ): Promise<{ items: Subject[]; total: number }> {
    const isDefault =
      !options?.search &&
      !options?.departmentId &&
      !options?.type &&
      options?.archived === undefined &&
      options?.isElective === undefined &&
      !options?.electiveGroupId &&
      (!options?.page || options.page === 1);

    if (isDefault) {
      return this.cache.remember(
        `slotly:library:subject:${institutionId}:all`,
        3600,
        async () => this.subjectRepo.findByInstitution(institutionId, options),
        [`library:subjects:${institutionId}`, `library:${institutionId}`],
      );
    }

    return this.subjectRepo.findByInstitution(institutionId, options);
  }

  async findByCode(
    institutionId: string,
    code: string,
  ): Promise<Subject | null> {
    return this.subjectRepo.findByCode(institutionId, code);
  }

  async findByDepartment(
    institutionId: string,
    departmentId: string,
  ): Promise<Subject[]> {
    return this.subjectRepo.findByDepartment(institutionId, departmentId);
  }

  async findByIds(ids: string[]): Promise<Subject[]> {
    return this.subjectRepo.findByIds(ids);
  }

  async setArchived(id: string, archived: boolean): Promise<Subject | null> {
    const res = await this.subjectRepo.setArchived(id, archived);
    if (res?.institutionId) {
      await this.cache.invalidateTag(`library:subjects:${res.institutionId}`);
      await this.cache.invalidateTag(`library:${res.institutionId}`);
    }
    return res;
  }

  async softDelete(id: string): Promise<boolean> {
    const item = await this.subjectRepo.findById(id);
    const ok = await this.subjectRepo.softDelete(id);
    if (ok && item?.institutionId) {
      await this.cache.invalidateTag(`library:subjects:${item.institutionId}`);
      await this.cache.invalidateTag(`library:${item.institutionId}`);
    }
    return ok;
  }

  async countByInstitution(institutionId: string): Promise<number> {
    return this.subjectRepo.countByInstitution(institutionId);
  }
}
