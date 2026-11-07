// Loading boundary for faculty catalog route.
import { LibraryTableSkeleton } from '@/features/library/components/library-table-skeleton';

/**
 * Skeleton loader matching faculty table columns.
 */
export default function FacultyLoading() {
  return <LibraryTableSkeleton entity="faculty" rows={8} />;
}
