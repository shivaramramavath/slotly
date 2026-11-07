// Strategy implementation for completion-rule.strategy.
import type { MissingField, NodeStatus } from '@slotly/contracts';

/** Interface defining structure for completion context. */
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

/** Interface defining structure for completion result. */
export interface CompletionResult {
  status: NodeStatus;
  missing: MissingField[];
}

/** Interface defining structure for completion rule strategy. */
export interface CompletionRuleStrategy {
  compute(
    data: Record<string, unknown>,
    context?: CompletionContext,
  ): CompletionResult;
}
