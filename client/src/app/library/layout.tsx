// Shared application layout for resource library routes providing persistent header, tabs, and filter toolbar.
'use client';

import * as React from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { LibraryProvider, useLibrary } from '@/features/library/components/library-context';
import { LibraryTabs } from '@/features/library/components/library-tabs';
import { LibraryToolbar } from '@/features/library/components/library-toolbar';
import { LibraryHeaderActions } from '@/features/library/components/library-header-actions';

function LibraryLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    activeTab,
    search,
    setSearch,
    selectedDeptId,
    setSelectedDeptId,
    showArchived,
    setShowArchived,
    departments,
    tabCounts,
  } = useLibrary();

  return (
    <div className="w-full">
      {/* 1. PageHeader (40px bottom margin) */}
      <PageHeader
        title="Resource Library"
        description="Central catalog for Faculty teaching resources, Academic Subjects, Elective groups, and Room facilities."
        actions={<LibraryHeaderActions />}
        className="mb-10"
      />

      {/* 2. LibraryTabs (16px bottom margin) */}
      <div className="mb-4">
        <LibraryTabs counts={tabCounts} />
      </div>

      {/* 3. LibraryToolbar (16px bottom margin) */}
      <div className="mb-4">
        <LibraryToolbar
          activeTab={activeTab}
          search={search}
          onSearchChange={setSearch}
          selectedDeptId={selectedDeptId}
          onDeptChange={setSelectedDeptId}
          showArchived={showArchived}
          onArchivedToggle={() => setShowArchived((prev) => !prev)}
          departments={departments}
        />
      </div>

      {/* 4. Active Route Table Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}

/** Shared layout for library sub-routes maintaining persistent header, tabs, and filter controls. */
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout activePath="/library">
      <LibraryProvider>
        <LibraryLayoutContent>{children}</LibraryLayoutContent>
      </LibraryProvider>
    </AppLayout>
  );
}
