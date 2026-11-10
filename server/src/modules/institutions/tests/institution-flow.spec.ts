// Unit and integration tests verifying institutions controller and service creation flow.
import { Types } from 'mongoose';
import { InstitutionsController } from '../controllers/institutions.controller';
import { DefaultInstitutionsService } from '../services/institutions.service';
import { DependencyCheckerService } from '../services/dependency-checker.service';
import { TreeBuilderService } from '../services/tree-builder.service';
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import type { InstitutionRepository } from '../repositories/institution.repository';
import type { DepartmentRepository } from '../repositories/department.repository';
import type { ProgramRepository } from '../repositories/program.repository';
import type { AcademicYearRepository } from '../repositories/academic-year.repository';
import type { SemesterRepository } from '../repositories/semester.repository';
import type { SectionRepository } from '../repositories/section.repository';
import type { HolidayRepository } from '../repositories/holiday.repository';
import type { EventBus } from '../../../common/events/event-bus.service';
import type { AuditService } from '../../../common/audit/audit.service';
import type { Institution } from '../schemas/institution.schema';
import type { Department } from '../schemas/department.schema';

describe('InstitutionsController & Service - Department Creation Flow', () => {
  let controller: InstitutionsController;
  let service: DefaultInstitutionsService;
  let cache: InMemoryCacheService;

  // In-memory data store simulating database
  let institutionsDb: Institution[] = [];
  let departmentsDb: Department[] = [];

  const mockInstitutionRepo: Partial<InstitutionRepository> = {
    findById: jest.fn(async (id: string) => {
      const found = institutionsDb.find(
        (i) => (i.id === id || i._id?.toString() === id) && !i.isDeleted,
      );
      return found ?? null;
    }),
    findOne: jest.fn(async (filter: Record<string, unknown>) => {
      const found = institutionsDb.find((i) => {
        if (filter.isDeleted !== undefined && i.isDeleted !== filter.isDeleted)
          return false;
        return true;
      });
      return found ?? null;
    }),
    create: jest.fn(async (doc: Partial<Institution>) => {
      const newInst: Institution = {
        _id: new Types.ObjectId(),
        id: undefined,
        name: doc.name!,
        code: doc.code!,
        workingDays: doc.workingDays || [1, 2, 3, 4, 5],
        defaultPeriodConfig: doc.defaultPeriodConfig!,
        isComplete: true,
        isDeleted: false,
      };
      newInst.id = (newInst._id as Types.ObjectId).toString();
      institutionsDb.push(newInst);
      return newInst;
    }),
  };

  const mockDepartmentRepo: Partial<DepartmentRepository> = {
    findByInstitution: jest.fn(async (institutionId: string) => {
      return departmentsDb.filter(
        (d) => d.institutionId.toString() === institutionId && !d.isDeleted,
      );
    }),
    findByCode: jest.fn(async (institutionId: string, code: string) => {
      const found = departmentsDb.find(
        (d) =>
          d.institutionId.toString() === institutionId &&
          d.code === code.toUpperCase().trim() &&
          !d.isDeleted,
      );
      return found ?? null;
    }),
    create: jest.fn(async (doc: Partial<Department>) => {
      const newDept: Department = {
        _id: new Types.ObjectId(),
        id: undefined,
        institutionId: doc.institutionId as Types.ObjectId,
        name: doc.name!,
        code: doc.code!,
        headFacultyId: doc.headFacultyId,
        isDeleted: false,
      };
      newDept.id = (newDept._id as Types.ObjectId).toString();
      departmentsDb.push(newDept);
      return newDept;
    }),
  };

  const mockProgRepo: Partial<ProgramRepository> = {
    findByInstitution: jest.fn(async () => []),
  };
  const mockYearRepo: Partial<AcademicYearRepository> = {
    findByInstitution: jest.fn(async () => []),
  };
  const mockSemRepo: Partial<SemesterRepository> = {
    findByInstitution: jest.fn(async () => []),
  };
  const mockSecRepo: Partial<SectionRepository> = {
    findByInstitution: jest.fn(async () => []),
  };
  const mockHolRepo: Partial<HolidayRepository> = {
    findByInstitution: jest.fn(async () => []),
  };
  const mockEventBus: Partial<EventBus> = {
    publish: jest.fn(async () => {}),
  };
  const mockAuditService: Partial<AuditService> = {
    log: jest.fn(async () => {}),
  };

  beforeEach(() => {
    institutionsDb = [];
    departmentsDb = [];
    cache = new InMemoryCacheService();

    service = new DefaultInstitutionsService(
      mockInstitutionRepo as InstitutionRepository,
      mockDepartmentRepo as DepartmentRepository,
      mockProgRepo as ProgramRepository,
      mockYearRepo as AcademicYearRepository,
      mockSemRepo as SemesterRepository,
      mockSecRepo as SectionRepository,
      mockHolRepo as HolidayRepository,
      new DependencyCheckerService(),
      new TreeBuilderService(),
      cache,
      mockEventBus as EventBus,
      mockAuditService as AuditService,
    );

    controller = new InstitutionsController(
      service,
      mockInstitutionRepo as InstitutionRepository,
      undefined,
      undefined,
    );
  });

  it('creates an institution if none exists, creates a department, and reflects in structure tree', async () => {
    const fakeReq = {
      user: {
        id: 'usr_admin',
        role: 'ADMIN' as const,
        sessionId: 'ses_1',
        institutionId: undefined as string | undefined,
      },
    } as any;

    // 1. Initial getStructure when no institution exists
    const initialStructure = await controller.getStructure(fakeReq);
    expect(initialStructure.institution.name).toBe('Main Campus');
    expect(initialStructure.departments).toHaveLength(0);
    expect(initialStructure.stats.totalDepartments).toBe(0);

    const institutionId = initialStructure.institution.id;
    expect(fakeReq.user.institutionId).toBe(institutionId);

    // 2. Create a department
    const createdDept = await controller.createDepartment(fakeReq, {
      name: 'Computer Science and Engineering',
      code: 'CSE',
    });

    expect(createdDept.name).toBe('Computer Science and Engineering');
    expect(createdDept.code).toBe('CSE');
    expect(createdDept.institutionId).toBe(institutionId);
    expect(createdDept.id).toBeDefined();

    // Verify it is saved in departmentsDb
    expect(departmentsDb).toHaveLength(1);
    expect(departmentsDb[0]?.code).toBe('CSE');

    // 3. getStructure after department creation
    const updatedStructure = await controller.getStructure(fakeReq);
    expect(updatedStructure.departments).toHaveLength(1);
    expect(updatedStructure.departments[0]?.code).toBe('CSE');
    expect(updatedStructure.stats.totalDepartments).toBe(1);

    // 4. listDepartments
    const deptsList = await controller.listDepartments(fakeReq);
    expect(deptsList).toHaveLength(1);
    expect(deptsList[0]?.code).toBe('CSE');
  });
});
