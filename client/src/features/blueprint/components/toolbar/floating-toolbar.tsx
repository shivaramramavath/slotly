// React component for floating-toolbar.
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  Minus,
  Maximize,
  RotateCcw,
  RotateCw,
  Search,
  ChevronDown,
  LayoutGrid,
  Layers,
  Building,
  RefreshCw,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useReactFlow, useStore } from '@xyflow/react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useBlueprintCommands } from '../../hooks/use-blueprint-commands';
import { useBlueprintLayout } from '../../hooks/use-blueprint-layout';
import { ToolbarMenu } from './toolbar-menu';
import type { BlueprintNodeType } from '@slotly/contracts';
import type { LayoutAlgorithm } from '../../types/canvas.types';
import { cn } from '@/lib/utils';

export interface FloatingToolbarProps {
  onAddNode?: (type: BlueprintNodeType, parentId?: string) => Promise<{ success: boolean }>;
  onCopy?: (() => void) | undefined;
  onPaste?: (() => void) | undefined;
  onDuplicate?: (() => void) | undefined;
}

/** React component rendering floating bottom pill toolbar */
export function FloatingToolbar({
  onCopy,
  onPaste,
  onDuplicate,
}: FloatingToolbarProps) {
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);

  const { undo, redo, canUndo, canRedo } = useBlueprintCommands();
  const { getLayoutedElements, saveSnapshotForReset, resetLayout } = useBlueprintLayout();

  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const setNodes = useBlueprintStore((s) => s.setNodes);
  const setEdges = useBlueprintStore((s) => s.setEdges);
  const selectNode = useBlueprintStore((s) => s.selectNode);

  // Popover states
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTypeFilter, setSearchTypeFilter] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Refs for clicking outside
  const layoutDropdownRef = useRef<HTMLDivElement>(null);
  const searchCardRef = useRef<HTMLDivElement>(null);

  // Global shortcut Escape to close popovers
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape') {
        setIsLayoutOpen(false);
        setIsSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(target)) {
        setIsLayoutOpen(false);
      }
      if (searchCardRef.current && !searchCardRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when search opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Layout calculation helper (Strictly vertical TB)
  const handleApplyLayout = (algo: LayoutAlgorithm) => {
    saveSnapshotForReset();
    const layouted = getLayoutedElements(nodes, edges, 'TB', algo);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setIsLayoutOpen(false);
    setTimeout(() => fitView({ duration: 300, maxZoom: 1, padding: 0.2 }), 50);
  };

  // Search filtering
  const matchingNodes = useMemo(() => {
    if (!searchQuery.trim() && searchTypeFilter === 'all') return [];
    const q = searchQuery.toLowerCase().trim();

    return nodes.filter((n) => {
      const matchesType =
        searchTypeFilter === 'all' ||
        (searchTypeFilter === 'subject' && n.data.nodeType === 'subjectAssignment') ||
        n.data.nodeType === searchTypeFilter;

      if (!matchesType) return false;
      if (!q) return true;

      const label = (n.data.label || '').toLowerCase();
      const code = String(n.data.config?.code || '').toLowerCase();
      const type = n.data.nodeType.toLowerCase();
      const faculty = String(n.data.config?.facultyName || '').toLowerCase();
      const room = String(n.data.config?.roomName || '').toLowerCase();

      return (
        label.includes(q) ||
        code.includes(q) ||
        type.includes(q) ||
        faculty.includes(q) ||
        room.includes(q)
      );
    });
  }, [nodes, searchQuery, searchTypeFilter]);

  const handleSelectSearchResult = (nodeId: string, position: { x: number; y: number }) => {
    selectNode(nodeId);
    setCenter(position.x + 100, position.y + 45, { zoom: 1.15, duration: 400 });
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 select-none">
      {/* 1. Expandable Search Field above the pill */}
      {isSearchOpen && (
        <div
          ref={searchCardRef}
          className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-[#111111]/95 backdrop-blur-md border border-[#232323] rounded-[12px] p-2.5 shadow-2xl mb-1 flex flex-col gap-2"
        >
          <div className="flex items-center bg-[#161616] border border-[#232323] rounded-[8px] px-2.5 py-1">
            <Search className="h-3.5 w-3.5 text-[#8A8A8A] shrink-0 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes, subjects, codes..."
              className="w-full bg-transparent text-xs text-[#FAFAFA] placeholder:text-[#555555] focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#8A8A8A] hover:text-[#FAFAFA] p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Type Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'section', label: 'Section' },
              { id: 'subject', label: 'Subjects' },
              { id: 'faculty', label: 'Faculty' },
              { id: 'room', label: 'Room' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSearchTypeFilter(chip.id)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors shrink-0',
                  searchTypeFilter === chip.id
                    ? 'bg-[#FAFAFA] text-[#0A0A0A] font-semibold'
                    : 'bg-[#181818] text-[#8A8A8A] hover:text-[#FAFAFA] border border-[#232323]',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search Results List */}
          {(searchQuery.trim() || searchTypeFilter !== 'all') && (
            <div className="max-h-48 overflow-y-auto divide-y divide-[#1C1C1C] rounded-[8px] border border-[#232323] bg-[#0A0A0A]">
              {matchingNodes.length === 0 ? (
                <div className="p-3 text-center text-xs font-mono text-[#666666]">
                  No matching nodes found.
                </div>
              ) : (
                matchingNodes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(n.id, n.position)}
                    className="w-full p-2 text-left hover:bg-[#161616] flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-[#FAFAFA] truncate">
                        {n.data.label}
                      </div>
                      <div className="font-mono text-[10px] text-[#8A8A8A] uppercase">
                        {n.data.nodeType}
                      </div>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#8A8A8A] shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Floating Pill Toolbar (44px height, radius 16px, centered 16px from bottom) */}
      <div
        role="toolbar"
        aria-label="Blueprint Canvas Controls"
        data-testid="blueprint-floating-toolbar"
        className="h-[44px] px-2 py-1.5 rounded-[16px] bg-[#111111]/95 backdrop-blur-md border border-[#232323] flex items-center gap-1 shadow-2xl"
      >
        {/* Zoom Controls */}
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out (-)"
          onClick={() => zoomOut({ duration: 200 })}
          className="h-8 w-8 rounded-[10px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Minus className="h-4 w-4" />
        </button>

        <span
          className="font-mono text-[11px] tabular-nums text-[#8A8A8A] w-14 text-center select-none"
          title="Current zoom"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in (+)"
          onClick={() => zoomIn({ duration: 200 })}
          className="h-8 w-8 rounded-[10px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-[#232323]" />

        {/* Fit View */}
        <button
          type="button"
          aria-label="Fit canvas to view"
          title="Fit view (⇧1)"
          onClick={() => fitView({ duration: 300, maxZoom: 1, padding: 0.2 })}
          className="h-8 px-2.5 rounded-[10px] text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Maximize className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Fit</span>
        </button>

        {/* Auto Layout Dropdown (Algorithms only: Hierarchical, Compact, Department, Reset) */}
        <div className="relative" ref={layoutDropdownRef}>
          <button
            type="button"
            aria-label="Auto layout algorithms"
            aria-expanded={isLayoutOpen}
            aria-haspopup="menu"
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
            className={cn(
              'h-8 px-2.5 rounded-[10px] text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
              isLayoutOpen && 'text-[#FAFAFA] bg-[#1A1A1A]',
            )}
          >
            <span>Layout</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {isLayoutOpen && (
            <div
              role="menu"
              aria-label="Layout algorithms"
              className="absolute bottom-[calc(100%+8px)] left-0 w-48 bg-[#111111] border border-[#232323] rounded-[12px] shadow-2xl py-1 z-50 text-left text-xs"
            >
              <div className="px-3 py-1 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider border-b border-[#1C1C1C]">
                Vertical Algorithms
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleApplyLayout('hierarchical')}
                className="w-full flex items-center gap-2 px-3 py-2 text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <div className="text-left">
                  <div className="font-medium">Hierarchical</div>
                  <div className="text-[10px] font-mono text-[#8A8A8A]">Standard Dagre tree</div>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleApplyLayout('compact')}
                className="w-full flex items-center gap-2 px-3 py-2 text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
              >
                <Layers className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <div className="text-left">
                  <div className="font-medium">Compact</div>
                  <div className="text-[10px] font-mono text-[#8A8A8A]">Dense rank separation</div>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleApplyLayout('department')}
                className="w-full flex items-center gap-2 px-3 py-2 text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
              >
                <Building className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <div className="text-left">
                  <div className="font-medium">Department-based</div>
                  <div className="text-[10px] font-mono text-[#8A8A8A]">Branch columns</div>
                </div>
              </button>

              <div className="border-t border-[#1C1C1C] my-1" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  resetLayout();
                  setIsLayoutOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset Layout</span>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-[#232323]" />

        {/* Undo / Redo */}
        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => undo()}
          title="Undo (⌘Z)"
          className={cn(
            'h-8 w-8 rounded-[10px] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
            canUndo
              ? 'text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A]'
              : 'opacity-40 text-[#8A8A8A] cursor-not-allowed',
          )}
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => redo()}
          title="Redo (⌘⇧Z)"
          className={cn(
            'h-8 w-8 rounded-[10px] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
            canRedo
              ? 'text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A]'
              : 'opacity-40 text-[#8A8A8A] cursor-not-allowed',
          )}
        >
          <RotateCw className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-[#232323]" />

        {/* Search Icon */}
        <button
          type="button"
          aria-label="Search canvas"
          title="Search canvas (⌘F)"
          aria-expanded={isSearchOpen}
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={cn(
            'h-8 w-8 rounded-[10px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
            isSearchOpen && 'text-[#FAFAFA] bg-[#1A1A1A]',
          )}
        >
          <Search className="h-4 w-4" />
        </button>

        {/* More Menu */}
        <ToolbarMenu
          onCopy={onCopy}
          onPaste={onPaste}
          onDuplicate={onDuplicate}
        />
      </div>
    </div>
  );
}
