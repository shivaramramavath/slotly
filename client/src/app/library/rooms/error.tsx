// Error component handling runtime exceptions in rooms directory view.
'use client';

import { LibraryErrorPanel } from '@/features/library/components/library-error-panel';

interface RoomsLibraryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Error component for rooms library route. */
export default function RoomsLibraryError({ error, reset }: RoomsLibraryErrorProps) {
  return (
    <LibraryErrorPanel
      error={error}
      onRetry={reset}
      entityName="Rooms Directory"
    />
  );
}
