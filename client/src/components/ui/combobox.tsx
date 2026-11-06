'use client';

import * as React from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase()),
  );

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded border border-[#232323] bg-[#111111] px-3 py-1 text-sm text-[#FAFAFA] transition-colors hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FACC15]"
      >
        <span className={cn(!selectedOption && 'text-[#8A8A8A]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#8A8A8A]" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-[#232323] bg-[#111111] p-1 shadow-md">
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-1 h-8 text-xs"
            autoFocus
          />
          {filteredOptions.length === 0 ? (
            <div className="py-2 text-center text-xs text-[#8A8A8A]">No options found</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange?.(opt.value);
                  setOpen(false);
                  setQuery('');
                }}
                className={cn(
                  'flex items-center justify-between rounded px-2 py-1.5 text-xs text-[#FAFAFA] cursor-pointer hover:bg-[#181818]',
                  opt.value === value && 'bg-[#181818] text-[#FACC15]',
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
