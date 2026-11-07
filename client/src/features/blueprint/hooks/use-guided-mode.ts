import { useCallback } from 'react';
import type { BlueprintCanvasNode } from '../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';
import { useBlueprintStore } from '../store/blueprint.store';
import { toast } from '@/components/ui/toast';

const HIERARCHY_ORDER: BlueprintNodeType[] = [
  'institution',
  'department',
  'program',
  'academicYear',
  'semester',
  'section',
  'batch',
  'subjectAssignment',
  'electiveGroup',
  'faculty',
  'room',
];

export function useGuidedMode() {
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setFixHint = useBlueprintStore((s) => s.setFixHint);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);

  const goToNextStep = useCallback(() => {
    if (nodes.length === 0) {
      toast.info('No nodes in blueprint', 'Add an institution root to begin.');
      return;
    }

    // Find first incomplete node in hierarchy order
    let targetNode: BlueprintCanvasNode | null = null;

    for (const nodeType of HIERARCHY_ORDER) {
      const candidates = nodes.filter(
        (n) => n.data.nodeType === nodeType && n.data.effectiveStatus !== 'complete',
      );
      if (candidates.length > 0) {
        // Pick the first one
        targetNode = candidates[0] || null;
        break;
      }
    }

    if (!targetNode) {
      toast.success('Blueprint complete', 'All nodes have valid configuration!');
      return;
    }

    // Focus node, set first missing field
    selectNode(targetNode.id);
    setActiveTab('config');

    const firstMissing = targetNode.data.missing[0];
    if (firstMissing) {
      setFixHint({ nodeId: targetNode.id, field: firstMissing.field });
      toast.info(
        `Next step: ${targetNode.data.label}`,
        `Please configure '${firstMissing.field}': ${firstMissing.message}`,
      );
    } else {
      toast.info(`Next step: ${targetNode.data.label}`, 'Please complete this node configuration.');
    }
  }, [nodes, selectNode, setFixHint, setActiveTab]);

  return { goToNextStep };
}
