// React component rendering View settings popover menu with layout mode radios and section toggles.
'use client';

import * as React from 'react';
import { LayoutGrid, List, Grid3X3, Check, RotateCcw } from 'lucide-react';
import type { ProjectLayoutMode } from './project-collection';

/** Interface defining view settings persisted in localStorage and query params. */
export interface ViewSettings {
  layout: ProjectLayoutMode;
  visibleSections: Record<string, boolean>;
}

/** Props for ViewMenu component. */
export interface ViewMenuProps {
  layout: ProjectLayoutMode;
  onLayoutChange: (layout: ProjectLayoutMode) => void;
  visibleSections: Record<string, boolean>;
  onToggleSection: (sectionId: string) => void;
  onResetView: () => void;
}

/** React component rendering 40px View menu popover button and configuration panel. */
export function ViewMenu({
  layout,
  onLayoutChange,
  visibleSections,
  onToggleSection,
  onResetView,
}: ViewMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const layoutOptions: Array<{ id: ProjectLayoutMode; label: string; icon: React.ElementType }> = [
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'list', label: 'List', icon: List },
    { id: 'compact', label: 'Compact', icon: Grid3X3 },
  ];

  const sectionOptions = [
    { id: 'pinned', label: 'Pinned', hint: 'Pin a project from its menu to see it in Pinned.' },
    { id: 'recent', label: 'Recent', hint: 'Opened in the last 14 days.' },
    { id: 'archived', label: 'Archived', hint: 'Archived terms.' },
  ];

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        aria-label="View layout and section options"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="h-10 px-3.5 rounded-[12px] border border-[#232323] hover:border-[#383838] bg-[#111111] hover:bg-[#181818] text-[#FAFAFA] flex items-center gap-2 text-xs font-mono transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
      >
        <LayoutGrid className="w-4 h-4 text-[#8A8A8A]" aria-hidden="true" />
        <span className="hidden sm:inline">View</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="View settings"
          className="absolute right-0 mt-2 w-72 rounded-[16px] border border-[#232323] bg-[#111111] p-3 shadow-2xl text-xs z-40 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Layout Mode Selection */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8A] px-2 py-1">
              Layout
            </div>
            <div role="radiogroup" aria-label="Layout mode" className="space-y-0.5 mt-1">
              {layoutOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      onLayoutChange(opt.id);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#181818] text-[#FAFAFA]'
                        : 'text-[#8A8A8A] hover:bg-[#161616] hover:text-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FAFAFA]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#181818] my-2.5" />

          {/* Sections Visibility */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A8A8A] px-2 py-1">
              Sections
            </div>
            <div className="space-y-0.5 mt-1">
              {sectionOptions.map((sec) => {
                const isVisible = visibleSections[sec.id] !== false;
                return (
                  <label
                    key={sec.id}
                    className="flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#161616] cursor-pointer text-[#FAFAFA]"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => onToggleSection(sec.id)}
                      className="mt-0.5 rounded border-[#232323] bg-[#0A0A0A] text-[#FAFAFA] accent-[#FAFAFA] focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-[#FAFAFA]">{sec.label}</div>
                      <div className="text-[11px] font-mono text-[#8A8A8A] truncate">{sec.hint}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#181818] my-2.5" />

          {/* Reset View Button */}
          <button
            type="button"
            onClick={() => {
              onResetView();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset to default</span>
          </button>
        </div>
      )}
    </div>
  );
}
