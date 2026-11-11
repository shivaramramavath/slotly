// Unit tests covering library hover peek endpoint for faculty, subjects, and rooms.
import { LibraryService } from '../services/library.service';
import type { FacultyRepository } from '../repositories/faculty.repository';
import type { SubjectRepository } from '../repositories/subject.repository';
import type { RoomRepository } from '../repositories/room.repository';
import type { FacultyWorkloadService } from '../services/faculty-workload.service';
import type { CacheService } from '../../../common/cache/cache.interface';

describe('Library Hover Peek Endpoint (Pass A)', () => {
  let service: LibraryService;
  let mockFacultyRepo: jest.Mocked<Partial<FacultyRepository>>;
  let mockSubjectRepo: jest.Mocked<Partial<SubjectRepository>>;
  let mockRoomRepo: jest.Mocked<Partial<RoomRepository>>;
  let mockWorkloadService: jest.Mocked<Partial<FacultyWorkloadService>>;
  let mockCacheService: jest.Mocked<Partial<CacheService>>;

  beforeEach(() => {
    mockFacultyRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'fac_1',
        name: 'Alan Turing',
        code: 'AT',
        departmentId: 'dept_cs',
        designation: 'Professor',
        maxHoursPerWeek: 20,
        availability: [
          [true, true, true],
          [true, true, true],
        ],
      } as any),
      findByInstitution: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'fac_1',
            name: 'Alan Turing',
            subjectIds: ['sub_1'],
            archived: false,
            isDeleted: false,
          },
        ],
        total: 1,
      } as any),
    };

    mockSubjectRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'sub_1',
        name: 'Theory of Computation',
        code: 'CS301',
        type: 'theory',
        weeklyHours: 4,
        credits: 4,
        institutionId: 'inst_1',
      } as any),
      findByIds: jest.fn().mockResolvedValue([]),
    };

    mockRoomRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'room_1',
        name: 'Turing Auditorium',
        code: 'AUD-01',
        type: 'lecture',
        capacity: 120,
        building: 'CS Block',
        equipment: ['Projector', 'Audio System'],
      } as any),
    };

    mockWorkloadService = {
      computeWorkload: jest.fn().mockReturnValue({
        assignedHours: 12,
        status: 'optimal',
      } as any),
    };

    mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    service = new LibraryService(
      mockFacultyRepo as any,
      mockSubjectRepo as any,
      {} as any,
      mockRoomRepo as any,
      {} as any,
      {} as any,
      mockWorkloadService as any,
      {} as any,
      {} as any,
      {} as any,
      mockCacheService as any,
    );
  });

  it('returns small read-only hover peek for faculty with workload and availability grid', async () => {
    const peek = await service.getPeek('faculty', 'fac_1');
    expect(peek.type).toBe('faculty');
    if (peek.type === 'faculty') {
      expect(peek.name).toBe('Alan Turing');
      expect(peek.designation).toBe('Professor');
      expect(peek.workloadUsed).toBe(12);
      expect(peek.maxWorkload).toBe(20);
      expect(peek.availability.length).toBe(2);
    }
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'slotly:library:peek:faculty:fac_1',
      peek,
      300,
    );
  });

  it('returns hover peek for subject with qualified faculty count', async () => {
    const peek = await service.getPeek('subjects', 'sub_1');
    expect(peek.type).toBe('subject');
    if (peek.type === 'subject') {
      expect(peek.name).toBe('Theory of Computation');
      expect(peek.code).toBe('CS301');
      expect(peek.weeklyHours).toBe(4);
      expect(peek.credits).toBe(4);
      expect(peek.qualifiedFacultyCount).toBe(1);
    }
  });

  it('returns hover peek for room with capacity and equipment', async () => {
    const peek = await service.getPeek('rooms', 'room_1');
    expect(peek.type).toBe('room');
    if (peek.type === 'room') {
      expect(peek.name).toBe('Turing Auditorium');
      expect(peek.capacity).toBe(120);
      expect(peek.equipment).toContain('Projector');
    }
  });
});
