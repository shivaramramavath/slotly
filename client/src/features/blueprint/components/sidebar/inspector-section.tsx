// Accordion section component for inspector panel with collapsible headers and resource counters.
'use client';

import * as React from 'react';
import { ChevronDown, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Props for InspectorSection component. */
export interface InspectorSectionProps {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onAdd?: (() => void) | undefined;
  addTooltip?: string | undefined;
  hasIssues?: boolean | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

/** React component rendering 48px header accordion section with count badge and action trigger. */
export function InspectorSection({
  id,
  title,
  icon: Icon,
  count,
  isOpen,
  onToggle,
  onAdd,
  addTooltip = 'Add item',
  hasIssues = false,
  children,
  className,
}: InspectorSectionProps) {
  const contentId = `inspector-section-content-${id}`;
  const headerId = `inspector-section-header-${id}`;

  return (
    <div className={cn('border-b border-[#232323] last:border-b-0', className)}>
      <div
        id={headerId}
        className="h-12 px-4 flex items-center justify-between hover:bg-[#141414] transition-colors select-none group"
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-label={`${title}${count !== undefined ? `, ${count} assigned` : ''}`}
          className="flex-1 flex items-center gap-2.5 text-left py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA] rounded-md"
        >
          <Icon className="h-4 w-4 text-[#8A8A8A] group-hover:text-[#FAFAFA] shrink-0 transition-colors" />
          <span className="text-xs font-medium text-[#FAFAFA] truncate">{title}</span>

          {hasIssues && (
            <span title="Section has unresolved requirements" className="flex items-center text-[#FACC15]">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          )}

          {count !== undefined && (
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-[6px] border border-[#232323] bg-[#161616] text-[#8A8A8A]">
              {count}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {onAdd && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              title={addTooltip}
              aria-label={addTooltip}
              className="h-8 w-8 rounded-[8px] border border-[#232323] bg-[#141414] hover:bg-[#1F1F1F] hover:border-[#383838] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
            className="h-8 w-8 rounded-[8px] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-transform duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={headerId}
          className="p-4 pt-1 space-y-3"
        >
          {children}
        </div>
      )}
    </div>
  );
}
