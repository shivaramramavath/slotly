// Error panel component displaying isolated library route error state, retry trigger, and return navigation link.
'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';

/** Props for LibraryErrorPanel component. */
export interface LibraryErrorPanelProps {
  error?: Error | null | undefined;
  onRetry: () => void;
  entityName?: string | undefined;
  className?: string | undefined;
}

/** React component rendering error state card with retry trigger and return link for library views. */
export function LibraryErrorPanel({
  error,
  onRetry,
  entityName = 'resources',
  className = '',
}: LibraryErrorPanelProps) {
  return (
    <SurfaceCard
      className={`p-8 text-center items-center justify-center min-h-[300px] ${className}`}
    >
      <AlertCircle className="w-10 h-10 text-[#EF4444] mb-3" aria-hidden="true" />
      <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">
        Failed to load {entityName}
      </h2>
      <p className="text-xs font-mono text-[#8A8A8A] max-w-md mb-6">
        {error?.message ||
          'An unexpected error occurred while communicating with the server.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-1.5 font-mono text-xs h-10 px-4 rounded-[12px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
        <Link
          href="/library/faculty"
          className="text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] underline underline-offset-4 py-2"
        >
          Back to Faculty
        </Link>
      </div>
    </SurfaceCard>
  );
}
