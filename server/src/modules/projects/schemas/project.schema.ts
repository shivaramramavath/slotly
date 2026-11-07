import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type {
  ProjectLifecycleStatus,
  ProjectSettings,
  ProjectStrictness,
  ProjectTerm,
} from '@slotly/contracts';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  _id?: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true,
  })
  institutionId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  ownerId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: {
      kind: { type: String, enum: ['odd', 'even', 'custom'], required: true },
      startDate: { type: String, required: true },
      endDate: { type: String, required: true },
      academicYearLabel: { type: String },
    },
    required: true,
  })
  term!: ProjectTerm;

  @Prop({
    type: String,
    enum: [
      'draft',
      'building',
      'ready',
      'pending_approval',
      'published',
      'archived',
    ],
    default: 'draft',
    index: true,
  })
  status!: ProjectLifecycleStatus;

  @Prop({
    type: {
      days: { type: [Number], default: [1, 2, 3, 4, 5] },
      periodsPerDay: { type: Number, default: 7 },
      periodDuration: { type: Number, default: 50 },
      startTime: { type: String, default: '09:00' },
      breaks: [
        {
          name: { type: String, required: true },
          afterPeriod: { type: Number, required: true },
          durationMinutes: { type: Number, required: true },
        },
      ],
      perDayOverrides: { type: Object, default: {} },
    },
    default: {
      days: [1, 2, 3, 4, 5],
      periodsPerDay: 7,
      periodDuration: 50,
      startTime: '09:00',
      breaks: [],
      perDayOverrides: {},
    },
  })
  settings!: ProjectSettings;

  @Prop({
    type: String,
    enum: ['strict', 'flexible', 'relaxed'],
    default: 'strict',
  })
  strictness!: ProjectStrictness;

  @Prop({ type: Date, default: null })
  lastOpenedAt?: Date | null;

  @Prop({ type: Number, default: 1 })
  revision!: number;

  @Prop({ type: Boolean, default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ institutionId: 1, status: 1 });
ProjectSchema.index({ ownerId: 1, createdAt: -1 });
