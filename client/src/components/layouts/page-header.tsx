// Reusable page header component matching sys0 visual hierarchy specifications.
'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/** Props for PageHeader component. */
export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** React component rendering standard page header with title, description, and action controls. */
export function PageHeader({
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`mb-10 space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] sm:text-[36px] font-semibold text-[#FAFAFA] tracking-[-0.02em] leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[15px] text-[#8A8A8A] max-w-[660px] leading-relaxed mt-3 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/** Skeleton placeholder component for PageHeader during loading state. */
export function PageHeaderSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`mb-10 space-y-3 ${className}`} aria-busy="true">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3 w-full max-w-[660px]">
          <Skeleton className="h-10 w-64 bg-[#181818] rounded-md motion-reduce:animate-none" />
          <Skeleton className="h-5 w-full max-w-[480px] bg-[#181818] rounded-md motion-reduce:animate-none" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 bg-[#181818] rounded-md motion-reduce:animate-none" />
          <Skeleton className="h-9 w-28 bg-[#181818] rounded-md motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
