// Domain service resolving notification recipient user accounts and emails.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import type { CreateAnnouncementDto, UserRole } from '@slotly/contracts';

/** Recipient record containing user identification and email. */
export interface RecipientInfo {
  userId: string;
  email: string;
}

/** Service resolving targeted users based on event context or announcement criteria. */
@Injectable()
export class RecipientResolverService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Resolves audience for an administrative announcement. */
  async resolveForAnnouncement(
    institutionId?: string,
    audience?: CreateAnnouncementDto['audience'],
  ): Promise<RecipientInfo[]> {
    const filter: Record<string, unknown> = {};

    if (institutionId) {
      filter['institutionId'] = institutionId;
    }

    if (audience?.roles && audience.roles.length > 0) {
      filter['role'] = { $in: audience.roles };
    }

    const users = await this.userModel
      .find(filter, { _id: 1, email: 1 })
      .lean()
      .exec();

    return users.map((u) => ({
      userId: (u._id as { toString(): string }).toString(),
      email: u.email,
    }));
  }

  /** Resolves targeted users for a timetable lifecycle or mutation domain event. */
  async resolveForEvent(
    _eventType: string,
    payload: {
      projectId?: string;
      institutionId?: string;
      userId?: string;
      userIds?: string[];
      targetUserIds?: string[];
      facultyId?: string;
    },
  ): Promise<RecipientInfo[]> {
    // 1. Direct recipient list in payload
    const directUserIds = [
      ...(payload.userIds || []),
      ...(payload.targetUserIds || []),
      ...(payload.userId ? [payload.userId] : []),
    ];

    if (directUserIds.length > 0) {
      const users = await this.userModel
        .find({ _id: { $in: directUserIds } }, { _id: 1, email: 1 })
        .lean()
        .exec();

      return users.map((u) => ({
        userId: (u._id as { toString(): string }).toString(),
        email: u.email,
      }));
    }

    // 2. Fallback: project stakeholders (Admins and Designers of the institution)
    const filter: Record<string, unknown> = {
      role: { $in: ['ADMIN', 'DESIGNER'] as UserRole[] },
    };
    if (payload.institutionId) {
      filter['institutionId'] = payload.institutionId;
    }

    const users = await this.userModel
      .find(filter, { _id: 1, email: 1 })
      .lean()
      .exec();

    return users.map((u) => ({
      userId: (u._id as { toString(): string }).toString(),
      email: u.email,
    }));
  }
}
