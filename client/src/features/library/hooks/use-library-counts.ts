'use client';

import { useQuery } from '@tanstack/react-query';
import { libraryApi } from '../services/library.api';
import type { LibraryCountsDto } from '@slotly/contracts';

export interface UseLibraryCountsOptions {
  departmentId?: string | undefined;
  archived?: boolean | undefined;
}

export function useLibraryCounts(options?: UseLibraryCountsOptions) {
  const departmentId = options?.departmentId || undefined;
  const archived = options?.archived;

  const { data: counts, isLoading, isError, refetch } = useQuery<LibraryCountsDto>({
    queryKey: ['library', 'counts', { departmentId, archived }],
    queryFn: () => libraryApi.getCounts({ departmentId, archived }),
    staleTime: 30_000,
  });

  return {
    counts,
    isLoading,
    isError,
    refetch,
  };
}
