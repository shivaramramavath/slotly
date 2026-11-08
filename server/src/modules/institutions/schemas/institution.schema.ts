// Data schema and persistence model for institution.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { PeriodConfig } from '@slotly/contracts';

/** Type alias for institution document. */
export type InstitutionDocument = Institution & Document;

/** Class implementing institution. */
@Schema({ timestamps: true, collection: 'institutions' })
export class Institution {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ type: String, default: '', trim: true })
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

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating institution. */
export const InstitutionSchema = SchemaFactory.createForClass(Institution);
