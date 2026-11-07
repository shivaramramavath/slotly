// Core implementation for gate-chain in server/src/modules/blueprint/gates.
import { Injectable } from '@nestjs/common';
import type { GateContext, GateResult, IGate } from './gate.interface';
import { NodeTypeRegistry } from '../model/node-type.registry';
import {
  CapacityGate,
  ConnectionEndpointGate,
  DuplicateNameGate,
  NoCycleGate,
  ParentCompleteGate,
  ParentExistsGate,
  ParentTypeAllowedGate,
  PermissionGate,
  ProjectNotLockedGate,
  QualificationGate,
  SingleParentGate,
} from './blueprint-gates';

/** Injectable service providing gate chain logic. */
@Injectable()
export class GateChain {
  private readonly gates: IGate[] = [];

  constructor(private readonly registry: NodeTypeRegistry) {
    this.registerDefaultGates();
  }

  private registerDefaultGates(): void {
    this.gates.push(
      new ProjectNotLockedGate(),
      new PermissionGate(),
      new ParentExistsGate(),
      new ParentTypeAllowedGate(this.registry),
      new ParentCompleteGate(this.registry),
      new SingleParentGate(),
      new NoCycleGate(),
      new DuplicateNameGate(),
      new CapacityGate(),
      new ConnectionEndpointGate(),
      new QualificationGate(),
    );
  }

  addGate(gate: IGate): void {
    this.gates.push(gate);
  }

  async evaluate(context: GateContext): Promise<GateResult> {
    for (const gate of this.gates) {
      const result = await gate.evaluate(context);
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  }
}
