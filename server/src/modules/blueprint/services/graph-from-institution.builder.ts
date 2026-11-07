import { Injectable } from '@nestjs/common';
import type {
  BlueprintEdgeDto,
  BlueprintNodeDto,
  DepartmentNode,
  InstitutionDto,
} from '@slotly/contracts';
import { CompletionService } from './completion.service';

export interface StructureBuildInput {
  institution:
    | InstitutionDto
    | {
        id: string;
        name: string;
        code: string;
        workingDays?: number[];
        defaultPeriodConfig?: Record<string, unknown>;
      };
  departments?: DepartmentNode[];
  faculty?: Array<{
    id: string;
    name: string;
    maxHoursPerDay?: number;
    maxHoursPerWeek?: number;
    availability?: boolean[][];
  }>;
  rooms?: Array<{ id: string; name: string; type: string; capacity: number }>;
}

@Injectable()
export class GraphFromInstitutionBuilder {
  constructor(private readonly completionService: CompletionService) {}

  build(
    projectId: string,
    source: StructureBuildInput,
  ): { nodes: BlueprintNodeDto[]; edges: BlueprintEdgeDto[] } {
    const nodes: BlueprintNodeDto[] = [];
    const edges: BlueprintEdgeDto[] = [];

    let edgeCounter = 1;
    const addEdge = (
      sourceId: string,
      targetId: string,
      type = 'hierarchy',
    ) => {
      edges.push({
        id: `edge_${projectId}_${edgeCounter++}`,
        projectId,
        source: sourceId,
        target: targetId,
        type,
      });
    };

    // 1. Institution Root Node (Y = 0)
    const instNodeId = `node_inst_${source.institution.id}`;
    const instNode: BlueprintNodeDto = {
      id: instNodeId,
      projectId,
      type: 'institution',
      refId: source.institution.id,
      parentId: null,
      position: { x: 400, y: 0 },
      data: {
        name: source.institution.name,
        code: source.institution.code,
        workingDays: source.institution.workingDays || [1, 2, 3, 4, 5],
        periodConfig: source.institution.defaultPeriodConfig || {
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
    };
    nodes.push(instNode);

    // 2. Departments
    const depts = source.departments || [];
    depts.forEach((dept, deptIdx) => {
      const deptNodeId = `node_dept_${dept.id}`;
      const deptX = 150 + deptIdx * 350;
      nodes.push({
        id: deptNodeId,
        projectId,
        type: 'department',
        refId: dept.id,
        parentId: instNodeId,
        position: { x: deptX, y: 160 },
        data: { name: dept.name, code: dept.code },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      });
      addEdge(instNodeId, deptNodeId);

      // 3. Programs under Department
      const progs = dept.programs || [];
      progs.forEach((prog, progIdx) => {
        const progNodeId = `node_prog_${prog.id}`;
        const progX = deptX - 100 + progIdx * 250;
        nodes.push({
          id: progNodeId,
          projectId,
          type: 'program',
          refId: prog.id,
          parentId: deptNodeId,
          position: { x: progX, y: 320 },
          data: { name: prog.name, durationYears: prog.durationYears || 4 },
          locked: false,
          hidden: false,
          status: 'complete',
          missing: [],
          effectiveStatus: 'complete',
        });
        addEdge(deptNodeId, progNodeId);

        // 4. Academic Years
        const acYears = prog.academicYears || [];
        acYears.forEach((ay, ayIdx) => {
          const ayNodeId = `node_ay_${ay.id}`;
          const ayX = progX - 50 + ayIdx * 200;
          nodes.push({
            id: ayNodeId,
            projectId,
            type: 'academicYear',
            refId: ay.id,
            parentId: progNodeId,
            position: { x: ayX, y: 480 },
            data: { yearNumber: ay.yearNumber, label: ay.label },
            locked: false,
            hidden: false,
            status: 'complete',
            missing: [],
            effectiveStatus: 'complete',
          });
          addEdge(progNodeId, ayNodeId);

          // 5. Semesters
          const sems = ay.semesters || [];
          sems.forEach((sem, semIdx) => {
            const semNodeId = `node_sem_${sem.id}`;
            const semX = ayX + semIdx * 180;
            nodes.push({
              id: semNodeId,
              projectId,
              type: 'semester',
              refId: sem.id,
              parentId: ayNodeId,
              position: { x: semX, y: 640 },
              data: {
                semesterNumber: sem.number,
                startDate: sem.startDate,
                endDate: sem.endDate,
              },
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            });
            addEdge(ayNodeId, semNodeId);

            // 6. Sections
            const secs = sem.sections || [];
            secs.forEach((sec, secIdx) => {
              const secNodeId = `node_sec_${sec.id}`;
              const secX = semX + secIdx * 160;
              nodes.push({
                id: secNodeId,
                projectId,
                type: 'section',
                refId: sec.id,
                parentId: semNodeId,
                position: { x: secX, y: 800 },
                data: { name: sec.name, strength: sec.strength },
                locked: false,
                hidden: false,
                status: 'complete',
                missing: [],
                effectiveStatus: 'complete',
              });
              addEdge(semNodeId, secNodeId);

              // 7. Batches
              const batches = sec.batches || [];
              batches.forEach((batch, batchIdx) => {
                const batchNodeId = `node_batch_${sec.id}_${batchIdx + 1}`;
                nodes.push({
                  id: batchNodeId,
                  projectId,
                  type: 'batch',
                  parentId: secNodeId,
                  position: { x: secX + batchIdx * 120, y: 960 },
                  data: { name: batch.name, size: batch.size },
                  locked: false,
                  hidden: false,
                  status: 'complete',
                  missing: [],
                  effectiveStatus: 'complete',
                });
                addEdge(secNodeId, batchNodeId);
              });
            });
          });
        });
      });
    });

    // 8. Independent Resources (Faculty & Rooms on the side)
    (source.faculty || []).forEach((f, idx) => {
      nodes.push({
        id: `node_fac_${f.id}`,
        projectId,
        type: 'faculty',
        refId: f.id,
        parentId: null,
        position: { x: 1200, y: idx * 120 },
        data: {
          name: f.name,
          availability:
            f.availability ||
            Array.from({ length: 7 }, () => Array<boolean>(10).fill(true)),
          maxHoursPerDay: f.maxHoursPerDay || 4,
          maxHoursPerWeek: f.maxHoursPerWeek || 16,
        },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      });
    });

    (source.rooms || []).forEach((r, idx) => {
      nodes.push({
        id: `node_room_${r.id}`,
        projectId,
        type: 'room',
        refId: r.id,
        parentId: null,
        position: { x: 1400, y: idx * 120 },
        data: {
          name: r.name,
          type: r.type,
          capacity: r.capacity,
        },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      });
    });

    // Compute status across entire generated graph
    const { updatedNodes } = this.completionService.recomputeGraph(nodes);

    return {
      nodes: updatedNodes,
      edges,
    };
  }
}
