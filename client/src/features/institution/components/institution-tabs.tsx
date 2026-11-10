// Segmented link tabs component for institution navigation with real URLs and keyboard support.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/** Interface defining an institution tab item. */
export interface InstitutionTabItem {
  key: string;
  label: string;
  href: string;
}

/** The 8 canonical tabs for the institution section. */
export const INSTITUTION_TABS: InstitutionTabItem[] = [
  { key: 'overview', label: 'Overview Tree', href: '/institutions' },
  { key: 'departments', label: 'Departments', href: '/institutions/departments' },
  { key: 'programs', label: 'Programs', href: '/institutions/programs' },
  { key: 'academic-years', label: 'Academic Years', href: '/institutions/academic-years' },
  { key: 'semesters', label: 'Semesters', href: '/institutions/semesters' },
  { key: 'sections', label: 'Sections & Batches', href: '/institutions/sections' },
  { key: 'calendar', label: 'Calendar & Holidays', href: '/institutions/calendar' },
  { key: 'working-days', label: 'Working Days', href: '/institutions/working-days' },
];

/** Pure helper to determine which institution tab is currently active. */
export function getActiveInstitutionTab(pathname: string): string {
  if (pathname === '/institutions/departments') return 'departments';
  if (pathname === '/institutions/programs') return 'programs';
  if (pathname === '/institutions/academic-years') return 'academic-years';
  if (pathname === '/institutions/semesters') return 'semesters';
  if (pathname === '/institutions/sections') return 'sections';
  if (pathname === '/institutions/calendar') return 'calendar';
  if (pathname === '/institutions/working-days') return 'working-days';
  return 'overview';
}

/** Props for InstitutionTabs component. */
export interface InstitutionTabsProps {
  className?: string | undefined;
}

/** React component rendering 40px high accessible segmented navigation tabs for institution section. */
export function InstitutionTabs({ className = '' }: InstitutionTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeKey = getActiveInstitutionTab(pathname);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetIndex = (index + 1) % INSTITUTION_TABS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetIndex = (index - 1 + INSTITUTION_TABS.length) % INSTITUTION_TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = INSTITUTION_TABS.length - 1;
    }

    if (targetIndex >= 0) {
      const targetTab = INSTITUTION_TABS[targetIndex];
      if (targetTab) {
        router.push(targetTab.href);
        const links = containerRef.current?.querySelectorAll<HTMLAnchorElement>('a[role="tab"]');
        links?.[targetIndex]?.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Institution navigation tabs"
      className={`h-10 p-1 bg-[#111111] border border-[#232323] rounded-[12px] inline-flex items-center gap-1 max-w-full overflow-x-auto scrollbar-none select-none ${className}`}
    >
      {INSTITUTION_TABS.map((tab, idx) => {
        const isActive = activeKey === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`h-8 px-3 rounded-[8px] text-xs font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA] ${
              isActive
                ? 'bg-[#181818] border border-[#232323] text-[#FAFAFA] font-medium'
                : 'border border-transparent text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#141414]'
            }`}
          >
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
