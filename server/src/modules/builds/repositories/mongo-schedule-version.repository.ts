import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduleVersion,
  ScheduleVersionDocument,
} from '../schemas/schedule-version.schema';
import type { IScheduleVersionRepository } from './schedule-version.repository.interface';
import type { ScheduleVersionDto } from '@slotly/contracts';

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
        ? doc.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: doc.updatedAt
        ? doc.updatedAt.toISOString()
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
  ): Promise<ScheduleVersionDto | null> {
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    return updated ? this.toDto(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id).exec();
    return res !== null;
  }
}
