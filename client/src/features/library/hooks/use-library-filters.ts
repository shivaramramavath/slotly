// Hook and helpers for URL-synchronized filter state with debounced search input.
'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { z } from 'zod';

/** Zod schema validating library query parameters. */
export const LibraryFiltersSchema = z.object({
  q: z.string().catch('').default(''),
  dept: z.string().catch('').default(''),
  archived: z.boolean().catch(false).default(false),
  page: z.number().int().positive().catch(1).default(1),
});

/** Inferred type of validated library filters. */
export type LibraryFilters = z.infer<typeof LibraryFiltersSchema>;

/** Default fallback values for library filters. */
export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  q: '',
  dept: '',
  archived: false,
  page: 1,
};

/**
 * Parses URL search params or record objects into validated library filters.
 */
export function parseLibraryFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined> | string,
): LibraryFilters {
  let params: URLSearchParams;
  if (typeof input === 'string') {
    params = new URLSearchParams(input.startsWith('?') ? input.slice(1) : input);
  } else if (input instanceof URLSearchParams) {
    params = input;
  } else {
    params = new URLSearchParams();
    for (const [key, val] of Object.entries(input)) {
      if (typeof val === 'string') params.set(key, val);
      else if (Array.isArray(val) && val[0]) params.set(key, val[0]);
    }
  }

  const rawQ = params.get('q') ?? '';
  const rawDept = params.get('dept') ?? '';
  const rawArchived = params.get('archived');
  const rawPage = params.get('page');

  let parsedArchived = false;
  if (rawArchived === 'true') parsedArchived = true;

  let parsedPage = 1;
  if (rawPage) {
    const num = parseInt(rawPage, 10);
    if (!Number.isNaN(num) && num > 0) {
      parsedPage = num;
    }
  }

  const result = LibraryFiltersSchema.safeParse({
    q: rawQ.trim(),
    dept: rawDept.trim(),
    archived: parsedArchived,
    page: parsedPage,
  });

  return result.success ? result.data : DEFAULT_LIBRARY_FILTERS;
}

/**
 * Serializes partial library filter changes into updated URLSearchParams.
 */
export function serializeLibraryFilters(
  filters: Partial<LibraryFilters>,
  existingParams?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(existingParams?.toString() || '');

  if (filters.q && filters.q.trim()) {
    params.set('q', filters.q.trim());
  } else {
    params.delete('q');
  }

  if (filters.dept && filters.dept.trim()) {
    params.set('dept', filters.dept.trim());
  } else {
    params.delete('dept');
  }

  if (filters.archived === true) {
    params.set('archived', 'true');
  } else {
    params.delete('archived');
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  } else {
    params.delete('page');
  }

  return params;
}

/**
 * Hook providing URL-synchronized library filters with debounced search, setters, and chip actions.
 */
export function useLibraryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Current parsed filters from URL
  const filters = React.useMemo(() => {
    return parseLibraryFilters(searchParams);
  }, [searchParams]);

  // Local state for instant typing responsiveness before debounce
  const [searchInput, setSearchInput] = React.useState(filters.q);
  const [prevFilterQ, setPrevFilterQ] = React.useState(filters.q);

  if (filters.q !== prevFilterQ) {
    setPrevFilterQ(filters.q);
    setSearchInput(filters.q);
  }

  const updateUrl = React.useCallback(
    (newFilters: Partial<LibraryFilters>) => {
      const merged: LibraryFilters = {
        ...filters,
        ...newFilters,
      };

      const params = serializeLibraryFilters(merged);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const target = `${pathname}${qs}`;

      React.startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [filters, pathname, router],
  );

  // Debounced search sync
  React.useEffect(() => {
    if (searchInput === filters.q) return;

    const timer = setTimeout(() => {
      // When search query changes, reset page to 1
      updateUrl({ q: searchInput, page: 1 });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput, filters.q, updateUrl]);

  const setSearch = React.useCallback((q: string) => {
    setSearchInput(q);
  }, []);

  const setDepartment = React.useCallback(
    (deptId: string) => {
      updateUrl({ dept: deptId, page: 1 });
    },
    [updateUrl],
  );

  const setArchived = React.useCallback(
    (archived: boolean) => {
      updateUrl({ archived, page: 1 });
    },
    [updateUrl],
  );

  const setPage = React.useCallback(
    (page: number) => {
      updateUrl({ page });
    },
    [updateUrl],
  );

  const removeFilter = React.useCallback(
    (key: 'q' | 'dept' | 'archived') => {
      if (key === 'q') {
        setSearchInput('');
        updateUrl({ q: '', page: 1 });
      } else if (key === 'dept') {
        updateUrl({ dept: '', page: 1 });
      } else if (key === 'archived') {
        updateUrl({ archived: false, page: 1 });
      }
    },
    [updateUrl],
  );

  const clearFilters = React.useCallback(() => {
    setSearchInput('');
    React.startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const isFiltered = Boolean(filters.q || filters.dept || filters.archived);

  return {
    filters,
    searchInput,
    setSearch,
    setSearchInput,
    setDepartment,
    setArchived,
    setPage,
    removeFilter,
    clearFilterKey: removeFilter,
    clearFilters,
    resetFilters: clearFilters,
    isFiltered,
    hasActiveFilters: isFiltered,
  };
}
