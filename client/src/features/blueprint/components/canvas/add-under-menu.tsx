// Floating picker menu opened when click-to-add matches multiple valid complete parents.
'use client';

import { useEffect, useRef, useState } from 'react';
import type { BlueprintNodeType } from '@slotly/contracts';
import { TYPE_ICONS } from '../canvas/node-card';
import { NODE_TYPE_DISPLAY_NAMES } from '../../can-add-child';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { BlueprintCanvasNode } from '../../types/canvas.types';

export interface AddUnderMenuProps {
  isOpen: boolean;
  childType: BlueprintNodeType | null;
  parents: BlueprintCanvasNode[];
  onSelectParent: (parentId: string) => void;
  onClose: () => void;
}

/**
 * Floating menu for selecting parent when multiple valid complete parents qualify.
 */
export function AddUnderMenu({
  isOpen,
  childType,
  parents,
  onSelectParent,
  onClose,
}: AddUnderMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (parents.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % parents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + parents.length) % parents.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const chosen = parents[selectedIndex];
        if (chosen) {
          onSelectParent(chosen.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, parents, selectedIndex, onClose, onSelectParent]);

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

  if (!isOpen || !childType || parents.length === 0) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label={`Add ${NODE_TYPE_DISPLAY_NAMES[childType]} under parent`}
      className={cn(
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[280px] rounded-[16px] border border-[#232323] bg-[#111111] shadow-2xl p-2 select-none outline-none',
        'animate-in fade-in-0 zoom-in-95 duration-100',
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#232323] mb-1">
        <div>
          <div className="text-[10px] font-mono uppercase text-[#8A8A8A] tracking-wider">
            Select Parent
          </div>
          <div className="text-[13px] font-medium text-[#FAFAFA]">
            Add {NODE_TYPE_DISPLAY_NAMES[childType]} under...
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1 rounded text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="py-1 max-h-[260px] overflow-y-auto space-y-1">
        {parents.map((p, idx) => {
          const Icon = TYPE_ICONS[p.data.nodeType] || null;
          const isSelected = selectedIndex === idx;

          return (
            <button
              key={p.id}
              type="button"
              role="menuitem"
              onClick={() => onSelectParent(p.id)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={cn(
                'w-full h-11 px-2.5 rounded-[10px] flex items-center gap-2.5 text-left transition-colors',
                isSelected ? 'bg-[#1A1A1A] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:bg-[#161616] hover:text-[#FAFAFA]',
              )}
            >
              {Icon && (
                <div className="w-7 h-7 rounded-[6px] bg-[#161616] border border-[#232323] flex items-center justify-center text-[#FAFAFA] shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="min-w-0 flex-1 truncate">
                <div className="text-xs font-medium text-[#FAFAFA] truncate">
                  {p.data.label}
                </div>
                <div className="text-[10px] font-mono text-[#8A8A8A] truncate">
                  {NODE_TYPE_DISPLAY_NAMES[p.data.nodeType]}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
