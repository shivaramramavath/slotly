// Data access repository for timetable share links.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Share, ShareDocument } from '../schemas/share.schema';

/** Repository interface and implementation managing Share persistence. */
@Injectable()
export class ShareRepository {
  constructor(
    @InjectModel(Share.name)
    private readonly shareModel: Model<ShareDocument>,
  ) {}

  /** Creates and persists a new timetable share record. */
  async create(data: Partial<Share>): Promise<ShareDocument> {
    const share = new this.shareModel(data);
    return share.save();
  }

  /** Finds a share by ID. */
  async findById(id: string): Promise<ShareDocument | null> {
    return this.shareModel.findById(id).exec();
  }

  /** Finds an active share by its hashed token. */
  async findByTokenHash(tokenHash: string): Promise<ShareDocument | null> {
    return this.shareModel.findOne({ tokenHash }).exec();
  }

  /** Lists shares for a given project. */
  async findByProject(projectId: string): Promise<ShareDocument[]> {
    return this.shareModel.find({ projectId }).sort({ createdAt: -1 }).exec();
  }

  /** Revokes a share by ID. */
  async revoke(id: string): Promise<ShareDocument | null> {
    return this.shareModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }
}
