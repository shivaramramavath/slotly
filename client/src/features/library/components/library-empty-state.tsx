// Empty state component displaying clean empty messaging with primary create and import action shortcuts.
'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LibraryTabKey } from './library-tabs';

/** Props for LibraryEmptyState component. */
export interface LibraryEmptyStateProps {
  entity: LibraryTabKey;
  onAdd: () => void;
  onImport: () => void;
  className?: string | undefined;
}

/** Formats user-facing empty state message corresponding to library resource entity. */
export function getLibraryEmptyMessage(entity: LibraryTabKey): string {
  switch (entity) {
    case 'faculty':
      return "No faculty found. Click 'Add faculty' or use 'Import' to populate.";
    case 'subjects':
      return "No subjects found. Click 'Add subject' or use 'Import' to populate.";
    case 'rooms':
    default:
      return "No rooms registered. Click 'Add room' or use 'Import' to populate.";
  }
}

/** Returns primary button label for adding new entity. */
export function getLibraryAddLabel(entity: LibraryTabKey): string {
  switch (entity) {
    case 'faculty':
      return 'Add faculty';
    case 'subjects':
      return 'Add subject';
    case 'rooms':
    default:
      return 'Add room';
  }
}

/** React component rendering standard 48px vertical padded empty state panel for library tables. */
export function LibraryEmptyState({
  entity,
  onAdd,
  onImport,
  className = '',
}: LibraryEmptyStateProps) {
  const message = getLibraryEmptyMessage(entity);
  const addLabel = getLibraryAddLabel(entity);

  return (
    <div
      className={`py-12 px-6 flex flex-col items-center justify-center text-center ${className}`}
    >
      <p className="text-xs font-mono text-[#8A8A8A] max-w-md mb-5 leading-relaxed">
        {message}
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={onAdd}
          className="gap-1.5 font-mono text-xs h-9 px-3.5 rounded-[12px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{addLabel}</span>
        </Button>
        <button
          type="button"
          onClick={onImport}
          className="text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] underline underline-offset-4 cursor-pointer py-1.5 px-2"
        >
          or use Import
        </button>
      </div>
    </div>
  );
}
