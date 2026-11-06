import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { PeriodConfig } from '@slotly/contracts';

export type InstitutionDocument = Institution & Document;

@Schema({ timestamps: true, collection: 'institutions' })
export class Institution {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ default: '', trim: true })
  address?: string | undefined;

  @Prop({ type: [Number], default: [1, 2, 3, 4, 5] })
  workingDays!: number[];

  @Prop({
    type: Object,
    default: {
      startTime: '09:00',
      periodDuration: 50,
      periodsPerDay: 7,
      breaks: [{ name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 }],
    },
  })
  defaultPeriodConfig!: PeriodConfig;

  @Prop({ default: true })
  isComplete!: boolean;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date | undefined;
}

export const InstitutionSchema = SchemaFactory.createForClass(Institution);
InstitutionSchema.index({ code: 1 }, { unique: true });
InstitutionSchema.index({ isDeleted: 1 });
