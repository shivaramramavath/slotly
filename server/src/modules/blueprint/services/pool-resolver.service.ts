// Service resolving hierarchical resource pools and where-used references for blueprint nodes.
import { Injectable, Inject, Optional } from '@nestjs/common';
import type {
  BlueprintGraphDto,
  BlueprintNodeDto,
  PoolItemType,
  ResolvedPool,
  ResolvedPoolItem,
} from '@slotly/contracts';
import {
  FACULTY_REPOSITORY,
  type FacultyRepository,
} from '../../library/repositories/faculty.repository';
import {
  SUBJECT_REPOSITORY,
  type SubjectRepository,
} from '../../library/repositories/subject.repository';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
} from '../../library/repositories/room.repository';
import { CachedBlueprintRepository } from '../repositories/cached-blueprint.repository';

/** Result item representing a node where a library resource is referenced. */
export interface WhereUsedResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  inPool: boolean;
  isAssigned: boolean;
  isRequired: boolean;
  isDirectAddition: boolean;
}

/** Internal tracking structure for a pool item during hierarchy resolution. */
interface TrackedPoolItem {
  itemId: string;
  kind: PoolItemType;
  sourceNodeId: string;
  sourceNodeType: string;
  required: boolean;
  pinned: boolean;
  isExcluded: boolean;
}

/** Injectable service resolving effective resource pools with inheritance rules. */
@Injectable()
export class PoolResolverService {
  constructor(
    @Inject(FACULTY_REPOSITORY)
    private readonly facultyRepo: FacultyRepository,
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepo: SubjectRepository,
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepo: RoomRepository,
    @Optional()
    private readonly blueprintRepo?: CachedBlueprintRepository,
  ) {}

  /** Resolves the effective resource pool for a given node in the graph. */
  async resolveEffectivePool(
    nodeId: string,
    nodes: BlueprintNodeDto[],
  ): Promise<ResolvedPool> {
    const nodesMap = new Map<string, BlueprintNodeDto>(
      nodes.map((n) => [n.id, n]),
    );
    const targetNode = nodesMap.get(nodeId);

    if (!targetNode) {
      return {
        nodeId,
        faculty: [],
        subjects: [],
        rooms: [],
      };
    }

    // 1. Build ancestor chain from root down to targetNode
    const chain: BlueprintNodeDto[] = [];
    let curr: BlueprintNodeDto | undefined = targetNode;
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      chain.unshift(curr);
      curr = curr.parentId ? nodesMap.get(curr.parentId) : undefined;
    }

    // 2. Accumulate additions and exclusions top-down
    // effectivePool(node) = effectivePool(parent) + own additions - own exclusions
    const activeItems = new Map<string, TrackedPoolItem>();

    for (let depth = 0; depth < chain.length; depth++) {
      const node = chain[depth]!;
      const pool = node.pool;

      if (!pool) continue;

      // Process additions
      for (const add of pool.additions || []) {
        const existing = activeItems.get(add.itemId);
        if (existing) {
          // If already inherited, child can upgrade required or pinned
          existing.required = existing.required || Boolean(add.required);
          existing.pinned = existing.pinned || Boolean(add.pinned);
          existing.isExcluded = false;
        } else {
          activeItems.set(add.itemId, {
            itemId: add.itemId,
            kind: add.kind,
            sourceNodeId: node.id,
            sourceNodeType: node.type,
            required: Boolean(add.required),
            pinned: Boolean(add.pinned),
            isExcluded: false,
          });
        }
      }

      // Process exclusions
      for (const excludedId of pool.exclusions || []) {
        const item = activeItems.get(excludedId);
        if (item) {
          // Ancestor Required Rule: items marked required by an ancestor cannot be excluded
          const isAncestorRequired =
            item.required && item.sourceNodeId !== node.id;
          if (!isAncestorRequired) {
            item.isExcluded = true;
          }
        }
      }
    }

    // 3. Filter non-excluded items and group by kind
    const faculty: ResolvedPoolItem[] = [];
    const subjects: ResolvedPoolItem[] = [];
    const rooms: ResolvedPoolItem[] = [];

