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
import { Badge } from '@/components/ui/badge';
import { History, Clock, User } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { toast } from '@/components/ui/toast';
import type { BlueprintHistoryEntryDto } from '@slotly/contracts';

export function HistoryDialog() {
  const isHistoryOpen = useBlueprintStore((s) => s.isHistoryOpen);
  const setIsHistoryOpen = useBlueprintStore((s) => s.setIsHistoryOpen);
  const projectId = useBlueprintStore((s) => s.projectId);

  const [entries, setEntries] = useState<BlueprintHistoryEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isHistoryOpen) return;

    let mounted = true;
    blueprintApi
      .getHistory(projectId)
      .then((data) => {
        if (mounted) setEntries(data);
      })
      .catch((err) => {
        if (mounted) toast.error('Failed to load history', (err as Error).message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isHistoryOpen, projectId]);

  if (!isHistoryOpen) return null;

  return (
    <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <History className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Blueprint Revision History
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Audit timeline of all operations committed to project {projectId}.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 max-h-80 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-[#8A8A8A]">Loading history log...</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8A8A8A]">No history events recorded yet.</div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded bg-[#161616] border border-[#232323] text-xs flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="font-mono text-[9px] uppercase">
                    rev {entry.revision}
                  </Badge>
                  <span className="font-mono text-[10px] text-[#FACC15] uppercase font-semibold">
                    {entry.operationType}
                  </span>
                </div>
                <div className="text-xs text-[#FAFAFA]">{entry.description}</div>
                <div className="flex items-center gap-3 text-[10px] text-[#8A8A8A] font-mono">
                  <span className="flex items-center gap-1">
                    <User className="h-2.5 w-2.5" />
                    <span>{entry.userId ? `User ${entry.userId.slice(-4)}` : 'System'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <DialogFooter className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(false)}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
