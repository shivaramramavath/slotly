// Data schema and persistence model for program.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** Type alias for program document. */
export type ProgramDocument = Program & Document;

/** Class implementing program. */
@Schema({ timestamps: true, collection: 'programs' })
export class Program {
  id?: string | undefined;
  _id?: unknown;

  @Prop({
    type: Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true,
  })
  institutionId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true,
  })
  departmentId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ required: true, min: 1, max: 6, default: 4 })
  durationYears!: number;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating program. */
export const ProgramSchema = SchemaFactory.createForClass(Program);
ProgramSchema.index(
  { departmentId: 1, code: 1, isDeleted: 1 },
  { unique: true },
);
