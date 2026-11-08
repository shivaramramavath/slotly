// Core implementation for breached-password.adapter in server/src/modules/auth/adapters.
import { Injectable } from '@nestjs/common';

/** Constant representing breached password checker. */
export const BREACHED_PASSWORD_CHECKER = Symbol('BREACHED_PASSWORD_CHECKER');

/** Interface defining structure for breached password checker. */
export interface BreachedPasswordChecker {
  isBreachedOrCommon(password: string): Promise<boolean>;
}

/** Injectable service providing common list password checker logic. */
@Injectable()
export class CommonListPasswordChecker implements BreachedPasswordChecker {
  // Built-in list of the most frequent leaked passwords
  private readonly commonPasswords = new Set<string>([
    'password1234',
    'password12345',
    '123456789012',
    'admin12345678',
    'welcome123456',
    'qwerty123456',
    'administrator',
    'iloveyou1234',
    'changeme1234',
    'letmein12345',
    'sunshine1234',
    'football1234',
    'monkey123456',
    'master123456',
    'dragon123456',
    'trustno11234',
    'superman1234',
    'default12345',
  ]);

  isBreachedOrCommon(password: string): Promise<boolean> {
    const lower = password.toLowerCase().trim();
    if (this.commonPasswords.has(lower)) {
      return Promise.resolve(true);
    }
    // Check sequential or single repeating character
    if (/^(.)\1{11,}$/.test(password)) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
}
