// Core implementation for queue.module in server/src/common/queue.
import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import {
  redisConfig,
  RedisConfig,
  queueConfig,
  QueueConfig,
} from '../../config';
import { WriteBehindService, WRITE_BEHIND_QUEUE } from './write-behind.service';

/** Class implementing app queue module. */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [
        ConfigModule.forFeature(redisConfig),
        ConfigModule.forFeature(queueConfig),
      ],
      inject: [redisConfig.KEY, queueConfig.KEY],
      useFactory: (redisConf: RedisConfig, queueConf: QueueConfig) => ({
        prefix: queueConf.prefix,
        connection: {
          host: redisConf.host,
          port: redisConf.port,
          password: redisConf.password || undefined,
          db: redisConf.db,
          tls: redisConf.tls ? {} : undefined,
        },
      }),
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
