import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Department, DepartmentDocument } from '../schemas/department.schema';

export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');

export interface DepartmentRepository extends BaseRepository<Department> {
  findByInstitution(institutionId: string): Promise<Department[]>;
  findByCode(institutionId: string, code: string): Promise<Department | null>;
  softDelete(id: string): Promise<boolean>;
  countActiveByInstitution(institutionId: string): Promise<number>;
}

@Injectable()
export class MongoDepartmentRepository
  extends MongoBaseRepository<Department, DepartmentDocument>
  implements DepartmentRepository
{
  constructor(@InjectModel(Department.name) model: Model<DepartmentDocument>) {
    super(model);
  }

  async findByInstitution(institutionId: string): Promise<Department[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ name: 1 })
      .lean<Department[]>()
      .exec();
  }

  async findByCode(
    institutionId: string,
    code: string,
  ): Promise<Department | null> {
    const doc = await this.model
      .findOne({
        institutionId,
        code: code.toUpperCase().trim(),
        isDeleted: false,
      })
      .lean<Department>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.model
      .countDocuments({ institutionId, isDeleted: false })
      .exec();
  }
}

@Injectable()
export class CachedDepartmentRepository
  extends CachedRepository<Department>
  implements DepartmentRepository
{
  constructor(
    private readonly departmentRepo: DepartmentRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(departmentRepo, cache, 'department', 86400);
  }

  async findByInstitution(institutionId: string): Promise<Department[]> {
    const key = `slotly:institution:${institutionId}:departments`;
    return this.cache.remember<Department[]>(
      key,
      86400,
      () => this.departmentRepo.findByInstitution(institutionId),
      [`institution:${institutionId}`],
    );
  }

  async findByCode(
    institutionId: string,
    code: string,
  ): Promise<Department | null> {
    return this.departmentRepo.findByCode(institutionId, code);
  }

  async softDelete(id: string): Promise<boolean> {
    const entity = await this.departmentRepo.findById(id);
    const success = await this.departmentRepo.softDelete(id);
    if (success && entity?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${entity.institutionId.toString()}`,
      );
    }
    return success;
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.departmentRepo.countActiveByInstitution(institutionId);
  }

  override async create(doc: Partial<Department>): Promise<Department> {
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
    update: Partial<Department>,
  ): Promise<Department | null> {
    const updated = await super.update(id, update);
    if (updated?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${updated.institutionId.toString()}`,
      );
    }
    return updated;
  }
}
