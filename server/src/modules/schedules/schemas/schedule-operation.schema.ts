// Data schema and persistence model for schedule-operation.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/** Type alias for schedule operation document. */
export type ScheduleOperationDocument = ScheduleOperation & Document;

/** Class implementing schedule operation. */
@Schema({ timestamps: true, collection: 'schedule_operations' })
export class ScheduleOperation {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, type: String, index: true })
  versionId!: string;

  @Prop({ required: true, type: Number })
  seq!: number;

  @Prop({ required: true, type: String })
  userId!: string;

  @Prop({ required: true, type: String })
  type!: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  forward!: Record<string, unknown>;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  inverse!: Record<string, unknown>;

  @Prop({ required: true, type: Date, default: Date.now })
  at!: Date;
}

/** Schema instance generated from schedule operation definition. */
export const ScheduleOperationSchema =
  SchemaFactory.createForClass(ScheduleOperation);

ScheduleOperationSchema.index({ versionId: 1, seq: 1 }, { unique: true });
