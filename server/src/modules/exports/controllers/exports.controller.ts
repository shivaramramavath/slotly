// HTTP controller handling export job creation, polling, and file downloads.
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { Public } from '../../auth/guards/public.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateExportDtoSchema,
  type CreateExportDto,
  type ExportJobDto,
} from '@slotly/contracts';
import { ExportFacade } from '../services/export.facade';

/** Controller exposing timetable export endpoints. */
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportFacade: ExportFacade) {}

  /** Enqueues timetable export generation job. */
  @Post('projects/:projectId')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('TIMETABLE_EXPORT')
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueueExport(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(CreateExportDtoSchema)) dto: CreateExportDto,
    @Req() req: { user: RequestUser },
  ): Promise<ExportJobDto> {
    return this.exportFacade.enqueueExport(projectId, req.user.id, dto);
  }

  /** Polls export generation progress and status. */
  @Get(':jobId')
  @UseGuards(AuthGuard)
  async getStatus(
    @Param('jobId') jobId: string,
    @Req() req: { user: RequestUser },
  ): Promise<ExportJobDto> {
    return this.exportFacade.getJobStatus(jobId, req.user.id);
  }

  /** Streams exported file using valid signed token. */
  @Public()
  @Get('download/:token')
  async download(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, mimeType, fileName } =
      await this.exportFacade.resolveDownload(token);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
