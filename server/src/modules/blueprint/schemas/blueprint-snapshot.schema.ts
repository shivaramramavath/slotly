import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { BlueprintGraphDto } from '@slotly/contracts';

export type BlueprintSnapshotDocument = BlueprintSnapshot & Document;

@Schema({ timestamps: true, collection: 'blueprint_snapshots' })
export class BlueprintSnapshot {
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

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ type: Object, required: true })
  graph!: BlueprintGraphDto;
}

export const BlueprintSnapshotSchema =
  SchemaFactory.createForClass(BlueprintSnapshot);
BlueprintSnapshotSchema.index({ projectId: 1, createdAt: -1 });
