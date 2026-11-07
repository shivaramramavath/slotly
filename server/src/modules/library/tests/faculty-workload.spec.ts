import { FacultyWorkloadService } from '../services/faculty-workload.service';
import { Faculty } from '../schemas/faculty.schema';
import { Subject } from '../schemas/subject.schema';

describe('FacultyWorkloadService', () => {
  let service: FacultyWorkloadService;

  beforeEach(() => {
    service = new FacultyWorkloadService();
  });

  const baseFaculty: Faculty = {
    id: 'fac-1',
    institutionId: 'inst-1',
    departmentId: 'dept-1',
    name: 'Prof. Grace Hopper',
    email: 'grace@slotly.edu',
    code: 'HOP',
    designation: 'Professor',
    availability: [],
    preferredPeriods: [],
    unavailableSlots: [],
    minHoursPerWeek: 6,
    maxHoursPerDay: 4,
    maxHoursPerWeek: 16,
    subjectIds: ['sub-1', 'sub-2'],
    archived: false,
    isDeleted: false,
  };

  const createSubject = (hours: number, lab = 0): Subject => ({
    institutionId: 'inst-1',
    departmentId: 'dept-1',
    programIds: [],
    code: 'CS',
    name: 'CompSci',
    credits: 3,
    type: 'theory',
    weeklyHours: hours,
    labHours: lab,
    consecutivePeriods: 1,
    preferredDays: [],
    requirements: { roomType: 'lecture', minCapacity: 30, equipment: [] },
    enrollment: 30,
    dependsOn: [],
    isElective: false,
    facultyIds: ['fac-1'],
    archived: false,
    isDeleted: false,
  });

  it('should mark status as under when assigned hours are less than minHoursPerWeek', () => {
    const subjects = [createSubject(3)]; // 3 hours < min 6
    const workload = service.computeWorkload(baseFaculty, subjects);

    expect(workload.assignedHours).toBe(3);
    expect(workload.status).toBe('under');
    expect(workload.percentage).toBe(19); // 3 / 16
  });

  it('should mark status as optimal when assigned hours are within limits', () => {
    const subjects = [createSubject(4), createSubject(4)]; // 8 hours
    const workload = service.computeWorkload(baseFaculty, subjects);

    expect(workload.assignedHours).toBe(8);
    expect(workload.status).toBe('optimal');
    expect(workload.percentage).toBe(50);
  });

  it('should mark status as near when assigned hours reach >= 85% of max', () => {
    const subjects = [createSubject(5), createSubject(5), createSubject(4)]; // 14 hours >= 13.6 (85% of 16)
    const workload = service.computeWorkload(baseFaculty, subjects);

    expect(workload.assignedHours).toBe(14);
    expect(workload.status).toBe('near');
    expect(workload.percentage).toBe(88);
  });

  it('should mark status as over when assigned hours exceed maxHoursPerWeek', () => {
    const subjects = [createSubject(6), createSubject(6), createSubject(6)]; // 18 hours > 16
    const workload = service.computeWorkload(baseFaculty, subjects);

    expect(workload.assignedHours).toBe(18);
    expect(workload.status).toBe('over');
    expect(workload.percentage).toBe(113);
  });
});
