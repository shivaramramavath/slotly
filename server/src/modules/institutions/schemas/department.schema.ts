// Data schema and persistence model for department.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** Type alias for department document. */
export type DepartmentDocument = Department & Document;

/** Class implementing department. */
@Schema({ timestamps: true, collection: 'departments' })
export class Department {
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

  @Prop({ required: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  headFacultyId?: Types.ObjectId | undefined;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating department. */
export const DepartmentSchema = SchemaFactory.createForClass(Department);
DepartmentSchema.index({ institutionId: 1, code: 1, isDeleted: 1 });
