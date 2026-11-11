// Floating context menu displayed on connect-end drag release on empty canvas.
'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { BlueprintNodeType } from '@slotly/contracts';
import { TYPE_ICONS } from '../canvas/node-card';
import { ALLOWED_CHILDREN, NODE_TYPE_DISPLAY_NAMES } from '../../can-add-child';
import { cn } from '@/lib/utils';
import { Plus, X, Lock } from 'lucide-react';
import type { BlueprintCanvasNode } from '../../types/canvas.types';

export interface ConnectEndMenuProps {
  isOpen: boolean;
  sourceNode: BlueprintCanvasNode | null;
  position: { x: number; y: number } | null;
  onSelectType: (childType: BlueprintNodeType) => void;
  onClose: () => void;
  onOpenConfig?: ((nodeId: string) => void) | undefined;
}

const DESCRIPTIONS: Record<BlueprintNodeType, string> = {
  institution: 'Root institution node',
  department: 'Academic department',
  program: 'Degree or study program',
  academicYear: 'Year cohort in program',
  semester: 'Active term duration',
  section: 'Class cohort with capacity',
  batch: 'Lab subgroup of section',
  subjectAssignment: 'Course assignment',
  electiveGroup: 'Elective pool',
  faculty: 'Instructor resource',
  room: 'Facility resource',
};

/**
 * Floating ConnectEndMenu rendered at drop position when a connection is dragged to empty canvas.
 */
export function ConnectEndMenu({
  isOpen,
  sourceNode,
  position,
  onSelectType,
  onClose,
  onOpenConfig,
}: ConnectEndMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const parentType = sourceNode?.data.nodeType || 'institution';
  const parentName = sourceNode?.data.label || 'Parent';
  const isParentComplete =
    (sourceNode?.data.effectiveStatus || sourceNode?.data.status) === 'complete';
  const allowedChildren = React.useMemo(
    () => ALLOWED_CHILDREN[parentType] || [],
    [parentType],
  );

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    menuRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (allowedChildren.length === 0 || !isParentComplete) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allowedChildren.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allowedChildren.length) % allowedChildren.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const chosen = allowedChildren[selectedIndex];
        if (chosen) {
          onSelectType(chosen);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allowedChildren, isParentComplete, selectedIndex, onClose, onSelectType]);

  // Click outside detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !position || !sourceNode) return null;

  // Clamp position to avoid viewport collision (232px width, ~240px height)
  const menuWidth = 232;
  const left = Math.max(16, Math.min(window.innerWidth - menuWidth - 380, position.x));
  const top = Math.max(16, Math.min(window.innerHeight - 280, position.y));

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label={`Add child to ${parentName}`}
      className={cn(
        'fixed z-50 w-[232px] rounded-[12px] border border-[#232323] bg-[#111111] shadow-2xl p-1 select-none outline-none',
        'animate-in fade-in-0 zoom-in-95 duration-100',
      )}
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      {/* Header with Parent Name and Close trigger */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#232323]">
        <div className="truncate">
          <div className="text-[10px] font-mono uppercase text-[#8A8A8A] tracking-wider">
            Add child to
          </div>
          <div className="text-[13px] font-medium text-[#FAFAFA] truncate">
            {parentName}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="p-1 rounded text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Case 1: Incomplete Parent */}
      {!isParentComplete && (
        <div className="p-3 text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#383838] mx-auto flex items-center justify-center text-[#FACC15]">
            <Lock className="h-4 w-4" />
          </div>
          <div className="text-xs text-[#FAFAFA] font-medium">
            Complete {parentName} first
          </div>
          <p className="text-[11px] text-[#8A8A8A] font-sans">
            Child nodes can only be created once this parent node is valid and complete.
          </p>
          {onOpenConfig && (
            <button
              type="button"
              onClick={() => {
                onOpenConfig(sourceNode.id);
                onClose();
              }}
              className="w-full mt-1 h-8 rounded-[8px] bg-[#181818] hover:bg-[#232323] text-xs font-mono text-[#FAFAFA] border border-[#383838] transition-colors"
            >
              Open Config
            </button>
          )}
        </div>
      )}

      {/* Case 2: Parent is a leaf node */}
      {isParentComplete && allowedChildren.length === 0 && (
        <div className="p-3 text-center text-xs text-[#8A8A8A] font-mono">
          No child types for {NODE_TYPE_DISPLAY_NAMES[parentType] || parentType}
        </div>
      )}

      {/* Case 3: List of valid child types */}
      {isParentComplete && allowedChildren.length > 0 && (
        <div className="py-1 space-y-0.5">
          {allowedChildren.map((childType, idx) => {
            const Icon = TYPE_ICONS[childType] || Plus;
            const isSelected = selectedIndex === idx;

            return (
              <button
                key={childType}
                type="button"
                role="menuitem"
                onClick={() => onSelectType(childType)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  'w-full min-h-[44px] md:h-[44px] touch:h-[48px] px-2.5 rounded-[8px] flex items-center gap-2.5 text-left transition-colors',
                  isSelected ? 'bg-[#1A1A1A] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:bg-[#161616] hover:text-[#FAFAFA]',
                )}
              >
                <div className="w-7 h-7 rounded-[6px] bg-[#161616] border border-[#232323] flex items-center justify-center text-[#FAFAFA] shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <div className="text-[13px] font-medium leading-snug truncate text-[#FAFAFA]">
                    {NODE_TYPE_DISPLAY_NAMES[childType] || childType}
                  </div>
                  <div className="text-[11px] text-[#8A8A8A] truncate font-sans">
                    {DESCRIPTIONS[childType] || ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
