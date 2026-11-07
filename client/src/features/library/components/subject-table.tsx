// Subject table component rendering course details, room requirements, and actions.
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { libraryApi } from '@/features/library/services/library.api';
import { institutionApi } from '@/features/institution/services/institution.api';
import { useLibraryFilters } from '@/features/library/hooks/use-library-filters';
import { useLibraryDialogs } from '@/features/library/context/library-dialogs-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LibraryTableSkeleton } from '@/features/library/components/library-table-skeleton';
import {
  BookOpen,
  Edit,
  Archive,
  Trash2,
  Plus,
  Upload,
  SearchX,
} from 'lucide-react';

/**
 * Subject table rendering course codes, type, requirements, and management actions.
 */
export function SubjectTable() {
  const { filters, hasActiveFilters, resetFilters } = useLibraryFilters();
  const { openAdd, openEdit, openImport, confirmDelete, archiveItem, isArchiving } =
    useLibraryDialogs();

  // Departments for name mapping
  const { data: departments = [] } = useQuery({
    queryKey: ['institution', 'departments'],
    queryFn: () => institutionApi.listDepartments(),
  });

  // Elective groups for mapping group names
  const { data: electiveGroups = [] } = useQuery({
    queryKey: ['library', 'elective-groups'],
    queryFn: () => libraryApi.listElectiveGroups(),
  });

  // Subjects query with keepPreviousData
  const {
    data: subjectData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      'library',
      'subjects',
      {
        departmentId: filters.dept || undefined,
        archived: filters.archived ? undefined : false,
        search: filters.q || undefined,
        page: filters.page,
      },
    ],
    queryFn: () =>
      libraryApi.listSubjects({
        departmentId: filters.dept || undefined,
        archived: filters.archived ? undefined : false,
        search: filters.q || undefined,
        page: filters.page,
        limit: 100,
      }),
    placeholderData: keepPreviousData,
  });

  const subjects = subjectData?.items || [];
  const isDimmed = isFetching && !isLoading;

  if (isLoading) {
    return <LibraryTableSkeleton entity="subjects" rows={8} />;
  }

  // 1. Zero data matching filters
  if (subjects.length === 0 && hasActiveFilters) {
    return (
      <EmptyState
        icon={<SearchX className="w-8 h-8 text-[#8A8A8A]" />}
        title="No results for these filters"
        description="Try clearing some search terms or filters to find academic subjects."
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
  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-8 h-8 text-[#8A8A8A]" />}
        title="No subjects cataloged yet"
        description="Add academic subjects or import syllabus details to begin timetable modeling."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAdd('subjects')}
              className="text-xs font-mono"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add subject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openImport('subjects')}
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
              <th className="p-3 w-24">Type</th>
              <th className="p-3 w-20">Credits</th>
              <th className="p-3 w-36">Weekly / Lab Hrs</th>
              <th className="p-3 w-48">Room Requirements</th>
              <th className="p-3 w-32">Elective Group</th>
              <th className="p-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232323]">
            {subjects.map((s) => {
              const dept = departments.find((d) => d.id === s.departmentId);
              const eGroup = electiveGroups.find((g) => g.id === s.electiveGroupId);

              return (
                <tr key={s.id} className="hover:bg-[#111] transition-colors">
                  <td className="p-3 font-mono text-[#FAFAFA] font-medium">{s.code}</td>
                  <td className="p-3 font-medium text-[#FAFAFA]">{s.name}</td>
                  <td className="p-3 font-mono text-[#8A8A8A]">
                    {dept?.code || s.departmentId}
                  </td>
                  <td className="p-3">
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
                  <td className="p-3 font-mono text-[#FAFAFA]">{s.credits}</td>
                  <td className="p-3 font-mono text-[#8A8A8A]">
                    <span className="text-[#FAFAFA]">{s.weeklyHours}h</span>
                    {s.labHours > 0 && ` (${s.labHours}h lab)`}
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-[11px] text-[#FAFAFA]">
                      {s.requirements?.roomType} (&ge; {s.requirements?.minCapacity})
                    </div>
                    {s.requirements?.equipment && s.requirements.equipment.length > 0 && (
                      <div className="text-[10px] text-[#8A8A8A] font-mono truncate max-w-44">
                        {s.requirements.equipment.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {s.isElective ? (
                      <Badge variant="yellow">{eGroup ? eGroup.name : 'Elective'}</Badge>
                    ) : (
                      <span className="text-[#8A8A8A] font-mono text-[11px]">Core</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Edit subject"
                        onClick={() => openEdit('subjects', s)}
                      >
                        <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={isArchiving}
                        title={s.archived ? 'Unarchive' : 'Archive'}
                        onClick={() =>
                          archiveItem({
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
                        className="h-7 w-7 p-0 hover:border-[#EF4444]"
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
