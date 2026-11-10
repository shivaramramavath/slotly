// React component for node-library-panel.
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Layers,
} from 'lucide-react';
import type { BlueprintNodeType } from '@slotly/contracts';
import { PALETTE_ITEMS } from './blueprint-palette';
import { NodeLibraryItem } from './node-library-item';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { cn } from '@/lib/utils';

export interface NodeLibraryPanelProps {
  onAddNode: (type: BlueprintNodeType, parentId?: string) => Promise<{ success: boolean }>;
}

const STORAGE_KEY = 'slotly:blueprint:node-library-expanded';

/** React component rendering floating vertical node library panel */
export function NodeLibraryPanel({ onAddNode }: NodeLibraryPanelProps) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);

  const { canAddNodeType, getNodeById } = useGateValidation(nodes, edges);
  const selectedParent = getNodeById(selectedNodeId);

  // Responsive and collapse state
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth >= 1280;
    } catch {
      return window.innerWidth >= 1280;
    }
  });

  // Track viewport width for mobile breakpoint
  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved === null) {
            setIsExpanded(window.innerWidth >= 1280);
          }
        } catch {
          // ignore localStorage errors
        }
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard roving tabindex state
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut "/" to focus and expand panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => {
          itemRefs.current[focusedIndex]?.focus();
        }, 50);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex]);

  const handleItemSelect = useCallback(
    async (type: BlueprintNodeType) => {
      await onAddNode(type, selectedParent?.id);
      if (isMobileSheetOpen) {
        setIsMobileSheetOpen(false);
      }
    },
    [onAddNode, selectedParent?.id, isMobileSheetOpen],
  );

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, type: BlueprintNodeType, isAllowed: boolean) => {
    const totalItems = PALETTE_ITEMS.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        {
          const nextIndex = (index + 1) % totalItems;
          setFocusedIndex(nextIndex);
          itemRefs.current[nextIndex]?.focus();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        {
          const prevIndex = (index - 1 + totalItems) % totalItems;
          setFocusedIndex(prevIndex);
          itemRefs.current[prevIndex]?.focus();
        }
        break;

      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        itemRefs.current[0]?.focus();
        break;

      case 'End':
        e.preventDefault();
        setFocusedIndex(totalItems - 1);
        itemRefs.current[totalItems - 1]?.focus();
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isAllowed) {
          void handleItemSelect(type);
        }
        break;

      case 'Escape':
        e.preventDefault();
        // Return focus to canvas
        panelRef.current?.blur();
        document.querySelector<HTMLElement>('.react-flow__pane')?.focus();
        break;

      default:
        break;
    }
  };

  // Structure and resource items
  const structureItems = PALETTE_ITEMS.filter((i) => i.category === 'structure');
  const resourceItems = PALETTE_ITEMS.filter((i) => i.category === 'resource');

  // Mobile Floating Trigger Button (< 768px)
  if (isMobile) {
    return (
      <>
        <div className="absolute top-4 left-4 z-30 pointer-events-auto">
          <button
            type="button"
            aria-label="Add node"
            onClick={() => setIsMobileSheetOpen(true)}
            className="w-12 h-12 rounded-[16px] bg-[#111111]/95 backdrop-blur-md border border-[#232323] text-[#FAFAFA] flex items-center justify-center shadow-2xl hover:bg-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Bottom Sheet */}
        {isMobileSheetOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs animate-in fade-in-0 duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setIsMobileSheetOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Node Library"
              className="relative z-10 w-full max-h-[80vh] overflow-y-auto rounded-t-[20px] bg-[#111111] border-t border-[#232323] p-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#232323]">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#8A8A8A]" />
                  <span className="text-sm font-medium text-[#FAFAFA]">Node Library</span>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setIsMobileSheetOpen(false)}
                  className="p-1 rounded text-[#8A8A8A] hover:text-[#FAFAFA]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-4">
                <div>
                  <div className="px-1 py-1 text-[12px] font-mono text-[#8A8A8A] uppercase tracking-wider">
                    Hierarchy Structure
                  </div>
                  <div className="space-y-1.5 mt-1">
                    {structureItems.map((item, idx) => {
                      const validation = canAddNodeType(item.type, selectedParent);
                      const isAllowed = validation.allowed;
                      return (
                        <NodeLibraryItem
                          key={item.type}
                          item={item}
                          isExpanded
                          isAllowed={isAllowed}
                          reason={validation.reason}
                          isFocused={focusedIndex === idx}
                          onSelect={() => handleItemSelect(item.type)}
                          onKeyDown={(e) => handleItemKeyDown(e, idx, item.type, isAllowed)}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-1 py-1 text-[12px] font-mono text-[#8A8A8A] uppercase tracking-wider">
                    Scheduling Resources
                  </div>
                  <div className="space-y-1.5 mt-1">
                    {resourceItems.map((item, idx) => {
                      const globalIdx = structureItems.length + idx;
                      const validation = canAddNodeType(item.type, selectedParent);
                      const isAllowed = validation.allowed;
                      return (
                        <NodeLibraryItem
                          key={item.type}
                          item={item}
                          isExpanded
                          isAllowed={isAllowed}
                          reason={validation.reason}
                          isFocused={focusedIndex === globalIdx}
                          onSelect={() => handleItemSelect(item.type)}
                          onKeyDown={(e) => handleItemKeyDown(e, globalIdx, item.type, isAllowed)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop / Tablet Floating Panel (>= 768px)
  return (
    <div
      ref={panelRef}
      role="toolbar"
      aria-label="Node library"
      data-testid="node-library-panel"
      className={cn(
        'absolute top-4 left-4 z-30 pointer-events-auto flex flex-col',
        'max-h-[calc(100%-32px)] rounded-[20px] border border-[#232323] bg-[#111111]/95 backdrop-blur-md shadow-2xl p-2 select-none',
        'transition-[width] duration-200 ease-out',
        isExpanded ? 'w-[264px]' : 'w-14 items-center',
      )}
    >
      {/* Panel Top Bar / Collapse Toggle */}
      <div
        className={cn(
          'flex items-center pb-2 mb-1 border-b border-[#232323]',
          isExpanded ? 'justify-between px-2' : 'justify-center w-full',
        )}
      >
        {isExpanded && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#FAFAFA]">Library</span>
            {selectedParent && (
              <span className="text-[10px] font-mono text-[#8A8A8A] truncate max-w-[100px]">
                under {selectedParent.data.label}
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          aria-label={isExpanded ? 'Collapse node library' : 'Expand node library'}
          onClick={toggleExpanded}
          className="h-7 w-7 rounded-[8px] flex items-center justify-center text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Internal Scroll Container with hidden scrollbar and edge fade */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-3 py-1">
        {/* Section 1: Hierarchy Structure */}
        <div>
          {isExpanded && (
            <div className="px-2 py-1 text-[12px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              Hierarchy structure
            </div>
          )}
          <div className="space-y-1 mt-0.5">
            {structureItems.map((item, idx) => {
              const validation = canAddNodeType(item.type, selectedParent);
              const isAllowed = validation.allowed;
              return (
                <NodeLibraryItem
                  key={item.type}
                  item={item}
                  isExpanded={isExpanded}
                  isAllowed={isAllowed}
                  reason={validation.reason}
                  isFocused={focusedIndex === idx}
                  itemRef={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  onSelect={() => handleItemSelect(item.type)}
                  onKeyDown={(e) => handleItemKeyDown(e, idx, item.type, isAllowed)}
                />
              );
            })}
          </div>
        </div>

        {/* Section 2: Scheduling Resources */}
        <div>
          {isExpanded && (
            <div className="px-2 py-1 text-[12px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              Resources
            </div>
          )}
          <div className="space-y-1 mt-0.5">
            {resourceItems.map((item, idx) => {
              const globalIdx = structureItems.length + idx;
              const validation = canAddNodeType(item.type, selectedParent);
              const isAllowed = validation.allowed;
              return (
                <NodeLibraryItem
                  key={item.type}
                  item={item}
                  isExpanded={isExpanded}
                  isAllowed={isAllowed}
                  reason={validation.reason}
                  isFocused={focusedIndex === globalIdx}
                  itemRef={(el) => {
                    itemRefs.current[globalIdx] = el;
                  }}
                  onSelect={() => handleItemSelect(item.type)}
                  onKeyDown={(e) => handleItemKeyDown(e, globalIdx, item.type, isAllowed)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
