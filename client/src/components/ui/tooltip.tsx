// React component for tooltip.
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Interface defining structure for tooltip props. */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** React component rendering tooltip. */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded border border-[#232323] bg-[#111111] px-2.5 py-1 text-xs text-[#FAFAFA] shadow-md animate-in fade-in-0 zoom-in-95',
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
