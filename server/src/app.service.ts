// Domain service orchestrating app.service business logic.
import { Injectable } from '@nestjs/common';
import { HealthResponse } from '@slotly/contracts';

/** Injectable service providing app service logic. */
@Injectable()
export class AppService {
  getHello(): string {
    return 'Slotly API';
  }

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'slotly-server',
      version: '0.1.0',
      uptime: process.uptime(),
      dependencies: {
        mongodb: 'up',
        redis: 'up',
      },
    };
  }
}
