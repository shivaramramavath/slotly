// Hook to fetch and cache live entity counts respecting active library filters.
'use client';

import { useQuery } from '@tanstack/react-query';
import { libraryApi } from '../services/library.api';
import { useLibraryFilters } from './use-library-filters';
import type { LibraryCountsDto } from '@slotly/contracts';

/** Options for filtering library entity counts. */
export interface UseLibraryCountsOptions {
  departmentId?: string | undefined;
  archived?: boolean | undefined;
}

/**
 * Fetches live resource counts (faculty, subjects, rooms) respecting department and archived filters.
 */
export function useLibraryCounts(options?: UseLibraryCountsOptions) {
  const { filters } = useLibraryFilters();

  const departmentId = options?.departmentId ?? (filters.dept || undefined);
  const archived =
    options?.archived !== undefined ? options.archived : filters.archived ? undefined : false;

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<LibraryCountsDto>({
    queryKey: ['library', 'counts', { departmentId, archived }],
    queryFn: () => libraryApi.getCounts({ departmentId, archived }),
    staleTime: 30_000,
  });

  return {
    data,
    counts: data,
    isLoading,
    isError,
    refetch,
  };
}
