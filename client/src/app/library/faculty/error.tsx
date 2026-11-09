// Error component handling runtime exceptions in faculty directory view.
'use client';

import { LibraryErrorPanel } from '@/features/library/components/library-error-panel';

interface FacultyLibraryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Error component for faculty library route. */
export default function FacultyLibraryError({ error, reset }: FacultyLibraryErrorProps) {
  return (
    <LibraryErrorPanel
      error={error}
      onRetry={reset}
      entityName="Faculty Directory"
    />
  );
}
