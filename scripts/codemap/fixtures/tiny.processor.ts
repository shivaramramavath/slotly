// Tiny queue processor fixture.
import { Processor, Process } from '@nestjs/bullmq';

@Processor('tiny-queue')
export class TinyProcessor {
  @Process('tiny-job')
  handleJob(): void {}
}
