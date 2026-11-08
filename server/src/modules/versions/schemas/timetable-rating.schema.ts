// Data schema and persistence model for timetable quality ratings and user feedback.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/** Type alias for timetable rating document. */
export type TimetableRatingDocument = TimetableRating & Document;

/** Class implementing timetable quality rating entity. */
@Schema({ timestamps: true, collection: 'timetable_ratings' })
export class TimetableRating {
  _id?: string;
  id?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ScheduleVersion',
    required: true,
    index: true,
  })
  versionId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ type: String, default: null })
  comment?: string | null;

  @Prop({ type: Object, default: {} })
  categories?: Record<string, number>;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

/** Mongoose schema factory for timetable rating. */
export const TimetableRatingSchema =
  SchemaFactory.createForClass(TimetableRating);

TimetableRatingSchema.index({ versionId: 1 });
TimetableRatingSchema.index({ projectId: 1 });
