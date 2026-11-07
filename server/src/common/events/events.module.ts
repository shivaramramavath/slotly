// Core implementation for events.module in server/src/common/events.
import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus.service';

/** Class implementing events module. */
@Global()
@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class EventsModule {}
