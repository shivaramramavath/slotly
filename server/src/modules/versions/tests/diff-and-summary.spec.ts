// Unit tests verifying DiffService and ChangeSummaryService deterministic diff computation and readability.
import { DiffService } from '../services/diff.service';
import { ChangeSummaryService } from '../services/change-summary.service';

describe('DiffService & ChangeSummaryService', () => {
  let diffService: DiffService;
  let summaryService: ChangeSummaryService;

  beforeEach(() => {
    summaryService = new ChangeSummaryService();
    diffService = new DiffService(summaryService);
  });

  it('should detect when a slot is moved in time and describe it clearly', () => {
    const leftVersion = {
      id: 'v1',
      score: 95,
      conflicts: [],
      slots: [
        {
          id: 'slot-1',
          sectionId: 'sec-1',
          subjectId: 'sub-ds',
          facultyId: 'fac-1',
          roomId: 'room-101',
          day: 1, // Mon
          startPeriod: 1,
          span: 1,
        },
      ],
    };

    const rightVersion = {
      id: 'v2',
      score: 98,
      conflicts: [],
      slots: [
        {
          id: 'slot-1',
          sectionId: 'sec-1',
          subjectId: 'sub-ds',
          facultyId: 'fac-1',
          roomId: 'room-101',
          day: 3, // Wed
          startPeriod: 3,
          span: 1,
        },
      ],
    };

    const lookups = {
      subjects: { 'sub-ds': 'Data Structures' },
      faculties: { 'fac-1': 'Dr. Smith' },
      rooms: { 'room-101': 'Lab 101' },
    };

    const diff = diffService.compare(leftVersion, rightVersion, lookups);

    expect(diff.leftVersionId).toBe('v1');
    expect(diff.rightVersionId).toBe('v2');
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]?.changes).toEqual([
      {
        field: 'time',
        from: { day: 1, startPeriod: 1, span: 1 },
        to: { day: 3, startPeriod: 3, span: 1 },
      },
    ]);

    expect(diff.summaries).toContain(
      'Data Structures moved from Mon P1 to Wed P3',
    );
    expect(diff.scoreDelta).toEqual({
      fromScore: 95,
      toScore: 98,
      delta: 3,
    });
    expect(diff.summaries).toContain(
      'Timetable score changed from 95 to 98 (+3)',
    );
  });

  it('should detect added and removed slots', () => {
    const leftVersion = {
      id: 'v1',
      slots: [
        {
          id: 'slot-old',
          sectionId: 'sec-1',
          subjectId: 'sub-os',
          day: 4, // Thu
          startPeriod: 4,
          span: 1,
        },
      ],
    };

    const rightVersion = {
      id: 'v2',
      slots: [
        {
          id: 'slot-new',
          sectionId: 'sec-1',
          subjectId: 'sub-algo',
          day: 5, // Fri
          startPeriod: 2,
          span: 1,
        },
      ],
    };

    const lookups = {
      subjects: {
        'sub-os': 'Operating Systems',
        'sub-algo': 'Algorithms',
      },
    };

    const diff = diffService.compare(leftVersion, rightVersion, lookups);

    expect(diff.removed).toHaveLength(1);
    expect(diff.added).toHaveLength(1);
    expect(diff.changed).toHaveLength(0);

    expect(diff.summaries).toContain('Algorithms added at Fri P2');
    expect(diff.summaries).toContain('Operating Systems removed from Thu P4');
  });

  it('should detect faculty and room changes on existing slots', () => {
    const leftVersion = {
      id: 'v1',
      slots: [
        {
          id: 'slot-1',
          sectionId: 'sec-1',
          subjectId: 'sub-algo',
          facultyId: 'fac-smith',
          roomId: 'room-101',
          day: 2,
          startPeriod: 1,
          span: 1,
        },
      ],
    };

    const rightVersion = {
      id: 'v2',
      slots: [
        {
          id: 'slot-1',
          sectionId: 'sec-1',
          subjectId: 'sub-algo',
          facultyId: 'fac-alan',
          roomId: 'room-102',
          day: 2,
          startPeriod: 1,
          span: 1,
        },
      ],
    };

    const lookups = {
      subjects: { 'sub-algo': 'Algorithms' },
      faculties: { 'fac-smith': 'Dr. Smith', 'fac-alan': 'Prof. Alan' },
      rooms: { 'room-101': 'Room 101', 'room-102': 'Room 102' },
    };

    const diff = diffService.compare(leftVersion, rightVersion, lookups);

    expect(diff.changed).toHaveLength(1);
    expect(diff.summaries).toContain(
      'Algorithms faculty changed from Dr. Smith to Prof. Alan',
    );
    expect(diff.summaries).toContain(
      'Algorithms room changed from Room 101 to Room 102',
    );
  });

  it('should calculate faculty workload and conflict deltas accurately', () => {
    const leftVersion = {
      id: 'v1',
      conflicts: [{ severity: 'hard' }, { severity: 'soft' }],
      slots: [
        {
          id: 'slot-1',
          sectionId: 'sec-1',
          facultyId: 'fac-alan',
          day: 1,
          startPeriod: 1,
          span: 2, // 2 periods
        },
      ],
    };

    const rightVersion = {
      id: 'v2',
      conflicts: [{ severity: 'soft' }], // 1 conflict
      slots: [
        {
          id: 'slot-1',
          sectionId: 'sec-1',
          facultyId: 'fac-alan',
          day: 1,
          startPeriod: 1,
          span: 4, // 4 periods
        },
      ],
    };

    const lookups = {
      faculties: { 'fac-alan': 'Prof. Alan' },
    };

    const diff = diffService.compare(leftVersion, rightVersion, lookups);

    expect(diff.workloadDeltas).toEqual([
      {
        facultyId: 'fac-alan',
        facultyName: 'Prof. Alan',
        fromPeriods: 2,
        toPeriods: 4,
        delta: 2,
      },
    ]);
    expect(diff.conflictDelta).toEqual({
      fromCount: 2,
      toCount: 1,
      delta: -1,
    });
    expect(diff.summaries).toContain(
      'Prof. Alan workload increased by 2 periods (2 -> 4)',
    );
    expect(diff.summaries).toContain('Total conflicts decreased by 1 (2 -> 1)');
  });
});
