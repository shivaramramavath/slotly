'use client';

import React, { memo, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Building2,
  FolderTree,
  GraduationCap,
  CalendarDays,
  Calendar,
  Users2,
  Users,
  BookOpen,
  Boxes,
  UserCheck,
  DoorOpen,
  Lock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  EyeOff,
} from 'lucide-react';
import type { BlueprintCanvasNode, BlueprintGroupNode as BlueprintGroupNodeType } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<BlueprintNodeType, React.ElementType> = {
  institution: Building2,
  department: FolderTree,
  program: GraduationCap,
  academicYear: CalendarDays,
  semester: Calendar,
  section: Users2,
  batch: Users,
  subjectAssignment: BookOpen,
  electiveGroup: Boxes,
  faculty: UserCheck,
  room: DoorOpen,
};

const TYPE_BADGE_LABELS: Record<BlueprintNodeType, string> = {
  institution: 'INSTITUTION',
  department: 'DEPARTMENT',
  program: 'PROGRAM',
  academicYear: 'ACAD. YEAR',
  semester: 'SEMESTER',
  section: 'SECTION',
  batch: 'BATCH',
  subjectAssignment: 'SUBJECT',
  electiveGroup: 'ELECTIVE GROUP',
  faculty: 'FACULTY',
  room: 'ROOM',
};

// ==========================================
// 1. STANDARD BLUEPRINT NODE
// ==========================================

