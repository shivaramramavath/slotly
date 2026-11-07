// React component for badge.
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Interface defining structure for badge props. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'yellow' | 'red' | 'neutral';
}

/** React component rendering badge. */
export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  const variants = {
    green: 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]',
    yellow: 'border-[#FACC15]/30 bg-[#FACC15]/10 text-[#FACC15]',
    red: 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]',
    neutral: 'border-[#232323] bg-[#181818] text-[#8A8A8A]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs font-medium tracking-tight',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
