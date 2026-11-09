// Unit tests verifying projects service logic and blueprint progress calculation from Redis cache.
import { ProjectsService } from '../services/projects.service';
import { ProjectDtoSchema } from '@slotly/contracts';
import type { CachedProjectRepository } from '../repositories/cached-project.repository';
import type { CachedBlueprintRepository } from '../../blueprint/repositories/cached-blueprint.repository';
import type { TemplateService } from '../../blueprint/services/template.service';
import type { GraphFromInstitutionBuilder } from '../../blueprint/services/graph-from-institution.builder';
import type { InstitutionsService } from '../../institutions/services/institutions.service';
import type { AuditService } from '../../../common/audit/audit.service';
import type { CacheService } from '../../../common/cache/cache.interface';

describe('ProjectsService - blueprintProgress calculation', () => {
  let service: ProjectsService;
  let mockProjectRepo: Partial<CachedProjectRepository>;
  let mockCache: Partial<CacheService>;

  const sampleProject = {
    _id: 'proj_123',
    id: 'proj_123',
    institutionId: 'inst_abc',
    ownerId: 'user_xyz',
    name: 'Fall Term 2026',
    term: { kind: 'odd', startDate: '2026-08-01', endDate: '2026-12-20' },
    status: 'draft',
    settings: {
      days: [1, 2, 3, 4, 5],
      periodsPerDay: 7,
      periodDuration: 50,
      startTime: '09:00',
      breaks: [],
    },
    strictness: 'strict',
    revision: 1,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-02T00:00:00Z'),
  };

  beforeEach(() => {
    mockProjectRepo = {
      findProjects: jest.fn().mockResolvedValue({
        items: [sampleProject],
        total: 1,
      }),
    };

    mockCache = {
      get: jest.fn(),
    };

    service = new ProjectsService(
      mockProjectRepo as CachedProjectRepository,
      {} as CachedBlueprintRepository,
      {} as TemplateService,
      {} as GraphFromInstitutionBuilder,
      {} as InstitutionsService,
      { log: jest.fn() } as unknown as AuditService,
      undefined,
      mockCache as CacheService,
    );
  });

  it('populates blueprintProgress from cached readiness data when available', async () => {
    (mockCache.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'slotly:blueprint:proj_123:readiness') {
        return Promise.resolve({ percentComplete: 75 });
      }
      return Promise.resolve(null);
    });

    const result = await service.findProjects();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.blueprintProgress).toBe(75);

    // Validate with Zod schema
    const parsed = ProjectDtoSchema.parse(result.items[0]);
    expect(parsed.blueprintProgress).toBe(75);
  });

  it('computes blueprintProgress from cached blueprint graph nodes if readiness key is missing', async () => {
    (mockCache.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'slotly:blueprint:proj_123') {
        return Promise.resolve({
          nodes: [
            { id: 'node_1', status: 'complete' },
            { id: 'node_2', status: 'complete' },
            { id: 'node_3', status: 'incomplete' },
            { id: 'node_4', status: 'incomplete' },
          ],
        });
      }
      return Promise.resolve(null);
    });

    const result = await service.findProjects();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.blueprintProgress).toBe(50);
  });

  it('returns blueprintProgress as null when neither is present in Redis without database queries', async () => {
    (mockCache.get as jest.Mock).mockResolvedValue(null);

    const result = await service.findProjects();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.blueprintProgress).toBeNull();

    const parsed = ProjectDtoSchema.parse(result.items[0]);
    expect(parsed.blueprintProgress).toBeNull();
  });
});