export const BlueprintNode = memo(function BlueprintNode({
  id,
  data,
  selected,
}: NodeProps<BlueprintCanvasNode>) {
  const [showMissing, setShowMissing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const layoutDirection = useBlueprintStore((s) => s.layoutDirection);
  const lockedNodes = useBlueprintStore((s) => s.lockedNodes);
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setContextMenu = useBlueprintStore((s) => s.setContextMenu);
  const focusModeNodeId = useBlueprintStore((s) => s.focusModeNodeId);
  const filterNodeType = useBlueprintStore((s) => s.filterNodeType);
  const hideUnrelated = useBlueprintStore((s) => s.hideUnrelated);

  const { getAllowedChildTypes } = useGateValidation(nodes, edges);

  const nodeType = data.nodeType || 'institution';
  const Icon = TYPE_ICONS[nodeType] || Building2;
  const isMultiplayerLocked = Boolean(lockedNodes[id]);
  const lockInfo = lockedNodes[id];
  const isManualLocked = Boolean(data.locked);

  const effectiveStatus = data.effectiveStatus || data.status || 'empty';
  const isComplete = effectiveStatus === 'complete';
  const isBlocked = effectiveStatus === 'blocked';
  const isIncomplete = effectiveStatus === 'incomplete' || effectiveStatus === 'empty';

  // Focus Mode neighbourhood check
  const isInFocusNeighbourhood = useMemo(() => {
    if (!focusModeNodeId) return true;
    if (focusModeNodeId === id) return true;
    // Check if connected via edge
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

  if (hideUnrelated && !matchesFilter) {
    return null;
  }

  // Target handle direction
  const targetPos =
    layoutDirection === 'LR' ? Position.Left :
    layoutDirection === 'RL' ? Position.Right :
    layoutDirection === 'BT' ? Position.Bottom :
    Position.Top;

  // Source handle direction
  const sourcePos =
    layoutDirection === 'LR' ? Position.Right :
    layoutDirection === 'RL' ? Position.Left :
    layoutDirection === 'BT' ? Position.Top :
    Position.Bottom;

  const allowedChildTypes = getAllowedChildTypes(nodeType);

  // Status-based styling
  let statusBorder = 'border-[#232323]';
  if (selected) {
    statusBorder = 'border-[#FACC15] shadow-[0_0_12px_rgba(250,204,21,0.25)]';
  } else if (isComplete) {
    statusBorder = 'border-[#22C55E]/80';
  } else if (isBlocked) {
    statusBorder = 'border-[#3A3A3A] opacity-60';
  } else if (isIncomplete) {
    statusBorder = 'border-dashed border-[#FACC15]/80';
  }

  return (
    <div
      onClick={() => selectNode(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
      }}
      className={cn(
        'relative group min-w-[220px] max-w-[260px] rounded-md bg-[#111111] border p-3 transition-all cursor-pointer select-none',
        statusBorder,
        !isInFocusNeighbourhood && 'opacity-20 filter grayscale pointer-events-none',
        !matchesFilter && 'opacity-30',
        data.hidden && 'opacity-40 border-dashed',
      )}
    >
      {/* Target Handle (for children/connections) */}
      {nodeType !== 'institution' && (
        <Handle
          type="target"
          position={targetPos}
          className="!w-2.5 !h-2.5 !bg-[#8A8A8A] !border-2 !border-[#0A0A0A] !rounded-full hover:!bg-[#FACC15]"
        />
      )}

      {/* Header with Type & Lock info */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded bg-[#161616] text-[#8A8A8A]">
            <Icon className="h-3.5 w-3.5 text-[#FAFAFA]" />
          </div>
          <span className="font-mono text-[10px] tracking-wider uppercase text-[#8A8A8A] truncate">
            {TYPE_BADGE_LABELS[nodeType] || nodeType}
          </span>
        </div>

        {isMultiplayerLocked && (
          <div
            title={`Locked by ${lockInfo?.userName || 'collaborator'}`}
            className="flex items-center gap-1 text-[10px] font-mono text-[#FACC15] bg-[#FACC15]/10 px-1.5 py-0.5 rounded border border-[#FACC15]/30"
          >
            <Lock className="h-2.5 w-2.5" />
            <span className="truncate max-w-[60px]">{lockInfo?.userName || 'Locked'}</span>
          </div>
        )}

        {isManualLocked && !isMultiplayerLocked && (
          <div
            title="Node locked from manual edits"
            className="text-[10px] font-mono text-[#8A8A8A] bg-[#161616] p-1 rounded"
          >
            <Lock className="h-2.5 w-2.5" />
          </div>
        )}

        {data.hidden && (
          <div title="Node is hidden from main view" className="text-[10px] text-[#8A8A8A]">
            <EyeOff className="h-2.5 w-2.5" />
          </div>
        )}

        {isBlocked && (
          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#232323] text-[#8A8A8A] border border-[#3A3A3A]">
            Parent incomplete
          </span>
        )}
      </div>

      {/* Node Title / Label */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-xs text-[#FAFAFA] truncate tracking-tight">
          {data.label || 'Untitled Node'}
        </h3>
        {isComplete && (
          <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E] shrink-0" />
        )}
        {isIncomplete && !isBlocked && (
          <AlertTriangle className="h-3.5 w-3.5 text-[#FACC15] shrink-0" />
        )}
      </div>

      {/* Node Description or Specific Info */}
      <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-[#8A8A8A]">
        {nodeType === 'section' && typeof data.config?.strength === 'number' && (
          <span>Strength: {data.config.strength}</span>
        )}
        {nodeType === 'batch' && typeof data.config?.size === 'number' && (
          <span>Size: {data.config.size}</span>
        )}
        {nodeType === 'subjectAssignment' && (
          <span>{String(data.config?.type || 'theory').toUpperCase()} • {String(data.config?.weeklyHours || 0)}h/wk</span>
        )}
        {nodeType === 'room' && typeof data.config?.capacity === 'number' && (
          <span>Cap: {data.config.capacity} ({String(data.config?.type || 'lecture')})</span>
        )}
        {nodeType === 'faculty' && (
          <span>Max {String(data.config?.maxHoursPerWeek || 0)}h/wk</span>
        )}
      </div>

      {/* Faculty Node: Compact Weekly Availability Mini-Grid */}
      {nodeType === 'faculty' && (
        <div className="mt-2 pt-1.5 border-t border-[#232323]">
          <div className="text-[9px] font-mono text-[#8A8A8A] mb-1 flex items-center justify-between">
            <span>Availability (Mon-Sat)</span>
            <span className="text-[#22C55E]">Open</span>
          </div>
          <div className="grid grid-cols-6 gap-0.5">
            {[0, 1, 2, 3, 4, 5].map((dayIdx) => (
              <div key={dayIdx} className="space-y-0.5">
                {[0, 1, 2, 3, 4].map((slotIdx) => (
                  <div
                    key={slotIdx}
                    title={`Day ${dayIdx + 1}, Period ${slotIdx + 1}`}
                    className="w-full h-1.5 rounded-[1px] bg-[#22C55E]/40 hover:bg-[#22C55E]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incomplete Missing Fields Checklist */}
      {isIncomplete && !isBlocked && data.missing && data.missing.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-[#232323]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMissing(!showMissing);
            }}
            className="w-full flex items-center justify-between text-[10px] font-mono text-[#FACC15] hover:underline"
          >
            <span>{data.missing.length} missing field{data.missing.length > 1 ? 's' : ''}</span>
            {showMissing ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showMissing && (
            <div className="mt-1 space-y-1 bg-[#0A0A0A] p-1.5 rounded border border-[#232323]">
              {data.missing.map((m, idx) => (
                <div key={idx} className="text-[10px] font-mono text-[#8A8A8A] leading-tight">
                  <span className="text-[#FACC15]">•</span> {m.field}: {m.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source Handle (for parents/connections) */}
      <Handle
        type="source"
        position={sourcePos}
        className="!w-2.5 !h-2.5 !bg-[#8A8A8A] !border-2 !border-[#0A0A0A] !rounded-full hover:!bg-[#FACC15]"
      />

      {/* G1 Gating: "+" add-child button appears ONLY when complete! */}
      {isComplete && allowedChildTypes.length > 0 && !isManualLocked && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
          <button
            type="button"
            title="Add child node"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMenu(!showAddMenu);
            }}
            className="w-6 h-6 rounded-full bg-[#111] border border-[#22C55E] text-[#22C55E] flex items-center justify-center hover:bg-[#22C55E] hover:text-[#0A0A0A] transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {/* Child Type Selection Dropdown */}
          {showAddMenu && (
            <div
              className="absolute top-7 left-1/2 -translate-x-1/2 w-40 bg-[#111111] border border-[#232323] rounded-md shadow-xl py-1 z-50 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1 text-[10px] font-mono text-[#8A8A8A] border-b border-[#232323]">
                Add Child Node
              </div>
              {allowedChildTypes.map((childType) => (
                <button
                  key={childType}
                  type="button"
                  onClick={() => {
                    setShowAddMenu(false);
                    window.dispatchEvent(
                      new CustomEvent('slotly:add-child', {
                        detail: { parentId: id, childType },
                      }),
                    );
                  }}
                  className="w-full text-left px-2.5 py-1 text-xs text-[#FAFAFA] hover:bg-[#1f1f1f] flex items-center gap-1.5"
                >
                  <Plus className="h-3 w-3 text-[#FACC15]" />
                  <span>{TYPE_BADGE_LABELS[childType] || childType}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ==========================================
// 2. SUB-FLOW / CONTAINER GROUP NODE
// ==========================================

export const BlueprintGroupNode = memo(function BlueprintGroupNode({
  id,
  data,
  selected,
}: NodeProps<BlueprintGroupNodeType>) {
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
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
        'rounded-lg border bg-[#111111]/30 p-3 transition-all min-w-[280px]',
        selected ? 'border-[#FACC15]' : 'border-[#232323]',
        collapsed ? 'h-14' : 'min-h-[220px]',
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
          <span className="font-semibold text-xs text-[#FAFAFA]">{data.label}</span>
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

export const nodeTypes = {
  blueprint: BlueprintNode,
  blueprintGroup: BlueprintGroupNode,
};
