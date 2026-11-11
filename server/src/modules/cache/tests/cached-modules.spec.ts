// Integration test suite for migrated and new module caches verifying hits, misses, and invalidation on writes.
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import { CachedUserRepository } from '../../users/repositories/cached-user.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { LibraryService } from '../../library/services/library.service';
import { TemplateService } from '../../blueprint/services/template.service';

describe('Migrated and New Module Caches (Hit, Miss, Invalidation)', () => {
  let cache: InMemoryCacheService;

  beforeEach(() => {
    cache = new InMemoryCacheService();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('CachedUserRepository (Migrated)', () => {
    it('caches user on findById and invalidates on update', async () => {
      const mockUser = {
        id: 'usr_1',
        email: 'test@slotly.local',
        name: 'User',
      };
      const innerRepo: any = {
        findById: jest.fn().mockResolvedValue(mockUser),
        update: jest
          .fn()
          .mockResolvedValue({ ...mockUser, name: 'Updated User' }),
      };

      const cachedRepo = new CachedUserRepository(innerRepo, cache);

      // 1. Cache Miss -> Loads from innerRepo
      const first = await cachedRepo.findById('usr_1');
      expect(first?.name).toBe('User');
      expect(innerRepo.findById).toHaveBeenCalledTimes(1);

      // 2. Cache Hit -> Served from cache
      const second = await cachedRepo.findById('usr_1');
      expect(second?.name).toBe('User');
      expect(innerRepo.findById).toHaveBeenCalledTimes(1);

      // 3. Invalidation on update
      await cachedRepo.update('usr_1', { name: 'Updated User' });
      expect(await cache.get('slotly:user:usr_1')).toBeNull();
    });
  });

  describe('NotificationsService (Unread Count Cache)', () => {
    it('caches unread count and invalidates when user marks as read', async () => {
      const mockRepo: any = {
        countUnread: jest.fn().mockResolvedValue(5),
        markAsRead: jest.fn().mockResolvedValue({ id: 'notif_1', read: true }),
        markAllAsRead: jest.fn().mockResolvedValue(5),
      };

      const notifService = new NotificationsService(
        mockRepo,
        {} as any,
        {} as any,
        { emitToUser: jest.fn() } as any,
        undefined,
        cache,
      );

      // 1. Miss -> Calls repo
      const count1 = await notifService.getUnreadCount('u100');
      expect(count1).toBe(5);
      expect(mockRepo.countUnread).toHaveBeenCalledTimes(1);

      // 2. Hit -> Served from cache
      const count2 = await notifService.getUnreadCount('u100');
      expect(count2).toBe(5);
      expect(mockRepo.countUnread).toHaveBeenCalledTimes(1);

      // 3. Mark as read invalidates cache
      await notifService.markAsRead('notif_1', 'u100');
      expect(await cache.get('slotly:notifications:unread:u100')).toBeNull();
    });
  });

  describe('LibraryService (Faculty List Cache)', () => {
    it('caches faculty list and invalidates on library changed notification', async () => {
      const mockFaculty = [
        { id: 'f1', name: 'Dr. Smith', institutionId: 'inst_A' },
      ];
      const facultyRepo: any = {
        findByInstitution: jest
          .fn()
          .mockResolvedValue({ items: mockFaculty, total: 1 }),
        findByCode: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockFaculty[0]),
      };

      const eventBus: any = { publish: jest.fn().mockResolvedValue(undefined) };
      const auditService: any = { log: jest.fn().mockResolvedValue(undefined) };

      const libraryService = new LibraryService(
        facultyRepo,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        eventBus,
        auditService,
        cache,
      );

      // 1. Miss
      const res1 = await libraryService.getFacultyList('inst_A');
      expect(res1.items).toHaveLength(1);
      expect(facultyRepo.findByInstitution).toHaveBeenCalledTimes(1);

      // 2. Hit
      const res2 = await libraryService.getFacultyList('inst_A');
      expect(res2.items).toHaveLength(1);
      expect(facultyRepo.findByInstitution).toHaveBeenCalledTimes(1);

      // 3. Invalidation on create
      await libraryService.createFaculty('inst_A', {
        name: 'Dr. Jones',
        code: 'JONES',
        email: 'jones@inst.edu',
        designation: 'Professor',
      } as any);

      expect(
        await cache.get('slotly:institution:inst_A:faculty:list'),
      ).toBeNull();
    });
  });

  describe('TemplateService (Templates List Cache)', () => {
    it('caches templates and invalidates when new template is created', async () => {
      const mockTemplates = [
        { id: 't1', name: 'Standard School', category: 'school', version: 1 },
      ];
      const templateRepo: any = {
        findAvailableTemplates: jest.fn().mockResolvedValue(mockTemplates),
        create: jest.fn().mockResolvedValue(mockTemplates[0]),
        findById: jest.fn().mockResolvedValue(mockTemplates[0]),
      };

      const templateService = new TemplateService(
        templateRepo,
        {} as any,
        {} as any,
        {} as any,
        cache,
      );

      // 1. Miss
      const list1 = await templateService.listTemplates('inst_T');
      expect(list1).toHaveLength(1);
      expect(templateRepo.findAvailableTemplates).toHaveBeenCalledTimes(1);

      // 2. Hit
      const list2 = await templateService.listTemplates('inst_T');
      expect(list2).toHaveLength(1);
      expect(templateRepo.findAvailableTemplates).toHaveBeenCalledTimes(1);

      // 3. Create invalidates
      await templateService.createTemplate(
        {
          name: 'College Template',
          category: 'college',
          subtree: { nodes: [], edges: [] },
        } as any,
        'user_1',
        'inst_T',
      );

      expect(await cache.get('slotly:blueprint-templates:inst_T')).toBeNull();
    });
  });
});
