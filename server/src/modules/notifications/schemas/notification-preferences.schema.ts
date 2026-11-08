// Mongoose schema and persistence model for user notification channel preferences.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { NotificationType } from '@slotly/contracts';

/** Type alias for notification preferences document. */
export type NotificationPreferencesDocument = NotificationPreferences &
  Document;

/** Entity representing user preferences across communication channels. */
@Schema({ timestamps: true, collection: 'notification_preferences' })
export class NotificationPreferences {
  _id?: string;
  id?: string;

  @Prop({ required: true, unique: true, index: true })
  userId!: string;

  @Prop({ type: Boolean, default: true })
  email!: boolean;

  @Prop({ type: Boolean, default: true })
  inApp!: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  types?: Partial<Record<NotificationType, { inApp: boolean; email: boolean }>>;

  createdAt?: Date;
  updatedAt?: Date;
}

/** Mongoose schema factory for NotificationPreferences entity. */
export const NotificationPreferencesSchema = SchemaFactory.createForClass(
  NotificationPreferences,
);
