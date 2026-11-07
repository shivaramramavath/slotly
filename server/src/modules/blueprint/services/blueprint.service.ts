import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ApplyOperationsDto,
  BatchOperationResult,
  BlueprintCommentDto,
  BlueprintGraphDto,
  BlueprintHistoryEntryDto,
  BlueprintImpactDto,
  BlueprintReadinessDto,
  BlueprintRecommendationDto,
  BlueprintSnapshotDto,
} from '@slotly/contracts';
import { CachedBlueprintRepository } from '../repositories/cached-blueprint.repository';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import { OperationService } from './operation.service';
import { CompletionService } from './completion.service';
import { ReadinessService } from './readiness.service';
import { ImpactAnalyzerService } from './impact-analyzer.service';
import { RecommendationsService } from './recommendations.service';
import {
  BlueprintCommentRepository,
  BlueprintHistoryRepository,
  BlueprintSnapshotRepository,
} from '../repositories/blueprint-auxiliary.repositories';
import { EventBus } from '../../../common/events/event-bus.service';

@Injectable()
export class BlueprintService {
  constructor(
    private readonly blueprintRepo: CachedBlueprintRepository,
    private readonly projectRepo: CachedProjectRepository,
    private readonly operationService: OperationService,
    private readonly completionService: CompletionService,
    private readonly readinessService: ReadinessService,
    private readonly impactAnalyzer: ImpactAnalyzerService,
    private readonly recommendationsService: RecommendationsService,
    private readonly historyRepo: BlueprintHistoryRepository,
    private readonly snapshotRepo: BlueprintSnapshotRepository,
    private readonly commentRepo: BlueprintCommentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async getGraph(projectId: string): Promise<BlueprintGraphDto> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    let blueprint = await this.blueprintRepo.findByProject(projectId);
    if (!blueprint) {
      blueprint = await this.blueprintRepo.resetGraph(projectId);
    }

    // Ensure status is up to date
    const { updatedNodes } = this.completionService.recomputeGraph(blueprint.nodes);

    return {
      projectId,
      revision: blueprint.revision,
      nodes: updatedNodes,
      edges: blueprint.edges,
      updatedAt: (blueprint as any).updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  async applyOperations(
    projectId: string,
    dto: ApplyOperationsDto,
    userId: string,
  ): Promise<BatchOperationResult> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    let blueprint = await this.blueprintRepo.findByProject(projectId);
    if (!blueprint) {
      blueprint = await this.blueprintRepo.resetGraph(projectId);
    }

    // Optimistic concurrency check
    if (typeof dto.clientRevision === 'number' && dto.clientRevision !== blueprint.revision) {
      throw new ConflictException({
        code: 'REVISION_CONFLICT',
        message: `Blueprint revision mismatch: server is at ${blueprint.revision}, client submitted ${dto.clientRevision}`,
        currentRevision: blueprint.revision,
        rejectedRevision: dto.clientRevision,
        currentState: {
          projectId,
          revision: blueprint.revision,
          nodes: blueprint.nodes,
          edges: blueprint.edges,
        },
      });
    }

    const projId = project.id || (project as any)._id?.toString() || projectId;
    const result = await this.operationService.applyBatch(
      dto.operations,
      blueprint.nodes,
      blueprint.edges,
      { id: projId, status: project.status, isLocked: false, isDeleted: project.isDeleted },
      { id: userId, role: 'ADMIN' },
    );

    // Save graph and increment revision
    const saved = await this.blueprintRepo.saveGraph(
      projectId,
      { nodes: result.nodes, edges: result.edges },
      blueprint.revision,
    );

    const newRevision = saved?.revision || blueprint.revision + 1;

    // Record history entry
    if (result.applied.length > 0) {
      await this.historyRepo.create({
        projectId,
        revision: newRevision,
        operationType: result.applied[0]?.type || 'batch',
        description: `Applied ${result.applied.length} operation(s); ${result.skipped.length} skipped`,
        userId,
      });

      // Emit domain event
      void this.eventBus.publish('blueprint.ops-applied', {
        projectId,
        revision: newRevision,
        applied: result.applied,
      });
    }

    return {
      revision: newRevision,
      applied: result.applied,
      skipped: result.skipped,
      graph: {
        projectId,
        revision: newRevision,
        nodes: result.nodes,
        edges: result.edges,
      },
    };
  }

  async getReadiness(projectId: string): Promise<BlueprintReadinessDto> {
    const graph = await this.getGraph(projectId);
    return this.readinessService.computeReadiness(graph.nodes);
  }

  async getImpact(projectId: string, nodeId: string): Promise<BlueprintImpactDto> {
    const graph = await this.getGraph(projectId);
    return this.impactAnalyzer.analyze(nodeId, graph.nodes);
  }

  async getRecommendations(
    projectId: string,
    targetNodeId?: string,
  ): Promise<BlueprintRecommendationDto[]> {
    const graph = await this.getGraph(projectId);
    return this.recommendationsService.getRecommendations(graph.nodes, graph.edges, targetNodeId);
  }

  async exportGraph(
    projectId: string,
    format: 'json' | 'svg' | 'png' = 'json',
  ): Promise<{ format: string; data: string | object }> {
    const graph = await this.getGraph(projectId);
    if (format === 'json') {
      return {
        format: 'json',
        data: {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          blueprint: graph,
        },
      };
    }

    // SVG representation
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="100%" height="100%" fill="#0A0A0A"/>
      <text x="50" y="50" fill="#FAFAFA" font-family="monospace" font-size="18">Slotly Blueprint - ${projectId}</text>
      <text x="50" y="80" fill="#8A8A8A" font-family="monospace" font-size="12">Nodes: ${graph.nodes.length} | Edges: ${graph.edges.length}</text>
    </svg>`;

    return {
      format,
      data: svg,
    };
  }

  async importGraph(projectId: string, importedData: any, userId: string): Promise<BatchOperationResult> {
    const nodes = importedData?.blueprint?.nodes || importedData?.nodes || [];
    const edges = importedData?.blueprint?.edges || importedData?.edges || [];

    const ops: ApplyOperationsDto['operations'] = [];

    for (const n of nodes) {
      ops.push({
        opId: `import_${n.id}`,
        type: 'add_node',
        targetId: n.id,
        node: n,
        parentId: n.parentId,
      });
    }

    for (const e of edges) {
      ops.push({
        opId: `import_${e.id}`,
        type: 'add_edge',
        targetId: e.id,
        edge: e,
      });
    }

    return this.applyOperations(projectId, { operations: ops }, userId);
  }

  async getHistory(projectId: string): Promise<BlueprintHistoryEntryDto[]> {
    const list = await this.historyRepo.findByProject(projectId);
    return list.map((h) => ({
      id: h.id || (h as any)._id?.toString() || '',
      projectId: h.projectId,
      revision: h.revision,
      operationType: h.operationType,
      description: h.description,
      userId: h.userId,
      timestamp: (h as any).createdAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async createSnapshot(projectId: string, label: string): Promise<BlueprintSnapshotDto> {
    const graph = await this.getGraph(projectId);
    const snap = await this.snapshotRepo.create({
      projectId,
      revision: graph.revision,
      label,
      graph,
    });
    const snapId = snap.id || (snap as any)._id?.toString() || '';
    return {
      id: snapId,
      projectId: snap.projectId,
      revision: snap.revision,
      label: snap.label,
      graph: snap.graph,
      createdAt: (snap as any).createdAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  async listSnapshots(projectId: string): Promise<BlueprintSnapshotDto[]> {
    const list = await this.snapshotRepo.findByProject(projectId);
    return list.map((s) => ({
      id: s.id || (s as any)._id?.toString() || '',
      projectId: s.projectId,
      revision: s.revision,
      label: s.label,
      graph: s.graph,
      createdAt: (s as any).createdAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async restoreSnapshot(projectId: string, snapshotId: string): Promise<BlueprintGraphDto> {
    const snap = await this.snapshotRepo.findById(snapshotId);
    if (!snap) {
      throw new NotFoundException(`Snapshot ${snapshotId} not found`);
    }

    const currentGraph = await this.getGraph(projectId);
    const saved = await this.blueprintRepo.saveGraph(
      projectId,
      { nodes: snap.graph.nodes, edges: snap.graph.edges },
      currentGraph.revision,
    );

    return {
      projectId,
      revision: saved?.revision || currentGraph.revision + 1,
      nodes: snap.graph.nodes,
      edges: snap.graph.edges,
      updatedAt: new Date().toISOString(),
    };
  }

  async compareSnapshot(
    projectId: string,
    snapshotId: string,
  ): Promise<{ addedNodes: string[]; removedNodes: string[]; modifiedNodes: string[] }> {
    const snap = await this.snapshotRepo.findById(snapshotId);
    if (!snap) {
      throw new NotFoundException(`Snapshot ${snapshotId} not found`);
    }

    const currentGraph = await this.getGraph(projectId);
    const snapNodeIds = new Set(snap.graph.nodes.map((n) => n.id));
    const currNodeIds = new Set(currentGraph.nodes.map((n) => n.id));

    const addedNodes = currentGraph.nodes.filter((n) => !snapNodeIds.has(n.id)).map((n) => n.id);
    const removedNodes = snap.graph.nodes.filter((n) => !currNodeIds.has(n.id)).map((n) => n.id);
    const modifiedNodes = currentGraph.nodes
      .filter((n) => snapNodeIds.has(n.id))
      .filter((n) => {
        const snapNode = snap.graph.nodes.find((sn) => sn.id === n.id);
        return JSON.stringify(snapNode?.data) !== JSON.stringify(n.data);
      })
      .map((n) => n.id);

    return { addedNodes, removedNodes, modifiedNodes };
  }

  async getComments(projectId: string, nodeId: string): Promise<BlueprintCommentDto[]> {
    const comments = await this.commentRepo.findByNode(projectId, nodeId);
    return comments.map((c) => ({
      id: c.id || (c as any)._id?.toString() || '',
      projectId: c.projectId,
      nodeId: c.nodeId,
      userId: c.userId,
      userName: c.userName,
      text: c.text,
      createdAt: (c as any).createdAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async addComment(
    projectId: string,
    nodeId: string,
    userId: string,
    userName: string,
    text: string,
  ): Promise<BlueprintCommentDto> {
    const comment = await this.commentRepo.create({
      projectId,
      nodeId,
      userId,
      userName,
      text,
    });
    return {
      id: comment.id || (comment as any)._id?.toString() || '',
      projectId: comment.projectId,
      nodeId: comment.nodeId,
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: (comment as any).createdAt?.toISOString?.() || new Date().toISOString(),
    };
  }
}
