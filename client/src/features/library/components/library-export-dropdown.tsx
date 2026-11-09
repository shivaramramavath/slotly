// Export dropdown component supporting keyboard accessible Excel and CSV downloads for library resources.
'use client';

import * as React from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import type { ImportEntity } from '@slotly/contracts';
import { libraryApi } from '../services/library.api';

/** Props for LibraryExportDropdown component. */
export interface LibraryExportDropdownProps {
  entity: ImportEntity;
  disabled?: boolean | undefined;
  institutionId?: string | undefined;
  className?: string | undefined;
}

/** React component rendering single export dropdown button with Excel and CSV options. */
export function LibraryExportDropdown({
  entity,
  disabled = false,
  institutionId,
  className = '',
}: LibraryExportDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const items = React.useMemo(
    () => [
      { format: 'xlsx' as const, label: 'Excel (.xlsx)', icon: FileSpreadsheet },
      { format: 'csv' as const, label: 'CSV (.csv)', icon: FileText },
    ],
    [],
  );

  const handleExport = (format: 'xlsx' | 'csv') => {
    setOpen(false);
    triggerRef.current?.focus();
    const url = libraryApi.getExportUrl(entity, format, institutionId);
    window.open(url, '_blank');
  };

  // Close when clicking outside
  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Focus management when menu opens
  React.useEffect(() => {
    if (open) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [open, focusedIndex]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFocusedIndex(0);
      setOpen(true);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id="library-export-trigger"
        aria-label="Export resource library records"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        title={disabled ? 'No records available to export' : 'Export records'}
        className={`h-10 px-3.5 rounded-[12px] border border-[#232323] bg-[#111111] text-xs font-mono flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAFAFA] ${
          disabled
            ? 'opacity-50 cursor-not-allowed text-[#8A8A8A]'
            : 'text-[#FAFAFA] hover:bg-[#181818] hover:border-[#383838] cursor-pointer'
        }`}
      >
        <Download className="w-4 h-4 text-[#8A8A8A]" />
        <span>Export</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8A8A8A] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-labelledby="library-export-trigger"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 mt-1.5 w-44 rounded-[12px] border border-[#232323] bg-[#111111] p-1 shadow-2xl text-xs z-30 animate-in fade-in zoom-in-95 duration-100"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.format}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => handleExport(item.format)}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] focus:bg-[#181818] focus:outline-none transition-colors cursor-pointer text-left font-mono"
              >
                <Icon className="w-3.5 h-3.5 text-[#8A8A8A]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
