// Room table component rendering facilities, capacities, equipment, and actions.
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { libraryApi } from '@/features/library/services/library.api';
import { useLibraryFilters } from '@/features/library/hooks/use-library-filters';
import { useLibraryDialogs } from '@/features/library/context/library-dialogs-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LibraryTableSkeleton } from '@/features/library/components/library-table-skeleton';
import {
  DoorOpen,
  Edit,
  Archive,
  Trash2,
  Plus,
  Upload,
  SearchX,
} from 'lucide-react';

/**
 * Room table displaying physical rooms, capacities, equipment tags, and actions.
 */
export function RoomTable() {
  const { filters, hasActiveFilters, resetFilters } = useLibraryFilters();
  const { openAdd, openEdit, openImport, confirmDelete, archiveItem, isArchiving } =
    useLibraryDialogs();

  // Rooms query with keepPreviousData
  const {
    data: roomData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      'library',
      'rooms',
      {
        departmentId: filters.dept || undefined,
        archived: filters.archived ? undefined : false,
        search: filters.q || undefined,
        page: filters.page,
      },
    ],
    queryFn: () =>
      libraryApi.listRooms({
        departmentId: filters.dept || undefined,
        archived: filters.archived ? undefined : false,
        search: filters.q || undefined,
        page: filters.page,
        limit: 100,
      }),
    placeholderData: keepPreviousData,
  });

  const rooms = roomData?.items || [];
  const isDimmed = isFetching && !isLoading;

  if (isLoading) {
    return <LibraryTableSkeleton entity="rooms" rows={8} />;
  }

  // 1. Zero data matching filters
  if (rooms.length === 0 && hasActiveFilters) {
    return (
      <EmptyState
        icon={<SearchX className="w-8 h-8 text-[#8A8A8A]" />}
        title="No results for these filters"
        description="Try clearing some search terms or filters to find facilities and rooms."
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
  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={<DoorOpen className="w-8 h-8 text-[#8A8A8A]" />}
        title="No rooms or facilities added yet"
        description="Add lecture halls, laboratories, or seminar rooms to enable room matching."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAdd('rooms')}
              className="text-xs font-mono"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add room
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openImport('rooms')}
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
              <th className="p-3 w-48">Name</th>
              <th className="p-3 w-36">Building</th>
              <th className="p-3 w-24">Type</th>
              <th className="p-3 w-24">Capacity</th>
              <th className="p-3 w-48">Equipment</th>
              <th className="p-3 w-20">Shared</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232323]">
            {rooms.map((r) => (
              <tr key={r.id} className="hover:bg-[#111] transition-colors">
                <td className="p-3 font-mono text-[#FAFAFA] font-medium">{r.code}</td>
                <td className="p-3 font-medium text-[#FAFAFA]">{r.name}</td>
                <td className="p-3 text-[#8A8A8A]">{r.building}</td>
                <td className="p-3">
                  <Badge
                    variant={
                      r.type === 'lab'
                        ? 'yellow'
                        : r.type === 'lecture'
                          ? 'neutral'
                          : 'green'
                    }
                  >
                    {r.type.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3 font-mono text-[#FAFAFA]">{r.capacity} seats</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 max-w-48">
                    {r.equipment && r.equipment.length > 0 ? (
                      r.equipment.map((eq) => (
                        <span
                          key={eq}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#111] border border-[#232323] text-[#FAFAFA]"
                        >
                          {eq}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8A8A8A] font-mono text-[10px]">Basic</span>
                    )}
                  </div>
                </td>
                <td className="p-3 font-mono text-[11px]">
                  {r.shared ? (
                    <span className="text-[#22C55E]">Yes</span>
                  ) : (
                    <span className="text-[#8A8A8A]">No</span>
                  )}
                </td>
                <td className="p-3">
                  {r.archived ? (
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
                      title="Edit room"
                      onClick={() => openEdit('rooms', r)}
                    >
                      <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={isArchiving}
                      title={r.archived ? 'Unarchive' : 'Archive'}
                      onClick={() =>
                        archiveItem({
                          entity: 'room',
                          id: r.id,
                          archived: !r.archived,
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
                          type: 'room',
                          id: r.id,
                          name: `${r.name} (${r.code})`,
                        })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
