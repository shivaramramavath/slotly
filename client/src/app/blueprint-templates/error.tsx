// Route error boundary component for blueprint templates and kits.
'use client';

import { AppLayout } from '@/components/layouts/app-layout';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

/** Error boundary component for blueprint templates route. */
export default function BlueprintTemplatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppLayout activePath="/blueprint-templates">
      <div className="pb-16 pt-8">
        <SurfaceCard className="p-8 text-center items-center justify-center min-h-[300px]">
          <AlertCircle className="w-10 h-10 text-[#EF4444] mb-3" />
          <h3 className="text-base font-semibold text-[#FAFAFA] mb-1">
            Failed to load blueprint templates
          </h3>
          <p className="text-xs font-mono text-[#8A8A8A] max-w-md mb-6">
            {error.message || 'An unexpected error occurred while loading template kits.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reset()}
            className="gap-1.5 font-mono text-xs rounded-[12px] h-8"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </SurfaceCard>
      </div>
    </AppLayout>
  );
}
