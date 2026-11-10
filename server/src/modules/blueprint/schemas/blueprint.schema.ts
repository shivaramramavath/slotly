// Data schema and persistence model for blueprint.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type {
  Assignment,
  AutoFillMode,
  BlueprintEdgeDto,
  BlueprintNodeDto,
  BlueprintNodeType,
  NodePool,
  NodePosition,
  NodeStatus,
} from '@slotly/contracts';

/** Type alias for blueprint document. */
export type BlueprintDocument = Blueprint & Document;

/** Class implementing blueprint node schema class. */
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

  @Prop({ type: Number, default: 1 })
  version?: number;

  @Prop({
    type: {
      additions: [
        {
          id: { type: String, required: true },
          kind: {
            type: String,
            enum: ['faculty', 'subject', 'room'],
            required: true,
          },
          itemId: { type: String, required: true },
          required: { type: Boolean, default: false },
          pinned: { type: Boolean, default: false },
          addedAt: { type: String, default: null },
        },
      ],
      exclusions: [{ type: String }],
    },
    default: { additions: [], exclusions: [] },
  })
  pool?: NodePool;

  @Prop({
    type: [
      {
        id: { type: String, required: true },
        subjectId: { type: String, required: true },
        facultyId: { type: String, default: null },
        roomId: { type: String, default: null },
        periodsPerWeek: { type: Number, required: true, min: 1 },
        isLab: { type: Boolean, default: false },
        labDuration: { type: Number, default: 1, min: 1 },
      },
    ],
    default: [],
  })
  assignments?: Assignment[];

  @Prop({
    type: String,
    enum: ['off', 'same_department', 'allow_other_departments'],
    default: 'off',
  })
  autoFill?: AutoFillMode;
}

/** Class implementing blueprint edge schema class. */
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

/** Class implementing blueprint. */
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

/** Zod schema validating blueprint. */
export const BlueprintSchema = SchemaFactory.createForClass(Blueprint);
