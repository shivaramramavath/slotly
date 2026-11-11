// Core implementation for blueprint-auxiliary.repositories in server/src/modules/blueprint/repositories.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import {
  BlueprintTemplate,
  BlueprintTemplateDocument,
} from '../schemas/blueprint-template.schema';
import {
  BlueprintHistory,
  BlueprintHistoryDocument,
} from '../schemas/blueprint-history.schema';
import {
  BlueprintSnapshot,
  BlueprintSnapshotDocument,
} from '../schemas/blueprint-snapshot.schema';
import {
  BlueprintComment,
  BlueprintCommentDocument,
} from '../schemas/blueprint-comment.schema';

/** Injectable service providing blueprint template repository logic. */
@Injectable()
export class BlueprintTemplateRepository extends MongoBaseRepository<
  BlueprintTemplate,
  BlueprintTemplateDocument
> {
  constructor(
    @InjectModel(BlueprintTemplate.name)
    model: Model<BlueprintTemplateDocument>,
  ) {
    super(model);
  }

  async count(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async findAvailableTemplates(
    institutionId?: string,
  ): Promise<BlueprintTemplate[]> {
    const query: Record<string, unknown> = {
      $or: [{ visibility: 'public' }],
    };
    if (institutionId) {
      (query.$or as Array<Record<string, unknown>>).push({
        visibility: 'institution',
        institutionId,
      });
    }
    return this.model
      .find(query)
      .sort({ category: 1, name: 1 })
      .lean<BlueprintTemplate[]>()
      .exec();
  }
}

/** Injectable service providing blueprint history repository logic. */
@Injectable()
export class BlueprintHistoryRepository extends MongoBaseRepository<
  BlueprintHistory,
  BlueprintHistoryDocument
> {
  constructor(
    @InjectModel(BlueprintHistory.name) model: Model<BlueprintHistoryDocument>,
  ) {
    super(model);
  }

  async findByProject(
    projectId: string,
    limit = 50,
    nodeId?: string,
  ): Promise<BlueprintHistory[]> {
    const filter: Record<string, unknown> = { projectId };
    if (nodeId) {
      filter.nodeId = nodeId;
    }
    return this.model
      .find(filter)
      .sort({ revision: -1 })
      .limit(limit)
      .lean<BlueprintHistory[]>()
      .exec();
  }
}

/** Injectable service providing blueprint snapshot repository logic. */
@Injectable()
export class BlueprintSnapshotRepository extends MongoBaseRepository<
  BlueprintSnapshot,
  BlueprintSnapshotDocument
> {
  constructor(
    @InjectModel(BlueprintSnapshot.name)
    model: Model<BlueprintSnapshotDocument>,
  ) {
    super(model);
  }

  async findByProject(projectId: string): Promise<BlueprintSnapshot[]> {
    return this.model
      .find({ projectId })
      .sort({ createdAt: -1 })
      .lean<BlueprintSnapshot[]>()
      .exec();
  }
}

/** Injectable service providing blueprint comment repository logic. */
@Injectable()
export class BlueprintCommentRepository extends MongoBaseRepository<
  BlueprintComment,
  BlueprintCommentDocument
> {
  constructor(
    @InjectModel(BlueprintComment.name) model: Model<BlueprintCommentDocument>,
  ) {
    super(model);
  }

  async findByNode(
    projectId: string,
    nodeId: string,
  ): Promise<BlueprintComment[]> {
    return this.model
      .find({ projectId, nodeId })
      .sort({ createdAt: 1 })
      .lean<BlueprintComment[]>()
      .exec();
  }
}
