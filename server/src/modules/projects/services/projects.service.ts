// Domain service orchestrating projects.service business logic.
import {
  ConflictException,
  Injectable,
  Inject,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateProjectDto,
  DuplicateProjectDto,
  ProjectDto,
  UpdateProjectDto,
} from '@slotly/contracts';
import { CachedProjectRepository } from '../repositories/cached-project.repository';
import { CachedBlueprintRepository } from '../../blueprint/repositories/cached-blueprint.repository';
import { TemplateService } from '../../blueprint/services/template.service';
import { GraphFromInstitutionBuilder } from '../../blueprint/services/graph-from-institution.builder';
import { INSTITUTIONS_SERVICE } from '../../institutions/services/institutions.service';
import type { InstitutionsService } from '../../institutions/services/institutions.service';
import { INSTITUTION_REPOSITORY } from '../../institutions/repositories/institution.repository';
import type { InstitutionRepository } from '../../institutions/repositories/institution.repository';
import { ProjectStateFactory } from '../lifecycle/project-state.factory';
import { AuditService } from '../../../common/audit/audit.service';
import type { Project } from '../schemas/project.schema';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

function getId(
  doc:
    { id?: string; _id?: { toString(): string } | string } | null | undefined,
): string {
  if (!doc) return '';
  if (doc.id) return doc.id;
  if (!doc._id) return '';
  return typeof doc._id === 'string' ? doc._id : doc._id.toString();
}

