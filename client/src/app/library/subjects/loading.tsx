// Loading component rendering zero layout shift table skeleton for subjects catalog.
import {
  LibraryTableSkeleton,
  SUBJECT_COLUMNS,
} from '@/features/library/components/library-table-skeleton';

/** Loading component for subjects library route. */
export default function SubjectsLibraryLoading() {
  return <LibraryTableSkeleton columns={SUBJECT_COLUMNS} rows={8} />;
}
