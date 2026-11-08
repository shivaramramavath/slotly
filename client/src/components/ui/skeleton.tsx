// React component for skeleton.
import * as React from 'react';
import { cn } from '@/lib/utils';

/** React component rendering skeleton. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-[#181818]', className)}
      {...props}
    />
  );
}
