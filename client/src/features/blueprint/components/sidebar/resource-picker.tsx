// Combobox popover picker allowing multi-select assignment of library resources.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Check, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Interface representing selectable resource item. */
export interface PickerResourceItem {
  id: string;
  name: string;
  meta?: string | undefined;
  ineligibleReason?: string | undefined;
}

/** Props for ResourcePicker component. */
export interface ResourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  resourceType: 'faculty' | 'room' | 'subject';
  items: PickerResourceItem[];
  selectedIds: string[];
  onToggleItem: (id: string) => void;
  isLoading?: boolean | undefined;
  className?: string | undefined;
}

/** React component rendering popover combobox picker with search and multi-select. */
export function ResourcePicker({
  isOpen,
  onClose,
  title,
  resourceType,
  items,
  selectedIds,
  onToggleItem,
  isLoading = false,
  className,
}: ResourcePickerProps) {
  const [search, setSearch] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const lowerSearch = search.toLowerCase().trim();

  // Sort: assigned first, then alphabetical
  const sortedItems = [...items].sort((a, b) => {
    const aSelected = selectedIds.includes(a.id);
    const bSelected = selectedIds.includes(b.id);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredItems = sortedItems.filter((item) => {
    if (!lowerSearch) return true;
    return (
      item.name.toLowerCase().includes(lowerSearch) ||
      (item.meta && item.meta.toLowerCase().includes(lowerSearch))
    );
  });

  const libraryLink = `/library?tab=${
    resourceType === 'faculty' ? 'faculty' : resourceType === 'room' ? 'rooms' : 'subjects'
  }`;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={`Select ${title}`}
      className={cn(
        'rounded-[12px] bg-[#141414] border border-[#232323] shadow-2xl p-3 space-y-3 max-h-[320px] flex flex-col z-30 animate-in fade-in zoom-in-95',
        className,
      )}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 border-b border-[#232323]">
        <h4 className="text-xs font-semibold text-[#FAFAFA] truncate">Select {title}</h4>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close picker"
          className="h-6 w-6 rounded text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative shrink-0">
        <Search className="h-3.5 w-3.5 text-[#8A8A8A] absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${resourceType}...`}
          aria-label={`Search ${resourceType}`}
          className="w-full h-9 pl-8 pr-3 rounded-[8px] bg-[#0A0A0A] border border-[#232323] text-xs text-[#FAFAFA] placeholder:text-[#666666] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
        />
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-[120px] max-h-[180px] pr-1">
        {isLoading ? (
          <div className="h-24 flex items-center justify-center text-xs font-mono text-[#8A8A8A]">
            Loading items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-24 flex flex-col items-center justify-center text-center p-2">
            <p className="text-xs text-[#8A8A8A]">No {resourceType} found in library.</p>
            <Link
              href={libraryLink}
              target="_blank"
              className="text-[11px] font-mono text-[#FAFAFA] hover:underline inline-flex items-center gap-1 mt-1.5"
            >
              <span>Open Library</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isIneligible = Boolean(item.ineligibleReason);

            return (
              <button
                key={item.id}
                type="button"
                disabled={isIneligible}
                onClick={() => !isIneligible && onToggleItem(item.id)}
                aria-pressed={isSelected}
                className={cn(
                  'w-full text-left px-2.5 py-2 rounded-[8px] border transition-colors flex items-start gap-2.5 text-xs',
                  isSelected
                    ? 'bg-[#181818] border-[#383838] text-[#FAFAFA]'
                    : 'bg-[#111111] border-transparent hover:border-[#232323] text-[#8A8A8A] hover:text-[#FAFAFA]',
                  isIneligible && 'opacity-40 cursor-not-allowed hover:border-transparent',
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-[4px] border mt-0.5 flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'bg-[#FAFAFA] border-[#FAFAFA] text-[#000000]'
                      : 'border-[#383838] bg-[#0A0A0A]',
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-[#FAFAFA]">{item.name}</p>
                  {item.meta && (
                    <p className="font-mono text-[10px] text-[#8A8A8A] truncate">{item.meta}</p>
                  )}
                  {isIneligible && (
                    <p className="font-mono text-[10px] text-[#EF4444] mt-0.5 truncate">
                      {item.ineligibleReason}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Done Button */}
      <div className="pt-2 border-t border-[#232323] flex items-center justify-between">
        <Link
          href={libraryLink}
          target="_blank"
          className="text-[11px] font-mono text-[#8A8A8A] hover:text-[#FAFAFA] inline-flex items-center gap-1 transition-colors"
        >
          <span>Open Library</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={handleClose}
          className="h-8 px-3 rounded-[8px] bg-[#FAFAFA] hover:bg-[#FAFAFA]/90 text-[#000000] font-medium text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
