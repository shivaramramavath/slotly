import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type {
  BlueprintEdgeDto,
  BlueprintNodeDto,
  BlueprintNodeType,
  NodePosition,
  NodeStatus,
} from '@slotly/contracts';

export type BlueprintDocument = Blueprint & Document;

@Schema({ _id: false })
export class BlueprintNodeSchemaClass {
  @Prop({ required: true })
  id!: string;

  @Prop({ type: String, required: true })
  type!: BlueprintNodeType;

  @Prop({ type: String, default: null })
  refId?: string | null;

  @Prop({ type: String, default: null })
  parentId?: string | null;

  @Prop({
    type: { x: Number, y: Number },
    required: true,
    default: { x: 0, y: 0 },
  })
  position!: NodePosition;

  @Prop({ type: Object, default: {} })
  data!: Record<string, unknown>;

  @Prop({ type: Boolean, default: false })
  locked!: boolean;

  @Prop({ type: Boolean, default: false })
  hidden!: boolean;

  @Prop({ type: String, default: null })
  groupId?: string | null;

  @Prop({ type: String, default: null })
  createdBy?: string | null;

  @Prop({
    type: String,
    enum: ['empty', 'incomplete', 'complete', 'blocked'],
    default: 'incomplete',
  })
  status!: NodeStatus;

  @Prop({
    type: [
      {
        field: { type: String, required: true },
        message: { type: String, required: true },
      },
    ],
    default: [],
  })
  missing!: Array<{ field: string; message: string }>;

  @Prop({
    type: String,
    enum: ['empty', 'incomplete', 'complete', 'blocked'],
    default: 'incomplete',
  })
  effectiveStatus!: NodeStatus;

  @Prop({ type: Object, default: {} })
  constraints?: Record<string, unknown>;
}

@Schema({ _id: false })
export class BlueprintEdgeSchemaClass {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  source!: string;

  @Prop({ required: true })
  target!: string;

  @Prop({ type: String, default: 'default' })
  type!: string;
}

@Schema({ timestamps: true, collection: 'blueprints' })
export class Blueprint {
  _id?: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
    index: true,
  })
  projectId!: string;

  @Prop({ type: Number, default: 1 })
  revision!: number;

  @Prop({ type: [BlueprintNodeSchemaClass], default: [] })
  nodes!: BlueprintNodeDto[];

  @Prop({ type: [BlueprintEdgeSchemaClass], default: [] })
  edges!: BlueprintEdgeDto[];

  @Prop({
    type: { x: Number, y: Number, zoom: Number },
    default: { x: 0, y: 0, zoom: 1 },
  })
  viewport!: { x: number; y: number; zoom: number };
}

export const BlueprintSchema = SchemaFactory.createForClass(Blueprint);
