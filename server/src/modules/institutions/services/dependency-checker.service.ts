import { Injectable, BadRequestException } from '@nestjs/common';

export interface BaseEntityRecord {
  id?: string | undefined;
  _id?: unknown;
  name?: string | undefined;
  code?: string | undefined;
  isDeleted?: boolean | undefined;
}

@Injectable()
export class DependencyCheckerService {
  /**
   * Asserts that a parent node exists and is not soft-deleted.
   * Mirrors G1 Creation Gate in BLUEPRINT_RULES.md.
   */
  assertParentActive<T extends BaseEntityRecord>(
    parent: T | null | undefined,
    parentType: string,
    parentId: string,
  ): asserts parent is T {
    if (!parent || parent.isDeleted) {
      throw new BadRequestException({
        code: 'PARENT_MISSING',
        message: `Parent ${parentType} with ID '${parentId}' does not exist or is inactive.`,
        details: { parentType, parentId },
      });
    }
  }

  /**
   * Asserts that an entity has zero active dependent children before permitting soft deletion.
   * Mirrors G4 Delete with Impact in BLUEPRINT_RULES.md.
   */
  assertNoActiveChildren(
    count: number,
    childType: string,
    parentName: string,
  ): void {
    if (count > 0) {
      throw new BadRequestException({
        code: 'HAS_DEPENDENT_CHILDREN',
        message: `Cannot delete '${parentName}' because it has ${count} active ${childType}(s). Remove or reassign all dependent items first.`,
        details: { childType, count, parentName },
      });
    }
  }

  /**
   * Asserts that sum of batch sizes does not exceed section strength.
   * Mirrors Batch rule in BLUEPRINT_RULES.md.
   */
  assertBatchCapacities(
    batches: Array<{ name: string; size: number }>,
    sectionStrength: number,
  ): void {
    const totalBatchSize = batches.reduce((sum, b) => sum + b.size, 0);
    if (totalBatchSize > sectionStrength) {
      throw new BadRequestException({
        code: 'CAPACITY_EXCEEDED',
        message: `Combined batch sizes (${totalBatchSize}) exceed section strength (${sectionStrength}).`,
        details: { totalBatchSize, sectionStrength },
      });
    }
  }
}
