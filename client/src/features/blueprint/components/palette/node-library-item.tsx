// Presentation component rendering an individual node library item with gated states.
'use client';

import { useState, useEffect, type KeyboardEvent, type MouseEvent, type DragEvent } from 'react';
import { HelpCircle, Lock } from 'lucide-react';
import type { PaletteItem } from './blueprint-palette';
import { cn } from '@/lib/utils';
import type { CanAddChildCode, CanAddChildFix } from '../../can-add-child';

export interface NodeLibraryItemProps {
  item: PaletteItem;
  isExpanded: boolean;
  isAllowed: boolean;
  code?: CanAddChildCode | undefined;
  reason?: string | undefined;
  fix?: CanAddChildFix | undefined;
  isFocused: boolean;
  validParentCount?: number | undefined;
  onSelect: () => void;
  onFixAction?: ((fix: CanAddChildFix) => void) | undefined;
  onKeyDown: (e: KeyboardEvent) => void;
  itemRef?: ((el: HTMLButtonElement | null) => void) | undefined;
}

/** React component rendering an individual node library item with gated states */
export function NodeLibraryItem({
  item,
  isExpanded,
  isAllowed,
  code,
  reason,
  fix,
  isFocused,
  validParentCount = 0,
  onSelect,
  onFixAction,
  onKeyDown,
  itemRef,
}: NodeLibraryItemProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const Icon = item.icon;
  const descriptionId = `node-desc-${item.type}`;
  const reasonId = `node-reason-${item.type}`;

  // Escape cancels drag
  useEffect(() => {
    if (!isDragging) return;

    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsDragging(false);
        window.dispatchEvent(new CustomEvent('slotly:drag-node-end'));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDragging]);

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      // Trigger helpful action instead of doing nothing
      if (fix && onFixAction) {
        onFixAction(fix);
      }
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

    setIsDragging(true);
    e.dataTransfer.setData('application/x-slotly-node', item.type);
    e.dataTransfer.setData('application/slotly-node-type', item.type);
    e.dataTransfer.effectAllowed = 'copy';

    // Ghost drag preview: 32px high, radius 12px, surface background, 1px border-strong, 80% opacity
    if (typeof document !== 'undefined') {
      const ghost = document.createElement('div');
      ghost.id = 'slotly-drag-ghost';
      ghost.style.position = 'fixed';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.height = '32px';
      ghost.style.borderRadius = '12px';
      ghost.style.backgroundColor = '#111111';
      ghost.style.border = '1px solid #383838';
      ghost.style.padding = '0 12px';
      ghost.style.display = 'flex';
      ghost.style.alignItems = 'center';
      ghost.style.gap = '8px';
      ghost.style.color = '#FAFAFA';
      ghost.style.fontSize = '12px';
      ghost.style.fontWeight = '500';
      ghost.style.opacity = '0.8';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '99999';
      ghost.innerText = item.label;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 16, 16);
      setTimeout(() => {
        if (document.body.contains(ghost)) {
          document.body.removeChild(ghost);
        }
      }, 0);
    }

    // Broadcast drag start for live canvas feedback
    window.dispatchEvent(
      new CustomEvent('slotly:drag-node-start', {
        detail: { type: item.type, label: item.label },
      }),
    );
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    window.dispatchEvent(new CustomEvent('slotly:drag-node-end'));
    window.dispatchEvent(new CustomEvent('slotly:drag-reason-clear'));
  };

  return (
    <div
      className="relative flex items-center justify-center w-full"
      data-testid={`library-item-wrapper-${item.type}`}
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
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onKeyDown={onKeyDown}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
        className={cn(
          'transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-white',
          isShaking && 'translate-x-0.5 -translate-x-0.5 motion-reduce:transform-none',
          isDragging && 'opacity-50',
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
            'relative flex items-center justify-center shrink-0 transition-colors',
            isExpanded ? 'w-8 h-8 rounded-[8px] bg-[#161616]' : 'w-full h-full',
            isAllowed ? 'text-[#FAFAFA]' : 'text-[#8A8A8A]',
          )}
        >
          <Icon className={cn(isExpanded ? 'h-5 w-5' : 'h-4 w-4')} />
          {!isAllowed && code === 'parent-incomplete' && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#181818] border border-[#383838] flex items-center justify-center text-[#FACC15]">
              <Lock className="h-2 w-2" />
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="min-w-0 flex-1 truncate">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[14px] font-medium leading-tight truncate text-[#FAFAFA]">
                {item.label}
              </span>
              {validParentCount > 1 && isAllowed && (
                <span className="text-[10px] font-mono text-[#8A8A8A] shrink-0">
                  {validParentCount} places
                </span>
              )}
            </div>
            <div
              id={descriptionId}
              className="text-[12px] text-[#8A8A8A] truncate mt-0.5 font-sans"
            >
              {!isAllowed && reason ? reason : item.description}
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
      {isTooltipVisible && !isDragging && (
        <div
          role="tooltip"
          className="absolute left-full ml-3 z-50 pointer-events-none whitespace-normal min-w-[200px] max-w-[260px] rounded-[12px] border border-[#232323] bg-[#111111] p-2.5 shadow-2xl animate-in fade-in-0 duration-100"
        >
          <div className="text-[13px] font-medium text-[#FAFAFA] flex items-center justify-between">
            <span>{item.label}</span>
            {!isAllowed && (
              <span className="text-[10px] font-mono text-[#FACC15] uppercase tracking-wider">
                {code === 'parent-incomplete' ? 'Locked' : 'Disabled'}
              </span>
            )}
          </div>

          <p className="text-[12px] text-[#8A8A8A] mt-1 leading-snug">
            {item.description}
          </p>

          {!isAllowed && reason && (
            <div className="mt-2 pt-2 border-t border-[#1F1F1F] flex items-start gap-1.5 text-[11px] text-[#FAFAFA] bg-[#181818]/60 p-1.5 rounded-[6px]">
              <HelpCircle className="h-3.5 w-3.5 text-[#FACC15] shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="text-[#FAFAFA]">{reason}</span>
                {fix && (
                  <div className="text-[10px] text-[#FACC15] font-mono mt-1">
                    Click to {fix.label}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
