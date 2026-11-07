// Data schema and persistence model for blueprint-template.schema.
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import type { GraphTemplateSubtree } from '@slotly/contracts';

/** Type alias for blueprint template document. */
export type BlueprintTemplateDocument = BlueprintTemplate & Document;

/** Class implementing blueprint template. */
@Schema({ timestamps: true, collection: 'blueprint_templates' })
export class BlueprintTemplate {
  _id?: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  category!: string;

  @Prop({ type: Object, required: true })
  subtree!: GraphTemplateSubtree;

  @Prop({ type: Number, default: 1 })
  version!: number;

  @Prop({
    type: String,
    enum: ['public', 'institution', 'private'],
    default: 'public',
    index: true,
  })
  visibility!: 'public' | 'institution' | 'private';

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    default: null,
    index: true,
  })
  institutionId?: string | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  createdById?: string | null;

  @Prop({ type: String, default: null })
  anchorNodeType?: string | null;
}

/** Zod schema validating blueprint template. */
export const BlueprintTemplateSchema =
  SchemaFactory.createForClass(BlueprintTemplate);
