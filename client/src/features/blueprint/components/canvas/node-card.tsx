// Presentation component rendering NodeCard and its subcomponents.
'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
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
  MessageSquare,
} from 'lucide-react';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';
import { cn } from '@/lib/utils';

export const TYPE_ICONS: Record<BlueprintNodeType, React.ElementType> = {
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

export const TYPE_LABELS: Record<BlueprintNodeType, string> = {
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

/** Compute completion percentage based on filled vs missing required fields */
export function calculateNodeProgress(node: BlueprintCanvasNode): number {
  const effectiveStatus = node.data.effectiveStatus || node.data.status;
  if (effectiveStatus === 'complete') return 100;
  if (effectiveStatus === 'blocked') return 0;

  const missingCount = node.data.missing?.length || 0;
  if (missingCount === 0) return 100;

  // Approximate required fields count per node type
  const requiredCountMap: Record<BlueprintNodeType, number> = {
    institution: 2,
    department: 2,
    program: 2,
    academicYear: 1,
    semester: 2,
    section: 2,
    batch: 2,
    subjectAssignment: 3,
    electiveGroup: 2,
    faculty: 2,
    room: 2,
  };

  const totalRequired = requiredCountMap[node.data.nodeType] || 2;
  const filled = Math.max(0, totalRequired - missingCount);
  return Math.min(95, Math.round((filled / Math.max(totalRequired, missingCount + filled)) * 100));
}

/** Get single metric line text for Row 2 */
export function getNodeMetricLine(node: BlueprintCanvasNode): string {
  const { nodeType, config } = node.data;

  // Check if node has pool data (v2 preparation)
  const pool = (node.data as Record<string, unknown>)['pool'] as { additions?: unknown[] } | undefined;
  if (pool?.additions && pool.additions.length > 0) {
    const adds = pool.additions as Array<{ itemType: string }>;
    const fCount = adds.filter((a) => a.itemType === 'faculty').length;
    const sCount = adds.filter((a) => a.itemType === 'subject').length;
    const rCount = adds.filter((a) => a.itemType === 'room').length;
    if (fCount > 0 || sCount > 0 || rCount > 0) {
      return `F ${fCount} • S ${sCount} • R ${rCount}`;
    }
  }

  switch (nodeType) {
    case 'section':
      return typeof config?.strength === 'number' ? `Strength ${config.strength}` : 'Strength not set';
    case 'batch':
      return typeof config?.size === 'number' ? `Size ${config.size}` : 'Size not set';
    case 'program':
      return typeof config?.durationYears === 'number' ? `${config.durationYears} years` : 'Duration not set';
    case 'semester':
      if (config?.startDate && config?.endDate) {
        return `${String(config.startDate)} to ${String(config.endDate)}`;
      }
      return typeof config?.number === 'number' ? `Semester ${config.number}` : 'Term active';
    case 'academicYear':
      return typeof config?.yearNumber === 'number' ? `Year ${config.yearNumber}` : 'Cohort active';
    case 'department':
      return typeof config?.code === 'string' ? `Code: ${config.code}` : 'Department node';
    case 'institution':
      return typeof config?.workingDaysCount === 'number'
        ? `${config.workingDaysCount} working days`
        : 'Campus root';
    case 'subjectAssignment':
      return `${String(config?.type || 'theory').toUpperCase()} • ${String(config?.weeklyHours || 0)}h/wk`;
    case 'faculty':
      return `Max ${String(config?.maxHoursPerWeek || 0)}h/wk`;
    case 'room':
      return `Cap ${config?.capacity || 0} (${String(config?.type || 'lecture')})`;
    default:
      return 'Active node';
  }
}

/** Subcomponent: Progress Bar in Row 3 */
export const NodeProgress = memo(function NodeProgress({
  percent,
  isComplete,
}: {
  percent: number;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2 w-full pt-1">
      <div className="h-1 flex-1 rounded-[2px] bg-[#222222] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-[2px] transition-all duration-300',
            isComplete ? 'bg-[#22C55E]' : 'bg-white/85',
          )}
          style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
        />
      </div>
      <span className="font-mono text-[11px] text-[#8A8A8A] min-w-[28px] text-right">
        {percent}%
      </span>
    </div>
  );
});

/** Subcomponent: Target Ring Handle at Top Edge */
export const HandleRing = memo(function HandleRing({
  position = Position.Top,
}: {
  position?: Position;
}) {
  return (
    <Handle
      type="target"
      position={position}
      className="!w-2.5 !h-2.5 !rounded-full !border-[1.5px] !border-[#8A8A8A] !bg-[#0A0A0A] hover:!border-[#FAFAFA] hover:!bg-[#FAFAFA] transition-colors"
      style={{ top: '-5px' }}
    />
  );
});

