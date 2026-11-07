// Skeleton table loader matching entity column layouts to avoid layout shifts.
import { Skeleton } from '@/components/ui/skeleton';
import type { LibraryEntityKey } from '@/features/library/config/library-entities';

/** Props for the LibraryTableSkeleton component. */
export interface LibraryTableSkeletonProps {
  entity: LibraryEntityKey;
  rows?: number;
}

interface ColumnDef {
  label: string;
  widthClass: string;
  align?: 'left' | 'right';
}

const ENTITY_COLUMNS: Record<LibraryEntityKey, ColumnDef[]> = {
  faculty: [
    { label: 'Code', widthClass: 'w-24' },
    { label: 'Name', widthClass: 'w-56' },
    { label: 'Department', widthClass: 'w-32' },
    { label: 'Designation', widthClass: 'w-36' },
    { label: 'Teaching Workload', widthClass: 'w-56' },
    { label: 'Qualified Subjects', widthClass: 'w-36' },
    { label: 'Status', widthClass: 'w-24' },
    { label: 'Actions', widthClass: 'w-24', align: 'right' },
  ],
  subjects: [
    { label: 'Code', widthClass: 'w-24' },
    { label: 'Name', widthClass: 'w-56' },
    { label: 'Department', widthClass: 'w-32' },
    { label: 'Type', widthClass: 'w-24' },
    { label: 'Credits', widthClass: 'w-20' },
    { label: 'Weekly / Lab Hrs', widthClass: 'w-36' },
    { label: 'Room Requirements', widthClass: 'w-48' },
    { label: 'Elective Group', widthClass: 'w-32' },
    { label: 'Actions', widthClass: 'w-24', align: 'right' },
  ],
  rooms: [
    { label: 'Code', widthClass: 'w-24' },
    { label: 'Name', widthClass: 'w-48' },
    { label: 'Building', widthClass: 'w-36' },
    { label: 'Type', widthClass: 'w-24' },
    { label: 'Capacity', widthClass: 'w-24' },
    { label: 'Equipment', widthClass: 'w-48' },
    { label: 'Shared', widthClass: 'w-20' },
    { label: 'Status', widthClass: 'w-24' },
    { label: 'Actions', widthClass: 'w-24', align: 'right' },
  ],
};

/**
 * Renders a placeholder skeleton table matching column widths of each library entity.
 */
export function LibraryTableSkeleton({ entity, rows = 6 }: LibraryTableSkeletonProps) {
  const columns = ENTITY_COLUMNS[entity] || ENTITY_COLUMNS.faculty;

  return (
    <div
      role="status"
      aria-label={`Loading ${entity} data...`}
      className="border border-[#232323] rounded-md overflow-x-auto bg-[#0A0A0A]"
    >
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-[#111] border-b border-[#232323] text-[#8A8A8A] font-mono">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`p-3 ${col.widthClass} ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232323]">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="h-12">
              {columns.map((col, cIdx) => (
                <td
                  key={cIdx}
                  className={`p-3 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block ${
                      col.align === 'right' ? 'float-right' : ''
                    }`}
                  >
                    <Skeleton className="h-4 w-20" />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
