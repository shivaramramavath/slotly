// Database repository managing program.repository persistence.
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Program, ProgramDocument } from '../schemas/program.schema';

/** Constant representing program repository. */
export const PROGRAM_REPOSITORY = Symbol('PROGRAM_REPOSITORY');

/** Interface defining structure for program repository. */
export interface ProgramRepository extends BaseRepository<Program> {
  findByInstitution(institutionId: string): Promise<Program[]>;
  findByDepartment(departmentId: string): Promise<Program[]>;
  findByCode(departmentId: string, code: string): Promise<Program | null>;
  softDelete(id: string): Promise<boolean>;
  countActiveByDepartment(departmentId: string): Promise<number>;
  countActiveByInstitution(institutionId: string): Promise<number>;
}

/** Injectable service providing mongo program repository logic. */
@Injectable()
export class MongoProgramRepository
  extends MongoBaseRepository<Program, ProgramDocument>
  implements ProgramRepository
{
  constructor(@InjectModel(Program.name) model: Model<ProgramDocument>) {
    super(model);
  }

  async findByInstitution(institutionId: string): Promise<Program[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ name: 1 })
      .lean<Program[]>()
      .exec();
  }

  async findByDepartment(departmentId: string): Promise<Program[]> {
    return this.model
      .find({ departmentId, isDeleted: false })
      .sort({ name: 1 })
      .lean<Program[]>()
      .exec();
  }

  async findByCode(
    departmentId: string,
    code: string,
  ): Promise<Program | null> {
    const doc = await this.model
      .findOne({
        departmentId,
        code: code.toUpperCase().trim(),
        isDeleted: false,
      })
      .lean<Program>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }

  async countActiveByDepartment(departmentId: string): Promise<number> {
    return this.model.countDocuments({ departmentId, isDeleted: false }).exec();
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.model
      .countDocuments({ institutionId, isDeleted: false })
      .exec();
  }
}

/** Injectable service providing cached program repository logic. */
@Injectable()
export class CachedProgramRepository
  extends CachedRepository<Program>
  implements ProgramRepository
{
  constructor(
    private readonly programRepo: ProgramRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(programRepo, cache, 'program', 86400);
  }

  async findByInstitution(institutionId: string): Promise<Program[]> {
    const key = `slotly:institution:${institutionId}:programs`;
    return this.cache.remember<Program[]>(
      key,
      86400,
      () => this.programRepo.findByInstitution(institutionId),
      [`institution:${institutionId}`],
    );
  }

  async findByDepartment(departmentId: string): Promise<Program[]> {
    return this.programRepo.findByDepartment(departmentId);
  }

  async findByCode(
    departmentId: string,
    code: string,
  ): Promise<Program | null> {
    return this.programRepo.findByCode(departmentId, code);
  }

  async softDelete(id: string): Promise<boolean> {
    const entity = await this.programRepo.findById(id);
    const success = await this.programRepo.softDelete(id);
    if (success && entity?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${entity.institutionId.toString()}`,
      );
    }
    return success;
  }

  async countActiveByDepartment(departmentId: string): Promise<number> {
    return this.programRepo.countActiveByDepartment(departmentId);
  }

  async countActiveByInstitution(institutionId: string): Promise<number> {
    return this.programRepo.countActiveByInstitution(institutionId);
  }

  override async create(doc: Partial<Program>): Promise<Program> {
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
    update: Partial<Program>,
  ): Promise<Program | null> {
    const updated = await super.update(id, update);
    if (updated?.institutionId) {
      await this.cache.invalidateTag(
        `institution:${updated.institutionId.toString()}`,
      );
    }
    return updated;
  }
}
