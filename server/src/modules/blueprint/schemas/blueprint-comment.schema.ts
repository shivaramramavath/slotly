// Data schema and persistence model for blueprint-comment.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/** Type alias for blueprint comment document. */
export type BlueprintCommentDocument = BlueprintComment & Document;

/** Class implementing blueprint comment. */
@Schema({ timestamps: true, collection: 'blueprint_comments' })
export class BlueprintComment {
  _id?: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId!: string;

  @Prop({ required: true, index: true })
  nodeId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: string;

  @Prop({ required: true })
  userName!: string;

  @Prop({ required: true, trim: true })
  text!: string;
}

/** Zod schema validating blueprint comment. */
export const BlueprintCommentSchema =
  SchemaFactory.createForClass(BlueprintComment);
BlueprintCommentSchema.index({ projectId: 1, nodeId: 1, createdAt: -1 });
