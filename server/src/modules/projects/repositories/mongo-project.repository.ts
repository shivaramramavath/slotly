// Database repository managing mongo-project.repository persistence.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import { Project, ProjectDocument } from '../schemas/project.schema';
import type {
  FindProjectsFilter,
  IProjectRepository,
} from './project.repository.interface';

/** Injectable service providing mongo project repository logic. */
@Injectable()
export class MongoProjectRepository
  extends MongoBaseRepository<Project, ProjectDocument>
  implements IProjectRepository
{
  constructor(@InjectModel(Project.name) model: Model<ProjectDocument>) {
    super(model);
  }

  async findProjects(
    filter: FindProjectsFilter,
    skip = 0,
    limit = 20,
  ): Promise<{ items: Project[]; total: number }> {
    const query: Record<string, unknown> = { isDeleted: false };

    if (filter.institutionId) {
      query['institutionId'] = filter.institutionId;
    }
    if (filter.ownerId) {
      query['ownerId'] = filter.ownerId;
    }
    if (filter.status) {
      query['status'] = filter.status;
    }
    if (filter.search) {
      query['name'] = { $regex: filter.search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Project[]>()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findByInstitution(institutionId: string): Promise<Project[]> {
    return this.model
      .find({ institutionId, isDeleted: false })
      .sort({ updatedAt: -1 })
      .lean<Project[]>()
      .exec();
  }

  async updateLastOpened(id: string): Promise<void> {
    const filter: Record<string, unknown> = { _id: id };
    await this.model
      .updateOne(filter, { $set: { lastOpenedAt: new Date() } })
      .exec();
  }

  async incrementRevision(
    id: string,
    expectedRevision?: number,
  ): Promise<Project | null> {
    const query: Record<string, unknown> = { _id: id, isDeleted: false };
    if (typeof expectedRevision === 'number') {
      query['revision'] = expectedRevision;
    }

    return this.model
      .findOneAndUpdate(
        query,
        { $inc: { revision: 1 }, $set: { updatedAt: new Date() } },
        { new: true },
      )
      .lean<Project>()
      .exec();
  }
}
