import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WriteBehindService, WRITE_BEHIND_QUEUE } from './write-behind.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: WRITE_BEHIND_QUEUE },
      { name: 'audit' },
      { name: 'notifications' },
    ),
  ],
  providers: [WriteBehindService],
  exports: [WriteBehindService, BullModule],
})
export class AppQueueModule {}
