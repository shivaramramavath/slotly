// Core implementation for revision.helper in server/src/common/concurrency.
import { HttpException, HttpStatus } from '@nestjs/common';
import { RevisionConflict } from '@slotly/contracts';

/** Class implementing revision conflict exception. */
export class RevisionConflictException extends HttpException {
  public readonly code = 'REVISION_CONFLICT';
  public readonly details: RevisionConflict;

  constructor(
    currentRevision: number,
    rejectedRevision: number,
    currentState?: unknown,
  ) {
    const details: RevisionConflict = {
      code: 'REVISION_CONFLICT',
      message: `Revision mismatch: server is at ${currentRevision}, client provided ${rejectedRevision}`,
      currentRevision,
      rejectedRevision,
      currentState,
    };
    super(details.message, HttpStatus.CONFLICT);
    this.details = details;
  }
}

/** Class implementing revision helper. */
export class RevisionHelper {
  /**
   * Asserts that expectedRevision matches actual currentRevision.
   * Throws RevisionConflictException (HTTP 409) if they differ.
   */
  static assertMatches(
    currentRevision: number,
    expectedRevision: number | string | undefined,
    currentState?: unknown,
  ): void {
    if (expectedRevision === undefined || expectedRevision === null) {
      return;
    }
    const parsedExpected =
      typeof expectedRevision === 'string'
        ? parseInt(expectedRevision, 10)
        : expectedRevision;

    if (isNaN(parsedExpected) || currentRevision !== parsedExpected) {
      throw new RevisionConflictException(
        currentRevision,
        isNaN(parsedExpected) ? -1 : parsedExpected,
        currentState,
      );
    }
  }
}
