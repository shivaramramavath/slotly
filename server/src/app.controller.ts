// HTTP controller handling app.controller endpoints.
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { HealthResponse } from '@slotly/contracts';

/** Controller handling app controller HTTP endpoints. */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
