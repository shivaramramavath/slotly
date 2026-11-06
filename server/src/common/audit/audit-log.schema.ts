import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, index: true })
  action!: string;

  @Prop({ required: true, index: true })
  actorId!: string;

  @Prop({ required: true, index: true })
  targetType!: string;

  @Prop({ required: true, index: true })
  targetId!: string;

  @Prop({ type: Object, default: {} })
  meta!: Record<string, unknown>;

  @Prop()
  ipAddress?: string;

  @Prop({ default: Date.now, index: true })
  timestamp!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
