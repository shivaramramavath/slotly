// React component for snapshots-dialog.
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, RotateCcw, GitCompare, Plus } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { toast } from '@/components/ui/toast';
import type { BlueprintSnapshotDto } from '@slotly/contracts';

interface SnapshotsDialogProps {
  onSnapshotRestored: () => Promise<void>;
}

/** React component rendering snapshots dialog. */
export function SnapshotsDialog({ onSnapshotRestored }: SnapshotsDialogProps) {
  const isSnapshotsOpen = useBlueprintStore((s) => s.isSnapshotsOpen);
  const setIsSnapshotsOpen = useBlueprintStore((s) => s.setIsSnapshotsOpen);
  const projectId = useBlueprintStore((s) => s.projectId);

  const [snapshots, setSnapshots] = useState<BlueprintSnapshotDto[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<{
    snapshot: BlueprintSnapshotDto;
    diff: { addedNodes: string[]; removedNodes: string[]; modifiedNodes: string[] };
  } | null>(null);

  useEffect(() => {
    if (!isSnapshotsOpen) return;

    let mounted = true;
    blueprintApi
      .listSnapshots(projectId)
      .then((data) => {
        if (mounted) setSnapshots(data);
      })
      .catch((err) => {
        if (mounted) toast.error('Failed to load snapshots', (err as Error).message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isSnapshotsOpen, projectId]);

  if (!isSnapshotsOpen) return null;

  const handleCreateSnapshot = async () => {
    if (!newLabel.trim()) return;
    setIsCreating(true);
    try {
      await blueprintApi.createSnapshot(projectId, { label: newLabel.trim() });
      toast.success('Snapshot created', `Saved snapshot '${newLabel}'.`);
      setNewLabel('');
      const list = await blueprintApi.listSnapshots(projectId);
      setSnapshots(list);
    } catch (err) {
      toast.error('Failed to create snapshot', (err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompare = async (snapshotId: string) => {
    try {
      const res = await blueprintApi.compareSnapshot(projectId, snapshotId);
      setSelectedDiff(res);
    } catch (err) {
      toast.error('Failed to compare snapshot', (err as Error).message);
    }
  };

  const handleRestore = async (snapshotId: string, label: string) => {
    try {
      await blueprintApi.restoreSnapshot(projectId, snapshotId);
      toast.success('Snapshot restored', `Restored graph to '${label}'.`);
      await onSnapshotRestored();
      setIsSnapshotsOpen(false);
    } catch (err) {
      toast.error('Failed to restore snapshot', (err as Error).message);
    }
  };

  return (
    <Dialog open={isSnapshotsOpen} onOpenChange={setIsSnapshotsOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <Camera className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Graph Snapshots &amp; Diff
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Create milestone snapshots, compare differences with current state, or restore previous versions.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 space-y-3">
        {/* Create Snapshot input */}
        <div className="flex items-center gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Before Department Restructure)"
            className="text-xs"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateSnapshot}
            disabled={isCreating || !newLabel.trim()}
            className="text-xs shrink-0 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
          </Button>
        </div>

        {/* Visual Diff View if selected */}
        {selectedDiff && (
          <div className="p-3 rounded bg-[#161616] border border-[#FACC15]/40 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#FAFAFA] font-semibold border-b border-[#232323] pb-1">
              <span>Diff vs Snapshot: {selectedDiff.snapshot.label}</span>
              <button
                type="button"
                onClick={() => setSelectedDiff(null)}
                className="text-[#8A8A8A] hover:text-[#FAFAFA]"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-1 rounded bg-[#0A0A0A] border border-[#232323]">
                <span className="text-[#22C55E] block font-bold">
                  +{selectedDiff.diff.addedNodes.length} Added
                </span>
              </div>
              <div className="p-1 rounded bg-[#0A0A0A] border border-[#232323]">
                <span className="text-[#EF4444] block font-bold">
                  -{selectedDiff.diff.removedNodes.length} Removed
                </span>
              </div>
              <div className="p-1 rounded bg-[#0A0A0A] border border-[#232323]">
                <span className="text-[#FACC15] block font-bold">
                  ~{selectedDiff.diff.modifiedNodes.length} Modified
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Snapshots List */}
        <div className="max-h-56 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-[#8A8A8A]">Loading snapshots...</div>
          ) : snapshots.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8A8A8A]">No snapshots saved yet.</div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-2.5 rounded bg-[#161616] border border-[#232323] text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-[#FAFAFA] flex items-center gap-2">
                    <span>{snap.label}</span>
                    <Badge variant="neutral" className="text-[9px]">
                      rev {snap.revision}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-[#8A8A8A] font-mono mt-0.5">
                    {snap.graph?.nodes?.length || 0} nodes • {new Date(snap.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1 text-[#8A8A8A] hover:text-[#FAFAFA]"
                    onClick={() => handleCompare(snap.id)}
                  >
                    <GitCompare className="h-3 w-3" />
                    <span>Diff</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1 text-[#FACC15] hover:bg-[#FACC15]/10"
                    onClick={() => handleRestore(snap.id, snap.label)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setIsSnapshotsOpen(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
