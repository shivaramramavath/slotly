import { ConstraintResolverService } from '../services/constraint-resolver.service';
import type { BlueprintNodeDto } from '@slotly/contracts';

describe('G9: ConstraintResolverService (Constraint Inheritance)', () => {
  const resolver = new ConstraintResolverService();

  it('should inherit constraints from ancestors and override lower down', () => {
    const nodes: BlueprintNodeDto[] = [
      {
        id: 'inst_1',
        projectId: 'p1',
        type: 'institution',
        parentId: null,
        position: { x: 0, y: 0 },
        data: {},
        constraints: {
          maxDailyLectures: 6,
          allowConsecutivePeriods: false,
          startTime: '09:00',
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
        position: { x: 0, y: 0 },
        data: {},
        constraints: {
          // Department overrides allowConsecutivePeriods
          allowConsecutivePeriods: true,
          departmentPrefDay: 'Wednesday',
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
        parentId: 'dept_1',
        position: { x: 0, y: 0 },
        data: {},
        constraints: {
          // Section overrides maxDailyLectures
          maxDailyLectures: 5,
        },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
    ];

    const secNode = nodes.find((n) => n.id === 'sec_1')!;
    const effective = resolver.effectiveConstraints(secNode, nodes);

    // Should inherit startTime from institution
    expect(effective['startTime']).toBe('09:00');
    // Should inherit departmentPrefDay from department
    expect(effective['departmentPrefDay']).toBe('Wednesday');
    // Should have department override of allowConsecutivePeriods
    expect(effective['allowConsecutivePeriods']).toBe(true);
    // Should have section override of maxDailyLectures
    expect(effective['maxDailyLectures']).toBe(5);
  });
});
