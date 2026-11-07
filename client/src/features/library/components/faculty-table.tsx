// Faculty table component with workload indicator, filters, and row actions.
'use client';

import * as React from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { libraryApi } from '@/features/library/services/library.api';
import { institutionApi } from '@/features/institution/services/institution.api';
import { useLibraryFilters } from '@/features/library/hooks/use-library-filters';
import { useLibraryDialogs } from '@/features/library/context/library-dialogs-context';
import { WorkloadBar } from '@/features/library/components/workload-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LibraryTableSkeleton } from '@/features/library/components/library-table-skeleton';
import {
  Users,
  Edit,
  Archive,
  Trash2,
  Plus,
  Upload,
  SearchX,
} from 'lucide-react';

/**
 * Faculty table rendering rows with workload bars, qualifications, and action menus.
 */
export function FacultyTable() {
  const { filters, hasActiveFilters, resetFilters } = useLibraryFilters();
  const { openAdd, openEdit, openImport, confirmDelete, archiveItem, isArchiving } =
    useLibraryDialogs();

  // Departments for name mapping
  const { data: departments = [] } = useQuery({
    queryKey: ['institution', 'departments'],
    queryFn: () => institutionApi.listDepartments(),
  });

  // Subjects for calculating workload assigned hours
  const { data: subjectData } = useQuery({
    queryKey: ['library', 'subjects', 'all'],
    queryFn: () => libraryApi.listSubjects({ limit: 500, archived: false }),
  });
  const subjects = React.useMemo(() => subjectData?.items || [], [subjectData]);

  // Faculty list query with keepPreviousData
  const {
    data: facultyData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      'library',
      'faculty',
      {
        departmentId: filters.dept || undefined,
        archived: filters.archived ? undefined : false,
        search: filters.q || undefined,
        page: filters.page,
      },
    ],
    queryFn: () =>
      libraryApi.listFaculty({
        departmentId: filters.dept || undefined,
        archived: filters.archived ? undefined : false,
        search: filters.q || undefined,
        page: filters.page,
        limit: 100,
      }),
    placeholderData: keepPreviousData,
  });

  const faculty = facultyData?.items || [];
  const isDimmed = isFetching && !isLoading;

  if (isLoading) {
    return <LibraryTableSkeleton entity="faculty" rows={8} />;
  }

  // 1. Zero data matching filters
  if (faculty.length === 0 && hasActiveFilters) {
    return (
      <EmptyState
        icon={<SearchX className="w-8 h-8 text-[#8A8A8A]" />}
        title="No results for these filters"
        description="Try clearing some search terms or filters to find faculty members."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-xs font-mono"
          >
            Clear filters
          </Button>
        }
      />
    );
  }

  // 2. Zero data overall
  if (faculty.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-8 h-8 text-[#8A8A8A]" />}
        title="No faculty members yet"
        description="Add faculty members or import via spreadsheet to start assigning teachers."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAdd('faculty')}
              className="text-xs font-mono"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add faculty
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openImport('faculty')}
              className="text-xs font-mono"
            >
              <Upload className="w-4 h-4 mr-1.5" /> Import
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Indeterminate loader bar during refetching */}
      {isFetching && (
        <div className="h-0.5 w-full bg-[#181818] overflow-hidden rounded">
          <div className="h-full bg-[#FACC15] animate-pulse w-full" />
        </div>
      )}

      <div
        className={`border border-[#232323] rounded-md overflow-x-auto bg-[#0A0A0A] transition-opacity duration-150 ${
          isDimmed ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#111] border-b border-[#232323] text-[#8A8A8A] font-mono">
            <tr>
              <th className="p-3 w-24">Code</th>
              <th className="p-3 w-56">Name</th>
              <th className="p-3 w-32">Department</th>
              <th className="p-3 w-36">Designation</th>
              <th className="p-3 w-56">Teaching Workload</th>
              <th className="p-3 w-36">Qualified Subjects</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232323]">
            {faculty.map((f) => {
              const dept = departments.find((d) => d.id === f.departmentId);
              const assignedHours = (f.subjectIds || []).reduce((sum, sId) => {
                const s = subjects.find((sub) => sub.id === sId);
                return sum + (s?.weeklyHours || 0);
              }, 0);

              return (
                <tr key={f.id} className="hover:bg-[#111] transition-colors">
                  <td className="p-3 font-mono text-[#FAFAFA] font-medium">{f.code}</td>
                  <td className="p-3">
                    <div className="font-medium text-[#FAFAFA]">{f.name}</div>
                    <div className="text-[11px] text-[#8A8A8A] font-mono">{f.email}</div>
                  </td>
                  <td className="p-3 font-mono text-[#FAFAFA]">
                    {dept?.code || f.departmentId}
                  </td>
                  <td className="p-3 text-[#8A8A8A]">{f.designation}</td>
                  <td className="p-3">
                    <WorkloadBar
                      assignedHours={assignedHours}
                      maxHours={f.maxHoursPerWeek}
                      minHours={f.minHoursPerWeek}
                    />
                  </td>
                  <td className="p-3 font-mono text-[#8A8A8A]">
                    <span className="text-[#FAFAFA]">{f.subjectIds?.length || 0}</span>{' '}
                    qualified
                  </td>
                  <td className="p-3">
                    {f.archived ? (
                      <Badge variant="neutral">Archived</Badge>
                    ) : (
                      <Badge variant="green">Active</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Edit faculty"
                        onClick={() => openEdit('faculty', f)}
                      >
                        <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={isArchiving}
                        title={f.archived ? 'Unarchive' : 'Archive'}
                        onClick={() =>
                          archiveItem({
                            entity: 'faculty',
                            id: f.id,
                            archived: !f.archived,
                          })
                        }
                      >
                        <Archive className="w-3.5 h-3.5 text-[#8A8A8A]" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 hover:border-[#EF4444]"
                        title="Delete"
                        onClick={() =>
                          confirmDelete({
                            type: 'faculty',
                            id: f.id,
                            name: `${f.name} (${f.code})`,
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
