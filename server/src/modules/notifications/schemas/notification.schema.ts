// Mongoose schema and persistence model for user notifications.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { NotificationType } from '@slotly/contracts';

/** Type alias for notification document. */
export type NotificationDocument = Notification & Document;

/** Entity representing a persistent in-app notification delivered to a user. */
@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  _id?: string;
  id?: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({
    type: String,
    enum: [
      'published',
      'updated',
      'assignment_changed',
      'conflict_found',
      'schedule_change',
      'announcement',
    ],
    required: true,
    index: true,
  })
  type!: NotificationType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  data?: Record<string, unknown> | undefined;

  @Prop({ type: Boolean, default: false, index: true })
  read!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

/** Mongoose schema factory for Notification entity. */
export const NotificationSchema = SchemaFactory.createForClass(Notification);
