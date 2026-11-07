// Data schema and persistence model for user.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { UserRole } from '@slotly/contracts';

/** Type alias for user document. */
export type UserDocument = User & Document;

/** Interface defining structure for device record. */
export interface DeviceRecord {
  deviceId: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  lastActiveAt: Date;
  isTrusted: boolean;
}

/** Class implementing user. */
@Schema({ timestamps: true, collection: 'users' })
export class User {
  id?: string | undefined;
  _id?: unknown;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'DESIGNER', 'FACULTY', 'STUDENT'],
    default: 'DESIGNER',
    index: true,
  })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Institution', index: true })
  institutionId?: Types.ObjectId | undefined;

  @Prop({ type: Types.ObjectId, ref: 'Department', index: true })
  departmentId?: Types.ObjectId | undefined;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ default: false })
  mfaEnabled!: boolean;

  @Prop({ type: String })
  mfaSecret?: string | undefined;

  @Prop({ type: [String], default: [] })
  recoveryCodes!: string[]; // Argon2 or sha256 hashed

  @Prop({ type: [String], default: [] })
  passwordHistory!: string[]; // previous password hashes to prevent reuse

  @Prop({
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active',
    index: true,
  })
  status!: 'active' | 'suspended' | 'deactivated';

  @Prop({ type: [Object], default: [] })
  devices!: DeviceRecord[];

  @Prop({ default: false })
  mfaRequired!: boolean; // Forced by institution admin
}

/** Zod schema validating user. */
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ institutionId: 1, role: 1 });
