import type {
  BlueprintEdgeDto,
  BlueprintNodeDto,
  BlueprintOp,
  FixHint,
  ReasonCode,
} from '@slotly/contracts';

export interface GateContext {
  operation: BlueprintOp;
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

export interface GateResult {
  allowed: boolean;
  reasonCode?: ReasonCode;
  message?: string;
  fixHint?: FixHint;
}

export interface IGate {
  readonly name: string;
  evaluate(context: GateContext): Promise<GateResult> | GateResult;
}
