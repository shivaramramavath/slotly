// Header actions component rendering the single export dropdown, import trigger, and active tab primary button.
'use client';

import { Upload, Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LibraryExportDropdown } from './library-export-dropdown';
import { useLibrary } from './library-context';
import { getLibraryAddLabel } from './library-empty-state';

/** Props for LibraryHeaderActions component. */
export interface LibraryHeaderActionsProps {
  className?: string | undefined;
}

/** React component rendering library header actions slot in PageHeader. */
export function LibraryHeaderActions({ className = '' }: LibraryHeaderActionsProps) {
  const {
    activeTab,
    tabCounts,
    openAddFaculty,
    openAddSubject,
    openAddRoom,
    openElectiveGroups,
    openImport,
  } = useLibrary();

  const currentCount = tabCounts[activeTab];
  const isExportDisabled = currentCount === 0;
  const addLabel = getLibraryAddLabel(activeTab);

  const handlePrimaryAdd = () => {
    if (activeTab === 'faculty') openAddFaculty();
    else if (activeTab === 'subjects') openAddSubject();
    else openAddRoom();
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Single Export Dropdown (Outline, 40px) */}
      <LibraryExportDropdown
        entity={activeTab}
        disabled={isExportDisabled}
      />

      {/* Import Button (Outline, 40px) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => openImport(activeTab)}
        className="h-10 px-3.5 font-mono text-xs rounded-[12px] gap-1.5"
      >
        <Upload className="w-4 h-4 text-[#8A8A8A]" />
        <span>Import</span>
      </Button>

      {/* Elective Groups Button (Only for Subjects tab) */}
      {activeTab === 'subjects' && (
        <Button
          variant="outline"
          size="sm"
          onClick={openElectiveGroups}
          className="h-10 px-3.5 font-mono text-xs rounded-[12px] gap-1.5"
        >
          <Layers className="w-4 h-4 text-[#8A8A8A]" />
          <span>Elective Groups</span>
        </Button>
      )}

      {/* Primary Action Button (Single Yellow Button, 40px) */}
      <Button
        variant="primary"
        size="sm"
        onClick={handlePrimaryAdd}
        className="h-10 px-4 font-mono text-xs font-medium rounded-[12px] gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>{addLabel}</span>
      </Button>
    </div>
  );
}
