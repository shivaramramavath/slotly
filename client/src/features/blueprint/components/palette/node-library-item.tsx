// React component for node-library-item.
'use client';

import { useState, type KeyboardEvent, type MouseEvent, type DragEvent } from 'react';
import { HelpCircle } from 'lucide-react';
import type { PaletteItem } from './blueprint-palette';
import { cn } from '@/lib/utils';

export interface NodeLibraryItemProps {
  item: PaletteItem;
  isExpanded: boolean;
  isAllowed: boolean;
  reason?: string | undefined;
  isFocused: boolean;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  itemRef?: ((el: HTMLButtonElement | null) => void) | undefined;
}

/** React component rendering an individual node library item */
export function NodeLibraryItem({
  item,
  isExpanded,
  isAllowed,
  reason,
  isFocused,
  onSelect,
  onKeyDown,
  itemRef,
}: NodeLibraryItemProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const Icon = item.icon;
  const descriptionId = `node-desc-${item.type}`;
  const reasonId = `node-reason-${item.type}`;

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      // Small 2px shake on disabled click
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
      return;
    }
    onSelect();
  };

  const handleDragStart = (e: DragEvent) => {
    if (!isAllowed) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/slotly-node-type', item.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="relative flex items-center justify-center w-full"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      <button
        ref={itemRef}
        type="button"
        tabIndex={isFocused ? 0 : -1}
        role="button"
        aria-label={`Add ${item.label}`}
        aria-disabled={!isAllowed}
        aria-describedby={!isAllowed && reason ? reasonId : descriptionId}
        draggable={isAllowed}
        onDragStart={handleDragStart}
        onClick={handleClick}
        onKeyDown={onKeyDown}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
        className={cn(
          'transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-white',
          isShaking && 'translate-x-0.5 -translate-x-0.5 motion-reduce:transform-none',
          isExpanded
            ? 'w-full h-14 px-3 rounded-[12px] flex items-center gap-3 text-left border'
            : 'w-10 h-10 rounded-[12px] flex items-center justify-center border',
          isAllowed
            ? 'bg-[#111111] hover:bg-[#1A1A1A] border-[#232323] hover:border-[#383838] text-[#FAFAFA] cursor-grab active:cursor-grabbing'
            : 'bg-[#111111]/60 border-[#1C1C1C] text-[#8A8A8A] cursor-not-allowed opacity-50',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center shrink-0 transition-colors',
            isExpanded ? 'w-8 h-8 rounded-[8px] bg-[#161616]' : 'w-full h-full',
            isAllowed ? 'text-[#FAFAFA]' : 'text-[#8A8A8A]',
          )}
        >
          <Icon className={cn(isExpanded ? 'h-5 w-5' : 'h-4 w-4')} />
        </div>

        {isExpanded && (
          <div className="min-w-0 flex-1 truncate">
            <div className="text-[14px] font-medium leading-tight truncate text-[#FAFAFA]">
              {item.label}
            </div>
            <div
              id={descriptionId}
              className="text-[12px] text-[#8A8A8A] truncate mt-0.5 font-sans"
            >
              {item.description}
            </div>
          </div>
        )}
      </button>

      {/* Visually hidden reason for screen readers when disabled */}
      {!isAllowed && reason && (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      )}

      {/* Styled Right-Side Floating Tooltip Card */}
      {isTooltipVisible && (
        <div
          role="tooltip"
          className="absolute left-full ml-3 z-50 pointer-events-none whitespace-normal min-w-[200px] max-w-[260px] rounded-[12px] border border-[#232323] bg-[#111111] p-2.5 shadow-2xl animate-in fade-in-0 duration-100"
        >
          <div className="text-[13px] font-medium text-[#FAFAFA] flex items-center justify-between">
            <span>{item.label}</span>
            {!isAllowed && (
              <span className="text-[10px] font-mono text-[#FACC15] uppercase tracking-wider">
                Disabled
              </span>
            )}
          </div>

          <p className="text-[12px] text-[#8A8A8A] mt-1 leading-snug">
            {item.description}
          </p>

          {!isAllowed && reason && (
            <div className="mt-2 pt-2 border-t border-[#1F1F1F] flex items-start gap-1.5 text-[11px] text-[#FAFAFA] bg-[#181818]/60 p-1.5 rounded-[6px]">
              <HelpCircle className="h-3.5 w-3.5 text-[#FACC15] shrink-0 mt-0.5" />
              <span className="leading-tight text-[#FAFAFA]">{reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
