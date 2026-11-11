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
  MessageSquare,
} from 'lucide-react';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { ALLOWED_CHILDREN, canAddChild } from '../../can-add-child';

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

  const { nodeType, config } = node.data;
  if (nodeType === 'section') {
    return `Strength ${config['strength'] || 60}`;
  }
  if (nodeType === 'batch') {
    return `Size ${config['size'] || 30}`;
  }
  if (nodeType === 'program') {
    return `${config['durationYears'] || 4} years`;
  }
  if (nodeType === 'academicYear') {
    return `Year ${config['yearNumber'] || 1}`;
  }
  if (nodeType === 'semester') {
    return `Semester ${config['number'] || 1}`;
  }
  if (nodeType === 'department') {
    return String(config['code'] || 'DEP');
  }
  if (nodeType === 'institution') {
    return String(config['code'] || 'CAMPUS');
  }
  if (nodeType === 'room') {
    return `Cap ${config['capacity'] || 30} (${config['type'] || 'general'})`;
  }
  if (nodeType === 'faculty') {
    return `${config['designation'] || 'Faculty'}`;
  }

  return '';
}

/** Subcomponent: Progress Bar kept for feature parity */
export const NodeProgress = memo(function NodeProgress({
  progress,
  effectiveStatus,
}: {
  progress: number;
  effectiveStatus: string;
}) {
  const isComplete = effectiveStatus === 'complete';
  return (
    <div className="w-full bg-[#1C1C1C] h-1 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full transition-all duration-300',
          isComplete ? 'bg-[#22C55E]' : 'bg-[#FACC15]',
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});

/** Subcomponent: Target Ring Handle at Top Edge */
export const HandleRing = memo(function HandleRing({
  nodeType,
  show,
}: {
  nodeType: BlueprintNodeType;
  show: boolean;
}) {
  if (nodeType === 'institution') return null;

  return (
    <div
      className={cn(
        'absolute -top-[5px] left-1/2 -translate-x-1/2 transition-opacity duration-150 z-20 pointer-events-auto',
        show ? 'opacity-100' : 'opacity-0 md:opacity-0',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[10px] !h-[10px] !rounded-full !bg-[#0A0A0A] !border-[1.5px] !border-[#8A8A8A] hover:!border-[#FAFAFA] hover:!scale-125 !transition-all"
        style={{ top: 0, left: '50%', transform: 'translate(-50%, 0)' }}
      />
    </div>
  );
});

/** Subcomponent: Source Pill Handle at Bottom Edge */
export const HandlePill = memo(function HandlePill({
  nodeType,
  show,
}: {
  nodeType: BlueprintNodeType;
  show: boolean;
}) {
  if (nodeType === 'batch') return null;

  return (
    <div
      className={cn(
        'absolute -bottom-[5px] left-1/2 -translate-x-1/2 transition-opacity duration-150 z-20 pointer-events-auto',
        show ? 'opacity-100' : 'opacity-0 md:opacity-0',
      )}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[20px] !h-[6px] !rounded-full !bg-[#232323] hover:!bg-[#FAFAFA] !border !border-[#383838] hover:!border-[#FAFAFA] !transition-all"
        style={{ bottom: 0, left: '50%', transform: 'translate(-50%, 0)' }}
      />
    </div>
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
  const nodes = useBlueprintStore((s) => s.nodes);

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

  // Compute live drag state highlights when dragging from library
  const validChildren = ALLOWED_CHILDREN[nodeType] || [];
  const isTargetForDrag = Boolean(activeDraggedType && validChildren.includes(activeDraggedType));
  const isDragDimmed = Boolean(activeDraggedType && !isTargetForDrag);

  // Card Border Styling
  let cardBorder = 'border-[#232323] hover:border-[#383838]';
  if (isDragOver) {
    if (isDragValid) {
      cardBorder = 'border-[#FAFAFA] ring-2 ring-[#FAFAFA]';
    } else {
      cardBorder = 'border-[#EF4444] ring-1 ring-[#EF4444]/60 cursor-not-allowed';
    }
  } else if (activeDraggedType) {
    if (isTargetForDrag) {
      if (isComplete) {
        cardBorder = 'border-[#FAFAFA] ring-2 ring-[#FAFAFA]/80';
      } else {
        cardBorder = 'border-dashed border-[#8A8A8A] ring-1 ring-[#8A8A8A]/50';
      }
    } else {
      cardBorder = 'border-[#1C1C1C] opacity-60';
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

  // Drag over target node: enforce canAddChild
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeDraggedType) return;

    const check = canAddChild(nodes, id, activeDraggedType, isCanvasLocked);

    if (check.ok) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragValid(true);
      setIsDragOver(true);
      window.dispatchEvent(new CustomEvent('slotly:drag-reason-clear'));
    } else {
      e.dataTransfer.dropEffect = 'none';
      setIsDragValid(false);
      setIsDragOver(true);
      window.dispatchEvent(
        new CustomEvent('slotly:drag-reason', {
          detail: {
            reason: check.reason || 'Cannot add node here',
            clientX: e.clientX,
            clientY: e.clientY,
            targetNodeId: id,
            showConfigButton: check.code === 'parent-incomplete',
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

    const check = canAddChild(nodes, id, droppedType, isCanvasLocked);
    if (!check.ok) {
      toast.error('Cannot add child here', check.reason || 'Parent must be complete');
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
        'relative w-[232px] rounded-[16px] bg-[#111111] p-3 transition-all duration-150 border cursor-pointer select-none outline-none',
        cardBorder,
        isDragDimmed && 'opacity-60',
        isLocked && 'border-[#EF4444]/40',
      )}
    >
      {/* Target Ring Handle at Top */}
      <HandleRing nodeType={nodeType} show={showHandles} />

      {/* Card Content Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-[6px] bg-[#161616] border border-[#232323] flex items-center justify-center text-[#FAFAFA] shrink-0">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider truncate">
              {TYPE_LABELS[nodeType] || nodeType}
            </div>
            <div
              className="text-[13px] font-medium text-[#FAFAFA] truncate max-w-[140px] leading-snug"
              title={data.label}
            >
              {data.label}
            </div>
          </div>
        </div>

        {/* Right Corner Badges: Incomplete Chip or Lock/Status indicator */}
        <div className="flex items-center gap-1 shrink-0">
          {activeDraggedType && isTargetForDrag && !isComplete && (
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#1C1C1C] text-[#FACC15] border border-[#383838]">
              Incomplete
            </span>
          )}

          {isLocked && (
            <span
              title={lockedBy ? `Locked by ${lockedBy.userName}` : 'Node locked'}
              className="text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
            </span>
          )}

          {isBlocked ? (
            <span className="w-2 h-2 rounded-full bg-[#8A8A8A]" title="Parent incomplete" />
          ) : isComplete ? (
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" title="Ready" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#FACC15]" title="Incomplete" />
          )}
        </div>
      </div>

      {/* Subtitle / Metric Line */}
      {metricText && (
        <div className="mt-1.5 text-[11px] font-mono text-[#8A8A8A] truncate">
          {metricText}
        </div>
      )}

      {/* Footer Status Line */}
      <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] font-mono text-[#8A8A8A]">
        <div>
          {isComplete ? (
            <span className="text-[#22C55E]">Ready</span>
          ) : (
            <span className="text-[#FACC15]">
              {issueCount} missing
            </span>
          )}
        </div>

        {commentsCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments?.();
            }}
            className="flex items-center gap-1 text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            <span>{commentsCount}</span>
          </button>
        )}
      </div>

      {/* Source Pill Handle at Bottom */}
      <HandlePill nodeType={nodeType} show={showHandles} />

      {/* Add Child "+" Control Button */}
      <AddChildButton
        nodeId={id}
        allowedChildTypes={allowedChildTypes}
        isHovered={isHovered}
        isSelected={selected}
      />

      {/* Visually hidden issues summary for screen readers */}
      <span id={`node-issues-summary-${id}`} className="sr-only">
        {issuesSummary}
      </span>
    </div>
  );
});
