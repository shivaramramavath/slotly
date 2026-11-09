// Route loading skeleton for blueprint templates and kits.
import { AppLayout } from '@/components/layouts/app-layout';
import { PageHeaderSkeleton } from '@/components/layouts/page-header';
import { KitCardSkeleton } from '@/features/templates/components/kit-card';
import { Skeleton } from '@/components/ui/skeleton';

/** Loading skeleton for blueprint templates page matching sys0 grid and token spacing. */
export default function BlueprintTemplatesLoading() {
  return (
    <AppLayout activePath="/blueprint-templates">
      <div className="pb-16 space-y-6">
        <PageHeaderSkeleton className="mb-10" />
        <div className="mb-4">
          <Skeleton className="h-10 w-80 rounded-[12px] bg-[#181818] motion-reduce:animate-none" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <KitCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
