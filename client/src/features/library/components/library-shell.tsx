// Shell layout wrapper providing search toolbar, route navigation tabs, and dialog context.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  LIBRARY_ENTITY_LIST,
  getLibraryEntity,
  type LibraryEntityKey,
} from '@/features/library/config/library-entities';
import { useLibraryFilters } from '@/features/library/hooks/use-library-filters';
import { useLibraryCounts } from '@/features/library/hooks/use-library-counts';
import {
  LibraryDialogsProvider,
  useLibraryDialogs,
} from '@/features/library/context/library-dialogs-context';
import { ExportMenu } from '@/features/library/components/export-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { institutionApi } from '@/features/institution/services/institution.api';
import { libraryApi } from '@/features/library/services/library.api';
import { useLibraryExport } from '@/features/library/hooks/use-library-export';
import {
  Search,
  Archive,
  Plus,
  Upload,
  Layers,
  X,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

/** Props for the LibraryShell component. */
export interface LibraryShellProps {
  children: React.ReactNode;
}

function LibraryShellContent({ children }: LibraryShellProps) {
  const segment = useSelectedLayoutSegment();
  const activeKey: LibraryEntityKey =
    segment === 'subjects' || segment === 'rooms' ? segment : 'faculty';
  const entityConfig = getLibraryEntity(activeKey);

  const queryClient = useQueryClient();
  const {
    filters,
    searchInput,
    setSearchInput,
    setDepartment,
    setArchived,
    resetFilters,
    clearFilterKey,
    hasActiveFilters,
  } = useLibraryFilters();

  const { data: counts, isLoading: loadingCounts } = useLibraryCounts();
  const { openAdd, openImport, openElectiveGroups } = useLibraryDialogs();

  const activeCount = counts ? counts[activeKey] : 0;

  // Mobile overflow export hook
  const { exportAs: exportMobile, isExporting: isExportingMobile } = useLibraryExport({
    entity: entityConfig.exportKey,
    count: activeCount,
    departmentId: filters.dept || undefined,
    archived: filters.archived ? undefined : false,
  });

  // Department list for filter select and chips
  const { data: departments = [] } = useQuery({
    queryKey: ['institution', 'departments'],
    queryFn: () => institutionApi.listDepartments(),
  });

  const selectedDepartment = React.useMemo(
    () => departments.find((d) => d.id === filters.dept),
    [departments, filters.dept],
  );

  // Prefetch data on tab hover/focus
  const handleTabPrefetch = React.useCallback(
    (key: LibraryEntityKey) => {
      const queryParams = {
        departmentId: filters.dept || undefined,
        archived: filters.archived ? undefined : false,
        search: filters.q || undefined,
        page: 1,
      };

      if (key === 'faculty') {
        queryClient.prefetchQuery({
          queryKey: ['library', 'faculty', queryParams],
          queryFn: () =>
            libraryApi.listFaculty({ ...queryParams, limit: 100 }),
        });
      } else if (key === 'subjects') {
        queryClient.prefetchQuery({
          queryKey: ['library', 'subjects', queryParams],
          queryFn: () =>
            libraryApi.listSubjects({ ...queryParams, limit: 100 }),
        });
      } else if (key === 'rooms') {
        queryClient.prefetchQuery({
          queryKey: ['library', 'rooms', queryParams],
          queryFn: () =>
            libraryApi.listRooms({ ...queryParams, limit: 100 }),
        });
      }
    },
    [filters, queryClient],
  );

  // Build tab link maintaining query params (resetting page)
  const getTabHref = (baseRoute: string) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.dept) params.set('dept', filters.dept);
    if (filters.archived) params.set('archived', 'true');
    const qs = params.toString();
    return qs ? `${baseRoute}?${qs}` : baseRoute;
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232323] pb-5">
        <div>
          <h1 className="text-xl font-mono font-semibold tracking-tight text-[#FAFAFA]">
            Resource Library
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-1 font-sans">
            Central catalog for Faculty teaching resources, Academic Subjects,
            Elective groups, and Room facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Elective Groups Button (only visible when in Subjects view) */}
          {activeKey === 'subjects' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openElectiveGroups()}
              className="font-mono text-xs hidden sm:inline-flex"
            >
              <Layers className="w-4 h-4 mr-1.5" /> Elective Groups
            </Button>
          )}

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <ExportMenu
              entity={entityConfig.exportKey}
              totalCount={activeCount}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => openImport(entityConfig.exportKey)}
              className="font-mono text-xs"
            >
              <Upload className="w-4 h-4 mr-1.5" /> Import
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAdd(entityConfig.key)}
              className="font-mono text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" /> {entityConfig.addLabel}
            </Button>
          </div>

          {/* Mobile Actions: Add button + Overflow Menu */}
          <div className="flex sm:hidden items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAdd(entityConfig.key)}
              className="font-mono text-xs"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="More actions"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="w-4 h-4 text-[#FAFAFA]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {activeKey === 'subjects' && (
                  <DropdownMenuItem onClick={() => openElectiveGroups()}>
                    <Layers className="w-4 h-4 mr-2" /> Elective Groups
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => openImport(entityConfig.exportKey)}>
                  <Upload className="w-4 h-4 mr-2" /> Import
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={isExportingMobile || activeCount === 0}
                  onClick={() => exportMobile('xlsx')}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isExportingMobile || activeCount === 0}
                  onClick={() => exportMobile('csv')}
                >
                  <FileText className="w-4 h-4 mr-2" /> CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Global Toolbar Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 p-3 bg-[#0A0A0A] border border-[#232323] rounded-md">
          <div className="relative min-w-56 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8A8A8A]" />
            <Input
              placeholder={entityConfig.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="w-48">
            <Select
              value={filters.dept}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
          </div>

          <Button
            type="button"
            variant={filters.archived ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setArchived(!filters.archived)}
            className="h-9 text-xs font-mono"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            {filters.archived ? 'Showing Archived' : 'Active Only'}
          </Button>
        </div>

        {/* Removable Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[#8A8A8A] font-mono text-[11px]">Filters:</span>

            {filters.q && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#232323] text-[#FAFAFA] font-mono text-xs">
                <span>Search: &quot;{filters.q}&quot;</span>
                <button
                  type="button"
                  aria-label="Remove search filter"
                  onClick={() => clearFilterKey('q')}
                  className="text-[#8A8A8A] hover:text-[#FAFAFA]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.dept && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#232323] text-[#FAFAFA] font-mono text-xs">
                <span>Dept: {selectedDepartment ? selectedDepartment.code : filters.dept}</span>
                <button
                  type="button"
                  aria-label="Remove department filter"
                  onClick={() => clearFilterKey('dept')}
                  className="text-[#8A8A8A] hover:text-[#FAFAFA]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.archived && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111] border border-[#232323] text-[#FAFAFA] font-mono text-xs">
                <span>Archived</span>
                <button
                  type="button"
                  aria-label="Remove archived filter"
                  onClick={() => clearFilterKey('archived')}
                  className="text-[#8A8A8A] hover:text-[#FAFAFA]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-[11px] font-mono px-2 text-[#8A8A8A] hover:text-[#FAFAFA]"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Link Tabs */}
      <nav
        aria-label="Library catalog tabs"
        className="flex border-b border-[#232323] gap-1 overflow-x-auto"
      >
        {LIBRARY_ENTITY_LIST.map((entity) => {
          const isActive = activeKey === entity.key;
          const Icon = entity.icon;
          const count = counts ? counts[entity.key] : null;
          const href = getTabHref(entity.route);

          return (
            <Link
              key={entity.key}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              onMouseEnter={() => handleTabPrefetch(entity.key)}
              onFocus={() => handleTabPrefetch(entity.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#FACC15] text-[#FAFAFA] font-medium'
                  : 'border-transparent text-[#8A8A8A] hover:text-[#FAFAFA] hover:border-[#232323]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{entity.label}</span>
              {loadingCounts ? (
                <Skeleton className="h-4 w-6 rounded-full" />
              ) : (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-[#FACC15]/20 text-[#FACC15]'
                      : 'bg-[#181818] text-[#8A8A8A]'
                  }`}
                >
                  {count ?? 0}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Child tab content */}
      <div className="pt-2">{children}</div>
    </div>
  );
}

/**
 * Shared layout shell for all library sub-routes, keeping modals and navigation mounted.
 */
export function LibraryShell({ children }: LibraryShellProps) {
  return (
    <LibraryDialogsProvider>
      <LibraryShellContent>{children}</LibraryShellContent>
    </LibraryDialogsProvider>
  );
}
