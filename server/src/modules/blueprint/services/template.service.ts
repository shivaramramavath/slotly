import { Injectable, OnModuleInit } from '@nestjs/common';
import type {
  ApplyOperationsDto,
  BatchOperationResult,
  CreateGraphTemplateDto,
  GraphTemplateDto,
} from '@slotly/contracts';
import { BlueprintTemplateRepository } from '../repositories/blueprint-auxiliary.repositories';
import { CachedBlueprintRepository } from '../repositories/cached-blueprint.repository';
import { OperationService } from './operation.service';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import * as crypto from 'crypto';

@Injectable()
export class TemplateService implements OnModuleInit {
  constructor(
    private readonly templateRepo: BlueprintTemplateRepository,
    private readonly blueprintRepo: CachedBlueprintRepository,
    private readonly projectRepo: CachedProjectRepository,
    private readonly operationService: OperationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultKits();
  }

  async seedDefaultKits(): Promise<void> {
    const count = await this.templateRepo.count();
    if (count > 0) return;

    // Seed 1: School Kit
    await this.templateRepo.create({
      name: 'Standard K-12 School Kit',
      category: 'K-12 School',
      visibility: 'public',
      version: 1,
      subtree: {
        nodes: [
          {
            id: 'tpl_dept_highschool',
            type: 'department',
            position: { x: 200, y: 150 },
            data: { name: 'High School Division', code: 'HSD' },
          },
          {
            id: 'tpl_prog_grade10',
            type: 'program',
            parentId: 'tpl_dept_highschool',
            position: { x: 200, y: 300 },
            data: { name: 'Grade 10 Curriculum', durationYears: 1 },
          },
          {
            id: 'tpl_ay_g10',
            type: 'academicYear',
            parentId: 'tpl_prog_grade10',
            position: { x: 200, y: 450 },
            data: { yearNumber: 1, label: 'Academic Year 2026-27' },
          },
          {
            id: 'tpl_sem_term1',
            type: 'semester',
            parentId: 'tpl_ay_g10',
            position: { x: 200, y: 600 },
            data: { semesterNumber: 1, startDate: '2026-08-01', endDate: '2026-12-15' },
          },
          {
            id: 'tpl_sec_10a',
            type: 'section',
            parentId: 'tpl_sem_term1',
            position: { x: 200, y: 750 },
            data: { name: 'Grade 10-A', strength: 30 },
          },
        ],
        edges: [
          { id: 'tpl_e_1', source: 'tpl_dept_highschool', target: 'tpl_prog_grade10', type: 'hierarchy' },
          { id: 'tpl_e_2', source: 'tpl_prog_grade10', target: 'tpl_ay_g10', type: 'hierarchy' },
          { id: 'tpl_e_3', source: 'tpl_ay_g10', target: 'tpl_sem_term1', type: 'hierarchy' },
          { id: 'tpl_e_4', source: 'tpl_sem_term1', target: 'tpl_sec_10a', type: 'hierarchy' },
        ],
      },
    });

    // Seed 2: College / University Kit
    await this.templateRepo.create({
      name: 'Higher Ed Department Kit',
      category: 'University',
      visibility: 'public',
      version: 1,
      subtree: {
        nodes: [
          {
            id: 'tpl_dept_cs',
            type: 'department',
            position: { x: 300, y: 150 },
            data: { name: 'Computer Science & Engineering', code: 'CSE' },
          },
          {
            id: 'tpl_prog_btech',
            type: 'program',
            parentId: 'tpl_dept_cs',
            position: { x: 300, y: 300 },
            data: { name: 'B.Tech in Computer Science', durationYears: 4 },
          },
          {
            id: 'tpl_ay_yr1',
            type: 'academicYear',
            parentId: 'tpl_prog_btech',
            position: { x: 300, y: 450 },
            data: { yearNumber: 1, label: 'First Year' },
          },
          {
            id: 'tpl_sem_s1',
            type: 'semester',
            parentId: 'tpl_ay_yr1',
            position: { x: 300, y: 600 },
            data: { semesterNumber: 1, startDate: '2026-09-01', endDate: '2027-01-20' },
          },
          {
            id: 'tpl_sec_cse_a',
            type: 'section',
            parentId: 'tpl_sem_s1',
            position: { x: 300, y: 750 },
            data: { name: 'CSE-A', strength: 60 },
          },
          {
            id: 'tpl_batch_cse_a1',
            type: 'batch',
            parentId: 'tpl_sec_cse_a',
            position: { x: 200, y: 900 },
            data: { name: 'Batch A1', size: 30 },
          },
          {
            id: 'tpl_batch_cse_a2',
            type: 'batch',
            parentId: 'tpl_sec_cse_a',
            position: { x: 400, y: 900 },
            data: { name: 'Batch A2', size: 30 },
          },
        ],
        edges: [
          { id: 'tpl_e_c1', source: 'tpl_dept_cs', target: 'tpl_prog_btech', type: 'hierarchy' },
          { id: 'tpl_e_c2', source: 'tpl_prog_btech', target: 'tpl_ay_yr1', type: 'hierarchy' },
          { id: 'tpl_e_c3', source: 'tpl_ay_yr1', target: 'tpl_sem_s1', type: 'hierarchy' },
          { id: 'tpl_e_c4', source: 'tpl_sem_s1', target: 'tpl_sec_cse_a', type: 'hierarchy' },
          { id: 'tpl_e_c5', source: 'tpl_sec_cse_a', target: 'tpl_batch_cse_a1', type: 'hierarchy' },
          { id: 'tpl_e_c6', source: 'tpl_sec_cse_a', target: 'tpl_batch_cse_a2', type: 'hierarchy' },
        ],
      },
    });

    // Seed 3: Lab-Heavy Curriculum Kit
    await this.templateRepo.create({
      name: 'Lab-Heavy Technical Kit',
      category: 'Vocational & STEM',
      visibility: 'public',
      version: 1,
      subtree: {
        nodes: [
          {
            id: 'tpl_dept_chem',
            type: 'department',
            position: { x: 300, y: 150 },
            data: { name: 'Applied Chemistry & Materials', code: 'ACM' },
          },
          {
            id: 'tpl_prog_stem',
            type: 'program',
            parentId: 'tpl_dept_chem',
            position: { x: 300, y: 300 },
            data: { name: 'Chemical Laboratory Sciences', durationYears: 3 },
          },
          {
            id: 'tpl_ay_stem1',
            type: 'academicYear',
            parentId: 'tpl_prog_stem',
            position: { x: 300, y: 450 },
            data: { yearNumber: 1, label: 'Year 1' },
          },
          {
            id: 'tpl_sem_stem1',
            type: 'semester',
            parentId: 'tpl_ay_stem1',
            position: { x: 300, y: 600 },
            data: { semesterNumber: 1, startDate: '2026-08-15', endDate: '2026-12-20' },
          },
          {
            id: 'tpl_sec_lab1',
            type: 'section',
            parentId: 'tpl_sem_stem1',
            position: { x: 300, y: 750 },
            data: { name: 'Section L1', strength: 40 },
          },
          {
            id: 'tpl_sub_organic',
            type: 'subjectAssignment',
            parentId: 'tpl_sec_lab1',
            position: { x: 300, y: 900 },
            data: {
              subjectId: 'sub_organic_chem',
              name: 'Organic Chemistry Lab',
              type: 'lab',
              weeklyHours: 4,
              facultyId: 'fac_lab_lead',
              roomType: 'lab',
            },
          },
        ],
        edges: [
          { id: 'tpl_e_l1', source: 'tpl_dept_chem', target: 'tpl_prog_stem', type: 'hierarchy' },
          { id: 'tpl_e_l2', source: 'tpl_prog_stem', target: 'tpl_ay_stem1', type: 'hierarchy' },
          { id: 'tpl_e_l3', source: 'tpl_ay_stem1', target: 'tpl_sem_stem1', type: 'hierarchy' },
          { id: 'tpl_e_l4', source: 'tpl_sem_stem1', target: 'tpl_sec_lab1', type: 'hierarchy' },
          { id: 'tpl_e_l5', source: 'tpl_sec_lab1', target: 'tpl_sub_organic', type: 'hierarchy' },
        ],
      },
    });
  }

