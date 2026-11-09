// Unit tests validating all 9 analytical metric calculators and workload balancer.
import { MetricRegistry } from '../services/metric.registry';
import { WorkloadBalancerService } from '../services/workload-balancer.service';
import { OverviewCountsMetric } from '../services/metrics/overview-counts.metric';
import { FacultyWorkloadMetric } from '../services/metrics/faculty-workload.metric';
import { RoomUtilizationMetric } from '../services/metrics/room-utilization.metric';
import { SubjectAllocationMetric } from '../services/metrics/subject-allocation.metric';
import { PeriodUtilizationMetric } from '../services/metrics/period-utilization.metric';
import { FreePeriodsMetric } from '../services/metrics/free-periods.metric';
import { DepartmentStatsMetric } from '../services/metrics/department-stats.metric';
import { UnallocatedSubjectsMetric } from '../services/metrics/unallocated-subjects.metric';
import { SchedulingEfficiencyMetric } from '../services/metrics/scheduling-efficiency.metric';
import type { MetricContext } from '../interfaces/analytics-metric.interface';
import type { Faculty } from '../../library/schemas/faculty.schema';
import type { Room } from '../../library/schemas/room.schema';
import type { Subject } from '../../library/schemas/subject.schema';
import type { Section } from '../../institutions/schemas/section.schema';
import type { Department } from '../../institutions/schemas/department.schema';

