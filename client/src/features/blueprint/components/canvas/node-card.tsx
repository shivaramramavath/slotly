// Presentation component rendering compact NodeCard and its subcomponents.
'use client';

import React, { memo, useState, useEffect } from 'react';
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
  Check,
} from 'lucide-react';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
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

/** Get single metric line text for subtitle */
export function getNodeMetricLine(node: BlueprintCanvasNode): string {
  const { nodeType, config } = node.data;

  // Check if node has pool data
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

/** Subcomponent: Progress Bar kept for feature parity */
export const NodeProgress = memo(function NodeProgress({
  percent,
  isComplete,
}: {
  percent: number;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2 w-full pt-1" data-testid="node-progress-bar">
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
  isVisible = false,
}: {
  position?: Position;
  isVisible?: boolean;
}) {
  return (
    <Handle
      type="target"
      position={position}
      className={cn(
        '!w-2 !h-2 !rounded-full !border !border-[#383838] !bg-[#111111] hover:!border-[#FAFAFA] hover:!bg-[#FAFAFA] transition-opacity duration-150',
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
      style={{ top: '-4px' }}
    />
  );
});

/** Subcomponent: Source Pill Handle at Bottom Edge */
export const HandlePill = memo(function HandlePill({
  position = Position.Bottom,
  isVisible = false,
}: {
  position?: Position;
  isVisible?: boolean;
}) {
  return (
    <Handle
      type="source"
      position={position}
      className={cn(
        '!w-2 !h-2 !rounded-full !border !border-[#383838] !bg-[#111111] hover:!border-[#FAFAFA] hover:!bg-[#FAFAFA] transition-opacity duration-150',
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
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
        isHovered || isSelected || open
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none md:pointer-events-none',
      )}
    >
      <button
        type="button"
        aria-label="Add child node"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-[20px] h-[20px] rounded-full bg-[#181818] border border-[#383838] text-[#FAFAFA] flex items-center justify-center hover:bg-[#FAFAFA] hover:text-[#0A0A0A] hover:border-[#FAFAFA] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Plus className="h-3 w-3" />
      </button>

      {open && (
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 w-44 bg-[#111111] border border-[#232323] rounded-[10px] shadow-2xl py-1 z-50 text-left overflow-hidden"
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
                <ChildIcon className="h-3.5 w-3.5 text-[#8A8A8A]" />
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

/** Base NodeCard component matching compact 232px specification */
export const NodeCard = memo(function NodeCard({
  node,
  selected = false,
  allowedChildTypes = [],
  onSelect,
  onContextMenu,
  onOpenComments,
}: NodeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragValid, setIsDragValid] = useState(false);
  const [activeDraggedType, setActiveDraggedType] = useState<BlueprintNodeType | null>(null);

  const isCanvasLocked = useBlueprintStore((s) => s.isCanvasLocked);

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

  // Total issues count (errors + warnings)
  const hasIssues = !isComplete && (isBlocked || isIncomplete || missingCount > 0);
  const issueCount = isBlocked ? 1 : Math.max(1, missingCount);

  const metricText = getNodeMetricLine(node);

  // Listen to drag-node start/end events across the window
  useEffect(() => {
    const handleDragStart = (e: Event) => {
      const { type } = (e as CustomEvent<{ type: BlueprintNodeType }>).detail;
      setActiveDraggedType(type);
    };

    const handleDragEnd = () => {
      setActiveDraggedType(null);
      setIsDragOver(false);
    };

    window.addEventListener('slotly:drag-node-start', handleDragStart);
    window.addEventListener('slotly:drag-node-end', handleDragEnd);

    return () => {
      window.removeEventListener('slotly:drag-node-start', handleDragStart);
      window.removeEventListener('slotly:drag-node-end', handleDragEnd);
    };
  }, []);

  // Card Border Styling
  let cardBorder = 'border-[#232323] hover:border-[#383838]';
  if (isDragOver) {
    if (isDragValid) {
      cardBorder = 'border-[#FAFAFA] ring-2 ring-[#FAFAFA]/70';
    } else {
      cardBorder = 'border-[#EF4444] ring-1 ring-[#EF4444]/60 cursor-not-allowed';
    }
  } else if (selected) {
    cardBorder = 'border-[#FAFAFA] ring-1 ring-[#FAFAFA] ring-offset-2 ring-offset-[#0A0A0A]';
  } else if (isBlocked) {
    cardBorder = 'border-[#232323] opacity-60';
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

  // Drag over target node
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeDraggedType) return;

    if (isCanvasLocked) {
      e.dataTransfer.dropEffect = 'none';
      setIsDragValid(false);
      setIsDragOver(true);
      window.dispatchEvent(
        new CustomEvent('slotly:drag-reason', {
          detail: {
            reason: 'Canvas is locked. Unlock canvas to add or modify nodes.',
            clientX: e.clientX,
            clientY: e.clientY,
          },
        }),
      );
      return;
    }

    const isAllowed = allowedChildTypes.includes(activeDraggedType);
    if (isAllowed && isComplete) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragValid(true);
      setIsDragOver(true);
      window.dispatchEvent(new CustomEvent('slotly:drag-reason-clear'));
    } else {
      e.dataTransfer.dropEffect = 'none';
      setIsDragValid(false);
      setIsDragOver(true);
      const reason = !isComplete
        ? `Complete '${data.label || 'parent'}' first`
        : `Cannot add ${activeDraggedType} under ${nodeType}. Needs a valid parent.`;
      window.dispatchEvent(
        new CustomEvent('slotly:drag-reason', {
          detail: {
            reason,
            clientX: e.clientX,
            clientY: e.clientY,
          },
        }),
      );
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    window.dispatchEvent(new CustomEvent('slotly:drag-reason-clear'));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    window.dispatchEvent(new CustomEvent('slotly:drag-reason-clear'));

    const droppedType = (e.dataTransfer.getData('application/x-slotly-node') ||
      e.dataTransfer.getData('application/slotly-node-type') ||
      activeDraggedType) as BlueprintNodeType;

    if (!droppedType) return;

    if (isCanvasLocked) {
      toast.info('Canvas locked', 'Canvas is locked. Unlock canvas to add or modify nodes.');
      return;
    }

    const isAllowed = allowedChildTypes.includes(droppedType);
    if (!isAllowed || !isComplete) {
      const reason = !isComplete
        ? `Complete '${data.label || 'parent'}' first`
        : `Cannot add ${droppedType} under ${nodeType}.`;
      toast.error('Cannot add child here', reason);
      return;
    }

    window.dispatchEvent(
      new CustomEvent('slotly:add-child', {
        detail: { parentId: id, childType: droppedType },
      }),
    );
  };

  const issuesSummary = isBlocked
    ? 'Node is blocked by parent'
    : hasIssues
      ? `${issueCount} issues: ${(data.missing || []).map((m) => m.field).join(', ')}`
      : 'Node is complete and valid';

  const showHandles = isHovered || selected || isDragOver;

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`blueprint-node-${id}`}
      data-status={effectiveStatus}
      aria-label={data.label || 'Node'}
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative group w-[232px] min-h-[64px] rounded-[12px] border p-3 select-none cursor-pointer',
        'bg-[#111111] transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white',
        cardBorder,
        data.hidden && 'opacity-40 border-dashed',
      )}
    >
      {/* Screen Reader Summary of Issues */}
      <span id={`node-issues-summary-${id}`} className="sr-only">
        {issuesSummary}
      </span>

      {/* Top Handle (Target) */}
      {nodeType !== 'institution' && <HandleRing isVisible={showHandles} />}

      {/* Main Row: Icon + Title/Subtitle + Status */}
      <div className="flex items-start justify-between gap-2.5">
        {/* Left: 20px Icon + Label + Subtitle */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <Icon className="h-5 w-5 text-[#8A8A8A] shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h3
              className="text-[14px] leading-snug font-medium text-[#FAFAFA] truncate"
              title={data.label || 'Untitled'}
            >
              {data.label || 'Untitled'}
            </h3>
            <div
              className="text-[12px] font-mono text-[#8A8A8A] leading-snug truncate mt-0.5"
              title={metricText}
            >
              {metricText}
            </div>
          </div>
        </div>

        {/* Right Status Area */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {hasIssues ? (
            <div
              className="flex items-center gap-1 text-[#FACC15]"
              title={`${issueCount} issues`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#FACC15]" />
              <span className="font-mono text-xs font-medium leading-none text-[#FACC15]">
                {issueCount}
              </span>
            </div>
          ) : isComplete ? (
            <span title="Ready">
              <Check className="h-4 w-4 text-[#8A8A8A] shrink-0" />
            </span>
          ) : null}

          {/* Locked / Comments Icons */}
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
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          )}

          {lockedBy ? (
            <span
              title={`Editing by ${lockedBy.userName}`}
              className="flex items-center gap-0.5 text-[9px] font-mono text-[#8A8A8A]"
            >
              <Lock className="h-3 w-3" />
            </span>
          ) : isLocked ? (
            <Lock className="h-3.5 w-3.5 text-[#8A8A8A]" />
          ) : null}
        </div>
      </div>

      {/* Bottom Handle / Add Child Control */}
      {nodeType !== 'batch' && (
        <>
          <HandlePill isVisible={showHandles} />
          {isComplete && allowedChildTypes.length > 0 && !isLocked && (
            <AddChildButton
              nodeId={id}
              allowedChildTypes={allowedChildTypes}
              isHovered={isHovered}
              isSelected={selected}
            />
          )}
        </>
      )}
    </div>
  );
});
