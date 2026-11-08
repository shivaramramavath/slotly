// React component for kbd.
import * as React from 'react';
import { cn } from '@/lib/utils';

/** React component rendering kbd. */
export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[#232323] bg-[#181818] px-1.5 font-mono text-[10px] font-medium text-[#8A8A8A]',
        className,
      )}
      {...props}
    />
  );
}
