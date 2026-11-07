// Core implementation for constraint.registry in server/src/modules/engine/core.
import type { IConstraint } from './constraint.interface';

/** Class implementing constraint registry. */
export class ConstraintRegistry {
  private readonly constraints = new Map<string, IConstraint>();

  register(constraint: IConstraint): this {
    this.constraints.set(constraint.id, constraint);
    return this;
  }

  unregister(id: string): boolean {
    return this.constraints.delete(id);
  }

  get(id: string): IConstraint | undefined {
    return this.constraints.get(id);
  }

  has(id: string): boolean {
    return this.constraints.has(id);
  }

  getAll(): IConstraint[] {
    return Array.from(this.constraints.values());
  }

  getHardConstraints(): IConstraint[] {
    return this.getAll().filter((c) => c.type === 'hard');
  }

  getSoftConstraints(): IConstraint[] {
    return this.getAll().filter((c) => c.type === 'soft');
  }

  clear(): void {
    this.constraints.clear();
  }
}
