// Domain service orchestrating blueprint.service business logic.
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  ApplyOperationsDto,
  AssignmentOpPayload,
  AutoFillMode,
  BatchOperationResult,
  BlueprintCommentDto,
  BlueprintEdgeDto,
  BlueprintGraphDto,
  BlueprintHistoryEntryDto,
  BlueprintImpactDto,
  BlueprintNodeDto,
  BlueprintReadinessDto,
  BlueprintRecommendationDto,
  BlueprintSnapshotDto,
  NodePatchPayload,
  PoolItemType,
  PoolOpPayload,
  ResolvedPool,
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
import {
  PoolResolverService,
  type WhereUsedResult,
} from './pool-resolver.service';
import { GateChain } from '../gates/gate-chain';

function getId(
  doc:
    { id?: string; _id?: { toString(): string } | string } | null | undefined,
): string {
  if (!doc) return '';
  if (doc.id) return doc.id;
  if (!doc._id) return '';
  return typeof doc._id === 'string' ? doc._id : doc._id.toString();
}

/** Injectable service providing blueprint service logic. */
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
    private readonly poolResolver: PoolResolverService,
    private readonly gateChain: GateChain,
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
    const { updatedNodes } = this.completionService.recomputeGraph(
      blueprint.nodes,
    );

    return {
      projectId,
      revision: blueprint.revision,
      nodes: updatedNodes,
      edges: blueprint.edges,
      updatedAt: new Date(blueprint.updatedAt || Date.now()).toISOString(),
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
    if (
      typeof dto.clientRevision === 'number' &&
      dto.clientRevision !== blueprint.revision
    ) {
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

    const projId = getId(project) || projectId;
    const result = await this.operationService.applyBatch(
      dto.operations,
      blueprint.nodes,
      blueprint.edges,
      {
        id: projId,
        status: project.status,
        isLocked: false,
        isDeleted: project.isDeleted,
      },
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

  async getImpact(
    projectId: string,
    nodeId: string,
  ): Promise<BlueprintImpactDto> {
    const graph = await this.getGraph(projectId);
    return this.impactAnalyzer.analyze(nodeId, graph.nodes);
  }

  async getRecommendations(
    projectId: string,
    targetNodeId?: string,
  ): Promise<BlueprintRecommendationDto[]> {
    const graph = await this.getGraph(projectId);
    return this.recommendationsService.getRecommendations(
      graph.nodes,
      graph.edges,
      targetNodeId,
    );
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

  async importGraph(
    projectId: string,
    importedData: Record<string, unknown>,
    userId: string,
  ): Promise<BatchOperationResult> {
    const payload = importedData as {
      blueprint?: { nodes?: BlueprintNodeDto[]; edges?: BlueprintEdgeDto[] };
      nodes?: BlueprintNodeDto[];
      edges?: BlueprintEdgeDto[];
    };
    const rawNodes: BlueprintNodeDto[] =
      payload.blueprint?.nodes ?? payload.nodes ?? [];
    const rawEdges: BlueprintEdgeDto[] =
      payload.blueprint?.edges ?? payload.edges ?? [];

    const ops: ApplyOperationsDto['operations'] = [];

    for (const n of rawNodes) {
      if (!n.id) continue;
      ops.push({
        opId: `import_${n.id}`,
        type: 'add_node',
        targetId: n.id,
        node: n,
        parentId: n.parentId,
      });
    }

    for (const e of rawEdges) {
      if (!e.id) continue;
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
      id: getId(h),
      projectId: h.projectId,
      revision: h.revision,
      operationType: h.operationType,
      description: h.description,
      userId: h.userId,
      timestamp: h.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  async createSnapshot(
    projectId: string,
    label: string,
  ): Promise<BlueprintSnapshotDto> {
    const graph = await this.getGraph(projectId);
    const snap = await this.snapshotRepo.create({
      projectId,
      revision: graph.revision,
      label,
      graph,
    });
    return {
      id: getId(snap),
      projectId: snap.projectId,
      revision: snap.revision,
      label: snap.label,
      graph: snap.graph,
      createdAt: snap.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async listSnapshots(projectId: string): Promise<BlueprintSnapshotDto[]> {
    const list = await this.snapshotRepo.findByProject(projectId);
    return list.map((s) => ({
      id: getId(s),
      projectId: s.projectId,
      revision: s.revision,
      label: s.label,
      graph: s.graph,
      createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  async restoreSnapshot(
    projectId: string,
    snapshotId: string,
  ): Promise<BlueprintGraphDto> {
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
  ): Promise<{
    addedNodes: string[];
    removedNodes: string[];
    modifiedNodes: string[];
  }> {
    const snap = await this.snapshotRepo.findById(snapshotId);
    if (!snap) {
      throw new NotFoundException(`Snapshot ${snapshotId} not found`);
    }

    const currentGraph = await this.getGraph(projectId);
    const snapNodeIds = new Set(snap.graph.nodes.map((n) => n.id));
    const currNodeIds = new Set(currentGraph.nodes.map((n) => n.id));

    const addedNodes = currentGraph.nodes
      .filter((n) => !snapNodeIds.has(n.id))
      .map((n) => n.id);
    const removedNodes = snap.graph.nodes
      .filter((n) => !currNodeIds.has(n.id))
      .map((n) => n.id);
    const modifiedNodes = currentGraph.nodes
      .filter((n) => snapNodeIds.has(n.id))
      .filter((n) => {
        const snapNode = snap.graph.nodes.find((sn) => sn.id === n.id);
        return JSON.stringify(snapNode?.data) !== JSON.stringify(n.data);
      })
      .map((n) => n.id);

    return { addedNodes, removedNodes, modifiedNodes };
  }

  async getComments(
    projectId: string,
    nodeId: string,
  ): Promise<BlueprintCommentDto[]> {
    const comments = await this.commentRepo.findByNode(projectId, nodeId);
    return comments.map((c) => ({
      id: getId(c),
      projectId: c.projectId,
      nodeId: c.nodeId,
      userId: c.userId,
      userName: c.userName,
      text: c.text,
      createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
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
      id: getId(comment),
      projectId: comment.projectId,
      nodeId: comment.nodeId,
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: comment.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async getNodePool(projectId: string, nodeId: string): Promise<ResolvedPool> {
    const graph = await this.getGraph(projectId);
    return this.poolResolver.resolveEffectivePool(nodeId, graph.nodes);
  }

  async getWhereUsed(
    projectId: string,
    refType: PoolItemType,
    refId: string,
  ): Promise<WhereUsedResult[]> {
    const graph = await this.getGraph(projectId);
    return this.poolResolver.getWhereUsed(projectId, refType, refId, graph);
  }

  async mutatePool(projectId: string, payload: PoolOpPayload, userId: string) {
    const graph = await this.getGraph(projectId);
    const node = graph.nodes.find((n) => n.id === payload.nodeId);
    if (!node) {
      throw new NotFoundException(`Node ${payload.nodeId} not found`);
    }

    const gateResult = await this.gateChain.evaluate({
      operation: {
        opId: randomUUID(),
        type: 'update_node',
        targetId: payload.nodeId,
      },
      poolOperation: payload,
      project: { id: projectId, status: 'draft' },
      graph,
    });

    if (!gateResult.allowed) {
      throw new BadRequestException({
        code: gateResult.reasonCode || 'INVALID_OPERATION',
        message: gateResult.message || 'Pool mutation rejected by gate check',
        fixHint: gateResult.fixHint,
      });
    }

    node.pool = node.pool || { additions: [], exclusions: [] };
    node.pool.additions = node.pool.additions || [];
    node.pool.exclusions = node.pool.exclusions || [];

    switch (payload.op) {
      case 'pool:add': {
        const itemKind = payload.kind || 'faculty';
        node.pool.additions.push({
          id: randomUUID(),
          kind: itemKind,
          itemId: payload.itemId,
          required: Boolean(payload.required),
          pinned: Boolean(payload.pinned),
          addedAt: new Date().toISOString(),
        });
        node.pool.exclusions = node.pool.exclusions.filter(
          (id) => id !== payload.itemId,
        );
        break;
      }
      case 'pool:exclude': {
        if (!node.pool.exclusions.includes(payload.itemId)) {
          node.pool.exclusions.push(payload.itemId);
        }
        break;
      }
      case 'pool:restore': {
        node.pool.exclusions = node.pool.exclusions.filter(
          (id) => id !== payload.itemId,
        );
        break;
      }
      case 'pool:remove': {
        node.pool.additions = node.pool.additions.filter(
          (a) => a.itemId !== payload.itemId,
        );
        break;
      }
      case 'pool:require': {
        const target = node.pool.additions.find(
          (a) => a.itemId === payload.itemId,
        );
        if (target) target.required = true;
        break;
      }
      case 'pool:pin': {
        const target = node.pool.additions.find(
          (a) => a.itemId === payload.itemId,
        );
        if (target) target.pinned = true;
        break;
      }
    }

    const newVersion = (node.version || 1) + 1;
    node.version = newVersion;

    const { updatedNodes, changes } = this.completionService.recomputeGraph(
      graph.nodes,
    );

    await this.blueprintRepo.saveGraph(projectId, {
      nodes: updatedNodes,
      edges: graph.edges,
    });

    await this.historyRepo.create({
      projectId,
      revision: newVersion,
      operationType: payload.op,
      description: `Pool operation ${payload.op} on node ${payload.nodeId}`,
      userId,
    });

    return {
      success: true,
      pool: node.pool,
      version: newVersion,
      changes,
    };
  }

  async mutateAssignment(
    projectId: string,
    payload: AssignmentOpPayload,
    userId: string,
  ) {
    const graph = await this.getGraph(projectId);
    const node = graph.nodes.find((n) => n.id === payload.nodeId);
    if (!node) {
      throw new NotFoundException(`Node ${payload.nodeId} not found`);
    }

    const gateResult = await this.gateChain.evaluate({
      operation: {
        opId: randomUUID(),
        type: 'update_node',
        targetId: payload.nodeId,
      },
      assignmentOperation: payload,
      project: { id: projectId, status: 'draft' },
      graph,
    });

    if (!gateResult.allowed) {
      throw new BadRequestException({
        code: gateResult.reasonCode || 'INVALID_OPERATION',
        message: gateResult.message || 'Assignment rejected by gate check',
        fixHint: gateResult.fixHint,
      });
    }

    node.assignments = node.assignments || [];

    if (payload.op === 'assignment:upsert' && payload.assignment) {
      const idx = node.assignments.findIndex(
        (a) => a.id === payload.assignment!.id,
      );
      if (idx >= 0) {
        node.assignments[idx] = payload.assignment;
      } else {
        node.assignments.push(payload.assignment);
      }
    } else if (payload.op === 'assignment:remove' && payload.assignmentId) {
      node.assignments = node.assignments.filter(
        (a) => a.id !== payload.assignmentId,
      );
    }

    const newVersion = (node.version || 1) + 1;
    node.version = newVersion;

    const { updatedNodes, changes } = this.completionService.recomputeGraph(
      graph.nodes,
    );

    await this.blueprintRepo.saveGraph(projectId, {
      nodes: updatedNodes,
      edges: graph.edges,
    });

    await this.historyRepo.create({
      projectId,
      revision: newVersion,
      operationType: payload.op,
      description: `Assignment operation ${payload.op} on node ${payload.nodeId}`,
      userId,
    });

    return {
      success: true,
      assignments: node.assignments,
      version: newVersion,
      changes,
    };
  }

  async patchNode(
    projectId: string,
    payload: NodePatchPayload,
    userId: string,
  ) {
    const graph = await this.getGraph(projectId);
    const node = graph.nodes.find((n) => n.id === payload.nodeId);
    if (!node) {
      throw new NotFoundException(`Node ${payload.nodeId} not found`);
    }

    if (
      typeof payload.version === 'number' &&
      typeof node.version === 'number' &&
      payload.version !== node.version
    ) {
      throw new ConflictException({
        code: 'REVISION_CONFLICT',
        message: `Node version mismatch: server is at ${node.version}, client sent ${payload.version}`,
        currentVersion: node.version,
        rejectedVersion: payload.version,
      });
    }

    if (payload.patch['data']) {
      node.data = {
        ...node.data,
        ...(payload.patch['data'] as Record<string, unknown>),
      };
    }
    if (payload.patch['autoFill']) {
      node.autoFill = payload.patch['autoFill'] as AutoFillMode;
    }

    const newVersion = (node.version || 1) + 1;
    node.version = newVersion;

    const { updatedNodes, changes } = this.completionService.recomputeGraph(
      graph.nodes,
    );

    await this.blueprintRepo.saveGraph(projectId, {
      nodes: updatedNodes,
      edges: graph.edges,
    });

    await this.historyRepo.create({
      projectId,
      revision: newVersion,
      operationType: 'node:patch',
      description: `Patched node ${payload.nodeId}`,
      userId,
    });

    return {
      success: true,
      node,
      version: newVersion,
      changes,
    };
  }
}
