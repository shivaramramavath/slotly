// React component for templates-dialog.
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
import { Layers, Check, AlertTriangle } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { toast } from '@/components/ui/toast';
import type { GraphTemplateDto } from '@slotly/contracts';

interface TemplatesDialogProps {
  onTemplateApplied: () => Promise<void>;
}

/** React component rendering templates dialog. */
export function TemplatesDialog({ onTemplateApplied }: TemplatesDialogProps) {
  const isTemplatesOpen = useBlueprintStore((s) => s.isTemplatesOpen);
  const setIsTemplatesOpen = useBlueprintStore((s) => s.setIsTemplatesOpen);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const projectId = useBlueprintStore((s) => s.projectId);
  const nodes = useBlueprintStore((s) => s.nodes);

  const [templates, setTemplates] = useState<GraphTemplateDto[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<GraphTemplateDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (!isTemplatesOpen) return;

    let mounted = true;
    blueprintApi
      .listTemplates()
      .then((list) => {
        if (mounted) {
          setTemplates(list);
          if (list[0]) setSelectedTemplate(list[0]);
        }
      })
      .catch((err) => {
        if (mounted) toast.error('Failed to load templates', (err as Error).message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isTemplatesOpen]);

  if (!isTemplatesOpen) return null;

  const handleApply = async () => {
    if (!selectedTemplate) return;

    if (!selectedNode) {
      toast.error('No anchor node selected', 'Please select an anchor node on the canvas first.');
      return;
    }

    if (selectedNode.data.effectiveStatus !== 'complete') {
      toast.error(
        'Anchor parent incomplete',
        `Anchor node '${selectedNode.data.label}' must be complete before applying a template (G1).`,
      );
      return;
    }

    setIsApplying(true);
    try {
      const res = await blueprintApi.applyTemplate(projectId, selectedTemplate.id, {
        anchorNodeId: selectedNode.id,
      });

      if (res.skipped && res.skipped.length > 0) {
        toast.info(
          'Template partially applied',
          `${res.applied.length} applied, ${res.skipped.length} skipped due to gates.`,
        );
      } else {
        toast.success('Template applied', `Created ${res.applied.length} nodes from '${selectedTemplate.name}'.`);
      }

      await onTemplateApplied();
      setIsTemplatesOpen(false);
    } catch (err) {
      toast.error('Failed to apply template', (err as Error).message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <Layers className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Templates &amp; Starter Kits
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Apply pre-configured academic subtrees under the selected anchor node.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 grid grid-cols-5 gap-3 max-h-80 min-h-[220px]">
        {/* Left: Template List */}
        <div className="col-span-2 border border-[#232323] rounded-md bg-[#0A0A0A] overflow-y-auto divide-y divide-[#232323]">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-[#8A8A8A]">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#8A8A8A]">No templates found</div>
          ) : (
            templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl)}
                className={`w-full p-2.5 text-left text-xs transition-colors flex flex-col gap-1 ${
                  selectedTemplate?.id === tpl.id ? 'bg-[#181818] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#FAFAFA] truncate">{tpl.name}</span>
                  <Badge variant="neutral" className="text-[9px] uppercase">
                    {tpl.category}
                  </Badge>
                </div>
                <span className="text-[10px] font-mono text-[#666666]">
                  {tpl.subtree?.nodes?.length || 0} nodes • v{tpl.version}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Right: Selected Template Details & Anchor Status */}
        <div className="col-span-3 border border-[#232323] rounded-md bg-[#161616] p-3 flex flex-col justify-between text-xs">
          {selectedTemplate ? (
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-[#FAFAFA] text-sm">{selectedTemplate.name}</h4>
                <p className="text-[11px] text-[#8A8A8A] mt-0.5">Category: {selectedTemplate.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                <div className="p-2 rounded bg-[#111111] border border-[#232323]">
                  <span className="text-[#8A8A8A] block text-[10px]">Anchor Requirement</span>
                  <span className="text-[#FACC15] uppercase font-semibold">
                    {selectedTemplate.anchorNodeType || 'Any Parent'}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#111111] border border-[#232323]">
                  <span className="text-[#8A8A8A] block text-[10px]">Total Elements</span>
                  <span className="text-[#FAFAFA] font-semibold">
                    {selectedTemplate.subtree?.nodes?.length || 0} nodes, {selectedTemplate.subtree?.edges?.length || 0} edges
                  </span>
                </div>
              </div>

              {/* Anchor Node Status */}
              <div className="p-2 rounded bg-[#111111] border border-[#232323] text-xs">
                <div className="text-[10px] text-[#8A8A8A] mb-1">Target Anchor on Canvas:</div>
                {selectedNode ? (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#FAFAFA]">{selectedNode.data.label}</span>
                    <Badge
                      variant={selectedNode.data.effectiveStatus === 'complete' ? 'green' : 'red'}
                      className="text-[9px]"
                    >
                      {selectedNode.data.effectiveStatus}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#EF4444] text-[11px]">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Please select an anchor node on the canvas</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#8A8A8A]">
              Select a template to view details
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsTemplatesOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApply}
          disabled={
            isApplying ||
            !selectedTemplate ||
            !selectedNode ||
            selectedNode.data.effectiveStatus !== 'complete'
          }
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{isApplying ? 'Applying Template...' : 'Apply Template Under Anchor'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
