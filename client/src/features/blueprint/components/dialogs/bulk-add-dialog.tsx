'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import type { BlueprintNodeType } from '@slotly/contracts';

interface BulkAddDialogProps {
  onAddBatchNodes: (
    items: Array<{ type: BlueprintNodeType; parentId: string; name: string; config?: Record<string, unknown> }>,
  ) => Promise<void>;
}

export function BulkAddDialog({ onAddBatchNodes }: BulkAddDialogProps) {
  const isBulkAddOpen = useBlueprintStore((s) => s.isBulkAddOpen);
  const setIsBulkAddOpen = useBlueprintStore((s) => s.setIsBulkAddOpen);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const nodes = useBlueprintStore((s) => s.nodes);

  const [mode, setMode] = useState<'sections' | 'semesters' | 'batches'>('sections');
  const [count, setCount] = useState(4);
  const [prefix, setPrefix] = useState('Section ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!isBulkAddOpen) return null;

  const handleApply = async () => {
    if (!selectedNode) {
      toast.error('No parent node selected', 'Please select a parent node first.');
      return;
    }

    if (selectedNode.data.effectiveStatus !== 'complete') {
      toast.error('Parent incomplete', `Please complete '${selectedNode.data.label}' first (G1).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const items: Array<{
        type: BlueprintNodeType;
        parentId: string;
        name: string;
        config?: Record<string, unknown>;
      }> = [];

      if (mode === 'sections') {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (let i = 0; i < count; i++) {
          const letter = letters[i] || String(i + 1);
          items.push({
            type: 'section',
            parentId: selectedNode.id,
            name: `${prefix}${letter}`,
            config: { strength: 60 },
          });
        }
      } else if (mode === 'semesters') {
        for (let i = 1; i <= count; i++) {
          items.push({
            type: 'semester',
            parentId: selectedNode.id,
            name: `Semester ${i}`,
            config: { number: i },
          });
        }
      } else if (mode === 'batches') {
        for (let i = 1; i <= count; i++) {
          items.push({
            type: 'batch',
            parentId: selectedNode.id,
            name: `Batch B${i}`,
            config: { size: 20 },
          });
        }
      }

      await onAddBatchNodes(items);
      setIsBulkAddOpen(false);
      toast.success('Bulk add complete', `Generated ${items.length} child nodes.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <Layers className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Bulk Add Child Nodes
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Quickly generate a sequence of structured children under the selected parent.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 space-y-3">
        {selectedNode && (
          <div className="p-2.5 rounded bg-[#161616] border border-[#232323] text-xs font-mono flex items-center justify-between">
            <span className="text-[#8A8A8A]">Target Parent:</span>
            <span className="text-[#FAFAFA] font-semibold">{selectedNode.data.label}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Pattern</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={mode === 'sections' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setMode('sections');
                setPrefix('Section ');
                setCount(4);
              }}
              className="text-xs"
            >
              Sections (A-D)
            </Button>
            <Button
              variant={mode === 'semesters' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setMode('semesters');
                setCount(8);
              }}
              className="text-xs"
            >
              Semesters (1-8)
            </Button>
            <Button
              variant={mode === 'batches' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setMode('batches');
                setCount(3);
              }}
              className="text-xs"
            >
              Batches (B1-B3)
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Count</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Prefix</label>
            <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          </div>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsBulkAddOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApply}
          disabled={isSubmitting || !selectedNode}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isSubmitting ? 'Generating...' : 'Generate Nodes'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
