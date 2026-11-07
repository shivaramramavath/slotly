import {
  Injectable,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

export const OTP_SERVICE = Symbol('OTP_SERVICE');

export interface OtpRecord {
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  resendAvailableAt: number;
}

export interface OtpService {
  createOtp(
    email: string,
    purpose: string,
    ttlSeconds?: number,
    cooldownSeconds?: number,
  ): Promise<string>;
  verifyOtp(email: string, purpose: string, code: string): Promise<boolean>;
  invalidateOtp(email: string, purpose: string): Promise<void>;
}

@Injectable()
export class RedisOtpService implements OtpService {
  constructor(@Inject(CACHE_SERVICE) private readonly cache: CacheService) {}

  private getKey(email: string, purpose: string): string {
    return `slotly:otp:${purpose}:${email.toLowerCase().trim()}`;
  }

  private hashOtp(code: string): string {
    return createHash('sha256').update(code.trim()).digest('hex');
  }

  async createOtp(
    email: string,
    purpose: string,
    ttlSeconds: number = 600,
    cooldownSeconds: number = 60,
  ): Promise<string> {
    const key = this.getKey(email, purpose);
    const existing = await this.cache.get<OtpRecord>(key);

    if (existing && Date.now() < existing.resendAvailableAt) {
      const waitSeconds = Math.ceil(
        (existing.resendAvailableAt - Date.now()) / 1000,
      );
      throw new BadRequestException({
        code: 'OTP_COOLDOWN',
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        details: { waitSeconds },
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const code = randomInt(100000, 999999).toString();
    const codeHash = this.hashOtp(code);

    const record: OtpRecord = {
      codeHash,
      attempts: 0,
      maxAttempts: 5,
      resendAvailableAt: Date.now() + cooldownSeconds * 1000,
    };

    // Stored in Redis with TTL. Overwrites/invalidates any previous OTP!
    await this.cache.set(key, record, ttlSeconds);

    Logger.log(
      `\n=======================================================\n` +
        `[AUTH OTP GENERATED] To: ${email} | Purpose: ${purpose} | Code: >>> ${code} <<<\n` +
        `=======================================================\n`,
      'RedisOtpService',
    );

    return code;
  }

  async verifyOtp(
    email: string,
    purpose: string,
    code: string,
  ): Promise<boolean> {
    const key = this.getKey(email, purpose);
    const record = await this.cache.get<OtpRecord>(key);

    if (!record) {
      throw new BadRequestException({
        code: 'OTP_EXPIRED_OR_INVALID',
        message: 'Verification code is invalid or has expired.',
      });
    }

    if (record.attempts >= record.maxAttempts) {
      await this.cache.del(key);
      throw new BadRequestException({
        code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        message:
          'Maximum verification attempts exceeded. Please request a new code.',
      });
    }

    const inputHash = this.hashOtp(code);
    if (inputHash !== record.codeHash) {
      record.attempts += 1;
      await this.cache.set(key, record, 600);
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: `Incorrect code. ${record.maxAttempts - record.attempts} attempts remaining.`,
      });
    }

    // Single use: delete upon successful verification
    await this.cache.del(key);
    return true;
  }

  async invalidateOtp(email: string, purpose: string): Promise<void> {
    const key = this.getKey(email, purpose);
    await this.cache.del(key);
  }
}
