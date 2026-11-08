// Database repository managing persistence and queries for OAuthIdentity entities.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OAuthProviderKey } from '@slotly/contracts';
import { BaseRepository } from '../../../common/database/base.repository';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import {
  OAuthIdentity,
  OAuthIdentityDocument,
} from '../schemas/oauth-identity.schema';

/** Dependency injection token for OAuthIdentity repository. */
export const OAUTH_IDENTITY_REPOSITORY = Symbol('OAUTH_IDENTITY_REPOSITORY');

/** Interface defining repository queries for OAuth identity links. */
export interface OAuthIdentityRepository extends BaseRepository<OAuthIdentity> {
  findByProviderAndId(
    provider: OAuthProviderKey,
    providerUserId: string,
  ): Promise<OAuthIdentity | null>;
  findByUserId(userId: string): Promise<OAuthIdentity[]>;
  findByUserAndProvider(
    userId: string,
    provider: OAuthProviderKey,
  ): Promise<OAuthIdentity | null>;
  deleteByUserAndProvider(
    userId: string,
    provider: OAuthProviderKey,
  ): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
}

/** Mongoose implementation of OAuthIdentityRepository. */
@Injectable()
export class MongoOAuthIdentityRepository
  extends MongoBaseRepository<OAuthIdentity, OAuthIdentityDocument>
  implements OAuthIdentityRepository
{
  constructor(
    @InjectModel(OAuthIdentity.name) model: Model<OAuthIdentityDocument>,
  ) {
    super(model);
  }

  /** Finds an OAuth identity record matching provider and providerUserId. */
  async findByProviderAndId(
    provider: OAuthProviderKey,
    providerUserId: string,
  ): Promise<OAuthIdentity | null> {
    const doc = await this.model
      .findOne({ provider, providerUserId })
      .lean<OAuthIdentity>()
      .exec();
    return doc ?? null;
  }

  /** Retrieves all OAuth identity links associated with a user ID. */
  async findByUserId(userId: string): Promise<OAuthIdentity[]> {
    const docs = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .lean<OAuthIdentity[]>()
      .exec();
    return docs || [];
  }

  /** Retrieves a specific OAuth identity link for a user and provider. */
  async findByUserAndProvider(
    userId: string,
    provider: OAuthProviderKey,
  ): Promise<OAuthIdentity | null> {
    const doc = await this.model
      .findOne({ userId: new Types.ObjectId(userId), provider })
      .lean<OAuthIdentity>()
      .exec();
    return doc ?? null;
  }

  /** Deletes an identity link between a user and provider. */
  async deleteByUserAndProvider(
    userId: string,
    provider: OAuthProviderKey,
  ): Promise<boolean> {
    const result = await this.model
      .deleteOne({ userId: new Types.ObjectId(userId), provider })
      .exec();
    return (result.deletedCount ?? 0) > 0;
  }

  /** Counts total connected OAuth identities for a user ID. */
  async countByUserId(userId: string): Promise<number> {
    return this.model
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec();
  }
}
