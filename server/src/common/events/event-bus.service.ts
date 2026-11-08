// Domain service orchestrating event-bus.service business logic.
import { Injectable, Logger } from '@nestjs/common';

/** Type alias for event handler. */
export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/** Injectable service providing event bus logic. */
@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<string, Set<EventHandler<unknown>>>();

  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    const typedHandler = handler as EventHandler<unknown>;
    set.add(typedHandler);

    // Return unsubscribe function
    return () => {
      set.delete(typedHandler);
      if (set.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  async publish<T>(event: string, payload: T): Promise<void> {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;

    const promises: Promise<void>[] = [];
    for (const handler of set) {
      try {
        const result = handler(payload);
        if (result instanceof Promise) {
          promises.push(
            result.catch((err: unknown) => {
              this.logger.error(
                `Error in event handler for "${event}": ${err instanceof Error ? err.message : String(err)}`,
              );
            }),
          );
        }
      } catch (err: unknown) {
        this.logger.error(
          `Synchronous error in event handler for "${event}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
}
