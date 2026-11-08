// Chain-of-responsibility coordinator running all 10 schedule move and placement validation rules.
import { Injectable } from '@nestjs/common';
import type { MoveValidationResultDto } from '@slotly/contracts';
import {
  MoveValidationContext,
  IMoveValidator,
} from './move-validator.interface';
import { VersionEditableValidator } from './version-editable.validator';
import { LockValidator } from './lock.validator';
import { BreakValidator } from './break.validator';
import { LabBlockValidator } from './lab-block.validator';
import { TargetFreeValidator } from './target-free.validator';
import { FacultyFreeValidator } from './faculty-free.validator';
import { RoomFreeValidator } from './room-free.validator';
import { FacultyAvailabilityValidator } from './faculty-availability.validator';
import { RoomAvailabilityValidator } from './room-availability.validator';
import { WorkloadValidator } from './workload.validator';

/** Injectable service providing move validator chain logic. */
@Injectable()
export class MoveValidatorChain {
  private readonly rootValidator: IMoveValidator;

  constructor() {
    const versionEditable = new VersionEditableValidator();
    const lock = new LockValidator();
    const breakVal = new BreakValidator();
    const labBlock = new LabBlockValidator();
    const targetFree = new TargetFreeValidator();
    const facultyFree = new FacultyFreeValidator();
    const roomFree = new RoomFreeValidator();
    const facultyAvail = new FacultyAvailabilityValidator();
    const roomAvail = new RoomAvailabilityValidator();
    const workload = new WorkloadValidator();

    // Wire chain
    versionEditable
      .setNext(lock)
      .setNext(breakVal)
      .setNext(labBlock)
      .setNext(targetFree)
      .setNext(facultyFree)
      .setNext(roomFree)
      .setNext(facultyAvail)
      .setNext(roomAvail)
      .setNext(workload);

    this.rootValidator = versionEditable;
  }

  /**
   * Evaluates move context through the full validator chain.
   */
  async validateMove(
    context: MoveValidationContext,
  ): Promise<MoveValidationResultDto> {
    const res = await this.rootValidator.validate(context);
    return res ?? { valid: true, suggestions: [] };
  }
}
