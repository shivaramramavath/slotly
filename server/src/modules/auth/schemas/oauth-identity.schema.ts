// Mongoose schema definition for third-party OAuth provider identities.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { OAuthProviderKey } from '@slotly/contracts';

/** Mongoose document type for OAuthIdentity. */
export type OAuthIdentityDocument = OAuthIdentity & Document;

/** Entity representing a connected third-party OAuth identity linked to a user. */
@Schema({ timestamps: true, collection: 'oauth_identities' })
export class OAuthIdentity {
  id?: string | undefined;
  _id?: unknown;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: ['google', 'github'], required: true })
  provider!: OAuthProviderKey;

  @Prop({ type: String, required: true })
  providerUserId!: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, required: false, trim: true })
  name?: string | undefined;

  @Prop({ type: String, required: false, trim: true })
  avatarUrl?: string | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

/** Factory-generated schema for OAuthIdentity with compound unique and query indexes. */
export const OAuthIdentitySchema = SchemaFactory.createForClass(OAuthIdentity);

OAuthIdentitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });
OAuthIdentitySchema.index({ userId: 1 });
OAuthIdentitySchema.index({ email: 1 });
