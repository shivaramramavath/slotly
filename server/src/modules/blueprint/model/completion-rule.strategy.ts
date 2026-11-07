import type { MissingField, NodeStatus } from '@slotly/contracts';

export interface CompletionContext {
  parentNode?:
    | {
        type: string;
        data: Record<string, unknown>;
      }
    | undefined;
  siblingNodes?:
    | Array<{
        type: string;
        data: Record<string, unknown>;
      }>
    | undefined;
}

export interface CompletionResult {
  status: NodeStatus;
  missing: MissingField[];
}

export interface CompletionRuleStrategy {
  compute(
    data: Record<string, unknown>,
    context?: CompletionContext,
  ): CompletionResult;
}
