// React component rendering blueprint templates and kits catalog page.
import { Suspense } from 'react';
import { TemplatesPage } from '@/features/templates/components/templates-page';
import { KitCardSkeleton } from '@/features/templates/components/kit-card';
import { PageHeaderSkeleton } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';

/** React component rendering blueprint templates page with Suspense wrapper. */
export default function BlueprintTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8 max-w-5xl mx-auto px-6 py-6 pb-16">
          <PageHeaderSkeleton />
          <Skeleton className="h-10 w-96 rounded-[12px] bg-[#181818] motion-reduce:animate-none" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <KitCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <TemplatesPage />
    </Suspense>
  );
}
