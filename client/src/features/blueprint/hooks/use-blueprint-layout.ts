// Custom React hook for use-blueprint-layout.
import { useCallback, useRef } from 'react';
import dagre from 'dagre';
import type { BlueprintCanvasNode, BlueprintCanvasEdge, LayoutDirection, LayoutAlgorithm } from '../types/canvas.types';
import { useBlueprintStore } from '../store/blueprint.store';
import { toast } from '@/components/ui/toast';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;

/**
 * Overlap avoidance algorithm: simple bounding box separation.
 */
function avoidOverlapsHelper(nodesList: BlueprintCanvasNode[]): BlueprintCanvasNode[] {
  const list = nodesList.map((n) => ({ ...n, position: { ...n.position } }));

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;

      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;

      const overlapX = NODE_WIDTH + 20 - Math.abs(dx);
      const overlapY = NODE_HEIGHT + 20 - Math.abs(dy);

      if (overlapX > 0 && overlapY > 0) {
        // Push apart along smallest overlap dimension
        if (overlapX < overlapY) {
          const shift = overlapX / 2;
          if (dx >= 0) {
            b.position.x += shift;
            a.position.x -= shift;
          } else {
            b.position.x -= shift;
            a.position.x += shift;
          }
        } else {
          const shift = overlapY / 2;
          if (dy >= 0) {
            b.position.y += shift;
            a.position.y -= shift;
          } else {
            b.position.y -= shift;
            a.position.y += shift;
          }
        }
      }
    }
  }

  return list;
}

/**
 * Standard hierarchical / compact layout using dagre.
 */
function calculateHierarchicalOrCompact(
  nodesList: BlueprintCanvasNode[],
  edgesList: BlueprintCanvasEdge[],
  direction: LayoutDirection = 'TB',
  isCompact = false,
): BlueprintCanvasNode[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'RL';

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: isHorizontal ? (isCompact ? 50 : 80) : isCompact ? 40 : 65,
    nodesep: isHorizontal ? (isCompact ? 30 : 50) : isCompact ? 35 : 55,
  });

  nodesList.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edgesList.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodesList.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}

/**
 * Department-based layout: separates distinct department branches into columns.
 */
function calculateDepartmentLayout(
  nodesList: BlueprintCanvasNode[],
  edgesList: BlueprintCanvasEdge[],
): BlueprintCanvasNode[] {
  const depts = nodesList.filter((n) => n.data.nodeType === 'department');
  if (depts.length === 0) {
    return calculateHierarchicalOrCompact(nodesList, edgesList, 'TB', false);
  }

  const inst = nodesList.find((n) => n.data.nodeType === 'institution');
  const resources = nodesList.filter(
    (n) => n.data.nodeType === 'faculty' || n.data.nodeType === 'room',
  );

  const updated = new Map<string, { x: number; y: number }>();

  // Institution at top center
  if (inst) {
    updated.set(inst.id, { x: 400, y: 50 });
  }

  // Lay out each department and its downstream subtree in separate columns
  let currentX = 100;
  depts.forEach((dept) => {
    // Find all descendants of dept
    const getDescendants = (parentId: string): string[] => {
      const children = nodesList.filter((n) => n.data.parentId === parentId);
      return [
        ...children.map((c) => c.id),
        ...children.flatMap((c) => getDescendants(c.id)),
      ];
    };

    const subtreeIds = [dept.id, ...getDescendants(dept.id)];
    const subtreeNodes = nodesList.filter((n) => subtreeIds.includes(n.id));
    const subtreeEdges = edgesList.filter(
      (e) => subtreeIds.includes(e.source) && subtreeIds.includes(e.target),
    );

    const subLayoutNodes = calculateHierarchicalOrCompact(subtreeNodes, subtreeEdges, 'TB', true);
    const minX = Math.min(...subLayoutNodes.map((n) => n.position.x));
    const maxX = Math.max(...subLayoutNodes.map((n) => n.position.x));
    const subtreeWidth = maxX - minX + NODE_WIDTH + 60;

    subLayoutNodes.forEach((sn) => {
      updated.set(sn.id, {
        x: sn.position.x - minX + currentX,
        y: sn.position.y + 220,
      });
    });

    currentX += subtreeWidth;
  });

  // Resources on the right side
  let resY = 50;
  resources.forEach((r) => {
    updated.set(r.id, { x: currentX + 100, y: resY });
    resY += NODE_HEIGHT + 20;
  });

  return nodesList.map((n) => ({
    ...n,
    position: updated.get(n.id) || n.position,
  }));
}

/**
 * Main layout calculation engine.
 */
function getLayoutedElements(
  nodesList: BlueprintCanvasNode[],
  edgesList: BlueprintCanvasEdge[],
  direction: LayoutDirection = 'TB',
  algorithm: LayoutAlgorithm = 'hierarchical',
): { nodes: BlueprintCanvasNode[]; edges: BlueprintCanvasEdge[] } {
  let layoutedNodes: BlueprintCanvasNode[];

  if (algorithm === 'department') {
    layoutedNodes = calculateDepartmentLayout(nodesList, edgesList);
  } else {
    layoutedNodes = calculateHierarchicalOrCompact(
      nodesList,
      edgesList,
      direction,
      algorithm === 'compact',
    );
  }

  return { nodes: avoidOverlapsHelper(layoutedNodes), edges: edgesList };
}

/** Custom React hook for use blueprint layout. */
export function useBlueprintLayout() {
  const previousPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodes = useBlueprintStore((s) => s.nodes);
  const setNodes = useBlueprintStore((s) => s.setNodes);

  /**
   * Save current positions to enable layout reset/revert.
   */
  const saveSnapshotForReset = useCallback(() => {
    previousPositionsRef.current.clear();
    nodes.forEach((n) => previousPositionsRef.current.set(n.id, { ...n.position }));
  }, [nodes]);

  /**
   * Revert to saved positions before layout run.
   */
  const resetLayout = useCallback(() => {
    if (previousPositionsRef.current.size === 0) {
      toast.info('No previous layout', 'Already at original positions.');
      return;
    }
    setNodes((prev) =>
      prev.map((n) => {
        const saved = previousPositionsRef.current.get(n.id);
        return saved ? { ...n, position: saved } : n;
      }),
    );
    toast.success('Layout reset', 'Restored previous manual positions.');
  }, [setNodes]);

  return {
    getLayoutedElements,
    saveSnapshotForReset,
    resetLayout,
    avoidOverlaps: avoidOverlapsHelper,
  };
}
