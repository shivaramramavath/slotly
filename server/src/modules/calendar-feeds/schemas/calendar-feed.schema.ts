// Mongoose schema and persistence model for calendar feed subscriptions.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { ViewerEntityType } from '@slotly/contracts';

/** Type alias for calendar feed document. */
export type CalendarFeedDocument = CalendarFeed & Document;

/** Entity representing a tokenized revocable calendar feed subscription. */
@Schema({ timestamps: true, collection: 'calendar_feeds' })
export class CalendarFeed {
  _id?: string;
  id?: string;

  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, index: true })
  institutionId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({
    type: String,
    enum: ['faculty', 'section', 'room', 'subject'],
    required: true,
  })
  entityType!: ViewerEntityType;

  @Prop({ required: true, index: true })
  entityId!: string;

  @Prop({ required: true, unique: true, index: true })
  tokenHash!: string;

  @Prop({ type: String, default: null })
  label?: string | null;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  lastAccessedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

/** Mongoose schema factory for CalendarFeed. */
export const CalendarFeedSchema = SchemaFactory.createForClass(CalendarFeed);
