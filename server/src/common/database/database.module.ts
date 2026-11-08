// Core implementation for database.module in server/src/common/database.
import { Module } from '@nestjs/common';
import { TransactionHelper } from './transaction.helper';

/** Database module exporting TransactionHelper. */
@Module({
  providers: [TransactionHelper],
  exports: [TransactionHelper],
})
export class DatabaseModule {}
