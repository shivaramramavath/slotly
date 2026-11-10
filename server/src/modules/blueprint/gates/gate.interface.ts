// Core implementation for gate.interface in server/src/modules/blueprint/gates.
import type {
  AssignmentOpPayload,
  BlueprintEdgeDto,
  BlueprintNodeDto,
  BlueprintOp,
  FixHint,
  PoolOpPayload,
  ReasonCode,
} from '@slotly/contracts';

/** Interface defining structure for gate context. */
export interface GateContext {
  operation: BlueprintOp;
  poolOperation?: PoolOpPayload | undefined;
  assignmentOperation?: AssignmentOpPayload | undefined;
  project: {
    id: string;
    status: string;
    isLocked?: boolean | undefined;
    isDeleted?: boolean | undefined;
  };
  user?:
    | {
        id: string;
        role: string;
        permissions?: string[] | undefined;
      }
    | undefined;
  graph: {
    nodes: BlueprintNodeDto[];
    edges: BlueprintEdgeDto[];
  };
}

/** Interface defining structure for gate result. */
export interface GateResult {
  allowed: boolean;
  reasonCode?: ReasonCode;
  message?: string;
  fixHint?: FixHint;
}

/** Interface defining structure for gate. */
export interface IGate {
  readonly name: string;
  evaluate(context: GateContext): Promise<GateResult> | GateResult;
}
