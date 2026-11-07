import { LibraryService } from '../services/library.service';
import type { FacultyRepository } from '../repositories/faculty.repository';
import type { SubjectRepository } from '../repositories/subject.repository';
import type { RoomRepository } from '../repositories/room.repository';
import type { ElectiveGroupRepository } from '../repositories/elective-group.repository';
import type { IRoomMatcher } from '../strategies/room-matcher.strategy';
import type { IFacultyQualifier } from '../strategies/faculty-qualifier.strategy';
import type { CacheService } from '../../../common/cache/cache.interface';
import { FacultyWorkloadService } from '../services/faculty-workload.service';
import { LibraryImportService } from '../services/library-import.service';
import { EventBus } from '../../../common/events/event-bus.service';
import { AuditService } from '../../../common/audit/audit.service';

describe('LibraryService - getCounts', () => {
  let service: LibraryService;
  let facultyRepo: jest.Mocked<Partial<FacultyRepository>>;
  let subjectRepo: jest.Mocked<Partial<SubjectRepository>>;
  let roomRepo: jest.Mocked<Partial<RoomRepository>>;
  let cache: jest.Mocked<Partial<CacheService>>;

  beforeEach(() => {
    facultyRepo = {
      findByInstitution: jest.fn().mockResolvedValue({ items: [], total: 15 }),
    };
    subjectRepo = {
      findByInstitution: jest.fn().mockResolvedValue({ items: [], total: 28 }),
    };
    roomRepo = {
      findByInstitution: jest.fn().mockResolvedValue({ items: [], total: 10 }),
    };

    cache = {
      remember: jest.fn().mockImplementation(async (_key, _ttl, loader) => {
        return (loader as () => Promise<unknown>)();
      }),
    };

    const electiveRepo = {} as ElectiveGroupRepository;
    const roomMatcher = {} as IRoomMatcher;
    const facultyQualifier = {} as IFacultyQualifier;
    const workloadService = {} as FacultyWorkloadService;
    const importService = {} as LibraryImportService;
    const eventBus = { publish: jest.fn() } as unknown as EventBus;
    const auditService = { log: jest.fn() } as unknown as AuditService;

    service = new LibraryService(
      facultyRepo as FacultyRepository,
      subjectRepo as SubjectRepository,
      electiveRepo,
      roomRepo as RoomRepository,
      roomMatcher,
      facultyQualifier,
      workloadService,
      importService,
      eventBus,
      auditService,
      cache as CacheService,
    );
  });

  it('computes counts across faculty, subjects, and rooms with filters and passes library:{institutionId} tag to cache', async () => {
    const institutionId = 'inst-123';
    const counts = await service.getCounts(institutionId, {
      departmentId: 'dept-cse',
      archived: false,
    });

    expect(counts).toEqual({
      faculty: 15,
      subjects: 28,
      rooms: 10,
    });

    // Check repository calls
    expect(facultyRepo.findByInstitution).toHaveBeenCalledWith(institutionId, {
      departmentId: 'dept-cse',
      archived: false,
      limit: 1,
    });
    expect(subjectRepo.findByInstitution).toHaveBeenCalledWith(institutionId, {
      departmentId: 'dept-cse',
      archived: false,
      limit: 1,
    });
    expect(roomRepo.findByInstitution).toHaveBeenCalledWith(institutionId, {
      departmentId: 'dept-cse',
      archived: false,
      limit: 1,
    });

    // Check cache.remember with tag
    expect(cache.remember).toHaveBeenCalledWith(
      'slotly:library:counts:inst-123:dept-cse:false',
      3600,
      expect.any(Function),
      ['library:inst-123'],
    );
  });

  it('uses default all when departmentId and archived filters are omitted', async () => {
    const institutionId = 'inst-456';
    const counts = await service.getCounts(institutionId);

    expect(counts).toEqual({
      faculty: 15,
      subjects: 28,
      rooms: 10,
    });

    expect(cache.remember).toHaveBeenCalledWith(
      'slotly:library:counts:inst-456:all:all',
      3600,
      expect.any(Function),
      ['library:inst-456'],
    );
  });
});
