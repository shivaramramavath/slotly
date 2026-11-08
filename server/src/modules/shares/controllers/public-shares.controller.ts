// HTTP controller for unauthenticated public timetable share views.
import { Controller, Get, Param } from '@nestjs/common';
import type { PublicShareViewDto } from '@slotly/contracts';
import { SharesService } from '../services/shares.service';

/** Controller exposing public read-only timetable views. */
@Controller('public/shares')
export class PublicSharesController {
  constructor(private readonly sharesService: SharesService) {}

  /** Resolves and returns the public read-only timetable for a share token. */
  @Get(':token')
  async getPublicShare(
    @Param('token') token: string,
  ): Promise<PublicShareViewDto> {
    return this.sharesService.resolvePublicShare(token);
  }
}
