// Data schema and persistence model for user and institution feedback items.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { FeedbackType, FeedbackStatus } from '@slotly/contracts';

/** Type alias for feedback document. */
export type FeedbackDocument = Feedback & Document;

/** Mongoose schema representing user-submitted feedback, issue reports, and ratings. */
@Schema({ timestamps: true, collection: 'feedback' })
export class Feedback {
  id?: string;
  _id?: unknown;

  @Prop({ required: true, type: String, index: true })
  userId!: string;

  @Prop({ required: true, type: String, trim: true })
  userName!: string;

  @Prop({ required: true, type: String, trim: true })
  userEmail!: string;

  @Prop({ type: String, required: false, index: true })
  institutionId?: string;

  @Prop({
    type: String,
    enum: ['rating', 'idea', 'problem', 'general'],
    required: true,
    index: true,
  })
  type!: FeedbackType;

  @Prop({ required: true, type: String, trim: true })
  message!: string;

  @Prop({ type: Number, required: false, min: 1, max: 5 })
  rating?: number;

  @Prop({ type: String, required: false, index: true })
  projectId?: string;

  @Prop({ type: String, required: false, index: true })
  versionId?: string;

  @Prop({
    type: String,
    enum: ['open', 'in_review', 'resolved', 'dismissed'],
    default: 'open',
    index: true,
  })
  status!: FeedbackStatus;

  @Prop({ type: String, required: false, trim: true })
  adminReply?: string;

  @Prop({ type: String, required: false, index: true })
  repliedBy?: string;

  @Prop({ type: String, required: false })
  repliedAt?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

/** Factory generating Mongoose schema for Feedback. */
export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });
