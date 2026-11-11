// Dialog allowing users to selectively copy configuration, pool, assignments, and rules from another node.
'use client';

import * as React from 'react';
import { Copy, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '../../services/blueprint.api';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { CopyNodeSettingsPart } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Props for CopySettingsDialog component. */
export interface CopySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  targetNodeId: string;
  className?: string | undefined;
}

const PARTS_OPTIONS: Array<{
  id: CopyNodeSettingsPart;
  label: string;
  description: string;
}> = [
  {
    id: 'fields',
    label: 'Node Configuration Fields',
    description: 'Working days, periods, duration, intake, and timing settings',
  },
  {
    id: 'pool',
    label: 'Resource Pool Additions & Exclusions',
    description: 'Assigned faculty, subjects, and rooms pool items',
  },
  {
    id: 'assignments',
    label: 'Subject Assignments',
    description: 'Subject-faculty-room schedule allocations (sections/batches only)',
  },
  {
    id: 'rules',
    label: 'Constraint Rules & Auto-fill Mode',
    description: 'Auto-fill borrow policies and custom node rule overrides',
  },
];

/** React component rendering Copy Settings modal dialog. */
export function CopySettingsDialog({
  isOpen,
  onClose,
  projectId,
  targetNodeId,
  className = '',
}: CopySettingsDialogProps) {
  const nodes = useBlueprintStore((s) => s.nodes);

  const targetNode = React.useMemo(
    () => nodes.find((n: BlueprintCanvasNode) => n.id === targetNodeId),
    [nodes, targetNodeId],
  );

  // Eligible source nodes (other nodes in graph)
  const candidateSourceNodes = React.useMemo(
    () => nodes.filter((n: BlueprintCanvasNode) => n.id !== targetNodeId),
    [nodes, targetNodeId],
  );

  const [selectedSourceId, setSelectedSourceId] = React.useState<string>(
    () => candidateSourceNodes[0]?.id || '',
  );
  const [selectedParts, setSelectedParts] = React.useState<CopyNodeSettingsPart[]>([
    'fields',
    'pool',
  ]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen || !targetNode) return null;

  const effectiveSourceId = selectedSourceId || candidateSourceNodes[0]?.id || '';

  const togglePart = (part: CopyNodeSettingsPart) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part],
    );
  };

  const handleCopy = async () => {
    if (!effectiveSourceId || selectedParts.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await blueprintApi.copyNodeSettings(projectId, targetNodeId, {
        sourceNodeId: effectiveSourceId,
        parts: selectedParts,
      });

      if (res.skippedParts && res.skippedParts.length > 0) {
        toast.warning(
          'Settings copied with warnings',
          `Applied: ${res.appliedParts.join(', ')}. Skipped: ${res.skippedParts
            .map((s: { part: string; reasonCode: string }) => `${s.part} (${s.reasonCode})`)
            .join(', ')}`,
        );
      } else {
        toast.success(
          'Settings copied',
          `Successfully applied ${res.appliedParts.join(', ')} to ${targetNode.data.label}.`,
        );
      }
      onClose();
    } catch (err) {
      toast.error('Copy failed', (err as Error).message || 'Unable to copy node settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Copy Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-0"
    >
      <div
        className={cn(
          'w-full max-w-md rounded-[14px] bg-[#0E0E0E] border border-[#232323] shadow-2xl overflow-hidden flex flex-col text-xs text-[#FAFAFA]',
          className,
        )}
      >
        {/* Header */}
        <div className="h-13 px-4 border-b border-[#232323] bg-[#0A0A0A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-[#FAFAFA]" />
            <h3 className="font-medium text-sm text-[#FAFAFA]">Copy Node Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-[8px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[11px] font-mono text-[#8A8A8A] block mb-1.5">
              Copy from source node:
            </label>
            <select
              value={effectiveSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border border-[#232323] text-xs text-[#FAFAFA] focus:border-[#FAFAFA] focus-visible:outline-none"
            >
              {candidateSourceNodes.map((n: BlueprintCanvasNode) => (
                <option key={n.id} value={n.id}>
                  {n.data.label} ({n.data.nodeType})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono text-[#8A8A8A] block">
              Select parts to copy into <span className="text-[#FAFAFA]">{targetNode.data.label}</span>:
            </label>
            <div className="space-y-1.5">
              {PARTS_OPTIONS.map((part) => {
                const isChecked = selectedParts.includes(part.id);
                return (
                  <div
                    key={part.id}
                    onClick={() => togglePart(part.id)}
                    className={cn(
                      'p-2.5 rounded-[8px] border transition-colors cursor-pointer select-none flex items-start gap-2.5',
                      isChecked
                        ? 'bg-[#161616] border-[#383838]'
                        : 'bg-[#111111] border-[#232323] hover:border-[#303030]',
                    )}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                        isChecked
                          ? 'bg-[#FAFAFA] border-[#FAFAFA] text-black'
                          : 'border-[#383838] bg-transparent',
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium text-xs text-[#FAFAFA]">{part.label}</div>
                      <div className="text-[11px] text-[#8A8A8A] mt-0.5">{part.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-13 px-4 border-t border-[#232323] bg-[#0A0A0A] flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-mono"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCopy}
            disabled={!selectedSourceId || selectedParts.length === 0 || isSubmitting}
            className="h-8 px-4 text-xs font-mono bg-[#FAFAFA] text-black hover:bg-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : null}
            Copy Selected Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