/** Injectable service providing projects service logic. */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepo: CachedProjectRepository,
    private readonly blueprintRepo: CachedBlueprintRepository,
    private readonly templateService: TemplateService,
    private readonly graphBuilder: GraphFromInstitutionBuilder,
    @Inject(INSTITUTIONS_SERVICE)
    private readonly institutionsService: InstitutionsService,
    private readonly auditService: AuditService,
    @Optional()
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo?: InstitutionRepository,
    @Optional()
    @Inject(CACHE_SERVICE)
    private readonly cache?: CacheService,
  ) {}

  private toDto(doc: Project, blueprintProgress: number | null = null): ProjectDto {
    const id = getId(doc);
    return {
      id,
      institutionId: doc.institutionId,
      ownerId: doc.ownerId,
      name: doc.name,
      term: doc.term,
      status: doc.status,
      settings: doc.settings,
      strictness: doc.strictness,
      lastOpenedAt: doc.lastOpenedAt?.toISOString?.() || undefined,
      revision: doc.revision,
      blueprintProgress,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  async create(
    dto: CreateProjectDto,
    userId: string,
    userInstitutionId?: string,
  ): Promise<ProjectDto> {
    let institutionId = dto.institutionId || userInstitutionId;
    if (!institutionId && this.institutionRepo) {
      const firstInst = await this.institutionRepo.findOne({
        isDeleted: false,
      });
      if (firstInst) {
        institutionId = (
          firstInst.id ||
          (firstInst as unknown as { _id?: { toString(): string } })._id
        )?.toString();
      }
    }
    if (!institutionId) {
      throw new ConflictException(
        'Institution ID is required to create a project',
      );
    }

    const created = await this.projectRepo.create({
      institutionId,
      ownerId: userId,
      name: dto.name,
      term: dto.term,
      status: 'draft',
      settings: dto.settings || {
        days: [1, 2, 3, 4, 5],
        periodsPerDay: 7,
        periodDuration: 50,
        startTime: '09:00',
        breaks: [],
        perDayOverrides: {},
      },
      strictness: dto.strictness || 'strict',
      revision: 1,
    });

    const projectId = getId(created);

    // Initialize Blueprint Graph based on source
    if (dto.source === 'template' && dto.templateId) {
      await this.templateService.applyTemplate(
        projectId,
        dto.templateId,
        undefined,
        userId,
      );
    } else if (dto.source === 'institution') {
      try {
        const tree = await this.institutionsService.getStructure(institutionId);
        const { nodes, edges } = this.graphBuilder.build(projectId, {
          institution: tree.institution,
          departments: tree.departments,
        });
        await this.blueprintRepo.resetGraph(projectId);
        await this.blueprintRepo.saveGraph(projectId, { nodes, edges }, 1);
      } catch {
        // Fallback to empty graph with institution node
        await this.initRootGraph(projectId, institutionId, dto.name);
      }
    } else {
      await this.initRootGraph(projectId, institutionId, dto.name);
    }

    await this.auditService.log(
      'PROJECT_CREATED',
      userId,
      { type: 'project', id: projectId },
      { name: dto.name, source: dto.source },
    );

    return this.toDto(created);
  }

  private async initRootGraph(
    projectId: string,
    institutionId: string,
    name: string,
  ): Promise<void> {
    const instNodeId = `node_inst_${institutionId}`;
    await this.blueprintRepo.resetGraph(projectId);
    await this.blueprintRepo.saveGraph(
      projectId,
      {
        nodes: [
          {
            id: instNodeId,
            projectId,
            type: 'institution',
            refId: institutionId,
            parentId: null,
            position: { x: 400, y: 50 },
            data: {
              name,
              code: 'INST',
              workingDays: [1, 2, 3, 4, 5],
              periodConfig: {
                startTime: '09:00',
                periodsPerDay: 7,
                periodDuration: 50,
                breaks: [],
              },
            },
            locked: false,
            hidden: false,
            status: 'complete',
            missing: [],
            effectiveStatus: 'complete',
          },
        ],
        edges: [],
      },
      1,
    );
  }

  async findProjects(
    institutionId?: string,
    ownerId?: string,
    status?: string,
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: ProjectDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const filter = {
      institutionId: institutionId || undefined,
      ownerId: ownerId || undefined,
      status: status || undefined,
      search: search || undefined,
    };
    const { items, total } = await this.projectRepo.findProjects(
      filter,
      skip,
      limit,
    );
    const dtos = await Promise.all(
      items.map(async (p) => {
        const pId = getId(p);
        let progress: number | null = null;
        if (this.cache && pId) {
          try {
            const cachedReadiness = await this.cache.get<{ percentComplete?: number }>(
              `slotly:blueprint:${pId}:readiness`,
            );
            if (cachedReadiness && typeof cachedReadiness.percentComplete === 'number') {
              progress = cachedReadiness.percentComplete;
            } else {
              const cachedBlueprint = await this.cache.get<{ nodes?: Array<{ status?: string }> }>(
                `slotly:blueprint:${pId}`,
              );
              if (cachedBlueprint?.nodes && Array.isArray(cachedBlueprint.nodes)) {
                const totalNodes = cachedBlueprint.nodes.length;
                if (totalNodes > 0) {
                  const completed = cachedBlueprint.nodes.filter((n) => n.status === 'complete').length;
                  progress = Math.round((completed / totalNodes) * 100);
                } else {
                  progress = 0;
                }
              }
            }
          } catch {
            // cache read failure is non-fatal
          }
        }
        return this.toDto(p, progress);
      }),
    );
    return {
      items: dtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(projectId: string): Promise<ProjectDto> {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.isDeleted) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // NON-CRITICAL: update lastOpenedAt asynchronously
    void this.projectRepo.updateLastOpened(projectId).catch(() => {});

    return this.toDto(project);
  }

  async update(
    projectId: string,
    dto: UpdateProjectDto,
    expectedRevision?: number,
  ): Promise<ProjectDto> {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.isDeleted) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (
      typeof expectedRevision === 'number' &&
      expectedRevision !== project.revision
    ) {
      throw new ConflictException({
        code: 'REVISION_CONFLICT',
        message: 'Project revision conflict',
        currentRevision: project.revision,
        rejectedRevision: expectedRevision,
      });
    }

    const state = ProjectStateFactory.create(project.status);
    if (!state.canEdit()) {
      throw new ConflictException(
        `Project in status "${project.status}" cannot be edited`,
      );
    }

    const updatePayload: Partial<Project> = {
      revision: project.revision + 1,
    };
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.term !== undefined) updatePayload.term = dto.term;
    if (dto.settings !== undefined) updatePayload.settings = dto.settings;
    if (dto.strictness !== undefined) updatePayload.strictness = dto.strictness;

    const updated = await this.projectRepo.update(projectId, updatePayload);

    return this.toDto(updated!);
  }

  async updateStatus(
    projectId: string,
    status: Project['status'],
  ): Promise<ProjectDto> {
    const updated = await this.projectRepo.update(projectId, { status });
    if (!updated) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    return this.toDto(updated);
  }

  async delete(projectId: string, userId: string): Promise<boolean> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const result = await this.projectRepo.update(projectId, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    await this.auditService.log('PROJECT_DELETED', userId, {
      type: 'project',
      id: projectId,
    });

    return !!result;
  }

  async duplicate(
    projectId: string,
    dto: DuplicateProjectDto,
    userId: string,
  ): Promise<ProjectDto> {
    const original = await this.projectRepo.findById(projectId);
    if (!original || original.isDeleted) {
      throw new NotFoundException(`Original project ${projectId} not found`);
    }

    const copy = await this.projectRepo.create({
      institutionId: original.institutionId,
      ownerId: userId,
      name: dto.name,
      term: original.term,
      status: 'draft',
      settings: original.settings,
      strictness: original.strictness,
      revision: 1,
    });

    const copyId = getId(copy);

    // Copy blueprint graph
    const originalGraph = await this.blueprintRepo.findByProject(projectId);
    if (originalGraph) {
      await this.blueprintRepo.saveGraph(
        copyId,
        {
          nodes: originalGraph.nodes.map((n) => ({ ...n, projectId: copyId })),
          edges: originalGraph.edges.map((e) => ({ ...e, projectId: copyId })),
        },
        1,
      );
    }

    await this.auditService.log(
      'PROJECT_DUPLICATED',
      userId,
      { type: 'project', id: copyId },
      { sourceProjectId: projectId, name: dto.name },
    );

    return this.toDto(copy);
  }

  async archive(projectId: string, userId: string): Promise<ProjectDto> {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.isDeleted) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const state = ProjectStateFactory.create(project.status);
    if (!state.canArchive()) {
      throw new ConflictException(
        `Project in status "${project.status}" cannot be archived`,
      );
    }

    const updated = await this.projectRepo.update(projectId, {
      status: 'archived',
    });

    await this.auditService.log('PROJECT_ARCHIVED', userId, {
      type: 'project',
      id: projectId,
    });

    return this.toDto(updated!);
  }
}
