// Main navigation bar component rendering plain-text active-underlined route links.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { UserRole } from '@slotly/contracts';

/** Helper determining whether a navigation link matches current path by first segment. */
export function isNavActive(pathname: string | null | undefined, targetHref: string): boolean {
  if (!pathname) return false;

  const cleanPath = pathname.split('?')[0]?.split('#')[0] || '/';
  const cleanTarget = targetHref.split('?')[0]?.split('#')[0] || '/';

  // Exact match
  if (cleanPath === cleanTarget) return true;

  // Projects equivalence: /dashboard or /projects or /projects/[id]
  if (
    (cleanTarget === '/dashboard' || cleanTarget === '/projects') &&
    (cleanPath === '/' || cleanPath === '/home' || cleanPath.startsWith('/dashboard') || cleanPath.startsWith('/projects'))
  ) {
    return true;
  }

  // Templates equivalence: /blueprint-templates or /kits
  if (
    (cleanTarget === '/blueprint-templates' || cleanTarget === '/kits') &&
    (cleanPath.startsWith('/blueprint-templates') || cleanPath.startsWith('/kits'))
  ) {
    return true;
  }

  // Institution equivalence: /institutions or /institution
  if (
    (cleanTarget === '/institutions' || cleanTarget === '/institution') &&
    (cleanPath.startsWith('/institutions') || cleanPath.startsWith('/institution'))
  ) {
    return true;
  }

  // Library equivalence: /library or /library/*
  if (cleanTarget === '/library' && cleanPath.startsWith('/library')) {
    return true;
  }

  // First segment check for sub-routes
  const pathFirstSegment = cleanPath.split('/')[1];
  const targetFirstSegment = cleanTarget.split('/')[1];

  return Boolean(pathFirstSegment && targetFirstSegment && pathFirstSegment === targetFirstSegment);
}

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Projects', href: '/dashboard' },
  { label: 'Institution', href: '/institutions' },
  { label: 'Library', href: '/library' },
  { label: 'Templates', href: '/blueprint-templates' },
];

/** Props for AppNav component. */
export interface AppNavProps {
  className?: string;
  onLinkClick?: () => void;
  orientation?: 'horizontal' | 'vertical';
}

/** React component rendering accessible, plain-text header navigation. */
export function AppNav({
  className = '',
  onLinkClick,
  orientation = 'horizontal',
}: AppNavProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role;

  // If role is student or faculty, provide personal timetable view link
  const items = React.useMemo(() => {
    if (userRole === 'STUDENT' || userRole === 'FACULTY') {
      return [
        { label: 'My Timetable', href: '/timetables/me' },
        ...DEFAULT_NAV_ITEMS,
      ];
    }
    return DEFAULT_NAV_ITEMS;
  }, [userRole]);

  const navClasses =
    orientation === 'vertical'
      ? 'flex flex-col gap-4 text-base'
      : 'flex items-center gap-7 text-sm';

  return (
    <nav aria-label="Main Navigation" className={`${navClasses} ${className}`}>
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);

        const linkProps: Record<string, unknown> = {};
        if (onLinkClick) linkProps.onClick = onLinkClick;
        if (active) linkProps['aria-current'] = 'page';

        return (
          <Link
            key={item.href}
            href={item.href}
            {...linkProps}
            className={`transition-colors py-1 ${
              active
                ? 'text-[#FAFAFA] font-medium underline underline-offset-[6px] decoration-white/60 decoration-1'
                : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
