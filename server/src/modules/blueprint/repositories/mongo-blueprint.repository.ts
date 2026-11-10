// Database repository managing mongo-blueprint.repository persistence.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import { Blueprint, BlueprintDocument } from '../schemas/blueprint.schema';
import type { IBlueprintRepository } from './blueprint.repository.interface';
import type {
  Assignment,
  AutoFillMode,
  BlueprintGraphDto,
  NodePool,
  NodePosition,
  NodeStatus,
} from '@slotly/contracts';

/** Injectable service providing mongo blueprint repository logic. */
@Injectable()
export class MongoBlueprintRepository
  extends MongoBaseRepository<Blueprint, BlueprintDocument>
  implements IBlueprintRepository
{
  constructor(@InjectModel(Blueprint.name) model: Model<BlueprintDocument>) {
    super(model);
  }

  async findByProject(projectId: string): Promise<Blueprint | null> {
    return this.model.findOne({ projectId }).lean<Blueprint>().exec();
  }

  async saveGraph(
    projectId: string,
    graph: Partial<BlueprintGraphDto>,
    expectedRevision?: number,
  ): Promise<Blueprint | null> {
    const query: Record<string, unknown> = { projectId };
    if (typeof expectedRevision === 'number') {
      query['revision'] = expectedRevision;
    }

    const updateDoc: Record<string, unknown> = {
      $inc: { revision: 1 },
      $set: { updatedAt: new Date() },
    };

    const $set = updateDoc.$set as Record<string, unknown>;
    if (graph.nodes) $set['nodes'] = graph.nodes;
    if (graph.edges) $set['edges'] = graph.edges;

    const updated = await this.model
      .findOneAndUpdate(query, updateDoc, { new: true, upsert: false })
      .lean<Blueprint>()
      .exec();

    if (
      !updated &&
      (expectedRevision === 1 || expectedRevision === undefined)
    ) {
      const existing = await this.model.findOne({ projectId }).lean().exec();
      if (!existing) {
        return this.model
          .findOneAndUpdate(
            { projectId },
            {
              $setOnInsert: {
                projectId,
                viewport: { x: 0, y: 0, zoom: 1 },
                createdAt: new Date(),
              },
              $set: {
                nodes: graph.nodes || [],
                edges: graph.edges || [],
                revision: 2,
                updatedAt: new Date(),
              },
            },
            { new: true, upsert: true },
          )
          .lean<Blueprint>()
          .exec();
      }
    }

    return updated;
  }

  async updateNode(
    projectId: string,
    nodeId: string,
    update: {
      position?: NodePosition | undefined;
      data?: Record<string, unknown> | undefined;
      version?: number | undefined;
      pool?: NodePool | undefined;
      assignments?: Assignment[] | undefined;
      autoFill?: AutoFillMode | undefined;
      status?: NodeStatus | undefined;
      effectiveStatus?: NodeStatus | undefined;
      missing?: Array<{ field: string; message: string }> | undefined;
    },
  ): Promise<boolean> {
    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (update.position) {
      $set['nodes.$.position'] = update.position;
    }
    if (update.data) {
      $set['nodes.$.data'] = update.data;
    }
    if (typeof update.version === 'number') {
      $set['nodes.$.version'] = update.version;
    }
    if (update.pool) {
      $set['nodes.$.pool'] = update.pool;
    }
    if (update.assignments) {
      $set['nodes.$.assignments'] = update.assignments;
    }
    if (update.autoFill) {
      $set['nodes.$.autoFill'] = update.autoFill;
    }
    if (update.status) {
      $set['nodes.$.status'] = update.status;
    }
    if (update.effectiveStatus) {
      $set['nodes.$.effectiveStatus'] = update.effectiveStatus;
    }
    if (update.missing) {
      $set['nodes.$.missing'] = update.missing;
    }

    const res = await this.model
      .updateOne({ projectId, 'nodes.id': nodeId }, { $set })
      .exec();
    return res.modifiedCount > 0;
  }

  async resetGraph(projectId: string): Promise<Blueprint> {
    const doc = await this.model
      .findOneAndUpdate(
        { projectId },
        {
          $set: {
            nodes: [],
            edges: [],
            revision: 1,
            viewport: { x: 0, y: 0, zoom: 1 },
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true },
      )
      .lean<Blueprint>()
      .exec();

    return doc;
  }
}
