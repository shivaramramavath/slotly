// React component for node-factory.
'use client';

import React, { memo, useMemo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { BlueprintCanvasNode, BlueprintGroupNode as BlueprintGroupNodeType } from '../../types/canvas.types';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { NodeCard } from './node-card';
import { cn } from '@/lib/utils';

// ==========================================
// 1. STANDARD BLUEPRINT NODE
// ==========================================

/** React component rendering standard blueprint node */
export const BlueprintNode = memo(function BlueprintNode({
  id,
  data,
  selected,
}: NodeProps<BlueprintCanvasNode>) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setContextMenu = useBlueprintStore((s) => s.setContextMenu);
  const setActiveCommentsNodeId = useBlueprintStore((s) => s.setActiveCommentsNodeId);
  const focusModeNodeId = useBlueprintStore((s) => s.focusModeNodeId);
  const filterNodeType = useBlueprintStore((s) => s.filterNodeType);
  const hideUnrelated = useBlueprintStore((s) => s.hideUnrelated);

  const { getAllowedChildTypes } = useGateValidation(nodes, edges);

  const nodeType = data.nodeType || 'institution';
  const allowedChildTypes = useMemo(
    () => getAllowedChildTypes(nodeType),
    [getAllowedChildTypes, nodeType],
  );

  // Focus Mode neighbourhood check
  const isInFocusNeighbourhood = useMemo(() => {
    if (!focusModeNodeId) return true;
    if (focusModeNodeId === id) return true;
    return edges.some(
      (e) =>
        (e.source === focusModeNodeId && e.target === id) ||
        (e.target === focusModeNodeId && e.source === id),
    );
  }, [focusModeNodeId, id, edges]);

  // Filter check
  const matchesFilter = useMemo(() => {
    if (filterNodeType === 'all') return true;
    return data.nodeType === filterNodeType;
  }, [filterNodeType, data.nodeType]);

  const childCount = useMemo(
    () => nodes.filter((n) => n.data.parentId === id).length,
    [nodes, id],
  );

  if (hideUnrelated && !matchesFilter) {
    return null;
  }

  const nodeObj: BlueprintCanvasNode = {
    id,
    type: 'blueprint',
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <div
      className={cn(
        'transition-opacity duration-120',
        !isInFocusNeighbourhood && 'opacity-20 filter grayscale pointer-events-none',
        !matchesFilter && 'opacity-30',
      )}
    >
      <NodeCard
        node={nodeObj}
        selected={selected}
        allowedChildTypes={allowedChildTypes}
        childCount={childCount}
        onSelect={() => selectNode(id)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
        }}
        onOpenComments={() => setActiveCommentsNodeId(id)}
      />
    </div>
  );
});

// ==========================================
// 2. SUB-FLOW / CONTAINER GROUP NODE
// ==========================================

/** React component rendering blueprint group node. */
export const BlueprintGroupNode = memo(function BlueprintGroupNode({
  id,
  data,
  selected,
}: NodeProps<BlueprintGroupNodeType>) {
  const [collapsed, setCollapsed] = React.useState(data.collapsed || false);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setContextMenu = useBlueprintStore((s) => s.setContextMenu);

  return (
    <div
      onClick={() => selectNode(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
      }}
      className={cn(
        'rounded-[12px] border bg-[#111111]/30 p-3 transition-all min-w-[240px]',
        selected ? 'border-white/60 ring-2 ring-white/10' : 'border-[#232323]',
        collapsed ? 'h-14' : 'min-h-[180px]',
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-[#232323]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="p-1 rounded hover:bg-[#181818] text-[#8A8A8A]"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <span className="font-medium text-xs text-[#FAFAFA]">{data.label}</span>
          <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#161616] text-[#8A8A8A]">
            {data.groupType}
          </span>
        </div>

        <span className="font-mono text-[10px] text-[#22C55E]">
          {data.completeCount}/{data.childCount} Complete
        </span>
      </div>

      {!collapsed && (
        <div className="pt-3 text-[11px] font-mono text-[#666666] text-center">
          Container Sub-flow
        </div>
      )}
    </div>
  );
});

/** Constant representing node types for React Flow. */
export const nodeTypes = {
  blueprint: BlueprintNode,
  blueprintGroup: BlueprintGroupNode,
};
