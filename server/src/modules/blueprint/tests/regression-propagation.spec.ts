import { CompletionService } from '../services/completion.service';
import { NodeTypeRegistry } from '../model/node-type.registry';
import type { BlueprintNodeDto } from '@slotly/contracts';

describe('G3: Parent Regression & Blocked Status Propagation', () => {
  let completionService: CompletionService;

  beforeEach(() => {
    const registry = new NodeTypeRegistry();
    completionService = new CompletionService(registry);
  });

  it('should propagate blocked effectiveStatus down descendants when an ancestor becomes incomplete', () => {
    // 1. Setup a valid complete chain: Institution -> Department -> Program -> AcademicYear -> Semester -> Section
    const nodes: BlueprintNodeDto[] = [
      {
        id: 'inst_1',
        projectId: 'p1',
        type: 'institution',
        parentId: null,
        position: { x: 0, y: 0 },
        data: {
          name: 'MIT',
          code: 'MIT',
          workingDays: [1, 2, 3, 4, 5],
          periodConfig: {
            startTime: '09:00',
            periodsPerDay: 7,
            periodDuration: 50,
          },
        },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'dept_1',
        projectId: 'p1',
        type: 'department',
        parentId: 'inst_1',
        position: { x: 0, y: 150 },
        data: { name: 'EECS', code: 'EECS' },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'prog_1',
        projectId: 'p1',
        type: 'program',
        parentId: 'dept_1',
        position: { x: 0, y: 300 },
        data: { name: 'Computer Science', durationYears: 4 },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'ay_1',
        projectId: 'p1',
        type: 'academicYear',
        parentId: 'prog_1',
        position: { x: 0, y: 450 },
        data: { yearNumber: 1, label: 'Year 1' },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'sem_1',
        projectId: 'p1',
        type: 'semester',
        parentId: 'ay_1',
        position: { x: 0, y: 600 },
        data: {
          semesterNumber: 1,
          startDate: '2026-09-01',
          endDate: '2027-01-15',
        },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'sec_1',
        projectId: 'p1',
        type: 'section',
        parentId: 'sem_1',
        position: { x: 0, y: 750 },
        data: { name: 'Section A', strength: 60 },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
    ];

    // Initial check: all complete
    const { updatedNodes: initial } = completionService.recomputeGraph(nodes);
    expect(initial.every((n) => n.status === 'complete')).toBe(true);
    expect(initial.every((n) => n.effectiveStatus === 'complete')).toBe(true);

    // 2. Make the Program incomplete (remove durationYears)
    const progNode = nodes.find((n) => n.id === 'prog_1')!;
    progNode.data = { name: 'Computer Science', durationYears: 0 };

    // 3. Recompute graph
    const { updatedNodes: afterRegression } =
      completionService.recomputeGraph(nodes);

    const prog = afterRegression.find((n) => n.id === 'prog_1')!;
    const ay = afterRegression.find((n) => n.id === 'ay_1')!;
    const sem = afterRegression.find((n) => n.id === 'sem_1')!;
    const sec = afterRegression.find((n) => n.id === 'sec_1')!;
    const dept = afterRegression.find((n) => n.id === 'dept_1')!;
    const inst = afterRegression.find((n) => n.id === 'inst_1')!;

    // Ancestors above program remain complete
    expect(inst.effectiveStatus).toBe('complete');
    expect(dept.effectiveStatus).toBe('complete');

    // Program itself is incomplete
    expect(prog.status).toBe('incomplete');
    expect(prog.effectiveStatus).toBe('incomplete');

    // ALL descendants of Program (AcademicYear, Semester, Section) become BLOCKED!
    expect(ay.status).toBe('complete'); // own data is fine
    expect(ay.effectiveStatus).toBe('blocked'); // blocked by ancestor

    expect(sem.status).toBe('complete');
    expect(sem.effectiveStatus).toBe('blocked');

    expect(sec.status).toBe('complete');
    expect(sec.effectiveStatus).toBe('blocked');

    // 4. Restore Program to complete
    progNode.data = { name: 'Computer Science', durationYears: 4 };
    const { updatedNodes: afterRestore } =
      completionService.recomputeGraph(nodes);

    const restoredAy = afterRestore.find((n) => n.id === 'ay_1')!;
    const restoredSem = afterRestore.find((n) => n.id === 'sem_1')!;
    const restoredSec = afterRestore.find((n) => n.id === 'sec_1')!;

    expect(restoredAy.effectiveStatus).toBe('complete');
    expect(restoredSem.effectiveStatus).toBe('complete');
    expect(restoredSec.effectiveStatus).toBe('complete');
  });
});
