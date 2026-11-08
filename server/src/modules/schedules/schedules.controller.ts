// HTTP controller handling timetable schedule slot queries, moves, mutations, locks, and history.
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Query,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  MoveSlotDtoSchema,
  SwapSlotsDtoSchema,
  EditSlotDtoSchema,
  BulkSlotsDtoSchema,
  MergeSlotDtoSchema,
  SplitSlotDtoSchema,
  LockSlotDtoSchema,
  UpdatePeriodsDtoSchema,
} from '@slotly/contracts';
import type {
  MoveSlotDto,
  SwapSlotsDto,
  EditSlotDto,
  BulkSlotsDto,
  MergeSlotDto,
  SplitSlotDto,
  LockSlotDto,
  UpdatePeriodsDto,
} from '@slotly/contracts';
import { SchedulesService } from './services/schedules.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditService } from '../../common/audit/audit.service';

/** Controller exposing REST endpoints for schedule versions and timetable studio slots. */
@Controller('versions/:versionId')
@UseGuards(AuthGuard, PermissionsGuard)
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly auditService: AuditService,
  ) {}

  private extractRevision(ifMatch?: string): number | undefined {
    if (!ifMatch) return undefined;
    const clean = ifMatch.replace(/["'W/]/g, '').trim();
    const parsed = parseInt(clean, 10);
    return isNaN(parsed) ? undefined : parsed;
  }

  @Get('slots')
  @RequirePermissions('TIMETABLE_READ')
  async getSlots(
    @Param('versionId') versionId: string,
    @Query('sectionId') sectionId?: string,
    @Query('facultyId') facultyId?: string,
    @Query('roomId') roomId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('day') day?: string,
  ) {
    const parsedDay = day !== undefined ? parseInt(day, 10) : undefined;
    return this.schedulesService.getScheduleEntries({
      versionId,
      sectionId,
      facultyId,
      roomId,
      subjectId,
      day: isNaN(parsedDay!) ? undefined : parsedDay,
    });
  }

  @Post('slots/validate-move')
  @RequirePermissions('TIMETABLE_READ')
  @HttpCode(HttpStatus.OK)
  async validateMove(
    @Param('versionId') versionId: string,
    @Body('slotId') slotId: string,
    @Body(new ZodValidationPipe(MoveSlotDtoSchema)) dto: MoveSlotDto,
  ) {
    return this.schedulesService.validateMove(versionId, slotId, dto);
  }

  @Post('slots/:slotId/move')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async moveSlot(
    @Param('versionId') versionId: string,
    @Param('slotId') slotId: string,
    @Body(new ZodValidationPipe(MoveSlotDtoSchema)) dto: MoveSlotDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'move',
      { ...dto, slotId },
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_MOVE',
      userId,
      { type: 'version', id: result.versionId },
      { slotId, day: dto.targetDay, period: dto.targetStartPeriod },
    );

    return result;
  }

  @Patch('slots/:slotId')
  @RequirePermissions('TIMETABLE_EDIT')
  async editSlot(
    @Param('versionId') versionId: string,
    @Param('slotId') slotId: string,
    @Body(new ZodValidationPipe(EditSlotDtoSchema)) dto: EditSlotDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'edit',
      { ...dto, slotId },
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_EDIT',
      userId,
      { type: 'version', id: result.versionId },
      { slotId, ...dto },
    );

    return result;
  }

  @Post('slots/swap')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async swapSlots(
    @Param('versionId') versionId: string,
    @Body(new ZodValidationPipe(SwapSlotsDtoSchema)) dto: SwapSlotsDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'swap',
      dto,
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_SWAP',
      userId,
      { type: 'version', id: result.versionId },
      dto,
    );

    return result;
  }

  @Delete('slots/:slotId')
  @RequirePermissions('TIMETABLE_EDIT')
  async clearSlot(
    @Param('versionId') versionId: string,
    @Param('slotId') slotId: string,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'clear',
      { slotId },
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_CLEAR',
      userId,
      { type: 'version', id: result.versionId },
      { slotId },
    );

    return result;
  }

  @Post('slots/bulk')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async bulkSlots(
    @Param('versionId') versionId: string,
    @Body(new ZodValidationPipe(BulkSlotsDtoSchema)) dto: BulkSlotsDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'bulk',
      dto,
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_BULK',
      userId,
      { type: 'version', id: result.versionId },
      { action: dto.action, count: dto.slotIds.length },
    );

    return result;
  }

  @Post('slots/:slotId/merge')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async mergeSlot(
    @Param('versionId') versionId: string,
    @Param('slotId') slotId: string,
    @Body(new ZodValidationPipe(MergeSlotDtoSchema)) dto: MergeSlotDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'merge',
      { ...dto, slotId },
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_MERGE',
      userId,
      { type: 'version', id: result.versionId },
      { slotId, span: dto.span },
    );

    return result;
  }

  @Post('slots/:slotId/split')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async splitSlot(
    @Param('versionId') versionId: string,
    @Param('slotId') slotId: string,
    @Body(new ZodValidationPipe(SplitSlotDtoSchema)) dto: SplitSlotDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'split',
      { ...dto, slotId },
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_SPLIT',
      userId,
      { type: 'version', id: result.versionId },
      { slotId },
    );

    return result;
  }

  @Post('slots/lock')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async lockSlots(
    @Param('versionId') versionId: string,
    @Body(new ZodValidationPipe(LockSlotDtoSchema)) dto: LockSlotDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.executeOperation(
      versionId,
      'lock',
      dto,
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_SLOT_LOCK',
      userId,
      { type: 'version', id: result.versionId },
      dto,
    );

    return result;
  }

  @Post('undo')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async undo(
    @Param('versionId') versionId: string,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.undo(versionId, userId, rev);

    void this.auditService.log(
      'SCHEDULE_UNDO',
      userId,
      { type: 'version', id: versionId },
      {},
    );

    return result;
  }

  @Post('redo')
  @RequirePermissions('TIMETABLE_EDIT')
  @HttpCode(HttpStatus.OK)
  async redo(
    @Param('versionId') versionId: string,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.redo(versionId, userId, rev);

    void this.auditService.log(
      'SCHEDULE_REDO',
      userId,
      { type: 'version', id: versionId },
      {},
    );

    return result;
  }

  @Get('periods')
  @RequirePermissions('TIMETABLE_READ')
  async getPeriods(@Param('versionId') versionId: string) {
    return this.schedulesService.getPeriods(versionId);
  }

  @Put('periods')
  @RequirePermissions('TIMETABLE_EDIT')
  async updatePeriods(
    @Param('versionId') versionId: string,
    @Body(new ZodValidationPipe(UpdatePeriodsDtoSchema)) dto: UpdatePeriodsDto,
    @Headers('if-match') ifMatch?: string,
    @Req() req?: Request & { user: { id: string } },
  ) {
    const userId = req?.user?.id || 'system';
    const rev = this.extractRevision(ifMatch);
    const result = await this.schedulesService.updatePeriods(
      versionId,
      dto,
      userId,
      rev,
    );

    void this.auditService.log(
      'SCHEDULE_PERIODS_UPDATE',
      userId,
      { type: 'version', id: versionId },
      { periodsPerDay: dto.periodsPerDay },
    );

    return result;
  }
}
