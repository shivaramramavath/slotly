// Data schema and persistence model for section.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { BatchDto } from '@slotly/contracts';

/** Type alias for section document. */
export type SectionDocument = Section & Document;

/** Class implementing section. */
@Schema({ timestamps: true, collection: 'sections' })
export class Section {
  id?: string | undefined;
  _id?: unknown;

  @Prop({
    type: Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true,
  })
  institutionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Semester', required: true, index: true })
  semesterId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'AcademicYear',
    required: true,
    index: true,
  })
  academicYearId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 1 })
  strength!: number;

  @Prop({ type: [Object], default: [] })
  batches!: BatchDto[];

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating section. */
export const SectionSchema = SchemaFactory.createForClass(Section);
SectionSchema.index({ semesterId: 1, name: 1, isDeleted: 1 });
