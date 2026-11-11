// Domain service providing sidebar operations: pool candidates, node checklist, assignment suggestions, and settings copy.
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type {
  AssignmentSuggestRequestDto,
  AssignmentSuggestResponseDto,
  AssignmentSuggestion,
  BlueprintNodeDto,
  BlueprintOp,
  CopyNodeSettingsDto,
  CopyNodeSettingsPart,
  CopyNodeSettingsResponseDto,
  NodeCheckResponseDto,
  NodeCheckWarning,
  PoolCandidateItemDto,
  PoolCandidatesQueryDto,
  PoolCandidatesResponseDto,
  RankedSuggestionItem,
} from '@slotly/contracts';
import { NodeFormSchemas } from '@slotly/contracts';
import { CachedBlueprintRepository } from '../repositories/cached-blueprint.repository';
import { PoolResolverService } from './pool-resolver.service';
import { BlueprintService } from './blueprint.service';
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
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import { CACHE_SERVICE } from '../../../common/cache';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { Faculty } from '../../library/schemas/faculty.schema';
import type { Room } from '../../library/schemas/room.schema';

function getItemId(entity: { id?: string | undefined; _id?: unknown }): string {
  return entity.id || (entity._id ? String(entity._id) : '');
}

/** Service providing backend support for the Blueprint right inspector sidebar. */
@Injectable()
export class BlueprintSidebarService {
  constructor(
    private readonly blueprintRepo: CachedBlueprintRepository,
    private readonly poolResolver: PoolResolverService,
    private readonly blueprintService: BlueprintService,
    @Inject(FACULTY_REPOSITORY)
    private readonly facultyRepo: FacultyRepository,
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepo: SubjectRepository,
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepo: RoomRepository,
    private readonly projectRepo: CachedProjectRepository,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: CacheService,
  ) {}

