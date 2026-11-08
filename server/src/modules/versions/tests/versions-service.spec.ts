// Unit tests verifying VersionsService duplication, restoration, labeling, and quality rating features.
import { VersionsService } from '../services/versions.service';
import { ConflictException } from '@nestjs/common';
import type { IScheduleVersionRepository } from '../../builds/repositories/schedule-version.repository.interface';
import type { ScheduleEntryRepository } from '../../schedules/repositories/schedule-entry.repository';
import type { ScheduleOccupancyRepository } from '../../schedules/repositories/schedule-occupancy.repository';
import type { TimetableRatingRepository } from '../repositories/timetable-rating.repository';
import type { DiffService } from '../services/diff.service';
import type { Model } from 'mongoose';
import type { ProjectDocument } from '../../projects/schemas/project.schema';
import type { ScheduleVersionDto } from '@slotly/contracts';
import type { TimetableRating } from '../schemas/timetable-rating.schema';

describe('VersionsService', () => {
  let service: VersionsService;
  let versionRepoMock: Partial<IScheduleVersionRepository>;
  let diffServiceMock: Partial<DiffService>;
  let entryRepoMock: Partial<ScheduleEntryRepository>;
  let occupancyRepoMock: Partial<ScheduleOccupancyRepository>;
  let ratingRepoMock: Partial<TimetableRatingRepository>;
  let projectModelMock: Partial<Model<ProjectDocument>>;

  const mockVersion1: ScheduleVersionDto = {
    id: 'v_1',
    projectId: 'proj_1',
    versionNo: 1,
    label: 'Term 1 Baseline',
    status: 'ready',
    score: 90,
    conflicts: [],
    stats: {
      totalSlots: 0,
      occupiedSlots: 0,
      roomUtilizationPct: 0,
      facultyLoadBalanceScore: 0,
      afternoonLabPct: 0,
    },
    slots: [],
    revision: 1,
    kind: 'auto',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    versionRepoMock = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'v_1') return Promise.resolve(mockVersion1);
        if (id === 'v_pub')
          return Promise.resolve({
            ...mockVersion1,
            id: 'v_pub',
            status: 'published',
          });
        return Promise.resolve(null);
      }),
      findByProjectId: jest.fn().mockResolvedValue([mockVersion1]),
      create: jest
        .fn()
        .mockImplementation((data: Partial<ScheduleVersionDto>) =>
          Promise.resolve({
            ...mockVersion1,
            id: 'v_new',
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        ),
      update: jest
        .fn()
        .mockImplementation((id: string, data: Partial<ScheduleVersionDto>) =>
          Promise.resolve({ ...mockVersion1, id, ...data }),
        ),
    };

    entryRepoMock = {
      findByVersion: jest.fn().mockResolvedValue([
        {
          _id: 'e1',
          versionId: 'v_1',
          sectionId: 'sec_1',
          day: 1,
          startPeriod: 1,
          span: 1,
          type: 'theory',
          revision: 1,
          locked: false,
        },
      ]),
      createMany: jest.fn().mockResolvedValue([]),
    };

    occupancyRepoMock = {
      findByVersion: jest.fn().mockResolvedValue([
        {
          versionId: 'v_1',
          resourceType: 'FACULTY',
          resourceId: 'fac_1',
          day: 1,
          period: 1,
          entryId: 'e1',
        },
      ]),
      createMany: jest.fn().mockResolvedValue([]),
    };

    ratingRepoMock = {
      create: jest.fn().mockImplementation((data: Partial<TimetableRating>) =>
        Promise.resolve({
          _id: 'r_1',
          ...data,
          createdAt: new Date(),
        } as TimetableRating),
      ),
      findByVersionId: jest.fn().mockResolvedValue([
        {
          _id: 'r_1',
          versionId: 'v_1',
          projectId: 'proj_1',
          userId: 'user_1',
          rating: 5,
          comment: 'Great schedule',
          createdAt: new Date(),
        } as TimetableRating,
      ]),
    };

    diffServiceMock = {
      compare: jest.fn(),
    };

    projectModelMock = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            id: 'proj_1',
            institutionId: 'inst_1',
          }),
        }),
      }),
    };

    service = new VersionsService(
      versionRepoMock as IScheduleVersionRepository,
      diffServiceMock as DiffService,
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
      ratingRepoMock as TimetableRatingRepository,
      projectModelMock as Model<ProjectDocument>,
    );
  });

  it('should duplicate a version into a new draft with incremented version number and copied entries', async () => {
    const res = await service.duplicateVersion('v_1', 'user_1');

    expect(res).toBeDefined();
    expect(res.id).toBe('v_new');
    expect(res.versionNo).toBe(2);
    expect(res.status).toBe('draft');
    expect(res.label).toContain('Draft Revision 2');

    // Cloned entries and occupancies
    expect(entryRepoMock.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        versionId: 'v_new',
        sectionId: 'sec_1',
        day: 1,
      }),
    ]);
    expect(occupancyRepoMock.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        versionId: 'v_new',
        resourceType: 'FACULTY',
      }),
    ]);
  });

  it('should restore an older version as a new draft revision', async () => {
    const res = await service.restoreVersion(
      'v_1',
      'user_1',
      'Restored Baseline',
    );

    expect(res).toBeDefined();
    expect(res.versionNo).toBe(2);
    expect(res.label).toBe('Restored Baseline');
  });

  it('should update label for an editable version but reject renaming a published version', async () => {
    const updated = await service.updateLabel('v_1', {
      label: 'Updated Label',
    });
    expect(updated.label).toBe('Updated Label');

    await expect(
      service.updateLabel('v_pub', { label: 'Illegal Rename' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should submit quality rating and retrieve ratings list', async () => {
    const ratingRes = await service.rateVersion('v_1', 'user_reviewer', {
      rating: 5,
      comment: 'Very balanced timetable',
      categories: { workload: 5, roomFit: 4 },
    });

    expect(ratingRes.rating).toBe(5);
    expect(ratingRes.comment).toBe('Very balanced timetable');
    expect(ratingRepoMock.create).toHaveBeenCalled();

    const ratingsList = await service.getRatings('v_1');
    expect(ratingsList).toHaveLength(1);
    expect(ratingsList[0]?.rating).toBe(5);
  });
});
