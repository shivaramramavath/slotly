// Overview component rendered in inspector when no canvas node or multiple nodes are selected.
'use client';

import {
  Layers,
  Network,
  Users,
  DoorOpen,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  MousePointerClick,
  Trash2,
} from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { TYPE_ICONS } from '../canvas/node-card';
import { useReactFlow } from '@xyflow/react';

/** Props for BlueprintOverview component. */
export interface BlueprintOverviewProps {
  projectId?: string | undefined;
  className?: string | undefined;
}

/** React component rendering whole-blueprint summary and needs-attention list. */
export function BlueprintOverview({ className = '' }: BlueprintOverviewProps) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const setNodes = useBlueprintStore((s) => s.setNodes);
  const setEdges = useBlueprintStore((s) => s.setEdges);
  const selectedNodeIds = useBlueprintStore((s) => s.selectedNodeIds);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setSelectedNodeIds = useBlueprintStore((s) => s.setSelectedNodeIds);

  const { setCenter } = useReactFlow();

  // Multi-selection state
  if (selectedNodeIds.length > 1) {
    return (
      <div className={`p-4 space-y-4 text-xs ${className}`}>
        <div className="p-3 rounded-[12px] bg-[#141414] border border-[#232323] space-y-2">
          <p className="font-medium text-[#FAFAFA] text-sm">
            {selectedNodeIds.length} nodes selected
          </p>
          <p className="font-mono text-[#8A8A8A] text-xs">
            Multi-node selection is active. Choose an action or click the canvas to deselect.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setNodes((prev) => prev.filter((n) => !selectedNodeIds.includes(n.id)));
              setEdges((prev) => prev.filter((e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)));
              setSelectedNodeIds([]);
            }}
            className="w-full h-10 px-3 rounded-[12px] bg-[#1A1111] hover:bg-[#251414] border border-[#EF4444]/30 text-[#EF4444] font-medium text-xs flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#EF4444]"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Selected Nodes</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedNodeIds([])}
            className="w-full h-10 px-3 rounded-[12px] bg-[#141414] hover:bg-[#1C1C1C] border border-[#232323] text-[#FAFAFA] text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          >
            Clear Selection
          </button>
        </div>
      </div>
    );
  }

  // Calculate readiness and resource counts
  const totalNodes = nodes.length;
  const completeNodes = nodes.filter((n) => n.data.effectiveStatus === 'complete').length;
  const readinessPercent = totalNodes > 0 ? Math.round((completeNodes / totalNodes) * 100) : 0;

  // Counts
  let facultyCount = 0;
  let roomCount = 0;
  let subjectCount = 0;

  nodes.forEach((n) => {
    if (n.data.nodeType === 'faculty') facultyCount++;
    if (n.data.nodeType === 'room') roomCount++;
    if (n.data.nodeType === 'subjectAssignment') subjectCount++;

    const config = n.data.config || {};
    const pool = (config['pool'] as { additions?: Array<{ kind?: string }> } | undefined);
    if (pool?.additions) {
      pool.additions.forEach((entry) => {
        if (entry.kind === 'faculty') facultyCount++;
        if (entry.kind === 'room') roomCount++;
        if (entry.kind === 'subject') subjectCount++;
      });
    }
  });

  const rootNode = nodes.find((n) => n.data.nodeType === 'institution');
  const blueprintName = (rootNode?.data.label as string) || (rootNode?.data.config?.['name'] as string) || 'Academic Blueprint';

  // Nodes needing attention
  const attentionNodes = nodes.filter(
    (n) => n.data.effectiveStatus !== 'complete' || (n.data.missing && n.data.missing.length > 0),
  );

  const handleSelectAttentionNode = (nodeId: string) => {
    selectNode(nodeId);
    const target = nodes.find((n) => n.id === nodeId);
    if (target && setCenter) {
      setCenter(target.position.x + 116, target.position.y + 32, { duration: 400 });
    }
  };

  return (
    <div className={`p-4 space-y-5 text-xs ${className}`}>
      {/* Blueprint Header & Status */}
      <div className="space-y-2 pb-3 border-b border-[#232323]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[#FAFAFA] truncate">{blueprintName}</h3>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-[#232323] bg-[#141414] text-[#8A8A8A] uppercase">
            Draft
          </span>
        </div>

        {/* 4px Thin Readiness Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] text-[#8A8A8A]">
            <span>Readiness</span>
            <span className="text-[#FAFAFA] font-medium">{readinessPercent}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[#232323] overflow-hidden">
            <div
              className="h-full bg-[#FAFAFA] transition-all duration-300"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Counts Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-[10px] bg-[#141414] border border-[#232323] flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-[#8A8A8A] shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-[#FAFAFA]">{totalNodes}</p>
            <p className="font-mono text-[10px] text-[#8A8A8A] uppercase">Nodes</p>
          </div>
        </div>

        <div className="p-2.5 rounded-[10px] bg-[#141414] border border-[#232323] flex items-center gap-2.5">
          <Network className="h-4 w-4 text-[#8A8A8A] shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-[#FAFAFA]">{edges.length}</p>
            <p className="font-mono text-[10px] text-[#8A8A8A] uppercase">Connections</p>
          </div>
        </div>

        <div className="p-2.5 rounded-[10px] bg-[#141414] border border-[#232323] flex items-center gap-2.5">
          <Users className="h-4 w-4 text-[#8A8A8A] shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-[#FAFAFA]">{facultyCount}</p>
            <p className="font-mono text-[10px] text-[#8A8A8A] uppercase">Faculty</p>
          </div>
        </div>

        <div className="p-2.5 rounded-[10px] bg-[#141414] border border-[#232323] flex items-center gap-2.5">
          <DoorOpen className="h-4 w-4 text-[#8A8A8A] shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-[#FAFAFA]">{roomCount}</p>
            <p className="font-mono text-[10px] text-[#8A8A8A] uppercase">Rooms</p>
          </div>
        </div>

        <div className="col-span-2 p-2.5 rounded-[10px] bg-[#141414] border border-[#232323] flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 text-[#8A8A8A] shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-[#FAFAFA]">{subjectCount}</p>
            <p className="font-mono text-[10px] text-[#8A8A8A] uppercase">Subjects Used</p>
          </div>
        </div>
      </div>

      {/* Needs Attention List */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#FAFAFA] flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[#FACC15]" />
            <span>Needs Attention ({attentionNodes.length})</span>
          </span>
          <span className="text-[10px] font-mono text-[#8A8A8A]">Click to edit</span>
        </div>

        {attentionNodes.length === 0 ? (
          <div className="p-3 rounded-[10px] bg-[#141414] border border-[#232323] text-center text-[#8A8A8A] space-y-1">
            <p className="text-xs font-medium text-[#FAFAFA]">All nodes are ready</p>
            <p className="text-[11px] font-mono">No configuration conflicts or missing fields.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {attentionNodes.map((node) => {
              const NodeIcon = TYPE_ICONS[node.data.nodeType] || Layers;
              const missingCount = node.data.missing?.length || 1;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleSelectAttentionNode(node.id)}
                  aria-label={`Select ${node.data.label}, ${missingCount} issues`}
                  className="w-full text-left p-2 rounded-[8px] bg-[#111111] hover:bg-[#181818] border border-transparent hover:border-[#232323] flex items-center justify-between gap-2 transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <NodeIcon className="h-3.5 w-3.5 text-[#8A8A8A] group-hover:text-[#FAFAFA] shrink-0" />
                    <span className="font-medium text-xs text-[#FAFAFA] truncate">
                      {node.data.label}
                    </span>
                    <span className="font-mono text-[9px] text-[#8A8A8A] uppercase">
                      {node.data.nodeType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-[#FACC15] bg-[#FACC15]/10 px-1.5 py-0.5 rounded">
                      {missingCount} to fix
                    </span>
                    <ChevronRight className="h-3 w-3 text-[#8A8A8A] group-hover:text-[#FAFAFA]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty Prompt */}
      <div className="p-3 rounded-[10px] bg-[#141414] border border-[#232323] flex items-center gap-2 text-center text-[#8A8A8A] justify-center">
        <MousePointerClick className="h-3.5 w-3.5 text-[#8A8A8A]" />
        <span className="text-[11px] font-mono">Select a node to edit its config.</span>
      </div>
    </div>
  );
}