  /** Retrieves cursor-paginated candidates from the library that may be added to a node pool. */
  async getCandidates(
    projectId: string,
    nodeId: string,
    query: PoolCandidatesQueryDto,
  ): Promise<PoolCandidatesResponseDto> {
    const queryHash = crypto
      .createHash('md5')
      .update(JSON.stringify(query))
      .digest('hex');
    const cacheKey = `slotly:blueprint:${projectId}:node:${nodeId}:candidates:${queryHash}`;
    const cached =
      await this.cacheService.get<PoolCandidatesResponseDto>(cacheKey);
    if (cached) return cached;

    const graph = await this.blueprintRepo.findByProject(projectId);
    if (!graph) throw new NotFoundException('Blueprint not found');
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new NotFoundException(`Node ${nodeId} not found`);

    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    const institutionId = project.institutionId;

    const resolvedPool = await this.poolResolver.resolveEffectivePool(
      nodeId,
      graph.nodes,
    );
    const nodeDeptId = this.resolveNodeDepartmentId(node, graph.nodes);

    let allItems: PoolCandidateItemDto[] = [];

    if (query.type === 'faculty') {
      const res = await this.facultyRepo.findByInstitution(institutionId);
      const list = res?.items || [];
      const search = (query.q || '').toLowerCase();
      allItems = list
        .filter((f) => {
          if (f.isDeleted) return false;
          if (
            search &&
            !f.name.toLowerCase().includes(search) &&
            !f.code?.toLowerCase().includes(search)
          )
            return false;
          if (query.department && f.departmentId !== query.department)
            return false;
          if (
            query.qualifiedFor &&
            !(f.subjectIds || []).includes(query.qualifiedFor)
          )
            return false;
          return true;
        })
        .map((f) => {
          const fid = getItemId(f);
          const alreadyInPool = resolvedPool.faculty.some(
            (p) => p.itemId === fid,
          );
          const excluded = (node.pool?.exclusions || []).includes(fid);
          const doNotLend = Boolean(
            nodeDeptId && f.departmentId && f.departmentId !== nodeDeptId,
          );
          return {
            id: fid,
            name: f.name,
            code: f.code,
            type: 'faculty' as const,
            departmentId: f.departmentId,
            alreadyInPool,
            excluded,
            archived: Boolean(f.archived),
            doNotLend,
            details: {
              designation: f.designation,
              maxHoursPerWeek: f.maxHoursPerWeek,
            },
          };
        });
    } else if (query.type === 'subject') {
      const res = await this.subjectRepo.findByInstitution(institutionId);
      const list = res?.items || [];
      const search = (query.q || '').toLowerCase();
      allItems = list
        .filter((s) => {
          if (s.isDeleted) return false;
          if (
            search &&
            !s.name.toLowerCase().includes(search) &&
            !s.code?.toLowerCase().includes(search)
          )
            return false;
          if (query.department && s.departmentId !== query.department)
            return false;
          if (query.subjectType && s.type !== query.subjectType) return false;
          return true;
        })
        .map((s) => {
          const sid = getItemId(s);
          const alreadyInPool = resolvedPool.subjects.some(
            (p) => p.itemId === sid,
          );
          const excluded = (node.pool?.exclusions || []).includes(sid);
          const doNotLend = Boolean(
            nodeDeptId && s.departmentId && s.departmentId !== nodeDeptId,
          );
          return {
            id: sid,
            name: s.name,
            code: s.code,
            type: 'subject' as const,
            departmentId: s.departmentId,
            alreadyInPool,
            excluded,
            archived: Boolean(s.archived),
            doNotLend,
            details: {
              subjectType: s.type,
              weeklyHours: s.weeklyHours,
              credits: s.credits,
            },
          };
        });
    } else if (query.type === 'room') {
      const res = await this.roomRepo.findByInstitution(institutionId);
      const list = res?.items || [];
      const search = (query.q || '').toLowerCase();
      allItems = list
        .filter((r) => {
          if (r.isDeleted) return false;
          if (
            search &&
            !r.name.toLowerCase().includes(search) &&
            !r.code?.toLowerCase().includes(search)
          )
            return false;
          if (query.roomType && r.type !== query.roomType) return false;
          return true;
        })
        .map((r) => {
          const rid = getItemId(r);
          const alreadyInPool = resolvedPool.rooms.some(
            (p) => p.itemId === rid,
          );
          const excluded = (node.pool?.exclusions || []).includes(rid);
          const doNotLend = Boolean(
            !r.shared &&
            r.departmentId &&
            nodeDeptId &&
            r.departmentId !== nodeDeptId,
          );
          return {
            id: rid,
            name: r.name,
            code: r.code,
            type: 'room' as const,
            departmentId: r.departmentId,
            alreadyInPool,
            excluded,
            archived: Boolean(r.archived),
            doNotLend,
            details: {
              roomType: r.type,
              capacity: r.capacity,
              building: r.building,
            },
          };
        });
    }

    const limit = query.limit || 20;
    const startIndex = query.cursor ? parseInt(query.cursor, 10) : 0;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + limit;
    const nextCursor = nextIndex < allItems.length ? String(nextIndex) : null;

    const response: PoolCandidatesResponseDto = {
      items: paginatedItems,
      nextCursor,
      total: allItems.length,
    };

    await this.cacheService.set(cacheKey, response, 60);
    return response;
  }

