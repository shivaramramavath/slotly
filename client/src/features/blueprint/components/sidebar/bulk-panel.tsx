// BulkPanel component rendering shared fields and batch actions when multiple nodes are selected.
'use client';

import * as React from 'react';
import { Layers, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

/** Props for BulkPanel component. */
export interface BulkPanelProps {
  projectId?: string | undefined;
  onUpdateNodes: (nodeIds: string[], data: Record<string, unknown>) => Promise<void> | void;
  className?: string | undefined;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** React component rendering multi-select bulk editing panel. */
export function BulkPanel({
  onUpdateNodes,
  className = '',
}: BulkPanelProps) {
  const selectedNodeIds = useBlueprintStore((s) => s.selectedNodeIds);
  const nodes = useBlueprintStore((s) => s.nodes);

  const selectedNodes = React.useMemo(
    () => nodes.filter((n) => selectedNodeIds.includes(n.id)),
    [nodes, selectedNodeIds],
  );

  const nodeTypes = React.useMemo(() => {
    return Array.from(new Set(selectedNodes.map((n) => n.data.nodeType)));
  }, [selectedNodes]);

  const [strength, setStrength] = React.useState<string>('');
  const [workingDays, setWorkingDays] = React.useState<number[]>([]);
  const [autoFillMode, setAutoFillMode] = React.useState<string>('');
  const [isApplying, setIsApplying] = React.useState(false);

  const toggleDay = (dayIndex: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort(),
    );
  };

  const handleApply = async () => {
    if (selectedNodeIds.length === 0) return;
    setIsApplying(true);
    try {
      const patch: Record<string, unknown> = {};
      if (strength.trim() !== '') {
        const num = Number(strength);
        if (!isNaN(num)) {
          patch['strength'] = num;
          patch['expectedStrength'] = num;
          patch['size'] = num;
        }
      }
      if (workingDays.length > 0) {
        patch['workingDays'] = workingDays;
      }
      if (autoFillMode) {
        patch['defaultAutoFillMode'] = autoFillMode;
        patch['autoFillMode'] = autoFillMode;
      }

      if (Object.keys(patch).length === 0) {
        toast.info('No changes', 'Please specify at least one field to update.');
        return;
      }

      await onUpdateNodes(selectedNodeIds, patch);
      toast.success(
        'Bulk update applied',
        `Successfully updated ${selectedNodeIds.length} nodes.`,
      );
    } catch (err) {
      toast.error('Bulk update failed', (err as Error).message || 'Failed to apply batch changes.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className={cn('p-4 space-y-5 text-xs text-[#FAFAFA] select-none', className)}>
      {/* Header */}
      <div className="p-3 rounded-[10px] bg-[#141414] border border-[#232323] space-y-1">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#FACC15]" />
          <span className="font-semibold text-sm text-[#FAFAFA]">
            {selectedNodeIds.length} Nodes Selected
          </span>
        </div>
        <p className="font-mono text-[11px] text-[#8A8A8A]">
          Types: {nodeTypes.join(', ')}
        </p>
      </div>

      {/* Shared Fields Section */}
      <div className="space-y-4">
        {/* Strength / Size */}
        <div>
          <label className="text-[11px] font-mono text-[#8A8A8A] block mb-1">
            Student Capacity / Strength
          </label>
          <input
            type="number"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            placeholder="Set strength across all selected..."
            className="w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border border-[#232323] text-xs text-[#FAFAFA] focus:border-[#FAFAFA] focus-visible:outline-none"
          />
        </div>

        {/* Working Days */}
        <div>
          <label className="text-[11px] font-mono text-[#8A8A8A] block mb-1.5">
            Instructional Days
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((day, idx) => {
              const dayNum = idx + 1;
              const isSelected = workingDays.includes(dayNum);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(dayNum)}
                  className={cn(
                    'h-7 px-2.5 rounded-[6px] text-xs font-mono border transition-colors',
                    isSelected
                      ? 'bg-[#FAFAFA] text-black border-[#FAFAFA] font-medium'
                      : 'bg-[#141414] text-[#8A8A8A] border-[#232323] hover:text-[#FAFAFA]',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* AutoFill Mode */}
        <div>
          <label className="text-[11px] font-mono text-[#8A8A8A] block mb-1">
            Auto-Fill Policy
          </label>
          <select
            value={autoFillMode}
            onChange={(e) => setAutoFillMode(e.target.value)}
            className="w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border border-[#232323] text-xs text-[#FAFAFA] focus:border-[#FAFAFA] focus-visible:outline-none"
          >
            <option value="">Leave unchanged</option>
            <option value="same_department">Same Department Only</option>
            <option value="allow_other_departments">Allow Cross-Department Borrow</option>
            <option value="off">Off (Manual only)</option>
          </select>
        </div>
      </div>

      {/* Apply Button */}
      <div className="pt-2">
        <Button
          variant="primary"
          onClick={handleApply}
          disabled={isApplying}
          className="w-full h-9 text-xs font-mono bg-[#FAFAFA] text-black hover:bg-white"
        >
          {isApplying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <Check className="h-3.5 w-3.5 mr-1.5" />
          )}
          Apply to {selectedNodeIds.length} Nodes
        </Button>
      </div>
    </div>
  );
}
