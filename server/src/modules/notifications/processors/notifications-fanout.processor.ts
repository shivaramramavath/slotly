// Event consumer and domain event fan-out coordinator for system notifications.
import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { EventBus } from '../../../common/events/event-bus.service';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { NotificationsService } from '../services/notifications.service';
import { RecipientResolverService } from '../services/recipient-resolver.service';

/** Coordinator subscribing to domain events to fan out real-time and persistent user notifications. */
@Injectable()
export class NotificationsFanoutProcessor implements OnModuleInit {
  private readonly logger = new Logger(NotificationsFanoutProcessor.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly notificationsService: NotificationsService,
    private readonly recipientResolver: RecipientResolverService,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
  ) {}

  onModuleInit() {
    this.logger.log('Registering notification event handlers on EventBus');

    // 1. Timetable Published event
    this.eventBus.subscribe(
      'timetable.published',
      async (payload: {
        projectId: string;
        versionId: string;
        institutionId?: string;
      }) => {
        this.logger.debug(
          `Received timetable.published for project ${payload.projectId}`,
        );

        // Invalidate viewer cache tag for this project
        try {
          await this.cache.invalidateTag(`project:${payload.projectId}:viewer`);
        } catch (err) {
          this.logger.warn(
            `Failed to invalidate viewer cache for project ${payload.projectId}: ${err}`,
          );
        }

        const recipients = await this.recipientResolver.resolveForEvent(
          'timetable.published',
          payload,
        );

        await this.notificationsService.dispatchNotification({
          type: 'published',
          title: 'Timetable Published',
          message:
            'A new timetable version has been published for your institution.',
          data: { projectId: payload.projectId, versionId: payload.versionId },
          recipients,
        });
      },
    );

    // 2. Timetable Updated event
    this.eventBus.subscribe(
      'timetable.updated',
      async (payload: {
        projectId: string;
        versionId?: string;
        institutionId?: string;
      }) => {
        const recipients = await this.recipientResolver.resolveForEvent(
          'timetable.updated',
          payload,
        );

        await this.notificationsService.dispatchNotification({
          type: 'updated',
          title: 'Timetable Updated',
          message:
            'A published timetable has been updated with recent revisions.',
          data: { projectId: payload.projectId, versionId: payload.versionId },
          recipients,
        });
      },
    );

    // 3. Assignment Changed event
    this.eventBus.subscribe(
      'timetable.assignment_changed',
      async (payload: {
        projectId: string;
        facultyId?: string;
        userId?: string;
        subjectName?: string;
      }) => {
        const recipients = await this.recipientResolver.resolveForEvent(
          'timetable.assignment_changed',
          payload,
        );

        await this.notificationsService.dispatchNotification({
          type: 'assignment_changed',
          title: 'Assignment Updated',
          message: payload.subjectName
            ? `Your teaching assignment for "${payload.subjectName}" has changed.`
            : 'Your teaching schedule assignment has been updated.',
          data: payload,
          recipients,
        });
      },
    );

    // 4. Conflict Found event
    this.eventBus.subscribe(
      'timetable.conflict_found',
      async (payload: {
        projectId: string;
        count?: number;
        userId?: string;
        institutionId?: string;
      }) => {
        const recipients = await this.recipientResolver.resolveForEvent(
          'timetable.conflict_found',
          payload,
        );

        await this.notificationsService.dispatchNotification({
          type: 'conflict_found',
          title: 'Schedule Conflict Detected',
          message: `Detected ${payload.count ?? 1} unresolved conflict(s) in project timetable.`,
          data: payload,
          recipients,
        });
      },
    );

    // 5. Schedule Change event
    this.eventBus.subscribe(
      'timetable.schedule_change',
      async (payload: {
        projectId: string;
        message?: string;
        userIds?: string[];
        institutionId?: string;
      }) => {
        const recipients = await this.recipientResolver.resolveForEvent(
          'timetable.schedule_change',
          payload,
        );

        await this.notificationsService.dispatchNotification({
          type: 'schedule_change',
          title: 'Schedule Change Notice',
          message:
            payload.message || 'A change has been made to scheduled sessions.',
          data: payload,
          recipients,
        });
      },
    );
  }
}
