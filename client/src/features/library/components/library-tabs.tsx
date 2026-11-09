// Segmented link tabs component for library navigation with real URLs, query preservation, and count skeletons.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Users, BookOpen, DoorOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/** Tab keys representing the three library resources. */
export type LibraryTabKey = 'faculty' | 'subjects' | 'rooms';

/** Interface defining tab item configuration. */
export interface LibraryTabItem {
  key: LibraryTabKey;
  label: string;
  hrefBase: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Standard tabs list for the library section. */
export const LIBRARY_TABS: LibraryTabItem[] = [
  {
    key: 'faculty',
    label: 'Faculty',
    hrefBase: '/library/faculty',
    icon: Users,
  },
  {
    key: 'subjects',
    label: 'Subjects',
    hrefBase: '/library/subjects',
    icon: BookOpen,
  },
  {
    key: 'rooms',
    label: 'Rooms & Facilities',
    hrefBase: '/library/rooms',
    icon: DoorOpen,
  },
];

/**
 * Pure helper determining active library tab from pathname.
 */
export function getActiveLibraryTab(pathname: string): LibraryTabKey {
  if (pathname.startsWith('/library/subjects') || pathname.startsWith('/library/subject')) {
    return 'subjects';
  }
  if (pathname.startsWith('/library/rooms') || pathname.startsWith('/library/room')) {
    return 'rooms';
  }
  return 'faculty';
}

/**
 * Computes destination href preserving search, active, and applicable department query params.
 * Rule: Preserve search and active-only filters across all tabs. Department filter is preserved
 * between Faculty and Subjects, but excluded from Rooms as rooms are institution-level facilities
 * without department assignments.
 */
export function getLibraryTabHref(
  target: LibraryTabKey,
  currentFilters: {
    search?: string | null | undefined;
    department?: string | null | undefined;
    archived?: string | null | undefined;
  },
): string {
  const params = new URLSearchParams();
  if (currentFilters.search) {
    params.set('search', currentFilters.search);
  }
  if (currentFilters.department && target !== 'rooms') {
    params.set('department', currentFilters.department);
  }
  if (currentFilters.archived === 'true') {
    params.set('archived', 'true');
  }
  const query = params.toString();
  return `/library/${target}${query ? `?${query}` : ''}`;
}

/** Props for LibraryTabs component. */
export interface LibraryTabsProps {
  counts?: Partial<Record<LibraryTabKey, number | undefined>> | undefined;
  className?: string | undefined;
}

/** React component rendering segmented link navigation tabs for library sections. */
export function LibraryTabs({ counts = {}, className = '' }: LibraryTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = getActiveLibraryTab(pathname);

  const currentFilters = React.useMemo(() => {
    return {
      search: searchParams.get('search'),
      department: searchParams.get('department'),
      archived: searchParams.get('archived'),
    };
  }, [searchParams]);

  return (
    <nav
      aria-label="Library sections"
      className={`flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none ${className}`}
    >
      {LIBRARY_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        const count = counts[tab.key];
        const href = getLibraryTabHref(tab.key, currentFilters);

        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`h-10 px-4 rounded-[12px] flex items-center gap-2 text-xs font-mono transition-all shrink-0 select-none ${
              isActive
                ? 'bg-[#181818] border border-[#232323] text-[#FAFAFA] font-medium'
                : 'text-[#8A8A8A] hover:text-[#FAFAFA] border border-transparent hover:bg-[#111111]'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-sans text-sm font-normal">{tab.label}</span>
            {typeof count === 'number' ? (
              <span className="text-xs font-mono opacity-80">{count}</span>
            ) : (
              <Skeleton className="h-3.5 w-5 rounded bg-[#232323] inline-block motion-reduce:animate-none" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
