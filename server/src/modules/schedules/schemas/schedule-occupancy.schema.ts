// Data schema and persistence model for schedule-occupancy.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { ScheduleResourceType } from '@slotly/contracts';

/** Type alias for schedule occupancy document. */
export type ScheduleOccupancyDocument = ScheduleOccupancy & Document;

/** Class implementing schedule occupancy. */
@Schema({ timestamps: true, collection: 'schedule_occupancies' })
export class ScheduleOccupancy {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, type: String, index: true })
  versionId!: string;

  @Prop({ required: true, type: String })
  resourceType!: ScheduleResourceType;

  @Prop({ required: true, type: String })
  resourceId!: string;

  @Prop({ required: true, type: Number })
  day!: number;

  @Prop({ required: true, type: Number })
  period!: number;

  @Prop({ required: true, type: String, index: true })
  entryId!: string;
}

/** Schema instance generated from schedule occupancy definition. */
export const ScheduleOccupancySchema =
  SchemaFactory.createForClass(ScheduleOccupancy);

// Mandatory compound unique index guaranteeing no resource double booking
ScheduleOccupancySchema.index(
  { versionId: 1, resourceType: 1, resourceId: 1, day: 1, period: 1 },
  { unique: true },
);
ScheduleOccupancySchema.index({ versionId: 1, entryId: 1 });
