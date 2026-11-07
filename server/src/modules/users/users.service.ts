// Domain service orchestrating users.service business logic.
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from './repositories/user.repository';
import type { UserRepository } from './repositories/user.repository';
import { SESSIONS_SERVICE } from '../auth/services/sessions.service';
import type { SessionsService } from '../auth/services/sessions.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AuditLog,
  type AuditLogDocument,
} from '../../common/audit/audit-log.schema';
import type { DeviceDto, SecurityActivityDto } from '@slotly/contracts';

/** Constant representing users service. */
export const USERS_SERVICE = Symbol('USERS_SERVICE');

/** Interface defining structure for users service. */
export interface UsersService {
  getSecurityOverview(userId: string): Promise<{
    email: string;
    isEmailVerified: boolean;
    mfaEnabled: boolean;
    activeSessionsCount: number;
    devicesCount: number;
  }>;
  getSecurityActivity(userId: string): Promise<SecurityActivityDto[]>;
  getDevices(userId: string): Promise<DeviceDto[]>;
  removeDevice(userId: string, deviceId: string): Promise<{ message: string }>;
}

/** Injectable service providing default users service logic. */
@Injectable()
export class DefaultUsersService implements UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async getSecurityOverview(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found.');

    const sessions = await this.sessionsService.listUserSessions(userId);
    return {
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfaEnabled,
      activeSessionsCount: sessions.length,
      devicesCount: user.devices?.length || 0,
    };
  }

  async getSecurityActivity(userId: string): Promise<SecurityActivityDto[]> {
    const logs = await this.auditModel
      .find({ actorId: userId })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean<AuditLogDocument[]>()
      .exec();

    return logs.map((log) => ({
      id:
        (log as unknown as { _id?: { toString(): string } })._id?.toString() ||
        '',
      action: log.action,
      ipAddress: log.ipAddress,
      timestamp: log.timestamp?.toISOString() || new Date().toISOString(),
      metadata: log.meta,
    }));
  }

  async getDevices(userId: string): Promise<DeviceDto[]> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found.');

    return (user.devices || []).map((d) => ({
      deviceId: d.deviceId,
      name: d.name,
      browser: d.browser,
      os: d.os,
      ip: d.ip,
      lastActiveAt: d.lastActiveAt.toISOString(),
      isTrusted: d.isTrusted,
    }));
  }

  async removeDevice(
    userId: string,
    deviceId: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found.');

    const filtered = (user.devices || []).filter(
      (d) => d.deviceId !== deviceId,
    );
    await this.userRepo.update(userId, { devices: filtered });

    return { message: 'Device removed.' };
  }
}
