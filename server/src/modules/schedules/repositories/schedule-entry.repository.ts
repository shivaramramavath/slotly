// Database repository managing schedule-entry.repository persistence.
import { ConflictException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import {
  ScheduleEntry,
  ScheduleEntryDocument,
} from '../schemas/schedule-entry.schema';
import {
  ScheduleVersion,
  ScheduleVersionDocument,
} from '../../builds/schemas/schedule-version.schema';

/** Interface defining query filter for schedule entries. */
export interface ScheduleEntryFilter {
  versionId: string;
  sectionId?: string | undefined;
  batchId?: string | undefined;
  facultyId?: string | undefined;
  roomId?: string | undefined;
  subjectId?: string | undefined;
  day?: number | undefined;
}

/** Interface defining structure for schedule entry repository. */
export interface IScheduleEntryRepository {
  findByVersion(versionId: string): Promise<ScheduleEntry[]>;
  findByFilter(filter: ScheduleEntryFilter): Promise<ScheduleEntry[]>;
  createMany(
    entries: Array<Partial<ScheduleEntry>>,
    session?: ClientSession,
  ): Promise<ScheduleEntry[]>;
  deleteByVersion(versionId: string, session?: ClientSession): Promise<number>;
}

/** Injectable repository providing schedule entry persistence. */
@Injectable()
export class ScheduleEntryRepository
  extends MongoBaseRepository<ScheduleEntry, ScheduleEntryDocument>
  implements IScheduleEntryRepository
{
  constructor(
    @InjectModel(ScheduleEntry.name)
    model: Model<ScheduleEntryDocument>,
    @Optional()
    @InjectModel(ScheduleVersion.name)
    private readonly versionModel?: Model<ScheduleVersionDocument>,
  ) {
    super(model);
  }

  private async assertVersionEditable(versionId?: string): Promise<void> {
    if (!versionId || !this.versionModel) return;
    const version = await this.versionModel.findById(versionId).lean().exec();
    if (
      version &&
      (version.status === 'published' || version.status === 'archived')
    ) {
      throw new ConflictException({
        message: 'Published or archived schedule versions are immutable.',
        code: 'VERSION_IMMUTABLE',
      });
    }
  }

  async findByVersion(versionId: string): Promise<ScheduleEntry[]> {
    return this.model.find({ versionId }).lean<ScheduleEntry[]>().exec();
  }

  async findByFilter(filter: ScheduleEntryFilter): Promise<ScheduleEntry[]> {
    const q: Record<string, unknown> = { versionId: filter.versionId };
    if (filter.sectionId) q['sectionId'] = filter.sectionId;
    if (filter.batchId) q['batchId'] = filter.batchId;
    if (filter.facultyId) q['facultyId'] = filter.facultyId;
    if (filter.roomId) q['roomId'] = filter.roomId;
    if (filter.subjectId) q['subjectId'] = filter.subjectId;
    if (filter.day !== undefined) q['day'] = filter.day;

    return this.model.find(q).lean<ScheduleEntry[]>().exec();
  }

  async createMany(
    entries: Array<Partial<ScheduleEntry>>,
    session?: ClientSession,
  ): Promise<ScheduleEntry[]> {
    if (entries.length > 0 && entries[0]?.versionId) {
      await this.assertVersionEditable(entries[0].versionId);
    }

    const created = session
      ? await this.model.insertMany(entries as ScheduleEntryDocument[], {
          session,
        })
      : await this.model.insertMany(entries as ScheduleEntryDocument[]);
    return (
      created as unknown as Array<
        { toObject?: () => ScheduleEntry } & ScheduleEntry
      >
    ).map((doc) =>
      typeof doc.toObject === 'function'
        ? doc.toObject()
        : (doc as ScheduleEntry),
    );
  }

  override async create(
    entry: Partial<ScheduleEntry>,
    session?: ClientSession,
  ): Promise<ScheduleEntry> {
    await this.assertVersionEditable(entry.versionId);
    if (session) {
      const created = await this.model.create(
        [entry as ScheduleEntryDocument],
        { session },
      );
      const first = created[0];
      if (!first) {
        throw new Error('Failed to create schedule entry');
      }
      return first.toObject() as ScheduleEntry;
    }
    return super.create(entry);
  }

  override async update(
    id: string,
    update: Partial<ScheduleEntry>,
    session?: ClientSession,
  ): Promise<ScheduleEntry | null> {
    if (update.versionId) {
      await this.assertVersionEditable(update.versionId);
    }
    const options = session
      ? { new: true as const, session }
      : { new: true as const };
    return this.model
      .findByIdAndUpdate(
        id,
        { $set: update as Record<string, unknown> },
        options,
      )
      .lean<ScheduleEntry>()
      .exec();
  }

  override async delete(id: string, session?: ClientSession): Promise<boolean> {
    const existing = await this.model.findById(id).lean<ScheduleEntry>().exec();
    if (existing) {
      await this.assertVersionEditable(existing.versionId);
    }
    const options = session ? { session } : undefined;
    const res = await this.model.findByIdAndDelete(id, options).exec();
    return res !== null;
  }

  async deleteByVersion(
    versionId: string,
    session?: ClientSession,
  ): Promise<number> {
    await this.assertVersionEditable(versionId);
    const options = session ? { session } : undefined;
    const res = await this.model.deleteMany({ versionId }, options).exec();
    return res.deletedCount || 0;
  }
}
