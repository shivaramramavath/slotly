// Component rendering route-aware header actions enforcing the single yellow accent rule.
'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useInstitutionContext } from './institution-context';

/** React component rendering header action controls dynamically based on active institution tab. */
export function InstitutionHeaderActions() {
  const pathname = usePathname();
  const {
    refetch,
    openAddDepartment,
    openAddProgram,
    openAddAcademicYear,
    openAddSemester,
    openAddSection,
    openAddHoliday,
  } = useInstitutionContext();

  if (pathname === '/institutions/departments') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={openAddDepartment}
        className="h-10 px-4 rounded-[12px] font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Department
      </Button>
    );
  }

  if (pathname === '/institutions/programs') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => openAddProgram()}
        className="h-10 px-4 rounded-[12px] font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Program
      </Button>
    );
  }

  if (pathname === '/institutions/academic-years') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => openAddAcademicYear()}
        className="h-10 px-4 rounded-[12px] font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Academic Year
      </Button>
    );
  }

  if (pathname === '/institutions/semesters') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => openAddSemester()}
        className="h-10 px-4 rounded-[12px] font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Semester
      </Button>
    );
  }

  if (pathname === '/institutions/sections') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => openAddSection()}
        className="h-10 px-4 rounded-[12px] font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Section
      </Button>
    );
  }

  if (pathname === '/institutions/calendar') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={openAddHoliday}
        className="h-10 px-4 rounded-[12px] font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Holiday
      </Button>
    );
  }

  if (pathname === '/institutions' || pathname === '/institutions/') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => void refetch()}
        className="h-10 px-4 rounded-[12px] border-[#232323] text-[#FAFAFA] hover:bg-[#161616]"
      >
        <RefreshCw className="h-4 w-4 mr-1.5" />
        Refresh Tree
      </Button>
    );
  }

  // Working days or other tabs: no primary CTA in header
  return null;
}
