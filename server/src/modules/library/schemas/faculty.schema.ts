// Data schema and persistence model for faculty.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { SlotCoordinate } from '@slotly/contracts';

/** Type alias for faculty document. */
export type FacultyDocument = Faculty & Document;

/** Class implementing faculty. */
@Schema({ timestamps: true, collection: 'faculties' })
export class Faculty {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ required: true, index: true })
  institutionId!: string;

  @Prop({ required: true, index: true })
  departmentId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ default: 'Assistant Professor', trim: true })
  designation!: string;

  @Prop({
    type: [[Boolean]],
    default: (): boolean[][] =>
      Array.from({ length: 7 }, () => Array<boolean>(10).fill(true)),
  })
  availability!: boolean[][];

  @Prop({ type: [Object], default: [] })
  preferredPeriods!: SlotCoordinate[];

  @Prop({ type: [Object], default: [] })
  unavailableSlots!: SlotCoordinate[];

  @Prop({ default: 0 })
  minHoursPerWeek!: number;

  @Prop({ default: 6 })
  maxHoursPerDay!: number;

  @Prop({ default: 20 })
  maxHoursPerWeek!: number;

  @Prop({ type: [String], default: [] })
  subjectIds!: string[];

  @Prop({ default: false, index: true })
  archived!: boolean;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating faculty. */
export const FacultySchema = SchemaFactory.createForClass(Faculty);
FacultySchema.index({ institutionId: 1, code: 1 }, { unique: true });
FacultySchema.index({ institutionId: 1, departmentId: 1 });
FacultySchema.index({ institutionId: 1, archived: 1, isDeleted: 1 });
