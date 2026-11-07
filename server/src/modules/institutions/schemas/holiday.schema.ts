// Data schema and persistence model for holiday.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** Type alias for holiday document. */
export type HolidayDocument = Holiday & Document;

/** Class implementing holiday. */
@Schema({ timestamps: true, collection: 'holidays' })
export class Holiday {
  id?: string | undefined;
  _id?: unknown;

  @Prop({
    type: Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true,
  })
  institutionId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  startDate!: string;

  @Prop({ required: true })
  endDate!: string;

  @Prop({
    type: String,
    enum: ['holiday', 'exam', 'event', 'break'],
    default: 'holiday',
  })
  type!: 'holiday' | 'exam' | 'event' | 'break';

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating holiday. */
export const HolidaySchema = SchemaFactory.createForClass(Holiday);
HolidaySchema.index({ institutionId: 1, startDate: 1 });
