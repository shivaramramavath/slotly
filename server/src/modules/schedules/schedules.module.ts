// NestJS feature module packaging schedules, occupancy indexes, validators, and studio operations.
import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ScheduleEntry,
  ScheduleEntrySchema,
} from './schemas/schedule-entry.schema';
import {
  ScheduleOccupancy,
  ScheduleOccupancySchema,
} from './schemas/schedule-occupancy.schema';
import {
  ScheduleOperation,
  ScheduleOperationSchema,
} from './schemas/schedule-operation.schema';
import {
  ScheduleVersion,
  ScheduleVersionSchema,
} from '../builds/schemas/schedule-version.schema';
import { ScheduleEntryRepository } from './repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from './repositories/schedule-occupancy.repository';
import { ScheduleOperationRepository } from './repositories/schedule-operation.repository';
import { MoveValidatorChain } from './validators/move-validator-chain';
import { ScheduleOperationRegistry } from './operations/schedule-operation.registry';
import { MoveSlotOperation } from './operations/move-slot.operation';
import { EditSlotOperation } from './operations/edit-slot.operation';
import { SwapSlotsOperation } from './operations/swap-slots.operation';
import { ClearSlotOperation } from './operations/clear-slot.operation';
import { MergeSlotOperation } from './operations/merge-slot.operation';
import { SplitSlotOperation } from './operations/split-slot.operation';
import { LockSlotOperation } from './operations/lock-slot.operation';
import { ApplySuggestionOperation } from './operations/apply-suggestion.operation';
import { CopyPasteOperation } from './operations/copy-paste.operation';
import { BulkSlotsOperation } from './operations/bulk-slots.operation';
import { ChangePeriodConfigOperation } from './operations/change-period-config.operation';
import { ScheduleGateway } from './gateways/schedule.gateway';
import { SchedulesService } from './services/schedules.service';
import { ScheduleMigrationService } from './migrations/schedule-migration.service';
import { SchedulesController } from './schedules.controller';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { EngineModule } from '../engine/engine.module';
import { BlueprintModule } from '../blueprint/blueprint.module';
import { BuildsModule } from '../builds/builds.module';
import { CacheModule } from '../../common/cache/cache.module';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../../common/audit/audit.module';

/** NestJS feature module configuring schedule entries, occupancies, operations, and websocket gateway. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScheduleEntry.name, schema: ScheduleEntrySchema },
      { name: ScheduleOccupancy.name, schema: ScheduleOccupancySchema },
      { name: ScheduleOperation.name, schema: ScheduleOperationSchema },
      { name: ScheduleVersion.name, schema: ScheduleVersionSchema },
    ]),
    DatabaseModule,
    CacheModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => EngineModule),
    forwardRef(() => BuildsModule),
    forwardRef(() => BlueprintModule),
    AuditModule,
  ],
  controllers: [SchedulesController],
  providers: [
    ScheduleEntryRepository,
    ScheduleOccupancyRepository,
    ScheduleOperationRepository,
    MoveValidatorChain,
    ScheduleOperationRegistry,
    MoveSlotOperation,
    EditSlotOperation,
    SwapSlotsOperation,
    ClearSlotOperation,
    MergeSlotOperation,
    SplitSlotOperation,
    LockSlotOperation,
    ApplySuggestionOperation,
    CopyPasteOperation,
    BulkSlotsOperation,
    ChangePeriodConfigOperation,
    ScheduleGateway,
    SchedulesService,
    ScheduleMigrationService,
  ],
  exports: [
    ScheduleEntryRepository,
    ScheduleOccupancyRepository,
    ScheduleOperationRepository,
    SchedulesService,
    ScheduleMigrationService,
    MoveValidatorChain,
    ScheduleGateway,
  ],
})
export class SchedulesModule implements OnModuleInit {
  constructor(
    private readonly registry: ScheduleOperationRegistry,
    private readonly moveOp: MoveSlotOperation,
    private readonly editOp: EditSlotOperation,
    private readonly swapOp: SwapSlotsOperation,
    private readonly clearOp: ClearSlotOperation,
    private readonly mergeOp: MergeSlotOperation,
    private readonly splitOp: SplitSlotOperation,
    private readonly lockOp: LockSlotOperation,
    private readonly applySuggestionOp: ApplySuggestionOperation,
    private readonly copyPasteOp: CopyPasteOperation,
    private readonly bulkOp: BulkSlotsOperation,
    private readonly changePeriodConfigOp: ChangePeriodConfigOperation,
  ) {}

  onModuleInit() {
    this.registry.register(this.moveOp);
    this.registry.register(this.editOp);
    this.registry.register(this.swapOp);
    this.registry.register(this.clearOp);
    this.registry.register(this.mergeOp);
    this.registry.register(this.splitOp);
    this.registry.register(this.lockOp);
    this.registry.register(this.applySuggestionOp);
    this.registry.register(this.copyPasteOp);
    this.registry.register(this.bulkOp);
    this.registry.register(this.changePeriodConfigOp);
  }
}
