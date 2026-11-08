// Data schema and persistence model for timetable publish requests.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { PublishRequestStatus } from '@slotly/contracts';

/** Type alias for publish request document. */
export type PublishRequestDocument = PublishRequest & Document;

/** Class implementing publish request entity. */
@Schema({ timestamps: true, collection: 'publish_requests' })
export class PublishRequest {
  _id?: string;
  id?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ScheduleVersion',
    required: true,
    index: true,
  })
  versionId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  requestedBy!: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  })
  status!: PublishRequestStatus;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  reviewer?: string | null;

  @Prop({ type: String, default: null })
  comment?: string | null;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

/** Mongoose schema factory for publish request. */
export const PublishRequestSchema =
  SchemaFactory.createForClass(PublishRequest);

PublishRequestSchema.index({ projectId: 1, status: 1 });
PublishRequestSchema.index({ versionId: 1 });
