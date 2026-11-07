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
import { Badge } from '@/components/ui/badge';
import { Upload, FileUp, Check } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { toast } from '@/components/ui/toast';

interface ImportDialogProps {
  onImportCompleted: () => Promise<void>;
}

export function ImportDialog({ onImportCompleted }: ImportDialogProps) {
  const isImportOpen = useBlueprintStore((s) => s.isImportOpen);
  const setIsImportOpen = useBlueprintStore((s) => s.setIsImportOpen);
  const projectId = useBlueprintStore((s) => s.projectId);
  const nodes = useBlueprintStore((s) => s.nodes);

  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [previewApplied, setPreviewApplied] = useState<Array<{ id: string; type: string; name: string }>>([]);
  const [previewSkipped, setPreviewSkipped] = useState<Array<{ id: string; type: string; name: string; reason: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isImportOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as Record<string, unknown>;
        setParsedData(json);

        // Client-side GateChain simulation preview
        const incomingNodes = (json['nodes'] as Array<{ id: string; type: string; data?: { name?: string }; parentId?: string }>) || [];
        const existingNodeIds = new Set(nodes.map((n) => n.id));
        const applied: Array<{ id: string; type: string; name: string }> = [];
        const skipped: Array<{ id: string; type: string; name: string; reason: string }> = [];

        incomingNodes.forEach((node) => {
          const name = node.data?.name || node.id;
          if (existingNodeIds.has(node.id)) {
            skipped.push({ id: node.id, type: node.type, name, reason: 'DUPLICATE_ID' });
          } else if (node.parentId && !existingNodeIds.has(node.parentId) && !incomingNodes.some((n) => n.id === node.parentId)) {
            skipped.push({ id: node.id, type: node.type, name, reason: 'PARENT_MISSING' });
          } else {
            applied.push({ id: node.id, type: node.type, name });
            existingNodeIds.add(node.id);
          }
        });

        setPreviewApplied(applied);
        setPreviewSkipped(skipped);
      } catch (err) {
        toast.error('Invalid JSON file', (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);
    try {
      const res = await blueprintApi.importGraph(projectId, parsedData);
      toast.success('Import completed', `Imported ${res.applied.length} elements.`);
      await onImportCompleted();
      setIsImportOpen(false);
    } catch (err) {
      toast.error('Import failed', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <Upload className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Import Blueprint Data
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Upload a JSON or Excel blueprint definition. Changes will be validated against G1-G8 gates before applying.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 space-y-3">
        {/* Upload Box */}
        <label className="border border-dashed border-[#232323] hover:border-[#FACC15] rounded-md p-6 flex flex-col items-center justify-center text-center bg-[#111111]/50 cursor-pointer transition-colors block">
          <FileUp className="h-6 w-6 text-[#8A8A8A] mb-2" />
          <span className="text-xs text-[#FAFAFA] font-medium">Click to select blueprint JSON</span>
          <span className="text-[10px] text-[#666666] font-mono mt-0.5">Supports .json file exports</span>
          <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Gate Simulation Preview */}
        {parsedData && (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#22C55E]">{previewApplied.length} will be applied</span>
              <span className="text-[#EF4444]">{previewSkipped.length} will be skipped</span>
            </div>

            {previewApplied.length > 0 && (
              <div className="p-2 rounded bg-[#161616] border border-[#232323] space-y-1">
                <div className="text-[10px] uppercase font-mono text-[#22C55E]">Allowed via Gates</div>
                {previewApplied.slice(0, 5).map((item) => (
                  <div key={item.id} className="text-xs text-[#FAFAFA] truncate">
                    • {item.name} <span className="font-mono text-[#8A8A8A]">({item.type})</span>
                  </div>
                ))}
                {previewApplied.length > 5 && (
                  <div className="text-[10px] font-mono text-[#8A8A8A]">
                    + {previewApplied.length - 5} more items
                  </div>
                )}
              </div>
            )}

            {previewSkipped.length > 0 && (
              <div className="p-2 rounded bg-[#161616] border border-[#232323] space-y-1">
                <div className="text-[10px] uppercase font-mono text-[#EF4444]">Skipped by Gates</div>
                {previewSkipped.map((item) => (
                  <div key={item.id} className="text-xs flex items-center justify-between">
                    <span className="text-[#FAFAFA] truncate max-w-[180px]">• {item.name}</span>
                    <Badge variant="red" className="text-[9px]">
                      {item.reason}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsImportOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirmImport}
          disabled={isSubmitting || !parsedData || previewApplied.length === 0}
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{isSubmitting ? 'Importing...' : 'Confirm & Apply Import'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
