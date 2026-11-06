import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SemesterDocument = Semester & Document;

@Schema({ timestamps: true, collection: 'semesters' })
export class Semester {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ type: Types.ObjectId, ref: 'Institution', required: true, index: true })
  institutionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Program', required: true, index: true })
  programId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicYear', required: true, index: true })
  academicYearId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 1, max: 12 })
  number!: number;

  @Prop({ required: true })
  startDate!: string;

  @Prop({ required: true })
  endDate!: string;

  @Prop({ default: '', trim: true })
  academicYearLabel!: string;

  @Prop({ default: true })
  active!: boolean;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date | undefined;
}

export const SemesterSchema = SchemaFactory.createForClass(Semester);
SemesterSchema.index({ academicYearId: 1, number: 1, isDeleted: 1 });
