// Loading component rendering zero layout shift table skeleton for faculty directory.
import {
  LibraryTableSkeleton,
  FACULTY_COLUMNS,
} from '@/features/library/components/library-table-skeleton';

/** Loading component for faculty library route. */
export default function FacultyLibraryLoading() {
  return <LibraryTableSkeleton columns={FACULTY_COLUMNS} rows={8} />;
}
