// Unit tests validating recipient resolution, preference filtering, and domain event fan-out.
import { NotificationsService } from '../services/notifications.service';
import { RecipientResolverService } from '../services/recipient-resolver.service';
import { NotificationsFanoutProcessor } from '../processors/notifications-fanout.processor';
import { EventBus } from '../../../common/events/event-bus.service';
import type { NotificationRepository } from '../repositories/notification.repository';
import type { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import type { NotificationsGateway } from '../gateways/notifications.gateway';
import type { EmailService } from '../../../common/email/email.service';
import type { CacheService } from '../../../common/cache/cache.interface';

describe('Notifications Fan-out and Preferences', () => {
  let recipientResolver: RecipientResolverService;
  let notificationsService: NotificationsService;
  let fanoutProcessor: NotificationsFanoutProcessor;
  let eventBus: EventBus;

  let mockUserModel: any;
  let mockNotificationRepo: Partial<jest.Mocked<NotificationRepository>>;
  let mockPrefsRepo: Partial<jest.Mocked<NotificationPreferencesRepository>>;
  let mockGateway: Partial<jest.Mocked<NotificationsGateway>>;
  let mockEmailService: Partial<jest.Mocked<EmailService>>;
  let mockCache: Partial<jest.Mocked<CacheService>>;

  beforeEach(() => {
    mockUserModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { _id: 'user_1', email: 'user1@apex.edu' },
            { _id: 'user_2', email: 'user2@apex.edu' },
          ]),
        }),
      }),
    };

    mockNotificationRepo = {
      create: jest.fn().mockImplementation(
        async (data) =>
          ({
            _id: 'notif_1',
            ...data,
            createdAt: new Date(),
          }) as any,
      ),
      findByUser: jest.fn().mockResolvedValue([]),
      countUnread: jest.fn().mockResolvedValue(0),
      markAsRead: jest.fn().mockResolvedValue(null),
      markAllAsRead: jest.fn().mockResolvedValue(0),
    };

    mockPrefsRepo = {
      findByUserId: jest.fn(),
      upsert: jest.fn(),
    };

    mockGateway = {
      emitToUser: jest.fn(),
      broadcastAnnouncement: jest.fn(),
    };

    mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };

    mockCache = {
      invalidateTag: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      remember: jest.fn(),
    };

    eventBus = new EventBus();

    recipientResolver = new RecipientResolverService(mockUserModel);

    notificationsService = new NotificationsService(
      mockNotificationRepo as any,
      mockPrefsRepo as any,
      recipientResolver,
      mockGateway as any,
      mockEmailService as any,
    );

    fanoutProcessor = new NotificationsFanoutProcessor(
      eventBus,
      notificationsService,
      recipientResolver,
      mockCache as any,
    );
  });

  describe('RecipientResolverService', () => {
    it('should query users by institution and role filters for announcements', async () => {
      const recipients = await recipientResolver.resolveForAnnouncement(
        'inst_123',
        { roles: ['FACULTY', 'STUDENT'] },
      );

      expect(mockUserModel.find).toHaveBeenCalledWith(
        {
          institutionId: 'inst_123',
          role: { $in: ['FACULTY', 'STUDENT'] },
        },
        { _id: 1, email: 1 },
      );
      expect(recipients).toHaveLength(2);
      expect(recipients[0]?.userId).toBe('user_1');
    });

    it('should resolve direct recipients from event payload', async () => {
      const recipients = await recipientResolver.resolveForEvent(
        'timetable.assignment_changed',
        { userIds: ['user_target_1'] },
      );

      expect(mockUserModel.find).toHaveBeenCalledWith(
        { _id: { $in: ['user_target_1'] } },
        { _id: 1, email: 1 },
      );
      expect(recipients).toHaveLength(2);
    });
  });

  describe('Preference Filtering', () => {
    it('should deliver to both in-app and email when both are enabled', async () => {
      mockPrefsRepo.findByUserId!.mockResolvedValue({
        userId: 'user_1',
        inApp: true,
        email: true,
      } as any);

      await notificationsService.dispatchNotification({
        type: 'published',
        title: 'Timetable Published',
        message: 'Spring 2026 is out.',
        recipients: [{ userId: 'user_1', email: 'user1@apex.edu' }],
      });

      expect(mockNotificationRepo.create).toHaveBeenCalled();
      expect(mockGateway.emitToUser).toHaveBeenCalledWith(
        'user_1',
        expect.objectContaining({ title: 'Timetable Published' }),
      );
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: 'user1@apex.edu',
        subject: 'Timetable Published',
        textContent: 'Spring 2026 is out.',
      });
    });

    it('should suppress in-app and send only email when inApp is disabled', async () => {
      mockPrefsRepo.findByUserId!.mockResolvedValue({
        userId: 'user_1',
        inApp: false,
        email: true,
      } as any);

      await notificationsService.dispatchNotification({
        type: 'published',
        title: 'Timetable Published',
        message: 'Spring 2026 is out.',
        recipients: [{ userId: 'user_1', email: 'user1@apex.edu' }],
      });

      expect(mockNotificationRepo.create).not.toHaveBeenCalled();
      expect(mockGateway.emitToUser).not.toHaveBeenCalled();
      expect(mockEmailService.send).toHaveBeenCalled();
    });

    it('should respect per-type preference override over global channel toggle', async () => {
      // Global email is true, but conflict_found email override is false
      mockPrefsRepo.findByUserId!.mockResolvedValue({
        userId: 'user_1',
        inApp: true,
        email: true,
        types: {
          conflict_found: { inApp: true, email: false },
        },
      } as any);

      await notificationsService.dispatchNotification({
        type: 'conflict_found',
        title: 'Conflict Found',
        message: 'Room overlap',
        recipients: [{ userId: 'user_1', email: 'user1@apex.edu' }],
      });

      expect(mockNotificationRepo.create).toHaveBeenCalled();
      expect(mockGateway.emitToUser).toHaveBeenCalled();
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });
  });

  describe('FanoutProcessor Event Subscription', () => {
    it('should invalidate viewer cache tag and dispatch notifications on timetable.published', async () => {
      fanoutProcessor.onModuleInit();

      const dispatchSpy = jest
        .spyOn(notificationsService, 'dispatchNotification')
        .mockResolvedValue(undefined);

      await eventBus.publish('timetable.published', {
        projectId: 'proj_999',
        versionId: 'ver_pub_1',
        institutionId: 'inst_1',
      });

      expect(mockCache.invalidateTag).toHaveBeenCalledWith(
        'project:proj_999:viewer',
      );
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'published',
          title: 'Timetable Published',
          data: { projectId: 'proj_999', versionId: 'ver_pub_1' },
        }),
      );
    });
  });
});
