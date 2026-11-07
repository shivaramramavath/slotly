import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BlueprintHistoryDocument = BlueprintHistory & Document;

@Schema({ timestamps: true, collection: 'blueprint_history' })
export class BlueprintHistory {
  _id?: string;
  id?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: string;

  @Prop({ type: Number, required: true })
  revision!: number;

  @Prop({ type: String, required: true })
  operationType!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: string;

  @Prop({ type: Date, default: Date.now })
  timestamp!: Date;
}

export const BlueprintHistorySchema = SchemaFactory.createForClass(BlueprintHistory);
BlueprintHistorySchema.index({ projectId: 1, revision: -1 });
