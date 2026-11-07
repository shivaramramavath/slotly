// Loading boundary for subjects catalog route.
import { LibraryTableSkeleton } from '@/features/library/components/library-table-skeleton';

/**
 * Skeleton loader matching subject catalog table columns.
 */
export default function SubjectsLoading() {
  return <LibraryTableSkeleton entity="subjects" rows={8} />;
}
