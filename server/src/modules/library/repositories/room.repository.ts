import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../common/database/mongo-base.repository';
import type { BaseRepository } from '../../../common/database/base.repository';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { Room, RoomDocument } from '../schemas/room.schema';

export const ROOM_REPOSITORY = Symbol('ROOM_REPOSITORY');

export interface RoomFilterOptions {
  departmentId?: string;
  type?: string;
  building?: string;
  minCapacity?: number;
  archived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RoomRepository extends BaseRepository<Room> {
  findByInstitution(
    institutionId: string,
    options?: RoomFilterOptions,
  ): Promise<{ items: Room[]; total: number }>;
  findByCode(institutionId: string, code: string): Promise<Room | null>;
  findByBuilding(institutionId: string, building: string): Promise<Room[]>;
  setArchived(id: string, archived: boolean): Promise<Room | null>;
  softDelete(id: string): Promise<boolean>;
  countByInstitution(institutionId: string): Promise<number>;
}

@Injectable()
export class MongoRoomRepository
  extends MongoBaseRepository<Room, RoomDocument>
  implements RoomRepository
{
  constructor(@InjectModel(Room.name) model: Model<RoomDocument>) {
    super(model);
  }

  async findByInstitution(
    institutionId: string,
    options: RoomFilterOptions = {},
  ): Promise<{ items: Room[]; total: number }> {
    const {
      departmentId,
      type,
      building,
      minCapacity,
      archived,
      search,
      page = 1,
      limit = 50,
    } = options;

    const query: Record<string, unknown> = {
      institutionId,
      isDeleted: false,
    };

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (type) {
      query.type = type;
    }

    if (building) {
      query.building = building;
    }

    if (minCapacity) {
      query.capacity = { $gte: minCapacity };
    }

    if (typeof archived === 'boolean') {
      query.archived = archived;
    }

    if (search && search.trim().length > 0) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { code: reg }, { building: reg }];
    }

    const total = await this.model.countDocuments(query).exec();
    const items = await this.model
      .find(query)
      .sort({ building: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Room[]>()
      .exec();

    return { items, total };
  }

  async findByCode(institutionId: string, code: string): Promise<Room | null> {
    const doc = await this.model
      .findOne({
        institutionId,
        code: code.toUpperCase().trim(),
        isDeleted: false,
      })
      .lean<Room>()
      .exec();
    return doc ?? null;
  }

  async findByBuilding(
    institutionId: string,
    building: string,
  ): Promise<Room[]> {
    return this.model
      .find({
        institutionId,
        building,
        isDeleted: false,
      })
      .sort({ name: 1 })
      .lean<Room[]>()
      .exec();
  }

  async setArchived(id: string, archived: boolean): Promise<Room | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { archived }, { new: true })
      .lean<Room>()
      .exec();
    return doc ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await this.model
      .updateOne({ _id: id }, { isDeleted: true, deletedAt: new Date() })
      .exec();
    return res.modifiedCount > 0;
  }

  async countByInstitution(institutionId: string): Promise<number> {
    return this.model
      .countDocuments({ institutionId, isDeleted: false })
      .exec();
  }
}

@Injectable()
export class CachedRoomRepository
  extends CachedRepository<Room>
  implements RoomRepository
{
  private readonly roomRepo: MongoRoomRepository;

  constructor(
    repo: MongoRoomRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(repo, cache, 'room', 3600);
    this.roomRepo = repo;
  }

  async findByInstitution(
    institutionId: string,
    options?: RoomFilterOptions,
  ): Promise<{ items: Room[]; total: number }> {
    const isDefault =
      !options?.search &&
      !options?.departmentId &&
      !options?.type &&
      !options?.building &&
      !options?.minCapacity &&
      options?.archived === undefined &&
      (!options?.page || options.page === 1);

    if (isDefault) {
      return this.cache.remember(
        `slotly:library:room:${institutionId}:all`,
        3600,
        async () => this.roomRepo.findByInstitution(institutionId, options),
        [`library:rooms:${institutionId}`, `library:${institutionId}`],
      );
    }

    return this.roomRepo.findByInstitution(institutionId, options);
  }

  async findByCode(institutionId: string, code: string): Promise<Room | null> {
    return this.roomRepo.findByCode(institutionId, code);
  }

  async findByBuilding(
    institutionId: string,
    building: string,
  ): Promise<Room[]> {
    return this.roomRepo.findByBuilding(institutionId, building);
  }

  async setArchived(id: string, archived: boolean): Promise<Room | null> {
    const res = await this.roomRepo.setArchived(id, archived);
    if (res?.institutionId) {
      await this.cache.invalidateTag(`library:rooms:${res.institutionId}`);
      await this.cache.invalidateTag(`library:${res.institutionId}`);
    }
    return res;
  }

  async softDelete(id: string): Promise<boolean> {
    const item = await this.roomRepo.findById(id);
    const ok = await this.roomRepo.softDelete(id);
    if (ok && item?.institutionId) {
      await this.cache.invalidateTag(`library:rooms:${item.institutionId}`);
      await this.cache.invalidateTag(`library:${item.institutionId}`);
    }
    return ok;
  }

  async countByInstitution(institutionId: string): Promise<number> {
    return this.roomRepo.countByInstitution(institutionId);
  }
}
