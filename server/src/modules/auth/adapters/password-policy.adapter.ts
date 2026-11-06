import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as argon2 from 'argon2';
import { BREACHED_PASSWORD_CHECKER } from './breached-password.adapter';
import type { BreachedPasswordChecker } from './breached-password.adapter';

export const PASSWORD_POLICY = Symbol('PASSWORD_POLICY');

export interface PasswordPolicy {
  validate(password: string): Promise<void>;
  assertNotReused(password: string, history: string[]): Promise<void>;
  hash(password: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

@Injectable()
export class StandardPasswordPolicy implements PasswordPolicy {
  constructor(
    @Inject(BREACHED_PASSWORD_CHECKER)
    private readonly breachedChecker: BreachedPasswordChecker,
  ) {}

  async validate(password: string): Promise<void> {
    if (!password || password.length < 12) {
      throw new BadRequestException({
        code: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 12 characters long.',
      });
    }

    if (password.length > 128) {
      throw new BadRequestException({
        code: 'PASSWORD_TOO_LONG',
        message: 'Password must not exceed 128 characters.',
      });
    }

    const isBreached = await this.breachedChecker.isBreachedOrCommon(password);
    if (isBreached) {
      throw new BadRequestException({
        code: 'PASSWORD_BREACHED_OR_COMMON',
        message:
          'This password is too common or appears in data breaches. Please choose a more unique passphrase.',
      });
    }
  }

  async assertNotReused(password: string, history: string[]): Promise<void> {
    for (const previousHash of history) {
      try {
        const matches = await argon2.verify(previousHash, password);
        if (matches) {
          throw new BadRequestException({
            code: 'PASSWORD_RECENTLY_USED',
            message:
              'You cannot reuse a recent password. Please select a new one.',
          });
        }
      } catch (err: unknown) {
        if (err instanceof BadRequestException) throw err;
        // ignore argon2 format errors
      }
    }
  }

  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
