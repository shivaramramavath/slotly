// React component for save-template-dialog.
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
import { BookmarkPlus, Check } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { toast } from '@/components/ui/toast';

/** React component rendering save template dialog. */
export function SaveTemplateDialog() {
  const isSaveTemplateOpen = useBlueprintStore((s) => s.isSaveTemplateOpen);
  const setIsSaveTemplateOpen = useBlueprintStore((s) => s.setIsSaveTemplateOpen);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'school' | 'college' | 'stem' | 'custom'>('custom');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!isSaveTemplateOpen || !selectedNode) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name required', 'Please enter a name for the template.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect subtree nodes
      const getDescendantIds = (parentId: string): string[] => {
        const children = nodes.filter((n) => n.data.parentId === parentId);
        return [...children.map((c) => c.id), ...children.flatMap((c) => getDescendantIds(c.id))];
      };

      const subtreeIds = [selectedNode.id, ...getDescendantIds(selectedNode.id)];
      const subtreeNodes = nodes.filter((n) => subtreeIds.includes(n.id));
      const subtreeEdges = edges.filter(
        (e) => subtreeIds.includes(e.source) && subtreeIds.includes(e.target),
      );

      await blueprintApi.createTemplate({
        name,
        category,
        version: 1,
        visibility: 'institution',
        anchorNodeType: selectedNode.data.nodeType,
        subtree: {
          nodes: subtreeNodes.map((n) => ({
            id: n.id,
            type: n.data.nodeType,
            position: n.position,
            data: n.data.config,
            parentId: n.data.parentId,
          })),
          edges: subtreeEdges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: 'hierarchy',
          })),
        },
      });

      setIsSaveTemplateOpen(false);
      toast.success('Template saved', `Saved '${name}' with ${subtreeNodes.length} nodes.`);
    } catch (err) {
      toast.error('Failed to save template', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#FACC15] mb-1">
          <BookmarkPlus className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Save Subtree as Template
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Create a reusable kit from {selectedNode.data.label} and its connected child elements.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
            Template Name <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard 4-Year B.Tech Branch"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Includes 8 semesters, theory labs and tutorial links"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'school' | 'college' | 'stem' | 'custom')}
            className="w-full h-8 bg-[#161616] border border-[#232323] rounded px-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#FACC15]"
          >
            <option value="custom">Custom Template</option>
            <option value="college">College / University</option>
            <option value="school">K-12 School</option>
            <option value="stem">Lab / STEM Intensive</option>
          </select>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsSaveTemplateOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSubmitting || !name.trim()}
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{isSubmitting ? 'Saving...' : 'Save Template'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
