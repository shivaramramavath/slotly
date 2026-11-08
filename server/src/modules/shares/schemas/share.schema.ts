// Mongoose schema and persistence model for public and scoped timetable share links.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { ShareScope } from '@slotly/contracts';

/** Type alias for share document. */
export type ShareDocument = Share & Document;

/** Entity representing a tokenized, revocable public share link for a published timetable. */
@Schema({ timestamps: true, collection: 'shares' })
export class Share {
  _id?: string;
  id?: string;

  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, index: true })
  institutionId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, unique: true, index: true })
  tokenHash!: string;

  @Prop({
    type: String,
    enum: ['all', 'section', 'faculty', 'room'],
    default: 'all',
    required: true,
  })
  scope!: ShareScope;

  @Prop({ type: String, default: null })
  targetId?: string | null;

  @Prop({ type: String, default: null })
  label?: string | null;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

/** Mongoose schema factory for Share entity. */
export const ShareSchema = SchemaFactory.createForClass(Share);
