import { ImpactAnalyzerService } from '../services/impact-analyzer.service';
import type { BlueprintNodeDto } from '@slotly/contracts';

describe('G4: ImpactAnalyzerService', () => {
  const analyzer = new ImpactAnalyzerService();

  it('should compute full cascade of descendants and subject assignments', () => {
    const nodes: BlueprintNodeDto[] = [
      {
        id: 'inst_1',
        projectId: 'p1',
        type: 'institution',
        parentId: null,
        position: { x: 0, y: 0 },
        data: {},
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
        position: { x: 0, y: 0 },
        data: {},
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
        position: { x: 0, y: 0 },
        data: {},
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
        parentId: 'prog_1',
        position: { x: 0, y: 0 },
        data: {},
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'sub_1',
        projectId: 'p1',
        type: 'subjectAssignment',
        parentId: 'sec_1',
        position: { x: 0, y: 0 },
        data: {},
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
    ];

    // Deleting department should impact program, section, and subject
    const impact = analyzer.analyze('dept_1', nodes);

    expect(impact.descendantsCount).toBe(3);
    expect(impact.descendantNodeIds).toEqual(
      expect.arrayContaining(['prog_1', 'sec_1', 'sub_1']),
    );
    expect(impact.subjectAssignmentsCount).toBe(1);
    expect(impact.affectedBuildsCount).toBe(1);
  });
});
