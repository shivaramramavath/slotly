// Data schema and persistence model for blueprint-snapshot.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { BlueprintGraphDto } from '@slotly/contracts';

/** Type alias for blueprint snapshot document. */
export type BlueprintSnapshotDocument = BlueprintSnapshot & Document;

/** Class implementing blueprint snapshot. */
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

/** Zod schema validating blueprint snapshot. */
export const BlueprintSnapshotSchema =
  SchemaFactory.createForClass(BlueprintSnapshot);
BlueprintSnapshotSchema.index({ projectId: 1, createdAt: -1 });
