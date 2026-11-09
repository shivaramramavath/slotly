// Error component handling runtime exceptions in subject catalog view.
'use client';

import { LibraryErrorPanel } from '@/features/library/components/library-error-panel';

interface SubjectsLibraryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Error component for subjects library route. */
export default function SubjectsLibraryError({ error, reset }: SubjectsLibraryErrorProps) {
  return (
    <LibraryErrorPanel
      error={error}
      onRetry={reset}
      entityName="Subject Catalog"
    />
  );
}
