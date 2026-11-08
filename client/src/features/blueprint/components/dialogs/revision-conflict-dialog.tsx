// React component for revision-conflict-dialog.
'use client';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';

interface RevisionConflictDialogProps {
  onReloadServerState: () => Promise<void>;
  onForceOverwrite: () => Promise<void>;
}

/** React component rendering revision conflict dialog. */
export function RevisionConflictDialog({
  onReloadServerState,
  onForceOverwrite,
}: RevisionConflictDialogProps) {
  const conflict = useBlueprintStore((s) => s.conflictState);
  const setConflictState = useBlueprintStore((s) => s.setConflictState);

  if (!conflict) return null;

  return (
    <Dialog open={Boolean(conflict)} onOpenChange={() => setConflictState(null)}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#EF4444] mb-1">
          <AlertTriangle className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Revision Conflict Detected
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Another collaborator committed changes to this blueprint while you were editing.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 p-3 bg-[#161616] border border-[#232323] rounded-md space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-[#8A8A8A]">
          <span>Server Revision:</span>
          <span className="text-[#22C55E] font-bold">rev {conflict.currentRevision}</span>
        </div>
        <div className="flex items-center justify-between text-[#8A8A8A]">
          <span>Your Local Revision:</span>
          <span className="text-[#FACC15] font-bold">rev {conflict.rejectedRevision}</span>
        </div>
        <div className="text-[11px] text-[#FAFAFA] border-t border-[#232323] pt-2">
          {conflict.message || 'Concurrent edit conflict. Choose how to reconcile.'}
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={async () => {
            setConflictState(null);
            await onReloadServerState();
          }}
        >
          <RefreshCw className="h-3 w-3" />
          <span>Take Theirs (Reload)</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          className="text-xs gap-1.5"
          onClick={async () => {
            setConflictState(null);
            await onForceOverwrite();
          }}
        >
          <Check className="h-3 w-3" />
          <span>Keep Mine (Force Overwrite)</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
