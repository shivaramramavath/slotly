// Data schema and persistence model for schedule-entry.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { SlotType } from '@slotly/contracts';

/** Type alias for schedule entry document. */
export type ScheduleEntryDocument = ScheduleEntry & Document;

/** Class implementing schedule entry. */
@Schema({ timestamps: true, collection: 'schedule_entries' })
export class ScheduleEntry {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, type: String, index: true })
  versionId!: string;

  @Prop({ required: true, type: String, index: true })
  sectionId!: string;

  @Prop({ type: String, required: false })
  batchId?: string | undefined;

  @Prop({ required: true, type: Number })
  day!: number;

  @Prop({ required: true, type: Number })
  startPeriod!: number;

  @Prop({ required: true, type: Number, default: 1 })
  span!: number;

  @Prop({ required: true, type: String })
  type!: SlotType;

  @Prop({ type: String, required: false, index: true })
  subjectId?: string | undefined;

  @Prop({ type: String, required: false, index: true })
  facultyId?: string | undefined;

  @Prop({ type: String, required: false, index: true })
  roomId?: string | undefined;

  @Prop({ required: true, type: Boolean, default: false })
  locked!: boolean;

  @Prop({ required: true, type: Number, default: 1 })
  revision!: number;
}

/** Schema instance generated from schedule entry definition. */
export const ScheduleEntrySchema = SchemaFactory.createForClass(ScheduleEntry);

ScheduleEntrySchema.index({
  versionId: 1,
  sectionId: 1,
  day: 1,
  startPeriod: 1,
});
ScheduleEntrySchema.index({
  versionId: 1,
  facultyId: 1,
  day: 1,
  startPeriod: 1,
});
ScheduleEntrySchema.index({ versionId: 1, roomId: 1, day: 1, startPeriod: 1 });