    for (const item of activeItems.values()) {
      if (item.isExcluded) continue;

      const details = await this.resolveLibraryItem(item.kind, item.itemId);
      const resolved: ResolvedPoolItem = {
        itemId: item.itemId,
        kind: item.kind,
        name: details.name,
        code: details.code,
        departmentId: details.departmentId,
        sourceNodeId: item.sourceNodeId,
        sourceNodeType: item.sourceNodeType,
        required: item.required,
        pinned: item.pinned,
        isExcluded: false,
      };

      if (item.kind === 'faculty') faculty.push(resolved);
      else if (item.kind === 'subject') subjects.push(resolved);
      else if (item.kind === 'room') rooms.push(resolved);
    }

    return {
      nodeId,
      faculty,
      subjects,
      rooms,
    };
  }

  /** Resolves metadata (name, code, departmentId) for a library item. */
  async resolveLibraryItem(
    kind: PoolItemType,
    itemId: string,
  ): Promise<{ name: string; code?: string; departmentId?: string }> {
    try {
      if (kind === 'faculty') {
        const doc = await this.facultyRepo.findById(itemId);
        if (doc) {
          const res: { name: string; code?: string; departmentId?: string } = {
            name: doc.name,
          };
          if (doc.code) res.code = doc.code;
          if (doc.departmentId) res.departmentId = doc.departmentId;
          return res;
        }
      } else if (kind === 'subject') {
        const doc = await this.subjectRepo.findById(itemId);
        if (doc) {
          const res: { name: string; code?: string; departmentId?: string } = {
            name: doc.name,
          };
          if (doc.code) res.code = doc.code;
          if (doc.departmentId) res.departmentId = doc.departmentId;
          return res;
        }
      } else if (kind === 'room') {
        const doc = await this.roomRepo.findById(itemId);
        if (doc) {
          const res: { name: string; code?: string; departmentId?: string } = {
            name: doc.name,
          };
          if (doc.code) res.code = doc.code;
          if (doc.departmentId) res.departmentId = doc.departmentId;
          return res;
        }
      }
    } catch {
      // Fallback if lookup fails
    }

    return {
      name: `${kind.charAt(0).toUpperCase() + kind.slice(1)} ${itemId.slice(-6)}`,
    };
  }

  /** Finds all nodes in a blueprint where a library resource is referenced. */
  async getWhereUsed(
    projectId: string,
    refType: PoolItemType,
    refId: string,
    providedGraph?: BlueprintGraphDto,
  ): Promise<WhereUsedResult[]> {
    let graph = providedGraph;
    if (!graph && this.blueprintRepo) {
      const doc = await this.blueprintRepo.findByProject(projectId);
      if (doc) {
        graph = {
          projectId,
          revision: doc.revision,
          nodes: doc.nodes,
          edges: doc.edges,
        };
      }
    }

    if (!graph || !graph.nodes) return [];

    const results: WhereUsedResult[] = [];

    for (const node of graph.nodes) {
      const nodeName =
        typeof node.data?.['name'] === 'string'
          ? (node.data['name'] as string)
          : node.id;
      const isDirectAddition = Boolean(
        node.pool?.additions?.some((a) => a.itemId === refId),
      );

      // Check assignment reference
      const isAssigned = Boolean(
        node.assignments?.some(
          (a) =>
            a.subjectId === refId ||
            a.facultyId === refId ||
            a.roomId === refId,
        ),
      );

      // Check effective pool presence
      const pool = await this.resolveEffectivePool(node.id, graph.nodes);
      const list =
        refType === 'faculty'
          ? pool.faculty
          : refType === 'subject'
            ? pool.subjects
            : pool.rooms;
      const poolItem = list.find((i) => i.itemId === refId);
      const inPool = Boolean(poolItem);
      const isRequired = Boolean(poolItem?.required);

      if (isDirectAddition || isAssigned || inPool) {
        results.push({
          nodeId: node.id,
          nodeName,
          nodeType: node.type,
          inPool,
          isAssigned,
          isRequired,
          isDirectAddition,
        });
      }
    }

    return results;
  }
}
