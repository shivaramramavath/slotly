// Layout server component rendering the persistent LibraryShell wrapper.
import type * as React from 'react';
import { Suspense } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { LibraryShell } from '@/features/library/components/library-shell';

/**
 * Shared layout for the resource library that keeps toolbar and navigation tabs persistent.
 */
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <Suspense>
        <LibraryShell>{children}</LibraryShell>
      </Suspense>
    </AppLayout>
  );
}
