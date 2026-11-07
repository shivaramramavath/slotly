// Core implementation for audit.module in server/src/common/audit.
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AuditLog, AuditLogSchema } from './audit-log.schema';
import { AuditService } from './audit.service';

/** Class implementing audit module. */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    BullModule.registerQueue({ name: 'audit' }),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
