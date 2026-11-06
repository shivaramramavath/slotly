import { Injectable } from '@nestjs/common';
import { HealthResponse } from '@slotly/contracts';

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
