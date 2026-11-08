// Data access repository for user notification channel preferences.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NotificationPreferences,
  NotificationPreferencesDocument,
} from '../schemas/notification-preferences.schema';
import type { NotificationPreferencesDto } from '@slotly/contracts';

/** Repository managing NotificationPreferences persistence. */
@Injectable()
export class NotificationPreferencesRepository {
  constructor(
    @InjectModel(NotificationPreferences.name)
    private readonly prefsModel: Model<NotificationPreferencesDocument>,
  ) {}

  /** Finds preferences for a given user, returning default preferences if none saved. */
  async findByUserId(
    userId: string,
  ): Promise<NotificationPreferencesDocument | null> {
    return this.prefsModel.findOne({ userId }).exec();
  }

  /** Upserts notification preferences for a user. */
  async upsert(
    userId: string,
    prefs: Partial<NotificationPreferencesDto>,
  ): Promise<NotificationPreferencesDocument> {
    const updated = await this.prefsModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            userId,
            ...(prefs.email !== undefined && { email: prefs.email }),
            ...(prefs.inApp !== undefined && { inApp: prefs.inApp }),
            ...(prefs.types !== undefined && { types: prefs.types }),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    return updated!;
  }
}
