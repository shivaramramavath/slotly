// Toolbar component rendering unified search, department selector, and active-only toggle controls.
'use client';

import { Search, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { DepartmentDto } from '@slotly/contracts';
import type { LibraryTabKey } from './library-tabs';

/** Props for LibraryToolbar component. */
export interface LibraryToolbarProps {
  activeTab: LibraryTabKey;
  search: string;
  onSearchChange: (value: string) => void;
  selectedDeptId: string;
  onDeptChange: (value: string) => void;
  showArchived: boolean;
  onArchivedToggle: () => void;
  departments?: DepartmentDto[] | undefined;
  className?: string | undefined;
}

/** React component rendering search and filter controls on plain background without nested boxes. */
export function LibraryToolbar({
  activeTab,
  search,
  onSearchChange,
  selectedDeptId,
  onDeptChange,
  showArchived,
  onArchivedToggle,
  departments = [],
  className = '',
}: LibraryToolbarProps) {
  const showDepartmentFilter = activeTab !== 'rooms';

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search
          className="w-4 h-4 absolute left-3.5 top-3 text-[#8A8A8A]"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search library records"
          placeholder="Search by code, name, designation, building..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 pl-10 text-xs bg-[#111111] border-[#232323] rounded-[12px] text-[#FAFAFA] placeholder:text-[#8A8A8A] focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
        />
      </div>

      {/* Department Filter (Only for Faculty and Subjects) */}
      {showDepartmentFilter && (
        <div className="w-full sm:w-52 shrink-0">
          <Select
            aria-label="Filter by department"
            value={selectedDeptId}
            onChange={(e) => onDeptChange(e.target.value)}
            className="h-10 text-xs bg-[#111111] border-[#232323] rounded-[12px] text-[#FAFAFA] focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Active Only / Showing Archived Toggle */}
      <div className="shrink-0">
        <Button
          type="button"
          variant={showArchived ? 'primary' : 'outline'}
          size="sm"
          onClick={onArchivedToggle}
          className="h-10 px-4 text-xs font-mono rounded-[12px] gap-2 select-none"
        >
          <Archive className="w-3.5 h-3.5 text-current" />
          <span>{showArchived ? 'Showing Archived' : 'Active Only'}</span>
        </Button>
      </div>
    </div>
  );
}
