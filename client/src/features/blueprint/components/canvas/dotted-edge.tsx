// React component for dotted-edge.
'use client';

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  useStore,
} from '@xyflow/react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { cn } from '@/lib/utils';

export interface EdgeLabelPillProps {
  label: string;
  x: number;
  y: number;
  visible?: boolean;
}

/** Edge Label Pill rendered at edge midpoint */
export const EdgeLabelPill = memo(function EdgeLabelPill({
  label,
  x,
  y,
  visible = true,
}: EdgeLabelPillProps) {
  if (!visible || !label) return null;

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
        pointerEvents: 'none',
      }}
      className="px-2 py-0.5 rounded-full bg-[#111111] border border-[#232323] font-mono text-[11px] text-[#8A8A8A] select-none shadow-sm"
    >
      {label}
    </div>
  );
});

/** Custom React Flow Edge with dotted styling and slow flow animation when connected to selected node */
export const DottedEdge = memo(function DottedEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected = false,
  data,
  style = {},
}: EdgeProps) {
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const nodes = useBlueprintStore((s) => s.nodes);

  // Zoom check: hide label pill below 0.6 zoom
  const zoom = useStore((s) => s.transform[2]);
  const showLabel = zoom >= 0.6;

  // Active / connected check for slow flow animation
  const isConnectedToSelected =
    Boolean(selectedNodeId) && (selectedNodeId === source || selectedNodeId === target);
  const isAnimated = selected || isConnectedToSelected;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate label text: children count below target, or custom label
  const childCount = nodes.filter((n) => n.data.parentId === target).length;
  const labelText =
    typeof data?.label === 'string'
      ? data.label
      : childCount > 0
      ? `${childCount} ${childCount === 1 ? 'child' : 'children'}`
      : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isAnimated ? 'rgba(250, 250, 250, 0.9)' : 'rgba(250, 250, 250, 0.55)',
          strokeWidth: 2,
          strokeDasharray: '1 6',
          strokeLinecap: 'round',
          ...style,
        }}
        className={cn(isAnimated && 'edge-flow')}
      />

      {labelText && (
        <EdgeLabelRenderer>
          <EdgeLabelPill
            label={labelText}
            x={labelX}
            y={labelY}
            visible={showLabel}
          />
        </EdgeLabelRenderer>
      )}
    </>
  );
});
