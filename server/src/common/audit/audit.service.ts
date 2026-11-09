// Domain service orchestrating audit logging, querying, and user security events.
import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
import type {
  AuditQueryDto,
  AuditLogDto,
  SecurityEventDto,
} from '@slotly/contracts';

/** Interface defining structure for audit payload. */
export interface AuditPayload {
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
  timestamp?: Date | undefined;
}

/** Injectable service providing audit service logic. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Optional() @InjectQueue('audit') private readonly auditQueue?: Queue,
    @Optional()
    @InjectModel(AuditLog.name)
    private readonly auditModel?: Model<AuditLogDocument>,
  ) {}

  /** Logs an action to the audit queue or directly to MongoDB. */
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

  /**
   * Queries audit logs with indexed filters and pagination.
   */
  async queryLogs(
    filter: AuditQueryDto,
  ): Promise<{ items: AuditLogDto[]; total: number }> {
    if (!this.auditModel) {
      return { items: [], total: 0 };
    }

    const query: Record<string, unknown> = {};
    if (filter.actorId) query.actorId = filter.actorId;
    if (filter.action) query.action = filter.action;
    if (filter.targetType) query.targetType = filter.targetType;
    if (filter.targetId) query.targetId = filter.targetId;

    if (filter.fromDate || filter.toDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filter.fromDate) dateFilter.$gte = new Date(filter.fromDate);
      if (filter.toDate) dateFilter.$lte = new Date(filter.toDate);
      query.timestamp = dateFilter;
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 50;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.auditModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.auditModel.countDocuments(query).exec(),
    ]);

    const items: AuditLogDto[] = docs.map((d) => ({
      id: String(
        (d as { _id?: unknown; id?: unknown })._id ??
          (d as { id?: unknown }).id,
      ),
      action: d.action,
      actorId: d.actorId,
      targetType: d.targetType,
      targetId: d.targetId,
      meta: (d.meta as Record<string, unknown>) ?? {},
      ipAddress: d.ipAddress,
      timestamp: d.timestamp
        ? new Date(d.timestamp).toISOString()
        : new Date().toISOString(),
    }));

    return { items, total };
  }

  /**
   * Retrieves security-related audit events for a specific user.
   */
  async getUserSecurityEvents(
    userId: string,
    limit = 20,
  ): Promise<SecurityEventDto[]> {
    if (!this.auditModel) {
      return [];
    }

    const docs = await this.auditModel
      .find({
        $or: [{ actorId: userId }, { targetType: 'user', targetId: userId }],
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();

    return docs.map((d) => ({
      id: String(
        (d as { _id?: unknown; id?: unknown })._id ??
          (d as { id?: unknown }).id,
      ),
      userId,
      action: d.action,
      ipAddress: d.ipAddress,
      timestamp: d.timestamp
        ? new Date(d.timestamp).toISOString()
        : new Date().toISOString(),
      meta: (d.meta as Record<string, unknown>) ?? {},
    }));
  }
}
