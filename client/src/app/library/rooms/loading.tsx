// Loading boundary for rooms and facilities route.
import { LibraryTableSkeleton } from '@/features/library/components/library-table-skeleton';

/**
 * Skeleton loader matching room directory table columns.
 */
export default function RoomsLoading() {
  return <LibraryTableSkeleton entity="rooms" rows={8} />;
}
