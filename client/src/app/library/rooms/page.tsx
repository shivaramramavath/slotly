// React component rendering the facilities and rooms directory table, equipment, and resource actions.
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
  ROOM_COLUMNS,
} from '@/features/library/components/library-table-skeleton';
import { LibraryErrorPanel } from '@/features/library/components/library-error-panel';
import { libraryApi } from '@/features/library/services/library.api';

/** React component rendering rooms library facilities view. */
export default function RoomsLibraryPage() {
  const {
    search,
    showArchived,
    setTabCount,
    openAddRoom,
    openEditRoom,
    openImport,
    confirmDelete,
    archiveResource,
  } = useLibrary();

  // Query rooms matching search and archive status (rooms are institution-level)
  const { data: roomData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['library', 'rooms', { archived: showArchived, search }],
    queryFn: () =>
      libraryApi.listRooms({
        archived: showArchived ? undefined : false,
        search: search || undefined,
        limit: 100,
      }),
  });

  // Update layout tab count when data arrives
  React.useEffect(() => {
    if (typeof roomData?.total === 'number') {
      setTabCount('rooms', roomData.total);
    }
  }, [roomData?.total, setTabCount]);

  if (isLoading) {
    return <LibraryTableSkeleton columns={ROOM_COLUMNS} rows={8} />;
  }

  if (isError) {
    return (
      <LibraryErrorPanel
        error={error as Error}
        onRetry={() => refetch()}
        entityName="Rooms Directory"
      />
    );
  }

  const rooms = roomData?.items || [];

  return (
    <SurfaceCard flush={true} className="overflow-x-auto">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-[#111111] border-b border-[#232323] text-[#8A8A8A] font-mono">
          <tr>
            <th className="px-4 py-3 min-w-[80px]">Code</th>
            <th className="px-4 py-3 min-w-[160px]">Name</th>
            <th className="px-4 py-3 min-w-[120px]">Building</th>
            <th className="px-4 py-3 min-w-[90px]">Type</th>
            <th className="px-4 py-3 min-w-[100px]">Capacity</th>
            <th className="px-4 py-3 min-w-[180px]">Equipment</th>
            <th className="px-4 py-3 min-w-[80px]">Shared</th>
            <th className="px-4 py-3 min-w-[90px]">Status</th>
            <th className="px-4 py-3 min-w-[110px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232323]">
          {rooms.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-0">
                <LibraryEmptyState
                  entity="rooms"
                  onAdd={openAddRoom}
                  onImport={() => openImport('rooms')}
                />
              </td>
            </tr>
          ) : (
            rooms.map((r) => (
              <tr key={r.id} className="hover:bg-[#141414] transition-colors">
                <td className="px-4 py-3 font-mono text-[#FAFAFA] font-medium">
                  {r.code}
                </td>
                <td className="px-4 py-3 font-medium text-[#FAFAFA]">{r.name}</td>
                <td className="px-4 py-3 text-[#8A8A8A]">{r.building}</td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 font-mono text-[#FAFAFA]">
                  {r.capacity} seats
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-48">
                    {r.equipment && r.equipment.length > 0 ? (
                      r.equipment.map((eq) => (
                        <span
                          key={eq}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#111111] border border-[#232323] text-[#FAFAFA]"
                        >
                          {eq}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8A8A8A] font-mono text-[10px]">
                        Basic
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[11px]">
                  {r.shared ? (
                    <span className="text-[#22C55E]">Yes</span>
                  ) : (
                    <span className="text-[#8A8A8A]">No</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.archived ? (
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
                      title="Edit Room"
                      onClick={() => openEditRoom(r)}
                    >
                      <Edit className="w-3.5 h-3.5 text-[#FAFAFA]" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 cursor-pointer"
                      title={r.archived ? 'Unarchive' : 'Archive'}
                      onClick={() =>
                        archiveResource({
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
                      className="h-7 w-7 p-0 hover:border-[#EF4444] cursor-pointer"
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
            ))
          )}
        </tbody>
      </table>
    </SurfaceCard>
  );
}
