// Loading component rendering zero layout shift table skeleton for rooms directory.
import {
  LibraryTableSkeleton,
  ROOM_COLUMNS,
} from '@/features/library/components/library-table-skeleton';

/** Loading component for rooms library route. */
export default function RoomsLibraryLoading() {
  return <LibraryTableSkeleton columns={ROOM_COLUMNS} rows={8} />;
}
