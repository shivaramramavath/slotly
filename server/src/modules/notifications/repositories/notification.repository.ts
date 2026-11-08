// Data access repository for in-app user notifications.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

/** Repository managing Notification entity CRUD and inbox querying. */
@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /** Inserts a single in-app notification. */
  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    const doc = new this.notificationModel(data);
    return doc.save();
  }

  /** Bulk inserts notifications for multiple recipients. */
  async createMany(
    items: Array<Partial<Notification>>,
  ): Promise<NotificationDocument[]> {
    if (items.length === 0) return [];
    const inserted = await this.notificationModel.insertMany(items);
    return inserted as unknown as NotificationDocument[];
  }

  /** Lists notifications for a given user, optionally filtering by unread status. */
  async findByUser(
    userId: string,
    unreadOnly = false,
    limit = 50,
  ): Promise<NotificationDocument[]> {
    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) {
      filter['read'] = false;
    }
    return this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Marks a single notification as read. */
  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    const updated = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, userId } as any,
        { $set: { read: true } },
        { new: true },
      )
      .exec();
    return updated as NotificationDocument | null;
  }

  /** Marks all notifications for a user as read. */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany({ userId, read: false }, { read: true })
      .exec();
    return result.modifiedCount || 0;
  }

  /** Returns count of unread notifications for a user. */
  async countUnread(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ userId, read: false })
      .exec();
  }
}
