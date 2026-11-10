// Departments view displaying academic department cards and child program creation.
'use client';

import { useInstitutionContext, InstitutionEmptyState } from '@/features/institution';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Trash2 } from 'lucide-react';

/** React page component rendering departments list and management cards. */
export default function DepartmentsPage() {
  const { structure, openAddDepartment, openAddProgram, deleteDepartment } = useInstitutionContext();
  const departments = structure?.departments || [];

  if (departments.length === 0) {
    return (
      <InstitutionEmptyState
        icon={Building2}
        title="No departments yet"
        description="Academic departments organize degree curricula, faculty resources, and room allocations."
        actionLabel="Create first department"
        onAction={openAddDepartment}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {departments.map((dept) => (
        <div
          key={dept.id}
          className="rounded-[16px] border border-[#232323] bg-[#111111] p-5 flex flex-col justify-between min-h-[160px] transition-colors hover:border-[#333333]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-[#FAFAFA]" />
                <h3 className="text-base font-semibold text-[#FAFAFA]">{dept.name}</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#FAFAFA]">
                {dept.code}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8A8A8A]">
              Contains {dept.programs.length} degree program{dept.programs.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#232323]/40 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddProgram(dept.id)}
              className="text-xs h-8 px-3 rounded-[8px] border-[#232323] hover:bg-[#161616]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Program
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteDepartment(dept.id, dept.name)}
              className="text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 h-8 w-8 p-0 rounded-[8px]"
              aria-label={`Delete department ${dept.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
