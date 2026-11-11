// Check tab rendering node-level requirements checklist, pool warnings, children summary, and Go-fix links.
'use client';

import * as React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blueprintApi } from '../../../services/blueprint.api';
import { useBlueprintStore } from '../../../store/blueprint.store';
import type { BlueprintCanvasNode } from '../../../types/canvas.types';
import type { NodeCheckResponseDto } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Props for NodeCheckTab component. */
export interface NodeCheckTabProps {
  projectId: string;
  node: BlueprintCanvasNode;
  onGoFixField?: (fieldName: string) => void;
  className?: string | undefined;
}

/** React component rendering checklist from GET /nodes/:id/check with fix links. */
export function NodeCheckTab({
  projectId,
  node,
  onGoFixField,
  className = '',
}: NodeCheckTabProps) {
  const [data, setData] = React.useState<NodeCheckResponseDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);

  const loadCheck = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blueprintApi.checkNode(projectId, node.id);
      setData(res);
    } catch (err) {
      setError((err as Error).message || 'Failed to run node validation check.');
    } finally {
      setLoading(false);
    }
  }, [projectId, node.id]);

  React.useEffect(() => {
    let active = true;
    void blueprintApi
      .checkNode(projectId, node.id)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError((err as Error).message || 'Failed to run node validation check.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [projectId, node.id]);

  if (loading && !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-[#8A8A8A] gap-2 h-64">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="font-mono text-xs">Checking node readiness...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertTriangle className="h-7 w-7 text-[#EF4444] mx-auto" />
        <p className="text-xs font-medium text-[#FAFAFA]">Unable to validate node</p>
        <p className="text-[11px] font-mono text-[#8A8A8A]">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadCheck()}
          className="h-7 text-xs font-mono gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  const check = data || {
    nodeId: node.id,
    isReady: node.data.effectiveStatus === 'complete',
    missingFields: node.data.missing.map((m) => m.field),
    warnings: [],
    childrenSummary: { total: 0, ready: 0, incomplete: 0 },
    fixHints: [],
  };

  const isReady = check.isReady && check.missingFields.length === 0;

  return (
    <div className={cn('p-4 space-y-5 text-xs text-[#FAFAFA] select-none', className)}>
      {/* Overall Node Readiness Header */}
      <div
        className={cn(
          'p-3 rounded-[10px] border flex items-center justify-between gap-3',
          isReady
            ? 'bg-[#0E1A11] border-[#1D3D24] text-[#22C55E]'
            : 'bg-[#1F190E] border-[#423114] text-[#FACC15]',
        )}
      >
        <div className="flex items-center gap-2.5">
          {isReady ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <div>
            <div className="font-medium text-xs text-[#FAFAFA]">
              {isReady ? 'Node Ready & Valid' : 'Incomplete Requirements'}
            </div>
            <div className="text-[11px] font-mono opacity-80 mt-0.5">
              {isReady
                ? 'All mandatory requirements satisfied.'
                : `${check.missingFields.length} missing requirement(s)`}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadCheck()}
          title="Re-run check"
          className="h-7 w-7 rounded-[6px] hover:bg-black/20 flex items-center justify-center text-inherit transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Required Fields Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs text-[#8A8A8A] uppercase tracking-wider font-mono">
            Mandatory Configuration
          </span>
          <span className="font-mono text-[11px] text-[#8A8A8A]">
            {check.missingFields.length === 0 ? 'All complete' : `${check.missingFields.length} to fix`}
          </span>
        </div>

        {check.missingFields.length === 0 ? (
          <div className="py-2 px-3 rounded-[8px] bg-[#111111] border border-[#232323] flex items-center gap-2 text-[11px] text-[#8A8A8A]">
            <CheckCircle className="h-3.5 w-3.5 text-[#22C55E]" />
            <span>All required fields are valid and saved.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {check.missingFields.map((field) => (
              <div
                key={field}
                className="p-2.5 rounded-[8px] bg-[#141414] border border-[#2B2B2B] hover:border-[#383838] flex items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <XCircle className="h-3.5 w-3.5 text-[#EF4444] shrink-0" />
                  <span className="font-mono text-xs text-[#FAFAFA] truncate">
                    {field} is required
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('node');
                    onGoFixField?.(field);
                  }}
                  className="h-6 px-2 text-[10px] font-mono gap-1 text-[#FAFAFA] border-[#383838] hover:border-[#FAFAFA] shrink-0"
                >
                  <span>Go fix</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pool & Consistency Warnings */}
      {check.warnings && check.warnings.length > 0 && (
        <div className="space-y-2">
          <span className="font-medium text-xs text-[#8A8A8A] uppercase tracking-wider font-mono">
            Pool & Assignment Warnings ({check.warnings.length})
          </span>
          <div className="space-y-1.5">
            {check.warnings.map((warn, i) => (
              <div
                key={`${warn.code}_${i}`}
                className="p-2.5 rounded-[8px] bg-[#16120C] border border-[#3A2912] space-y-1"
              >
                <div className="flex items-center gap-2 text-[#FACC15] font-mono text-[11px] font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{warn.code}</span>
                </div>
                <p className="text-[11px] text-[#FAFAFA] pl-5">{warn.message}</p>
                {warn.fixHint && (
                  <p className="text-[10px] font-mono text-[#8A8A8A] pl-5">
                    Hint: {warn.fixHint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Children Status Summary */}
      {check.childrenSummary && check.childrenSummary.total > 0 && (
        <div className="p-3 rounded-[10px] bg-[#111111] border border-[#232323] space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-[#8A8A8A]">
            <span>Child Nodes Summary</span>
            <span className="text-[#FAFAFA]">{check.childrenSummary.total} Total</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
            <div className="p-2 rounded bg-[#161616] border border-[#262626]">
              <div className="text-base font-semibold text-[#22C55E]">
                {check.childrenSummary.ready}
              </div>
              <div className="text-[#8A8A8A] mt-0.5">Ready</div>
            </div>
            <div className="p-2 rounded bg-[#161616] border border-[#262626]">
              <div className="text-base font-semibold text-[#FACC15]">
                {check.childrenSummary.incomplete}
              </div>
              <div className="text-[#8A8A8A] mt-0.5">Incomplete</div>
            </div>
          </div>
        </div>
      )}

      {/* Fix Hints List */}
      {check.fixHints && check.fixHints.length > 0 && (
        <div className="space-y-2">
          <span className="font-medium text-xs text-[#8A8A8A] uppercase tracking-wider font-mono">
            Recommended Next Actions
          </span>
          <div className="space-y-1">
            {check.fixHints.map((hint: string, idx: number) => (
              <div
                key={idx}
                className="p-2 rounded-[8px] bg-[#141414] border border-[#232323] flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="text-[#FAFAFA] truncate">{hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