/** Subcomponent: Source Pill Handle at Bottom Edge */
export const HandlePill = memo(function HandlePill({
  position = Position.Bottom,
}: {
  position?: Position;
}) {
  return (
    <Handle
      type="source"
      position={position}
      className="!w-4 !h-2 !rounded-full !bg-[#8A8A8A]/50 hover:!bg-[#FAFAFA] !border !border-[#232323] transition-colors"
      style={{ bottom: '-4px' }}
    />
  );
});

/** Subcomponent: Add Child Control Button */
export const AddChildButton = memo(function AddChildButton({
  nodeId,
  allowedChildTypes,
  isHovered,
  isSelected,
}: {
  nodeId: string;
  allowedChildTypes: BlueprintNodeType[];
  isHovered: boolean;
  isSelected: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (allowedChildTypes.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-150',
        isHovered || isSelected || open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:pointer-events-none',
      )}
    >
      <button
        type="button"
        aria-label="Add child node"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-[22px] h-[22px] rounded-full bg-[#181818] border border-[#FAFAFA]/40 text-[#FAFAFA] flex items-center justify-center hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Plus className="h-3 w-3" />
      </button>

      {open && (
        <div
          className="absolute top-7 left-1/2 -translate-x-1/2 w-44 bg-[#111111] border border-[#232323] rounded-[10px] shadow-xl py-1 z-50 text-left overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-mono text-[#8A8A8A] border-b border-[#232323]">
            Add Child Node
          </div>
          {allowedChildTypes.map((childType) => {
            const ChildIcon = TYPE_ICONS[childType] || Plus;
            return (
              <button
                key={childType}
                type="button"
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(
                    new CustomEvent('slotly:add-child', {
                      detail: { parentId: nodeId, childType },
                    }),
                  );
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-[#FAFAFA] hover:bg-[#1a1a1a] flex items-center gap-2 transition-colors"
              >
                <ChildIcon className="h-3 w-3 text-[#8A8A8A]" />
                <span className="font-mono text-[11px] truncate">
                  {TYPE_LABELS[childType] || childType}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export interface NodeCardProps {
  node: BlueprintCanvasNode;
  selected?: boolean;
  allowedChildTypes?: BlueprintNodeType[];
  childCount?: number;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onOpenComments?: () => void;
}

/** Base NodeCard component matching reference visual spec */
export const NodeCard = memo(function NodeCard({
  node,
  selected = false,
  allowedChildTypes = [],
  childCount = 0,
  onSelect,
  onContextMenu,
  onOpenComments,
}: NodeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { id, data } = node;
  const nodeType = data.nodeType || 'institution';
  const Icon = TYPE_ICONS[nodeType] || Building2;

  const effectiveStatus = data.effectiveStatus || data.status || 'empty';
  const isComplete = effectiveStatus === 'complete';
  const isBlocked = effectiveStatus === 'blocked';
  const isIncomplete = effectiveStatus === 'incomplete' || effectiveStatus === 'empty';
  const isLocked = Boolean(data.locked);
  const lockedBy = data.lockedBy;
  const commentsCount = data.commentsCount || 0;
  const missingCount = data.missing?.length || 0;

  const progressPercent = calculateNodeProgress(node);
  const metricText = getNodeMetricLine(node);

  // States styling
  let cardBorder = 'border-[#232323] hover:border-[#383838]';
  if (selected) {
    cardBorder = 'border-white/60 ring-2 ring-white/10';
  } else if (isBlocked) {
    cardBorder = 'border-[#232323] opacity-50';
  } else if (isComplete) {
    cardBorder = 'border-[#232323] hover:border-[#383838]';
  } else if (isIncomplete) {
    cardBorder = 'border-dashed border-[#FACC15]/50';
  }

  const handleMouseEnter = () => {
    setIsHovered(true);
    window.dispatchEvent(
      new CustomEvent('slotly:node-hover', { detail: { nodeId: id } }),
    );
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    window.dispatchEvent(
      new CustomEvent('slotly:node-leave', { detail: { nodeId: id } }),
    );
  };

  const handleFocus = () => {
    window.dispatchEvent(
      new CustomEvent('slotly:node-focus', { detail: { nodeId: id } }),
    );
  };

  const handleBlur = () => {
    window.dispatchEvent(
      new CustomEvent('slotly:node-blur', { detail: { nodeId: id } }),
    );
  };

  const issuesSummary = isBlocked
    ? 'Node is blocked by parent'
    : isIncomplete && missingCount > 0
      ? `${missingCount} requirements missing: ${(data.missing || []).map((m) => m.field).join(', ')}`
      : 'Node is complete and valid';

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`blueprint-node-${id}`}
      data-status={effectiveStatus}
      aria-describedby={`node-issues-summary-${id}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      onContextMenu={onContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        'relative group w-[200px] min-h-[72px] rounded-[12px] border p-[12px_14px] select-none cursor-pointer transition-[border-color,opacity] duration-120 outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        'bg-gradient-to-b from-[#141414] to-[#0D0D0D]',
        cardBorder,
        data.hidden && 'opacity-40 border-dashed',
      )}
    >
      {/* Screen Reader Summary of Issues */}
      <span id={`node-issues-summary-${id}`} className="sr-only">
        {issuesSummary}
      </span>
      {/* Top Handle (Target) */}
      {nodeType !== 'institution' && <HandleRing />}

      {/* Row 1: Icon + Title + Type Label + Status Indicator */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className="h-4 w-4 text-[#FAFAFA]/70 shrink-0" />
          <h3 className="text-[14px] leading-5 font-medium text-[#FAFAFA] truncate">
            {data.label || 'Untitled'}
          </h3>
        </div>

        {/* Right side: Type pill or status dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isComplete && (
            <span
              title="Complete"
              className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
            />
          )}

          {isBlocked && (
            <span className="font-mono text-[10px] text-[#8A8A8A]">
              Blocked
            </span>
          )}

          {isIncomplete && !isBlocked && (
            <AlertTriangle className="h-3 w-3 text-[#FACC15]" />
          )}

          {/* Quick Corner Indicators */}
          {commentsCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments?.();
              }}
              title={`${commentsCount} comments`}
              className="text-[#8A8A8A] hover:text-[#FAFAFA]"
            >
              <MessageSquare className="h-3 w-3" />
            </button>
          )}

          {lockedBy ? (
            <span
              title={`Editing by ${lockedBy.userName}`}
              className="flex items-center gap-0.5 text-[9px] font-mono text-[#8A8A8A]"
            >
              <Lock className="h-2.5 w-2.5" />
              <span>Editing</span>
            </span>
          ) : isLocked ? (
            <Lock className="h-3 w-3 text-[#8A8A8A]" />
          ) : null}
        </div>
      </div>

      {/* Row 2: Metric Line */}
      <div className="mt-1 text-[12px] text-[#8A8A8A] font-mono leading-none truncate">
        {metricText}
      </div>

      {/* Faculty Availability Mini-Grid (if faculty node) */}
      {nodeType === 'faculty' && (
        <div className="mt-2 pt-1 border-t border-[#1C1C1C]">
          <div className="grid grid-cols-6 gap-0.5">
            {[0, 1, 2, 3, 4, 5].map((d) => (
              <div key={d} className="space-y-0.5">
                {[0, 1, 2, 3].map((s) => (
                  <div key={s} className="w-full h-1 rounded-[1px] bg-[#22C55E]/30" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Progress Bar */}
      <NodeProgress percent={progressPercent} isComplete={isComplete} />

      {/* Static Compact Footer Status (No inline expansion or layout shift) */}
      <div className="mt-1.5 pt-1 border-t border-[#1C1C1C] flex items-center justify-between font-mono text-[11px] leading-none">
        {isIncomplete && !isBlocked && missingCount > 0 ? (
          <span className="text-[#FACC15]">{missingCount} missing</span>
        ) : isBlocked ? (
          <span className="text-[#8A8A8A]">Blocked</span>
        ) : isComplete ? (
          <span className="text-[#22C55E]">Ready</span>
        ) : (
          <span className="text-[#8A8A8A]">Draft</span>
        )}

        {childCount > 0 && (
          <span className="text-[#8A8A8A]">
            {childCount} {childCount === 1 ? 'child' : 'children'}
          </span>
        )}
      </div>

      {/* Bottom Handle / Add Child Control */}
      {isComplete && allowedChildTypes.length > 0 && !isLocked ? (
        <>
          <HandlePill />
          <AddChildButton
            nodeId={id}
            allowedChildTypes={allowedChildTypes}
            isHovered={isHovered}
            isSelected={selected}
          />
        </>
      ) : (
        <HandlePill />
      )}
    </div>
  );
});
