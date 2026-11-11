// Data schema and persistence model for blueprint-history.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/** Type alias for blueprint history document. */
export type BlueprintHistoryDocument = BlueprintHistory & Document;

/** Class implementing blueprint history. */
@Schema({ timestamps: true, collection: 'blueprint_history' })
export class BlueprintHistory {
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

  @Prop({ type: Number, required: true })
  revision!: number;

  @Prop({ type: String, required: true })
  operationType!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: String, required: false, index: true, default: null })
  nodeId?: string | null;

  @Prop({ type: [Object], default: [] })
  changelog?: Array<{
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
  }>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: string;

  @Prop({ type: Date, default: Date.now })
  timestamp!: Date;
}

/** Zod schema validating blueprint history. */
export const BlueprintHistorySchema =
  SchemaFactory.createForClass(BlueprintHistory);
BlueprintHistorySchema.index({ projectId: 1, revision: -1 });
BlueprintHistorySchema.index({ projectId: 1, nodeId: 1, revision: -1 });
