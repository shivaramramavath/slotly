// React component for app-layout composing AppHeader, PageContainer, and auth protection.
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { AppHeader } from './app-header';
import { PageContainer } from './page-container';
import { PageHeaderSkeleton } from './page-header';
import { ProjectCardSkeleton } from '@/features/projects/components/project-card';

/** Interface defining structure for app layout props. */
export interface AppLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  compact?: boolean;
  fluid?: boolean;
}

/** React component rendering app layout with authentication route protection and sys0 styling. */
export function AppLayout({
  children,
  compact = false,
  fluid = false,
}: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  React.useEffect(() => {
    if (status !== 'loading' && status !== 'idle') return;
    const timer = setTimeout(() => {
      const current = useAuthStore.getState().status;
      if (current === 'loading' || current === 'idle') {
        clearAuth();
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [status, clearAuth]);

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      const nextQuery =
        pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${nextQuery}`);
    }
  }, [status, router, pathname]);

  // Render shell skeleton while checking/restoring authentication
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA]" aria-busy="true">
        <AppHeader compact={compact} />
        <main className="flex-1 py-6">
          <PageContainer fluid={fluid}>
            <PageHeaderSkeleton />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          </PageContainer>
        </main>
      </div>
    );
  }

  // If unauthenticated, don't flash content while redirecting
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA]">
      <AppHeader compact={compact} />
      <main className="flex-1 pb-16">
        <PageContainer fluid={fluid}>
          {children}
        </PageContainer>
      </main>
    </div>
  );
}
