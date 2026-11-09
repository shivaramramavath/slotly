// Database repository managing mongo-schedule-version.repository persistence.
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import {
  ScheduleVersion,
  ScheduleVersionDocument,
} from '../schemas/schedule-version.schema';
import type { IScheduleVersionRepository } from './schedule-version.repository.interface';
import type { ScheduleVersionDto } from '@slotly/contracts';

/** Injectable service providing mongo schedule version repository logic. */
@Injectable()
export class MongoScheduleVersionRepository implements IScheduleVersionRepository {
  constructor(
    @InjectModel(ScheduleVersion.name)
    private readonly model: Model<ScheduleVersionDocument>,
  ) {}

  private toDto(doc: ScheduleVersionDocument): ScheduleVersionDto {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      versionNo: doc.versionNo,
      label: doc.label,
      slots: doc.slots || [],
      conflicts: doc.conflicts || [],
      stats: doc.stats || {
        totalSlots: 0,
        occupiedSlots: 0,
        roomUtilizationPct: 0,
        facultyLoadBalanceScore: 0,
        afternoonLabPct: 0,
      },
      score: doc.score,
      kind: doc.kind,
      revision: doc.revision,
      status: doc.status,
      createdAt: doc.createdAt
        ? new Date(doc.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: doc.updatedAt
        ? new Date(doc.updatedAt).toISOString()
        : new Date().toISOString(),
    };
  }

  async create(data: Partial<ScheduleVersionDto>): Promise<ScheduleVersionDto> {
    const created = await this.model.create(data);
    return this.toDto(created);
  }

  async findById(id: string): Promise<ScheduleVersionDto | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toDto(doc) : null;
  }

  async findByProjectId(projectId: string): Promise<ScheduleVersionDto[]> {
    const docs = await this.model
      .find({ projectId })
      .sort({ versionNo: -1 })
      .exec();
    return docs.map((d) => this.toDto(d));
  }

  async findLatestByProjectId(
    projectId: string,
  ): Promise<ScheduleVersionDto | null> {
    const doc = await this.model
      .findOne({ projectId })
      .sort({ versionNo: -1 })
      .exec();
    return doc ? this.toDto(doc) : null;
  }

  async countByProjectId(projectId: string): Promise<number> {
    return this.model.countDocuments({ projectId }).exec();
  }

  async update(
    id: string,
    data: Partial<ScheduleVersionDto>,
    session?: ClientSession,
  ): Promise<ScheduleVersionDto | null> {
    const existing = await this.model
      .findById(id)
      .session(session || null)
      .exec();
    if (!existing) {
      return null;
    }

    if (existing.status === 'published') {
      const isArchiving = data.status === 'archived';
      if (!isArchiving) {
        throw new ConflictException({
          message:
            'Published schedule versions are immutable and cannot be modified.',
          code: 'VERSION_IMMUTABLE',
        });
      }
    } else if (existing.status === 'archived') {
      throw new ConflictException({
        message:
          'Archived schedule versions are immutable and cannot be modified.',
        code: 'VERSION_IMMUTABLE',
      });
    }

    const options = session
      ? { new: true as const, session }
      : { new: true as const };
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: data }, options)
      .exec();
    return updated ? this.toDto(updated as ScheduleVersionDocument) : null;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.model.findById(id).exec();
    if (
      existing &&
      (existing.status === 'published' || existing.status === 'archived')
    ) {
      throw new ConflictException({
        message:
          'Published or archived schedule versions are immutable and cannot be deleted.',
        code: 'VERSION_IMMUTABLE',
      });
    }
    const res = await this.model.findByIdAndDelete(id).exec();
    return res !== null;
  }
}