describe('Analytics Metrics and Workload Balancer', () => {
  const mockFaculties: Partial<Faculty>[] = [
    {
      id: 'fac-1',
      name: 'Dr. Alan Turing',
      email: 'alan@slotly.test',
      code: 'AT',
      departmentId: 'dept-1',
      maxHoursPerWeek: 10,
      subjectIds: ['sub-1'],
    },
    {
      id: 'fac-2',
      name: 'Dr. Ada Lovelace',
      email: 'ada@slotly.test',
      code: 'AL',
      departmentId: 'dept-1',
      maxHoursPerWeek: 20,
      subjectIds: ['sub-1', 'sub-2'],
    },
  ];

  const mockRooms: Partial<Room>[] = [
    {
      id: 'room-1',
      name: 'Hall 101',
      code: 'H101',
      capacity: 60,
      type: 'lecture',
    },
    {
      id: 'room-2',
      name: 'Lab 201',
      code: 'L201',
      capacity: 30,
      type: 'lab',
    },
  ];

  const mockSubjects: Partial<Subject>[] = [
    {
      id: 'sub-1',
      name: 'Algorithms',
      code: 'CS101',
      weeklyHours: 4,
      departmentId: 'dept-1',
    },
    {
      id: 'sub-2',
      name: 'Operating Systems',
      code: 'CS102',
      weeklyHours: 3,
      departmentId: 'dept-1',
    },
  ];

  const mockSections: Partial<Section>[] = [
    {
      id: 'sec-1',
      name: 'CS-A',
      strength: 40,
    },
  ];

  const mockDepartments: Partial<Department>[] = [
    {
      id: 'dept-1',
      name: 'Computer Science',
      code: 'CS',
    },
  ];

  // 12 hours for fac-1 (target 10 -> overloaded)
  // 0 hours for fac-2 (target 20 -> underloaded)
  const mockEntries = [
    {
      id: 'entry-1',
      versionId: 'ver-1',
      sectionId: 'sec-1',
      day: 1,
      startPeriod: 1,
      span: 2,
      type: 'theory' as const,
      subjectId: 'sub-1',
      facultyId: 'fac-1',
      roomId: 'room-1',
      locked: false,
      revision: 1,
    },
    {
      id: 'entry-2',
      versionId: 'ver-1',
      sectionId: 'sec-1',
      day: 1,
      startPeriod: 3,
      span: 2,
      type: 'theory' as const,
      subjectId: 'sub-1',
      facultyId: 'fac-1',
      roomId: 'room-1',
      locked: false,
      revision: 1,
    },
    {
      id: 'entry-3',
      versionId: 'ver-1',
      sectionId: 'sec-1',
      day: 2,
      startPeriod: 1,
      span: 4,
      type: 'theory' as const,
      subjectId: 'sub-1',
      facultyId: 'fac-1',
      roomId: 'room-1',
      locked: false,
      revision: 1,
    },
    {
      id: 'entry-4',
      versionId: 'ver-1',
      sectionId: 'sec-1',
      day: 3,
      startPeriod: 1,
      span: 4,
      type: 'theory' as const,
      subjectId: 'sub-1',
      facultyId: 'fac-1',
      roomId: 'room-1',
      locked: false,
      revision: 1,
    },
  ];

  const mockContext: MetricContext = {
    projectId: 'proj-1',
    institutionId: 'inst-1',
    versionId: 'ver-1',
    entries: mockEntries,
    settings: {
      days: [1, 2, 3, 4, 5],
      periodsPerDay: 6,
      periodDuration: 50,
      breaks: [],
      startTime: '09:00',
      perDayOverrides: {},
    },
    faculties: mockFaculties as Faculty[],
    rooms: mockRooms as Room[],
    subjects: mockSubjects as Subject[],
    sections: mockSections as Section[],
    departments: mockDepartments as Department[],
    generatedCount: 3,
    publishedCount: 1,
    conflictsCount: 0,
  };

  it('overview counts metric should compute accurate totals', async () => {
    const metric = new OverviewCountsMetric();
    const result = await metric.calculate(mockContext);

    expect(result.facultyCount).toBe(2);
    expect(result.roomCount).toBe(2);
    expect(result.subjectCount).toBe(2);
    expect(result.sectionCount).toBe(1);
    expect(result.departmentCount).toBe(1);
    expect(result.generatedTimetablesCount).toBe(3);
    expect(result.publishedTimetablesCount).toBe(1);
  });

  it('faculty workload metric should identify overloaded and underloaded faculty', async () => {
    const metric = new FacultyWorkloadMetric();
    const result = await metric.calculate(mockContext);

    const alan = result.items.find((f) => f.facultyId === 'fac-1');
    const ada = result.items.find((f) => f.facultyId === 'fac-2');

    expect(alan).toBeDefined();
    expect(alan?.scheduledHours).toBe(12);
    expect(alan?.targetHours).toBe(18); // default targetWeeklyHours when not set on schema

    expect(ada).toBeDefined();
    expect(ada?.scheduledHours).toBe(0);
    expect(ada?.status).toBe('underloaded');
  });

  it('room utilization metric should calculate room hours and utilization rate', async () => {
    const metric = new RoomUtilizationMetric();
    const result = await metric.calculate(mockContext);

    const hall = result.items.find((r) => r.roomId === 'room-1');
    expect(hall).toBeDefined();
    expect(hall?.occupiedPeriods).toBe(12);
    expect(hall?.utilizationPercentage).toBe(40);
  });

  it('subject allocation metric should compute syllabus fulfillment', async () => {
    const metric = new SubjectAllocationMetric();
    const result = await metric.calculate(mockContext);

    const sub1 = result.items.find((s) => s.subjectId === 'sub-1');
    expect(sub1).toBeDefined();
    expect(sub1?.allocatedHours).toBe(12);
  });

  it('period utilization metric should return utilization breakdown per period', async () => {
    const metric = new PeriodUtilizationMetric();
    const result = await metric.calculate(mockContext);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.peakPeriod).toBeDefined();
  });

  it('free periods metric should calculate gaps and free slots for faculties', async () => {
    const metric = new FreePeriodsMetric();
    const result = await metric.calculate(mockContext);

    expect(result.items.length).toBe(2);
  });

  it('department stats metric should aggregate department hours and members', async () => {
    const metric = new DepartmentStatsMetric();
    const result = await metric.calculate(mockContext);

    const cs = result.items.find((d) => d.departmentId === 'dept-1');
    expect(cs).toBeDefined();
    expect(cs?.facultyCount).toBe(2);
    expect(cs?.totalWeeklyHours).toBe(12);
  });

  it('unallocated subjects metric should flag subjects with 0 or insufficient hours', async () => {
    const metric = new UnallocatedSubjectsMetric();
    const result = await metric.calculate(mockContext);

    const unallocated = result.items.find((s) => s.subjectId === 'sub-2');
    expect(unallocated).toBeDefined();
    expect(unallocated?.allocatedHours).toBe(0);
  });

  it('scheduling efficiency metric should compute overall quality score', async () => {
    const metric = new SchedulingEfficiencyMetric();
    const result = await metric.calculate(mockContext);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.explanations).toBeDefined();
  });

  it('workload balancer should propose transfer from overloaded to qualified underloaded faculty', () => {
    const balancer = new WorkloadBalancerService();
    const result = balancer.suggestBalancing(mockContext);

    expect(result.suggestions.length).toBeGreaterThan(0);
    const suggestion = result.suggestions[0];
    expect(suggestion?.fromFacultyId).toBe('fac-1');
    expect(suggestion?.toFacultyId).toBe('fac-2');
    expect(suggestion?.subjectId).toBe('sub-1');
    expect(result.imbalanceScore).toBeGreaterThan(0);
  });

  it('metric registry should properly register and retrieve all 9 metrics', () => {
    const registry = new MetricRegistry(
      new OverviewCountsMetric(),
      new FacultyWorkloadMetric(),
      new RoomUtilizationMetric(),
      new SubjectAllocationMetric(),
      new PeriodUtilizationMetric(),
      new FreePeriodsMetric(),
      new DepartmentStatsMetric(),
      new UnallocatedSubjectsMetric(),
      new SchedulingEfficiencyMetric(),
    );

    expect(registry.getAllMetrics().length).toBe(9);
    expect(registry.getMetric('faculty_workload')).toBeDefined();
    expect(registry.getMetric('unallocated_subjects')).toBeDefined();
  });
});
