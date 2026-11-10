// Data schema and persistence model for user pinned projects.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/** Type alias for ProjectPin document. */
export type ProjectPinDocument = ProjectPin & Document;

/** Class representing a user-pinned project entry. */
@Schema({ timestamps: true, collection: 'project_pins' })
export class ProjectPin {
  _id?: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId!: string;

  @Prop({ type: Date, default: () => new Date(), required: true })
  pinnedAt!: Date;
}

/** Mongoose schema validating project pin entries. */
export const ProjectPinSchema = SchemaFactory.createForClass(ProjectPin);

ProjectPinSchema.index({ userId: 1, projectId: 1 }, { unique: true });
ProjectPinSchema.index({ userId: 1, pinnedAt: -1 });
