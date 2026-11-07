// Data schema and persistence model for elective-group.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Type alias for elective group document. */
export type ElectiveGroupDocument = ElectiveGroup & Document;

/** Class implementing elective group. */
@Schema({ timestamps: true, collection: 'elective_groups' })
export class ElectiveGroup {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ required: true, index: true })
  institutionId!: string;

  @Prop({ type: String, default: null })
  departmentId?: string | null | undefined;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  subjectIds!: string[];

  @Prop({ default: true })
  mustBeSimultaneous!: boolean;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating elective group. */
export const ElectiveGroupSchema = SchemaFactory.createForClass(ElectiveGroup);
ElectiveGroupSchema.index({ institutionId: 1, name: 1 });
ElectiveGroupSchema.index({ institutionId: 1, isDeleted: 1 });
