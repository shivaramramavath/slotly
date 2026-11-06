import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

export interface AuditPayload {
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
  timestamp?: Date | undefined;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Optional() @InjectQueue('audit') private readonly auditQueue?: Queue,
    @Optional()
    @InjectModel(AuditLog.name)
    private readonly auditModel?: Model<AuditLogDocument>,
  ) {}

  async log(
    action: string,
    actor: { id: string } | string,
    target: { type: string; id: string },
    meta: Record<string, unknown> = {},
    ipAddress?: string,
  ): Promise<void> {
    const actorId = typeof actor === 'string' ? actor : actor.id;
    const payload: AuditPayload = {
      action,
      actorId,
      targetType: target.type,
      targetId: target.id,
      meta,
      ipAddress,
      timestamp: new Date(),
    };

    if (this.auditQueue) {
      try {
        await this.auditQueue.add('log-event', payload, {
          removeOnComplete: true,
          attempts: 3,
        });
        return;
      } catch (err: unknown) {
        this.logger.warn(
          `Failed to enqueue audit event, persisting directly: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (this.auditModel) {
      try {
        await this.auditModel.create(payload as unknown as AuditLog);
      } catch (err: unknown) {
        this.logger.error(
          `Failed to persist audit log: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
