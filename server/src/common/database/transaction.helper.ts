// Core implementation for transaction.helper in server/src/common/database.
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

/** Injectable service providing transaction helper logic. */
@Injectable()
export class TransactionHelper {
  private readonly logger = new Logger(TransactionHelper.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Executes a callback within a MongoDB replica set transaction.
   * If any error occurs, the transaction automatically aborts.
   */
  async withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      return result!;
    } catch (error) {
      this.logger.error(
        `Transaction aborted due to error: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
