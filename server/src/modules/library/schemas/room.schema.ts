// Data schema and persistence model for room.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { RoomType } from '@slotly/contracts';

/** Type alias for room document. */
export type RoomDocument = Room & Document;

/** Class implementing room. */
@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ required: true, index: true })
  institutionId!: string;

  @Prop({ type: String, default: null })
  departmentId?: string | null | undefined;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, uppercase: true, trim: true })
  code!: string;

  @Prop({
    type: String,
    enum: ['lecture', 'lab', 'seminar'],
    default: 'lecture',
  })
  type!: RoomType;

  @Prop({ required: true, min: 1 })
  capacity!: number;

  @Prop({ required: true, trim: true })
  building!: string;

  @Prop({ type: [String], default: [] })
  equipment!: string[];

  @Prop({ default: true })
  shared!: boolean;

  @Prop({
    type: [[Boolean]],
    default: (): boolean[][] =>
      Array.from({ length: 7 }, () => Array<boolean>(10).fill(true)),
  })
  availability!: boolean[][];

  @Prop({ type: [String], default: [] })
  labFor!: string[];

  @Prop({ default: false, index: true })
  archived!: boolean;

  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;
}

/** Zod schema validating room. */
export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ institutionId: 1, code: 1 }, { unique: true });
RoomSchema.index({ institutionId: 1, type: 1 });
RoomSchema.index({ institutionId: 1, departmentId: 1 });
RoomSchema.index({ institutionId: 1, archived: 1, isDeleted: 1 });
