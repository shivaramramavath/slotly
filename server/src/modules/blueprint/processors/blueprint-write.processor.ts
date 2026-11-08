// Queue processor handling background jobs for blueprint-write.processor.
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  WRITE_BEHIND_QUEUE,
  WriteBehindService,
} from '../../../common/queue/write-behind.service';
import { CachedBlueprintRepository } from '../repositories/cached-blueprint.repository';
import type { NodePosition } from '@slotly/contracts';

/** Interface defining structure for sync node job data. */
export interface SyncNodeJobData {
  entity: string;
  id: string;
  projectId?: string | undefined;
  payload: {
    position?: NodePosition | undefined;
    data?: Record<string, unknown> | undefined;
  };
  timestamp: number;
}

/** BullMQ queue processor for blueprint write processor jobs. */
@Processor(WRITE_BEHIND_QUEUE)
export class BlueprintWriteProcessor extends WorkerHost {
  private readonly logger = new Logger(BlueprintWriteProcessor.name);

  constructor(
    private readonly blueprintRepo: CachedBlueprintRepository,
    private readonly writeBehindService: WriteBehindService,
  ) {
    super();
  }

  async process(job: Job<SyncNodeJobData>): Promise<{ success: boolean }> {
    if (job.data.entity !== 'node') {
      return { success: true };
    }

    const { id: nodeId, projectId, payload } = job.data;
    if (!projectId) {
      this.logger.warn(
        `Received node sync job ${job.id} without projectId, skipping`,
      );
      return { success: false };
    }

    try {
      this.logger.debug(
        `Persisting coalesced write-behind for node ${nodeId} in project ${projectId}`,
      );
      await this.blueprintRepo.updateNode(projectId, nodeId, {
        position: payload.position,
        data: payload.data,
      });

      return { success: true };
    } catch (err) {
      this.logger.error(
        `Failed to persist write-behind for node ${nodeId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    } finally {
      await this.writeBehindService.decrementPendingWrites(
        projectId,
        `node:${nodeId}`,
      );
    }
  }
}