  async listTemplates(institutionId?: string): Promise<GraphTemplateDto[]> {
    const list = await this.templateRepo.findAvailableTemplates(institutionId);
    return list.map((t) => ({
      id: t.id || (t as any)._id?.toString() || '',
      name: t.name,
      category: t.category,
      subtree: t.subtree,
      version: t.version,
      visibility: t.visibility,
      institutionId: t.institutionId || undefined,
      createdById: t.createdById || undefined,
      createdAt: (t as any).createdAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async getTemplate(templateId: string): Promise<GraphTemplateDto | null> {
    const t = await this.templateRepo.findById(templateId);
    if (!t) return null;
    return {
      id: t.id || (t as any)._id?.toString() || '',
      name: t.name,
      category: t.category,
      subtree: t.subtree,
      version: t.version,
      visibility: t.visibility,
      institutionId: t.institutionId || undefined,
      createdById: t.createdById || undefined,
      createdAt: (t as any).createdAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  async createTemplate(
    dto: CreateGraphTemplateDto,
    userId: string,
    institutionId?: string,
  ): Promise<GraphTemplateDto> {
    const created = await this.templateRepo.create({
      name: dto.name,
      category: dto.category,
      subtree: dto.subtree,
      version: dto.version || 1,
      visibility: dto.visibility || 'institution',
      institutionId: institutionId || null,
      createdById: userId,
      anchorNodeType: dto.anchorNodeType || null,
    });
    const createdId = created.id || (created as any)._id?.toString() || '';
    return (await this.getTemplate(createdId))!;
  }

  async duplicateTemplate(templateId: string, userId: string): Promise<GraphTemplateDto> {
    const original = await this.getTemplate(templateId);
    if (!original) {
      throw new Error(`Template ${templateId} not found`);
    }

    const copy = await this.templateRepo.create({
      name: `${original.name} (Copy)`,
      category: original.category,
      subtree: original.subtree,
      version: 1,
      visibility: 'institution',
      institutionId: original.institutionId || null,
      createdById: userId,
    });
    const copyId = copy.id || (copy as any)._id?.toString() || '';

    return (await this.getTemplate(copyId))!;
  }

  async applyTemplate(
    projectId: string,
    templateId: string,
    anchorNodeId?: string,
    userId?: string,
  ): Promise<BatchOperationResult> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const currentGraph = await this.blueprintRepo.findByProject(projectId);
    const existingNodes = currentGraph?.nodes || [];
    const existingEdges = currentGraph?.edges || [];

    // Map template node IDs to fresh IDs
    const idMap = new Map<string, string>();
    const templateNodes = template.subtree.nodes || [];
    for (const tn of templateNodes) {
      if (tn.id) {
        idMap.set(tn.id, `node_${crypto.randomUUID().slice(0, 8)}`);
      }
    }

    // Root nodes in the subtree (nodes with no parent or whose parent is not in idMap)
    // will be reparented under anchorNodeId
    const ops: ApplyOperationsDto['operations'] = [];

    for (const tn of templateNodes) {
      const newId = idMap.get(tn.id!)!;
      let parentId = tn.parentId ? idMap.get(tn.parentId) || tn.parentId : null;

      if (!parentId && anchorNodeId) {
        parentId = anchorNodeId;
      }

      ops.push({
        opId: `op_${crypto.randomUUID().slice(0, 8)}`,
        type: 'add_node',
        targetId: newId,
        node: {
          id: newId,
          projectId,
          type: tn.type!,
          parentId,
          position: tn.position || { x: 0, y: 0 },
          data: tn.data || {},
          status: 'incomplete',
          missing: [],
          effectiveStatus: 'incomplete',
        },
        parentId,
      });
    }

    const templateEdges = template.subtree.edges || [];
    for (const te of templateEdges) {
      const source = idMap.get(te.source!) || te.source;
      const target = idMap.get(te.target!) || te.target;
      const edgeId = `edge_${crypto.randomUUID().slice(0, 8)}`;

      ops.push({
        opId: `op_${crypto.randomUUID().slice(0, 8)}`,
        type: 'add_edge',
        targetId: edgeId,
        edge: {
          id: edgeId,
          projectId,
          source: source!,
          target: target!,
          type: te.type || 'hierarchy',
        },
      });
    }

    // Connect anchorNode to roots of subtree
    if (anchorNodeId) {
      const rootNewIds = templateNodes
        .filter((tn) => !tn.parentId || !idMap.has(tn.parentId))
        .map((tn) => idMap.get(tn.id!)!);

      for (const rId of rootNewIds) {
        const edgeId = `edge_${crypto.randomUUID().slice(0, 8)}`;
        ops.push({
          opId: `op_${crypto.randomUUID().slice(0, 8)}`,
          type: 'add_edge',
          targetId: edgeId,
          edge: {
            id: edgeId,
            projectId,
            source: anchorNodeId,
            target: rId,
            type: 'hierarchy',
          },
        });
      }
    }

    // Execute through OperationService
    const projId = project.id || (project as any)._id?.toString() || projectId;
    const result = await this.operationService.applyBatch(
      ops,
      existingNodes,
      existingEdges,
      { id: projId, status: project.status, isLocked: false, isDeleted: project.isDeleted },
      userId ? { id: userId, role: 'ADMIN' } : undefined,
    );

    // Persist resulting graph and increment revision
    const currentRev = currentGraph?.revision || 1;
    const saved = await this.blueprintRepo.saveGraph(
      projectId,
      { nodes: result.nodes, edges: result.edges },
      currentRev,
    );

    return {
      revision: saved?.revision || currentRev + 1,
      applied: result.applied,
      skipped: result.skipped,
      graph: {
        projectId,
        revision: saved?.revision || currentRev + 1,
        nodes: result.nodes,
        edges: result.edges,
      },
    };
  }
}
