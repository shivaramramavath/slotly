import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AcademicYearDocument = AcademicYear & Document;

@Schema({ timestamps: true, collection: 'academic_years' })
export class AcademicYear {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ type: Types.ObjectId, ref: 'Institution', required: true, index: true })
  institutionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Program', required: true, index: true })
  programId!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 6 })
  yearNumber!: number;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop()
  deletedAt?: Date | undefined;
}

export const AcademicYearSchema = SchemaFactory.createForClass(AcademicYear);
AcademicYearSchema.index({ programId: 1, yearNumber: 1, isDeleted: 1 });
