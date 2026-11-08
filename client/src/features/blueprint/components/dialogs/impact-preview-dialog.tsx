// React component for impact-preview-dialog.
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
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';

interface ImpactPreviewDialogProps {
  onConfirmDelete: (nodeId: string) => Promise<void>;
}

/** React component rendering impact preview dialog. */
export function ImpactPreviewDialog({ onConfirmDelete }: ImpactPreviewDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const impactNode = useBlueprintStore((s) => s.impactPreviewNode);
  const setImpactPreviewNode = useBlueprintStore((s) => s.setImpactPreviewNode);
  const nodes = useBlueprintStore((s) => s.nodes);

  if (!impactNode) return null;

  // Compute downstream descendants that will be cascade deleted
  const getDescendantIds = (nodeId: string): string[] => {
    const directChildren = nodes.filter((n) => n.data.parentId === nodeId);
    const childIds = directChildren.map((c) => c.id);
    const subDescendants = childIds.flatMap(getDescendantIds);
    return [...childIds, ...subDescendants];
  };

  const descendantIds = getDescendantIds(impactNode.id);
  const affectedDescendants = nodes.filter((n) => descendantIds.includes(n.id));

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(impactNode.id);
      setImpactPreviewNode(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={Boolean(impactNode)} onOpenChange={() => setImpactPreviewNode(null)}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#EF4444] mb-1">
          <AlertTriangle className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Delete Node: {impactNode.data.label}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Deleting this node will remove it and trigger a cascade deletion of all connected downstream elements.
        </DialogDescription>
      </DialogHeader>

      {/* Downstream Impact List */}
      <div className="my-3 p-3 bg-[#161616] border border-[#232323] rounded-md">
        <div className="text-xs font-mono text-[#FAFAFA] mb-1.5 flex items-center justify-between">
          <span>Downstream Ripple Impact</span>
          <span className="text-[#EF4444]">{affectedDescendants.length} descendant(s) affected</span>
        </div>

        {affectedDescendants.length > 0 ? (
          <ul className="max-h-32 overflow-y-auto space-y-1 text-xs text-[#8A8A8A] font-mono">
            {affectedDescendants.map((child) => (
              <li key={child.id} className="flex items-center gap-2">
                <span className="text-[#EF4444]">•</span>
                <span className="text-[#FAFAFA]">{child.data.label}</span>
                <span className="text-[10px] text-[#666666]">({child.data.nodeType})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#8A8A8A]">No downstream children will be affected.</p>
        )}
      </div>

      <DialogFooter className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setImpactPreviewNode(null)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{isDeleting ? 'Deleting...' : 'Confirm Cascade Delete'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
