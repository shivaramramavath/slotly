// State machine pattern implementing academic timetable publishing lifecycle states and transition guards.
import { BadRequestException, ConflictException } from '@nestjs/common';
import type { ScheduleVersionStatus } from '@slotly/contracts';

/** Interface defining transition evaluation context with conflict counts and blueprint readiness. */
export interface PublishTransitionContext {
  conflicts?: Array<{ severity?: string }>;
  isBlueprintComplete?: boolean;
  comment?: string;
  userId?: string;
}

/** Interface defining publish state transitions and identity. */
export interface IPublishState {
  readonly name: ScheduleVersionStatus;
  canTransitionTo(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): boolean;
  validateTransition(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): void;
}

/** Base abstract class for publish states providing common transition checks and error formatting. */
export abstract class BasePublishState implements IPublishState {
  abstract readonly name: ScheduleVersionStatus;

  abstract canTransitionTo(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): boolean;

  validateTransition(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): void {
    if (!this.canTransitionTo(target, context)) {
      throw new BadRequestException({
        message: `Cannot transition timetable version from "${this.name}" to "${target}".`,
        code: 'INVALID_STATE_TRANSITION',
      });
    }
  }
}

/** State representing a draft timetable version. */
export class DraftState extends BasePublishState {
  readonly name: ScheduleVersionStatus = 'draft';

  canTransitionTo(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): boolean {
    if (target === 'editing' || target === 'ready' || target === 'archived') {
      return true;
    }
    if (target === 'validated') {
      return checkValidationGuards(context);
    }
    return false;
  }

  override validateTransition(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): void {
    if (target === 'validated') {
      assertValidationGuards(this.name, context);
      return;
    }
    super.validateTransition(target, context);
  }
}

/** State representing an active editing timetable version. */
export class EditingState extends BasePublishState {
  readonly name: ScheduleVersionStatus = 'editing';

  canTransitionTo(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): boolean {
    if (target === 'draft' || target === 'ready' || target === 'archived') {
      return true;
    }
    if (target === 'validated') {
      return checkValidationGuards(context);
    }
    return false;
  }

  override validateTransition(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): void {
    if (target === 'validated') {
      assertValidationGuards(this.name, context);
      return;
    }
    super.validateTransition(target, context);
  }
}

/** State representing a validated timetable version with 0 hard conflicts and complete blueprint. */
export class ValidatedState extends BasePublishState {
  readonly name: ScheduleVersionStatus = 'validated';

  canTransitionTo(target: ScheduleVersionStatus): boolean {
    return (
      target === 'pending_approval' ||
      target === 'editing' ||
      target === 'draft' ||
      target === 'approved' ||
      target === 'archived'
    );
  }
}

/** State representing a timetable version awaiting administrative approval. */
export class PendingApprovalState extends BasePublishState {
  readonly name: ScheduleVersionStatus = 'pending_approval';

  canTransitionTo(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): boolean {
    if (target === 'approved' || target === 'archived') {
      return true;
    }
    if (target === 'editing') {
      // Rejection returns to editing; rejection requires a review comment
      return (
        typeof context?.comment === 'string' &&
        context.comment.trim().length > 0
      );
    }
    return false;
  }

  override validateTransition(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): void {
    if (target === 'editing') {
      if (!context?.comment || context.comment.trim().length === 0) {
        throw new BadRequestException({
          message:
            'Rejecting a publication request and returning to editing requires a mandatory comment.',
          code: 'INVALID_STATE_TRANSITION',
        });
      }
      return;
    }
    super.validateTransition(target, context);
  }
}

/** State representing an approved timetable version ready for immutable publishing. */
export class ApprovedState extends BasePublishState {
  readonly name: ScheduleVersionStatus = 'approved';

  canTransitionTo(target: ScheduleVersionStatus): boolean {
    return (
      target === 'published' || target === 'editing' || target === 'archived'
    );
  }
}

/** State representing a sealed, published immutable timetable version. */
export class PublishedState extends BasePublishState {
  readonly name: ScheduleVersionStatus = 'published';

  canTransitionTo(target: ScheduleVersionStatus): boolean {
    // A published version can only transition to archived
    return target === 'archived';
  }

  override validateTransition(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): void {
    if (target !== 'archived') {
      throw new ConflictException({
        message:
          'Published timetable version is immutable and cannot be modified or re-opened.',
        code: 'VERSION_IMMUTABLE',
      });
    }
    super.validateTransition(target, context);
  }
}

/** State representing an archived timetable version. */
export class ArchivedState extends BasePublishState {
  readonly name: ScheduleVersionStatus = 'archived';

  canTransitionTo(): boolean {
    // Archived is a terminal state
    return false;
  }

  override validateTransition(): void {
    throw new ConflictException({
      message:
        'Archived timetable version is immutable and cannot be transitioned to any other state.',
      code: 'VERSION_IMMUTABLE',
    });
  }
}

/** Helper function checking if validation guards pass. */
function checkValidationGuards(context?: PublishTransitionContext): boolean {
  if (!context) return false;
  if (context.isBlueprintComplete !== true) return false;
  const hardConflicts = (context.conflicts || []).filter(
    (c) => c.severity === 'hard' || c.severity === 'error',
  );
  return hardConflicts.length === 0;
}

/** Helper function asserting validation guards with specific errors. */
function assertValidationGuards(
  current: ScheduleVersionStatus,
  context?: PublishTransitionContext,
): void {
  if (!context || context.isBlueprintComplete !== true) {
    throw new BadRequestException({
      message: `Cannot validate version from "${current}": Blueprint graph is not complete.`,
      code: 'INVALID_STATE_TRANSITION',
    });
  }
  const hardConflicts = (context.conflicts || []).filter(
    (c) => c.severity === 'hard' || c.severity === 'error',
  );
  if (hardConflicts.length > 0) {
    throw new BadRequestException({
      message: `Cannot validate version from "${current}": ${hardConflicts.length} hard conflict(s) remain unresolved.`,
      code: 'HARD_CONFLICTS_EXIST',
    });
  }
}

/**
 * State machine managing timetable version publish lifecycle.
 */
export class PublishStateMachine {
  private state: IPublishState;

  constructor(initialStatus: ScheduleVersionStatus = 'draft') {
    this.state = this.resolveState(initialStatus);
  }

  /** Resolves concrete state instance from status enum name. */
  private resolveState(status: ScheduleVersionStatus): IPublishState {
    switch (status) {
      case 'draft':
        return new DraftState();
      case 'editing':
      case 'ready':
        return new EditingState();
      case 'validated':
        return new ValidatedState();
      case 'pending_approval':
        return new PendingApprovalState();
      case 'approved':
        return new ApprovedState();
      case 'published':
        return new PublishedState();
      case 'archived':
        return new ArchivedState();
      default:
        return new DraftState();
    }
  }

  /** Returns the current status name. */
  getStatus(): ScheduleVersionStatus {
    return this.state.name;
  }

  /** Checks whether transition to target status is permitted. */
  canTransitionTo(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): boolean {
    return this.state.canTransitionTo(target, context);
  }

  /** Transitions to target status, applying guards and throwing if invalid. */
  transition(
    target: ScheduleVersionStatus,
    context?: PublishTransitionContext,
  ): ScheduleVersionStatus {
    this.state.validateTransition(target, context);
    this.state = this.resolveState(target);
    return this.state.name;
  }
}
