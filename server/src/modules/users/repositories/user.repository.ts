// Database repository managing user.repository persistence.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { User, UserDocument } from '../schemas/user.schema';

/** Constant representing user repository. */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/** Interface defining structure for user repository. */
export interface UserRepository extends BaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  countByInstitution(institutionId?: string): Promise<number>;
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
}
