// NestJS module configuring real-time notifications, persistence, fanout, and announcements.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import {
  NotificationPreferences,
  NotificationPreferencesSchema,
} from './schemas/notification-preferences.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationPreferencesRepository } from './repositories/notification-preferences.repository';
import { RecipientResolverService } from './services/recipient-resolver.service';
import { NotificationsService } from './services/notifications.service';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { NotificationsFanoutProcessor } from './processors/notifications-fanout.processor';
import { NotificationsController } from './controllers/notifications.controller';
import { AnnouncementsController } from './controllers/announcements.controller';
import { EmailModule } from '../../common/email/email.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../../common/events/events.module';
import { CacheModule } from '../../common/cache/cache.module';

/** Module providing comprehensive notification lifecycle, real-time push, preferences, and announcements. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      {
        name: NotificationPreferences.name,
        schema: NotificationPreferencesSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
    EmailModule,
    AuthModule,
    EventsModule,
    CacheModule,
  ],
  controllers: [NotificationsController, AnnouncementsController],
  providers: [
    NotificationRepository,
    NotificationPreferencesRepository,
    RecipientResolverService,
    NotificationsService,
    NotificationsGateway,
    NotificationsFanoutProcessor,
  ],
  exports: [NotificationsService, NotificationRepository, NotificationsGateway],
})
export class NotificationsModule {}
