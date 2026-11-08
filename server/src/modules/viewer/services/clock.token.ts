// Clock token and system clock abstraction for injectable time testing.
import { Injectable } from '@nestjs/common';

/** Interface defining structure for injectable clock. */
export interface IClock {
  /** Returns the current date and time. */
  now(): Date;
}

/** Injection token for Clock implementation. */
export const CLOCK = Symbol('CLOCK');

/** Default system clock implementation returning real-world local time. */
@Injectable()
export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
