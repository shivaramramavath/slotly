// Issues summary component highlighting unresolved requirements with auto-fix trigger.
'use client';

import { AlertTriangle, Wand2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatIssueLabel } from '../canvas/issue-label';
import type { BlueprintCanvasNode } from '../../types/canvas.types';

/** Props for IssuesSummary component. */
export interface IssuesSummaryProps {
  node: BlueprintCanvasNode;
  onAutoFix: () => void;
  onJumpToField: (field: string) => void;
  className?: string | undefined;
}

/** React component rendering issues banner with 2px yellow left indicator and jump-to-field rows. */
export function IssuesSummary({
  node,
  onAutoFix,
  onJumpToField,
  className = '',
}: IssuesSummaryProps) {
  const missing = node.data.missing || [];
  const missingCount = missing.length;

  if (missingCount === 0) return null;

  return (
    <div
      className={`rounded-[12px] bg-[#141414] border border-[#232323] border-l-2 border-l-[#FACC15] p-3 space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#FACC15] shrink-0" />
          <span className="text-xs font-medium text-[#FAFAFA]">
            {missingCount} missing requirement{missingCount > 1 ? 's' : ''}
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAutoFix}
          className="h-7 px-2.5 text-[11px] font-mono gap-1.5 border-[#383838] hover:border-[#FAFAFA] text-[#FAFAFA] bg-[#111111]"
        >
          <Wand2 className="h-3 w-3 text-[#FACC15]" />
          <span>Fix automatically</span>
        </Button>
      </div>

      <div className="space-y-1 pt-1 border-t border-[#232323]">
        {missing.map((item, idx) => {
          const rawKey = typeof item === 'string' ? item : item.field;
          const message = typeof item === 'string' ? formatIssueLabel(item) : item.message || formatIssueLabel(item.field);

          return (
            <button
              key={`${rawKey}-${idx}`}
              type="button"
              onClick={() => onJumpToField(rawKey)}
              aria-label={`Jump to ${rawKey}: ${message}`}
              className="w-full text-left px-2 py-1.5 rounded-[8px] bg-[#111111] hover:bg-[#181818] border border-transparent hover:border-[#232323] flex items-center justify-between gap-2 transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#FAFAFA] truncate group-hover:text-white">{message}</p>
                <p className="font-mono text-[10px] text-[#8A8A8A] truncate">missing: {rawKey}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[#8A8A8A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
