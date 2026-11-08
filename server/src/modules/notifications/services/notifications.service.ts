// Domain service orchestrating notification creation, preference evaluation, delivery, and user inbox management.
import { Injectable, Optional } from '@nestjs/common';
import type {
  NotificationDto,
  NotificationPreferencesDto,
  NotificationType,
  CreateAnnouncementDto,
} from '@slotly/contracts';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import {
  RecipientResolverService,
  RecipientInfo,
} from './recipient-resolver.service';
import { EmailService } from '../../../common/email/email.service';

/** Service coordinating notification storage, preference filtering, push, and email dispatch. */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly prefsRepo: NotificationPreferencesRepository,
    private readonly recipientResolver: RecipientResolverService,
    private readonly gateway: NotificationsGateway,
    @Optional()
    private readonly emailService?: EmailService,
  ) {}

  /** Retrieves user notifications with optional unread filter. */
  async getUserNotifications(
    userId: string,
    unreadOnly = false,
    limit = 50,
  ): Promise<NotificationDto[]> {
    const list = await this.notificationRepo.findByUser(
      userId,
      unreadOnly,
      limit,
    );
    return list.map((n) => ({
      id:
        (n as unknown as { _id?: { toString(): string } })._id?.toString() ||
        n.id ||
        '',
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      read: n.read,
      createdAt: n.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  /** Gets unread notifications count for a user. */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.countUnread(userId);
  }

  /** Marks a specific notification as read. */
  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepo.markAsRead(id, userId);
  }

  /** Marks all notifications as read for a user. */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);
  }

  /** Retrieves notification preferences for a user with sensible defaults. */
  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const prefs = await this.prefsRepo.findByUserId(userId);
    if (!prefs) {
      return {
        email: true,
        inApp: true,
      };
    }
    return {
      email: prefs.email,
      inApp: prefs.inApp,
      types: prefs.types as NotificationPreferencesDto['types'],
    };
  }

  /** Updates user communication channel preferences. */
  async updatePreferences(
    userId: string,
    dto: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const updated = await this.prefsRepo.upsert(userId, dto);
    return {
      email: updated.email,
      inApp: updated.inApp,
      types: updated.types as NotificationPreferencesDto['types'],
    };
  }

  /** Evaluates recipient preferences and delivers notification across in-app and email channels. */
  async dispatchNotification(payload: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    recipients: RecipientInfo[];
  }): Promise<void> {
    for (const recipient of payload.recipients) {
      const prefs = await this.getPreferences(recipient.userId);

      // Check type override first, falling back to global toggle
      const typeOverride = prefs.types?.[payload.type];
      const allowInApp =
        typeOverride?.inApp !== undefined ? typeOverride.inApp : prefs.inApp;
      const allowEmail =
        typeOverride?.email !== undefined ? typeOverride.email : prefs.email;

      // 1. In-App delivery
      if (allowInApp) {
        const doc = await this.notificationRepo.create({
          userId: recipient.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          ...(payload.data ? { data: payload.data } : {}),
          read: false,
        });

        const dto: NotificationDto = {
          id:
            (
              doc as unknown as { _id?: { toString(): string } }
            )._id?.toString() ||
            doc.id ||
            '',
          userId: recipient.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data,
          read: false,
          createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
        };

        this.gateway.emitToUser(recipient.userId, dto);
      }

      // 2. Email delivery via EmailService / BullMQ worker
      if (allowEmail && recipient.email && this.emailService) {
        await this.emailService.send({
          to: recipient.email,
          subject: payload.title,
          textContent: payload.message,
        });
      }
    }
  }

  /** Publishes an administrative announcement across audience and broadcasts via real-time gateway. */
  async dispatchAnnouncement(
    institutionId: string | undefined,
    dto: CreateAnnouncementDto,
  ): Promise<void> {
    const recipients = await this.recipientResolver.resolveForAnnouncement(
      institutionId,
      dto.audience,
    );

    // Broadcast live event on gateway
    this.gateway.broadcastAnnouncement({
      title: dto.title,
      message: dto.message,
      audience: dto.audience,
      createdAt: new Date().toISOString(),
    });

    // Deliver persistent notifications to matched users
    await this.dispatchNotification({
      type: 'announcement',
      title: dto.title,
      message: dto.message,
      data: { audience: dto.audience },
      recipients,
    });
  }
}
