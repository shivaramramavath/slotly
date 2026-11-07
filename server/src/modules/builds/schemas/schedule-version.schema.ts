import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type {
  ScheduleVersionKind,
  ScheduleVersionStatus,
  ScheduleVersionStats,
} from '@slotly/contracts';
import type { Slot, Violation } from '../../engine/core/types';

export type ScheduleVersionDocument = ScheduleVersion & Document;

@Schema({ timestamps: true, collection: 'schedule_versions' })
export class ScheduleVersion {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  versionNo!: number;

  @Prop({ required: true })
  label!: string;

  @Prop({ type: Array, default: [] })
  slots!: Slot[];

  @Prop({ type: Array, default: [] })
  conflicts!: Violation[];

  @Prop({ type: Object, default: {} })
  stats!: ScheduleVersionStats;

  @Prop({ required: true, default: 100 })
  score!: number;

  @Prop({ required: true, default: 'auto' })
  kind!: ScheduleVersionKind;

  @Prop({ required: true, default: 1 })
  revision!: number;

  @Prop({ required: true, default: 'ready', index: true })
  status!: ScheduleVersionStatus;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const ScheduleVersionSchema =
  SchemaFactory.createForClass(ScheduleVersion);

ScheduleVersionSchema.index({ projectId: 1, versionNo: 1 }, { unique: true });
ScheduleVersionSchema.index({ projectId: 1, status: 1 });
