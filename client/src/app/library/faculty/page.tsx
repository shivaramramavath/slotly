// React component rendering the faculty directory table, workload indicators, and resource actions.
'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { WorkloadBar } from '@/features/library/components/workload-bar';
import { useLibrary } from '@/features/library/components/library-context';
import { LibraryEmptyState } from '@/features/library/components/library-empty-state';
import {
  LibraryTableSkeleton,
  FACULTY_COLUMNS,
} from '@/features/library/components/library-table-skeleton';
import { LibraryErrorPanel } from '@/features/library/components/library-error-panel';
import { libraryApi } from '@/features/library/services/library.api';

/** React component rendering faculty library directory view. */
export default function FacultyLibraryPage() {
  const {
    search,
    selectedDeptId,
    showArchived,
    departments,
    setTabCount,
    openAddFaculty,
    openEditFaculty,
    openImport,
    confirmDelete,
    archiveResource,
  } = useLibrary();

  // Query faculty records matching active filters
  const { data: facultyData, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'library',
      'faculty',
      { departmentId: selectedDeptId, archived: showArchived, search },
    ],
    queryFn: () =>
      libraryApi.listFaculty({
        departmentId: selectedDeptId || undefined,
        archived: showArchived ? undefined : false,
        search: search || undefined,
        limit: 100,
      }),
  });

  // Query subjects to calculate assigned teaching workload hours
  const { data: subjectsData } = useQuery({
    queryKey: ['library', 'subjects', { archived: false, limit: 100 }],
    queryFn: () => libraryApi.listSubjects({ limit: 100 }),
  });
  const subjects = subjectsData?.items || [];

  // Update layout tab count when data arrives
  React.useEffect(() => {
    if (typeof facultyData?.total === 'number') {
      setTabCount('faculty', facultyData.total);
    }
  }, [facultyData?.total, setTabCount]);

  if (isLoading) {
    return <LibraryTableSkeleton columns={FACULTY_COLUMNS} rows={8} />;
  }

  if (isError) {
    return (
      <LibraryErrorPanel
        error={error as Error}
        onRetry={() => refetch()}
        entityName="Faculty Directory"
      />
    );
  }

  const faculties = facultyData?.items || [];

  return (
    <SurfaceCard flush={true} className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-[#111111] border-b border-[#232323] text-[#8A8A8A] font-mono">
          <tr>
            <th className="px-4 py-3 min-w-[80px]">Code</th>
            <th className="px-4 py-3 min-w-[180px]">Name</th>
            <th className="px-4 py-3 min-w-[100px]">Department</th>
            <th className="px-4 py-3 min-w-[120px]">Designation</th>
            <th className="px-4 py-3 w-56 min-w-[220px]">Teaching Workload</th>
            <th className="px-4 py-3 min-w-[140px]">Qualified Subjects</th>
            <th className="px-4 py-3 min-w-[90px]">Status</th>
            <th className="px-4 py-3 min-w-[110px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232323]">
          {faculties.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-0">
                <LibraryEmptyState
                  entity="faculty"
                  onAdd={openAddFaculty}
                  onImport={() => openImport('faculty')}
                />
              </td>
            </tr>
          ) : (
            faculties.map((f) => {
              const dept = departments.find((d) => d.id === f.departmentId);
              // Calculate assigned hours from qualified subjects
              const assignedHours = (f.subjectIds || []).reduce((sum, sId) => {
                const s = subjects.find((sub) => sub.id === sId);
                return sum + (s?.weeklyHours || 0);
              }, 0);

              return (
                <tr key={f.id} className="hover:bg-[#141414] transition-colors">
                  <td className="px-4 py-3 font-mono text-[#FAFAFA] font-medium">
                    {f.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#FAFAFA]">{f.name}</div>
                    <div className="text-[11px] text-[#8A8A8A] font-mono">{f.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#FAFAFA]">
                    {dept?.code || f.departmentId}
                  </td>
                  <td className="px-4 py-3 text-[#8A8A8A]">{f.designation}</td>
                  <td className="px-4 py-3">
                    <WorkloadBar
                      assignedHours={assignedHours}
                      maxHours={f.maxHoursPerWeek}
                      minHours={f.minHoursPerWeek}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-[#8A8A8A]">
                    <span className="text-[#FAFAFA]">
                      {f.subjectIds?.length || 0}
                    </span>{' '}
                    qualified
                  </td>
                  <td className="px-4 py-3">
                    {f.archived ? (
                      <Badge variant="neutral">Archived</Badge>
                    ) : (
                      <Badge variant="green">Active</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 cursor-pointer"
                        title="Edit Faculty"
                        onClick={() => openEditFaculty(f)}
                      >
                        <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 cursor-pointer"
                        title={f.archived ? 'Unarchive' : 'Archive'}
                        onClick={() =>
                          archiveResource({
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
                        className="h-7 w-7 p-0 hover:border-[#EF4444] cursor-pointer"
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
            })
          )}
        </tbody>
      </table>
    </SurfaceCard>
  );
}
