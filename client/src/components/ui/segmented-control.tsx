// Segmented control component rendering 40px high accessible single-choice tab strip.
'use client';

import * as React from 'react';

/** Option item configuration for SegmentedControl. */
export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  count?: number | undefined;
  badge?: string | number | undefined;
}

/** Props for SegmentedControl component. */
export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

/** React component rendering 40px high segmented control with surface styling and keyboard navigation. */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filter options',
  className = '',
}: SegmentedControlProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.length;
      const nextOption = options[nextIndex];
      if (nextOption) {
        onChange(nextOption.value);
        const nextButton = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
        nextButton?.focus();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + options.length) % options.length;
      const prevOption = options[prevIndex];
      if (prevOption) {
        onChange(prevOption.value);
        const prevButton = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[prevIndex];
        prevButton?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstOption = options[0];
      if (firstOption) {
        onChange(firstOption.value);
        const firstButton = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[0];
        firstButton?.focus();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = options.length - 1;
      const lastOption = options[lastIndex];
      if (lastOption) {
        onChange(lastOption.value);
        const lastButton = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[lastIndex];
        lastButton?.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`h-10 p-1 bg-[#111111] border border-[#232323] rounded-[12px] inline-flex items-center gap-1 max-w-full overflow-x-auto scrollbar-none select-none ${className}`}
    >
      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`h-8 px-3 rounded-[8px] text-xs font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA] ${
              isSelected
                ? 'bg-[#181818] border border-[#232323] text-[#FAFAFA] font-medium'
                : 'border border-transparent text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#141414]'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[11px] ${
                  isSelected ? 'text-[#FAFAFA]/70' : 'text-[#8A8A8A]'
                }`}
              >
                ({opt.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