  /** Inspects a node's configuration, effective pools, and children to return a validation checklist. */
  async checkNode(
    projectId: string,
    nodeId: string,
  ): Promise<NodeCheckResponseDto> {
    const cacheKey = `slotly:blueprint:${projectId}:node:${nodeId}:check`;
    const cached = await this.cacheService.get<NodeCheckResponseDto>(cacheKey);
    if (cached) return cached;

    const graph = await this.blueprintRepo.findByProject(projectId);
    if (!graph) throw new NotFoundException('Blueprint not found');
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new NotFoundException(`Node ${nodeId} not found`);

    const missingFields: string[] = [];
    const schema = NodeFormSchemas[node.type as keyof typeof NodeFormSchemas];
    if (schema) {
      const parsed = schema.safeParse(node.data || {});
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const fieldName = String(issue.path[0] || 'field');
          if (!missingFields.includes(fieldName)) {
            missingFields.push(fieldName);
          }
        }
      }
    }

    const warnings: NodeCheckWarning[] = [];
    const resolvedPool = await this.poolResolver.resolveEffectivePool(
      nodeId,
      graph.nodes,
    );

    // 1. Qualified faculty check for subjects
    if (resolvedPool.subjects.length > 0) {
      const poolFacultyIds = resolvedPool.faculty.map((f) => f.itemId);
      const facultyDocsRaw = await Promise.all(
        poolFacultyIds.map((id) => this.facultyRepo.findById(id)),
      );
      const poolFacultyDocs = facultyDocsRaw.filter(
        (f): f is Faculty => f !== null,
      );

      for (const subject of resolvedPool.subjects) {
        const hasQualified = poolFacultyDocs.some((f) =>
          (f.subjectIds || []).includes(subject.itemId),
        );
        if (!hasQualified) {
          warnings.push({
            code: 'NO_QUALIFIED_FACULTY',
            message: `No qualified faculty in pool for subject "${subject.name}"`,
            severity: 'warning',
            targetField: 'faculty',
            fixHint: `Add faculty qualified for ${subject.name} to the pool`,
          });
        }
      }
    }

    // 2. Lab room check
    const poolSubjectDocs = await this.subjectRepo.findByIds(
      resolvedPool.subjects.map((s) => s.itemId),
    );
    const hasLabSubject = poolSubjectDocs.some(
      (s) => s.type === 'lab' || s.requirements?.roomType === 'lab',
    );
    if (hasLabSubject) {
      const poolRoomDocsRaw = await Promise.all(
        resolvedPool.rooms.map((r) => this.roomRepo.findById(r.itemId)),
      );
      const poolRoomDocs = poolRoomDocsRaw.filter((r): r is Room => r !== null);
      const hasLabRoom = poolRoomDocs.some((r) => r.type === 'lab');
      if (!hasLabRoom) {
        warnings.push({
          code: 'LAB_ROOM_MISSING',
          message:
            'Lab subject present in pool but no lab room is assigned or available',
          severity: 'warning',
          targetField: 'rooms',
          fixHint: 'Add a lab room to the pool',
        });
      }
    }

    // 3. Capacity versus section strength check
    if (node.type === 'section' && node.data?.['strength']) {
      const strength = Number(node.data['strength']);
      if (strength > 0 && resolvedPool.rooms.length > 0) {
        const poolRoomsRaw = await Promise.all(
          resolvedPool.rooms.map((r) => this.roomRepo.findById(r.itemId)),
        );
        const poolRooms = poolRoomsRaw.filter((r): r is Room => r !== null);
        const validRooms = poolRooms.filter((r) => r.capacity >= strength);
        if (validRooms.length === 0) {
          warnings.push({
            code: 'ROOM_CAPACITY_DEFICIT',
            message: `All available rooms have capacity smaller than section strength (${strength})`,
            severity: 'error',
            targetField: 'strength',
            fixHint: `Add a room with capacity >= ${strength} to the pool`,
          });
        }
      }
    }

    // 4. Section class teacher & home room in effective pool check
    if (node.type === 'section') {
      const classTeacherId = node.data?.['classTeacherId'] as
        string | undefined;
      if (
        classTeacherId &&
        !resolvedPool.faculty.some((f) => f.itemId === classTeacherId)
      ) {
        warnings.push({
          code: 'CLASS_TEACHER_NOT_IN_POOL',
          message:
            'Configured class teacher does not belong to the effective pool',
          severity: 'error',
          targetField: 'classTeacherId',
          fixHint: 'Select a class teacher from the effective pool',
        });
      }

      const homeRoomId = node.data?.['homeRoomId'] as string | undefined;
      if (
        homeRoomId &&
        !resolvedPool.rooms.some((r) => r.itemId === homeRoomId)
      ) {
        warnings.push({
          code: 'HOME_ROOM_NOT_IN_POOL',
          message: 'Configured home room does not belong to the effective pool',
          severity: 'error',
          targetField: 'homeRoomId',
          fixHint: 'Select a home room from the effective pool',
        });
      }
    }

    // Children summary
    const children = graph.nodes.filter((n) => n.parentId === nodeId);
    const readyCount = children.filter((c) => c.status === 'complete').length;
    const childrenSummary = {
      total: children.length,
      ready: readyCount,
      incomplete: children.length - readyCount,
    };

    // Synthesize fix hints
    const fixHints: string[] = [];
    for (const mf of missingFields) {
      fixHints.push(`Fill required field: ${mf}`);
    }
    for (const w of warnings) {
      if (w.fixHint && !fixHints.includes(w.fixHint)) {
        fixHints.push(w.fixHint);
      }
    }
    if (childrenSummary.incomplete > 0) {
      fixHints.push(
        `Complete ${childrenSummary.incomplete} child node(s) under this hierarchy`,
      );
    }

    const isReady =
      missingFields.length === 0 &&
      warnings.filter((w) => w.severity === 'error').length === 0;

    const response: NodeCheckResponseDto = {
      nodeId,
      isReady,
      missingFields,
      warnings,
      childrenSummary,
      fixHints,
    };

    await this.cacheService.set(cacheKey, response, 30);
    return response;
  }

  /** Generates ranked faculty and room suggestions for unassigned subjects in a section or batch. */
  async suggestAssignments(
    projectId: string,
    nodeId: string,
    dto: AssignmentSuggestRequestDto,
  ): Promise<AssignmentSuggestResponseDto> {
    const graph = await this.blueprintRepo.findByProject(projectId);
    if (!graph) throw new NotFoundException('Blueprint not found');
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new NotFoundException(`Node ${nodeId} not found`);

    if (node.type !== 'section' && node.type !== 'batch') {
      throw new BadRequestException(
        'Assignment suggestions are only applicable to Section or Batch nodes',
      );
    }

    const resolvedPool = await this.poolResolver.resolveEffectivePool(
      nodeId,
      graph.nodes,
    );
    const targetSubjectIds: string[] = [];

    if (dto.mode === 'all' || !dto.subjectId) {
      const assignedSubjectIds = new Set(
        (node.assignments || []).map((a) => a.subjectId),
      );
      for (const s of resolvedPool.subjects) {
        if (!assignedSubjectIds.has(s.itemId)) {
          targetSubjectIds.push(s.itemId);
        }
      }
    } else {
      targetSubjectIds.push(dto.subjectId);
    }

    const facultyDocsRaw = await Promise.all(
      resolvedPool.faculty.map((f) => this.facultyRepo.findById(f.itemId)),
    );
    const facultyDocs = facultyDocsRaw.filter((f): f is Faculty => f !== null);

    const roomDocsRaw = await Promise.all(
      resolvedPool.rooms.map((r) => this.roomRepo.findById(r.itemId)),
    );
    const roomDocs = roomDocsRaw.filter((r): r is Room => r !== null);

    const subjectDocs = await this.subjectRepo.findByIds(targetSubjectIds);

    const sectionStrength = Number(node.data?.['strength'] || 40);
    const suggestions: AssignmentSuggestion[] = [];

    for (const subject of subjectDocs) {
      // 1. Rank Faculty
      const facultyRanked: RankedSuggestionItem[] = [];
      for (const f of facultyDocs) {
        let score = 0;
        const reasons: string[] = [];
        const fid = getItemId(f);
        const isQualified = (f.subjectIds || []).includes(subject.id || '');
        if (isQualified) {
          score += 100;
          reasons.push('Qualified for subject');
        } else {
          reasons.push('General faculty');
        }

        const maxHours = f.maxHoursPerWeek || 20;
        if (maxHours > 10) {
          score += 30;
          reasons.push('Workload capacity available');
        }

        facultyRanked.push({
          id: fid,
          name: f.name,
          score,
          reasons,
        });
      }
      facultyRanked.sort((a, b) => b.score - a.score);

      // 2. Rank Rooms
      const roomRanked: RankedSuggestionItem[] = [];
      for (const r of roomDocs) {
        let score = 0;
        const reasons: string[] = [];
        const rid = getItemId(r);
        const reqType = (subject.requirements?.roomType ||
          subject.type) as string;
        if (
          r.type === reqType ||
          (reqType === 'theory' && r.type === 'lecture')
        ) {
          score += 80;
          reasons.push(`Matches room type (${r.type})`);
        }

        if (r.capacity >= sectionStrength) {
          score += 50;
          reasons.push(
            `Capacity (${r.capacity}) covers strength (${sectionStrength})`,
          );
        } else {
          score -= 40;
          reasons.push(
            `Capacity (${r.capacity}) is below strength (${sectionStrength})`,
          );
        }

        roomRanked.push({
          id: rid,
          name: r.name,
          score,
          reasons,
        });
      }
      roomRanked.sort((a, b) => b.score - a.score);

      suggestions.push({
        subjectId: subject.id || '',
        subjectName: subject.name,
        faculty: facultyRanked.slice(0, 5),
        rooms: roomRanked.slice(0, 5),
      });
    }

    return { suggestions };
  }

  /** Copies selected settings between nodes atomically with gate validation. */
  async copySettings(
    projectId: string,
    targetNodeId: string,
    dto: CopyNodeSettingsDto,
    userId: string,
  ): Promise<CopyNodeSettingsResponseDto> {
    const graph = await this.blueprintRepo.findByProject(projectId);
    if (!graph) throw new NotFoundException('Blueprint not found');
    const targetNode = graph.nodes.find((n) => n.id === targetNodeId);
    if (!targetNode)
      throw new NotFoundException(`Target node ${targetNodeId} not found`);

    const sourceNode = graph.nodes.find((n) => n.id === dto.sourceNodeId);
    if (!sourceNode)
      throw new NotFoundException(`Source node ${dto.sourceNodeId} not found`);

    const operations: BlueprintOp[] = [];
    const appliedParts: CopyNodeSettingsPart[] = [];
    const skippedParts: Array<{
      part: CopyNodeSettingsPart;
      reasonCode: string;
      message: string;
    }> = [];

    for (const part of dto.parts) {
      if (part === 'fields') {
        const copyableFields: Record<string, unknown> = {};
        const ignoredKeys = new Set([
          'id',
          'name',
          'code',
          'parentId',
          'position',
          'status',
          'effectiveStatus',
          'missing',
        ]);
        for (const [k, v] of Object.entries(sourceNode.data || {})) {
          if (!ignoredKeys.has(k)) {
            copyableFields[k] = v;
          }
        }
        if (Object.keys(copyableFields).length > 0) {
          operations.push({
            opId: `op_copy_fields_${Date.now()}`,
            type: 'update_node',
            targetId: targetNodeId,
            data: copyableFields,
          });
          appliedParts.push('fields');
        }
      } else if (part === 'pool') {
        const additions = sourceNode.pool?.additions || [];
        for (const add of additions) {
          operations.push({
            opId: `op_copy_pool_${add.itemId}_${Date.now()}`,
            type: 'update_node',
            targetId: targetNodeId,
            data: {
              __poolAdd: {
                kind: add.kind,
                itemId: add.itemId,
                required: add.required,
                pinned: add.pinned,
              },
            },
          });
        }
        appliedParts.push('pool');
      } else if (part === 'assignments') {
        if (
          (sourceNode.type === 'section' || sourceNode.type === 'batch') &&
          (targetNode.type === 'section' || targetNode.type === 'batch')
        ) {
          const assignments = sourceNode.assignments || [];
          if (assignments.length > 0) {
            operations.push({
              opId: `op_copy_assign_${Date.now()}`,
              type: 'update_node',
              targetId: targetNodeId,
              data: { assignments },
            });
            appliedParts.push('assignments');
          }
        } else {
          skippedParts.push({
            part: 'assignments',
            reasonCode: 'TYPE_INCOMPATIBLE',
            message:
              'Assignments can only be copied between Section or Batch nodes',
          });
        }
      } else if (part === 'rules') {
        if (sourceNode.constraints) {
          operations.push({
            opId: `op_copy_rules_${Date.now()}`,
            type: 'update_node',
            targetId: targetNodeId,
            data: { constraints: sourceNode.constraints },
          });
          appliedParts.push('rules');
        }
      }
    }

    if (operations.length > 0) {
      const result = await this.blueprintService.applyOperations(
        projectId,
        { operations },
        userId,
      );
      if (result.skipped.length > 0) {
        for (const skip of result.skipped) {
          skippedParts.push({
            part: 'fields',
            reasonCode: skip.reasonCode,
            message: skip.message,
          });
        }
      }
    }

    return {
      appliedParts,
      skippedParts,
      appliedOperations: operations.length,
    };
  }

  private resolveNodeDepartmentId(
    node: BlueprintNodeDto,
    allNodes: BlueprintNodeDto[],
  ): string | undefined {
    if (node.type === 'department') {
      return (node.data?.['departmentId'] as string) || node.id;
    }
    let curr: BlueprintNodeDto | undefined = node;
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      if (curr.type === 'department') {
        return (curr.data?.['departmentId'] as string) || curr.id;
      }
      curr = curr.parentId
        ? allNodes.find((n) => n.id === curr!.parentId)
        : undefined;
    }
    return undefined;
  }
}
