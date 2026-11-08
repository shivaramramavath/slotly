// Database repository managing publish-request persistence in MongoDB.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import {
  PublishRequest,
  PublishRequestDocument,
} from '../schemas/publish-request.schema';

/** Interface defining structure for publish request repository operations. */
export interface IPublishRequestRepository {
  findById(id: string): Promise<PublishRequest | null>;
  findByProjectId(projectId: string): Promise<PublishRequest[]>;
  findByVersionId(versionId: string): Promise<PublishRequest | null>;
  findPending(): Promise<PublishRequest[]>;
  create(
    data: Partial<PublishRequest>,
    session?: ClientSession,
  ): Promise<PublishRequest>;
  update(
    id: string,
    data: Partial<PublishRequest>,
    session?: ClientSession,
  ): Promise<PublishRequest | null>;
}

/** Injectable repository providing persistence for publish requests. */
@Injectable()
export class PublishRequestRepository
  extends MongoBaseRepository<PublishRequest, PublishRequestDocument>
  implements IPublishRequestRepository
{
  constructor(
    @InjectModel(PublishRequest.name)
    model: Model<PublishRequestDocument>,
  ) {
    super(model);
  }

  /** Finds all publish requests for a specific project sorted latest first. */
  async findByProjectId(projectId: string): Promise<PublishRequest[]> {
    const docs = await this.model
      .find({ projectId })
      .sort({ createdAt: -1 })
      .lean<PublishRequest[]>()
      .exec();
    return docs;
  }

  /** Finds the most recent publish request for a specific timetable version. */
  async findByVersionId(versionId: string): Promise<PublishRequest | null> {
    const doc = await this.model
      .findOne({ versionId })
      .sort({ createdAt: -1 })
      .lean<PublishRequest>()
      .exec();
    return doc ?? null;
  }

  /** Finds all pending publish requests across all projects. */
  async findPending(): Promise<PublishRequest[]> {
    const docs = await this.model
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean<PublishRequest[]>()
      .exec();
    return docs;
  }

  /** Updates publish request by ID with optional session. */
  override async update(
    id: string,
    data: Partial<PublishRequest>,
    session?: ClientSession,
  ): Promise<PublishRequest | null> {
    const options = session
      ? { new: true as const, session }
      : { new: true as const };
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, options)
      .lean<PublishRequest>()
      .exec();
    return doc ?? null;
  }
}
