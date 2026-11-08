// Database repository managing user.repository persistence.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { User, UserDocument } from '../schemas/user.schema';
import type { UserRole } from '@slotly/contracts';

/** Query filter options for administrative user searches. */
export interface UserQueryOptions {
  institutionId?: string | undefined;
  role?: UserRole | undefined;
  status?: string | undefined;
  search?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

/** Constant representing user repository. */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/** Interface defining structure for user repository. */
export interface UserRepository extends BaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  countByInstitution(institutionId?: string): Promise<number>;
  findWithFilter(options: UserQueryOptions): Promise<User[]>;
  countWithFilter(options: UserQueryOptions): Promise<number>;
}

/** Injectable service providing mongo user repository logic. */
@Injectable()
export class MongoUserRepository
  extends MongoBaseRepository<User, UserDocument>
  implements UserRepository
{
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ email: email.toLowerCase().trim() })
      .lean<User>()
      .exec();
    return doc ?? null;
  }

  async countByInstitution(institutionId?: string): Promise<number> {
    const filter = institutionId ? { institutionId } : {};
    return this.model.countDocuments(filter).exec();
  }

  async findWithFilter(options: UserQueryOptions): Promise<User[]> {
    const query: Record<string, unknown> = {};
    if (options.institutionId) query.institutionId = options.institutionId;
    if (options.role) query.role = options.role;
    if (options.status) query.status = options.status;
    if (options.search) {
      const regex = new RegExp(options.search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const q = this.model.find(query).sort({ createdAt: -1 });
    if (options.offset) q.skip(options.offset);
    if (options.limit) q.limit(options.limit);

    return q.lean<User[]>().exec();
  }

  async countWithFilter(options: UserQueryOptions): Promise<number> {
    const query: Record<string, unknown> = {};
    if (options.institutionId) query.institutionId = options.institutionId;
    if (options.role) query.role = options.role;
    if (options.status) query.status = options.status;
    if (options.search) {
      const regex = new RegExp(options.search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    return this.model.countDocuments(query).exec();
  }
}
