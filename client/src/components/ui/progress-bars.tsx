// Three-bar progression indicator glyph component matching visual specification.
'use client';

import type { ProjectLifecycleStatus } from '@slotly/contracts';

/** Configuration describing active count and color token for progress bars. */
export interface BarIndicatorConfig {
  activeBars: number;
  colorClass: string;
}

/** Pure helper mapping project lifecycle status to bar indicator count and color token. */
export function getIndicatorConfig(status: ProjectLifecycleStatus): BarIndicatorConfig {
  switch (status) {
    case 'published':
      return { activeBars: 3, colorClass: 'bg-[#22C55E]' };
    case 'ready':
      return { activeBars: 2, colorClass: 'bg-[#22C55E]' };
    case 'building':
    case 'pending_approval':
      return { activeBars: 2, colorClass: 'bg-[#FACC15]' };
    case 'archived':
      return { activeBars: 1, colorClass: 'bg-[#8A8A8A]' };
    case 'draft':
    default:
      return { activeBars: 1, colorClass: 'bg-[#8A8A8A]' };
  }
}

/** Props for ProgressBars component. */
export interface ProgressBarsProps {
  status: ProjectLifecycleStatus;
  className?: string;
}

/** React component rendering three-bar indicator glyph with increasing heights (6px, 10px, 14px). */
export function ProgressBars({ status, className = '' }: ProgressBarsProps) {
  const { activeBars, colorClass } = getIndicatorConfig(status);

  return (
    <div
      className={`inline-flex items-end gap-[3px] h-3.5 ${className}`}
      aria-hidden="true"
    >
      <span
        className={`w-[3px] h-[6px] rounded-[1px] transition-colors ${
          activeBars >= 1 ? colorClass : 'bg-[#232323]'
        }`}
      />
      <span
        className={`w-[3px] h-[10px] rounded-[1px] transition-colors ${
          activeBars >= 2 ? colorClass : 'bg-[#232323]'
        }`}
      />
      <span
        className={`w-[3px] h-[14px] rounded-[1px] transition-colors ${
          activeBars >= 3 ? colorClass : 'bg-[#232323]'
        }`}
      />
    </div>
  );
}
