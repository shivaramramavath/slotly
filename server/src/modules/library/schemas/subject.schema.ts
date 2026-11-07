// Data schema and persistence model for subject.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { SubjectType, SubjectRequirements } from '@slotly/contracts';

/** Type alias for subject document. */
export type SubjectDocument = Subject & Document;

/** Class implementing subject. */
@Schema({ timestamps: true, collection: 'subjects' })
export class Subject {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ required: true, index: true })
  institutionId!: string;

  @Prop({ required: true, index: true })
  departmentId!: string;

  @Prop({ type: [String], default: [] })
  programIds!: string[];

  @Prop({ required: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 3 })
  credits!: number;

  @Prop({
    type: String,
    enum: ['theory', 'lab', 'tutorial', 'seminar'],
    default: 'theory',
  })
  type!: SubjectType;

  @Prop({ default: 3 })
  weeklyHours!: number;

  @Prop({ default: 0 })
  labHours!: number;

  @Prop({ default: 1 })
  consecutivePeriods!: number;

  @Prop({ type: [Number], default: [] })
  preferredDays!: number[];

  @Prop({
    type: Object,
    default: { roomType: 'lecture', minCapacity: 30, equipment: [] },
  })
  requirements!: SubjectRequirements;

  @Prop({ default: 0 })
  enrollment!: number;

  @Prop({ type: [String], default: [] })
  dependsOn!: string[];

  @Prop({ default: false })
  isElective!: boolean;

  @Prop({ type: String, default: null })
  electiveGroupId?: string | null | undefined;

  @Prop({ type: [String], default: [] })
  facultyIds!: string[];

  @Prop({ default: false, index: true })
  archived!: boolean;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating subject. */
export const SubjectSchema = SchemaFactory.createForClass(Subject);
SubjectSchema.index({ institutionId: 1, code: 1 }, { unique: true });
SubjectSchema.index({ institutionId: 1, departmentId: 1 });
SubjectSchema.index({ institutionId: 1, type: 1 });
SubjectSchema.index({ institutionId: 1, archived: 1, isDeleted: 1 });
