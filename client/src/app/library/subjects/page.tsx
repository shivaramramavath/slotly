// React component rendering the academic subject catalog table, requirements, and resource actions.
'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useLibrary } from '@/features/library/components/library-context';
import { LibraryEmptyState } from '@/features/library/components/library-empty-state';
import {
  LibraryTableSkeleton,
  SUBJECT_COLUMNS,
} from '@/features/library/components/library-table-skeleton';
import { LibraryErrorPanel } from '@/features/library/components/library-error-panel';
import { libraryApi } from '@/features/library/services/library.api';

/** React component rendering subjects library catalog view. */
export default function SubjectsLibraryPage() {
  const {
    search,
    selectedDeptId,
    showArchived,
    departments,
    setTabCount,
    openAddSubject,
    openEditSubject,
    openImport,
    confirmDelete,
    archiveResource,
  } = useLibrary();

  // Query subjects matching active filters
  const { data: subjectData, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'library',
      'subjects',
      { departmentId: selectedDeptId, archived: showArchived, search },
    ],
    queryFn: () =>
      libraryApi.listSubjects({
        departmentId: selectedDeptId || undefined,
        archived: showArchived ? undefined : false,
        search: search || undefined,
        limit: 100,
      }),
  });

  // Query elective groups to display group names
  const { data: electiveGroups = [] } = useQuery({
    queryKey: ['library', 'elective-groups'],
    queryFn: () => libraryApi.listElectiveGroups(),
  });

  // Update layout tab count when data arrives
  React.useEffect(() => {
    if (typeof subjectData?.total === 'number') {
      setTabCount('subjects', subjectData.total);
    }
  }, [subjectData?.total, setTabCount]);

  if (isLoading) {
    return <LibraryTableSkeleton columns={SUBJECT_COLUMNS} rows={8} />;
  }

  if (isError) {
    return (
      <LibraryErrorPanel
        error={error as Error}
        onRetry={() => refetch()}
        entityName="Subject Catalog"
      />
    );
  }

  const subjects = subjectData?.items || [];

  return (
    <SurfaceCard flush={true} className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-[#111111] border-b border-[#232323] text-[#8A8A8A] font-mono">
          <tr>
            <th className="px-4 py-3 min-w-[80px]">Code</th>
            <th className="px-4 py-3 min-w-[180px]">Name</th>
            <th className="px-4 py-3 min-w-[100px]">Department</th>
            <th className="px-4 py-3 min-w-[90px]">Type</th>
            <th className="px-4 py-3 min-w-[80px]">Credits</th>
            <th className="px-4 py-3 min-w-[140px]">Weekly / Lab Hrs</th>
            <th className="px-4 py-3 min-w-[160px]">Room Requirements</th>
            <th className="px-4 py-3 min-w-[120px]">Elective Group</th>
            <th className="px-4 py-3 min-w-[110px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232323]">
          {subjects.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-0">
                <LibraryEmptyState
                  entity="subjects"
                  onAdd={openAddSubject}
                  onImport={() => openImport('subjects')}
                />
              </td>
            </tr>
          ) : (
            subjects.map((s) => {
              const dept = departments.find((d) => d.id === s.departmentId);
              const eGroup = electiveGroups.find((g) => g.id === s.electiveGroupId);

              return (
                <tr key={s.id} className="hover:bg-[#141414] transition-colors">
                  <td className="px-4 py-3 font-mono text-[#FAFAFA] font-medium">
                    {s.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#FAFAFA]">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-[#8A8A8A]">
                    {dept?.code || s.departmentId}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        s.type === 'lab'
                          ? 'yellow'
                          : s.type === 'theory'
                            ? 'neutral'
                            : 'green'
                      }
                    >
                      {s.type.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#FAFAFA]">{s.credits}</td>
                  <td className="px-4 py-3 font-mono text-[#8A8A8A]">
                    <span className="text-[#FAFAFA]">{s.weeklyHours}h</span>
                    {s.labHours > 0 && ` (${s.labHours}h lab)`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-[11px] text-[#FAFAFA]">
                      {s.requirements?.roomType || 'Standard'} (&ge;{' '}
                      {s.requirements?.minCapacity || 30})
                    </div>
                    {s.requirements?.equipment && s.requirements.equipment.length > 0 && (
                      <div className="text-[10px] text-[#8A8A8A] font-mono truncate max-w-40">
                        {s.requirements.equipment.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.isElective ? (
                      <Badge variant="yellow">
                        {eGroup ? eGroup.name : 'Elective'}
                      </Badge>
                    ) : (
                      <span className="text-[#8A8A8A] font-mono text-[11px]">Core</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 cursor-pointer"
                        title="Edit Subject"
                        onClick={() => openEditSubject(s)}
                      >
                        <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 cursor-pointer"
                        title={s.archived ? 'Unarchive' : 'Archive'}
                        onClick={() =>
                          archiveResource({
                            entity: 'subject',
                            id: s.id,
                            archived: !s.archived,
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
                            type: 'subject',
                            id: s.id,
                            name: `${s.name} (${s.code})`,
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
