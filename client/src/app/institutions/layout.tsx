// Shared layout for institution routes providing persistent header, stats row, tabs, and modals.
'use client';

import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { PageHeader } from '@/components/layouts/page-header';
import {
  InstitutionProvider,
  useInstitutionContext,
  InstitutionHeaderActions,
  InstitutionStatsRow,
  InstitutionTabs,
} from '@/features/institution';

function InstitutionLayoutContent({ children }: { children: ReactNode }) {
  const { structure } = useInstitutionContext();
  const institutionName = structure?.institution.name || 'Institution Settings';

  return (
    <div className="w-full">
      {/* 1. Page Header with Title, Main Badge, and Contextual Action */}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <span>{institutionName}</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#8A8A8A]">
              Main
            </span>
          </span>
        }
        description="Hierarchical academic management, working calendar, period timing, and structural dependencies."
        actions={<InstitutionHeaderActions />}
        className="mb-8"
      />

      {/* 2. Quick Statistics Row (6 Cards, 16px Radius, Monochrome Numbers) */}
      <div className="mb-8">
        <InstitutionStatsRow />
      </div>

      {/* 3. 40px Segmented Navigation Tabs */}
      <div className="mb-6">
        <InstitutionTabs />
      </div>

      {/* 4. Active Sub-Route Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}

/** Shared layout for institution sub-routes maintaining persistent header, stats, and tabs. */
export default function InstitutionLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout activePath="/institutions">
      <InstitutionProvider>
        <InstitutionLayoutContent>{children}</InstitutionLayoutContent>
      </InstitutionProvider>
    </AppLayout>
  );
}
