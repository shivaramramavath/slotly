// Registry storing and resolving schedule mutation commands.
import { Injectable, NotFoundException } from '@nestjs/common';
import { IScheduleCommand } from './schedule-operation.interface';

/** Injectable registry managing registered schedule commands. */
@Injectable()
export class ScheduleOperationRegistry {
  private readonly commands = new Map<string, IScheduleCommand>();

  register(command: IScheduleCommand): void {
    this.commands.set(command.type, command);
  }

  getCommand<T = unknown, R = unknown>(type: string): IScheduleCommand<T, R> {
    const cmd = this.commands.get(type);
    if (!cmd) {
      throw new NotFoundException(
        `Schedule operation command '${type}' not registered`,
      );
    }
    return cmd as unknown as IScheduleCommand<T, R>;
  }

  has(type: string): boolean {
    return this.commands.has(type);
  }
}
