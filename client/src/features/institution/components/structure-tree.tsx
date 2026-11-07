'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  DepartmentNode,
  ProgramNode,
  AcademicYearNode,
  SemesterNode,
  SectionNode,
} from '@slotly/contracts';
import {
  ChevronRight,
  ChevronDown,
  Building,
  GraduationCap,
  CalendarDays,
  Clock,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';

interface StructureTreeProps {
  departments: DepartmentNode[];
  onAddDepartment: () => void;
  onAddProgram: (departmentId: string) => void;
  onAddYear: (programId: string) => void;
  onAddSemester: (academicYearId: string) => void;
  onAddSection: (semesterId: string) => void;
  onDeleteDepartment: (id: string, name: string) => void;
  onDeleteProgram: (id: string, name: string) => void;
  onDeleteYear: (id: string, label: string) => void;
  onDeleteSemester: (id: string, name: string) => void;
  onDeleteSection: (id: string, name: string) => void;
}

export function StructureTree({
  departments,
  onAddDepartment,
  onAddProgram,
  onAddYear,
  onAddSemester,
  onAddSection,
  onDeleteDepartment,
  onDeleteProgram,
  onDeleteYear,
  onDeleteSemester,
  onDeleteSection,
}: StructureTreeProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#FAFAFA]">Hierarchy Tree</h2>
          <p className="text-xs font-mono text-[#8A8A8A]">
            Department → Program → Academic Year → Semester → Section &amp; Batches
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onAddDepartment}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Building className="h-10 w-10 text-[#8A8A8A] mx-auto" />
            <h3 className="text-sm font-semibold text-[#FAFAFA]">No Departments Configured</h3>
            <p className="text-xs font-mono text-[#8A8A8A] max-w-sm mx-auto">
              Start building your institution hierarchy by creating the first academic department.
            </p>
            <Button variant="primary" size="sm" onClick={onAddDepartment}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Create First Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {departments.map((dept) => (
            <DepartmentItem
              key={dept.id}
              dept={dept}
              isCollapsed={collapsed[dept.id] ?? false}
              onToggle={() => toggle(dept.id)}
              collapsedMap={collapsed}
              onToggleChild={toggle}
              onAddProgram={onAddProgram}
              onAddYear={onAddYear}
              onAddSemester={onAddSemester}
              onAddSection={onAddSection}
              onDeleteDepartment={onDeleteDepartment}
              onDeleteProgram={onDeleteProgram}
              onDeleteYear={onDeleteYear}
              onDeleteSemester={onDeleteSemester}
              onDeleteSection={onDeleteSection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Department Item
// ----------------------------------------------------
function DepartmentItem({
  dept,
  isCollapsed,
  onToggle,
  collapsedMap,
  onToggleChild,
  onAddProgram,
  onAddYear,
  onAddSemester,
  onAddSection,
  onDeleteDepartment,
  onDeleteProgram,
  onDeleteYear,
  onDeleteSemester,
  onDeleteSection,
}: {
  dept: DepartmentNode;
  isCollapsed: boolean;
  onToggle: () => void;
  collapsedMap: Record<string, boolean>;
  onToggleChild: (id: string) => void;
  onAddProgram: (departmentId: string) => void;
  onAddYear: (programId: string) => void;
  onAddSemester: (academicYearId: string) => void;
  onAddSection: (semesterId: string) => void;
  onDeleteDepartment: (id: string, name: string) => void;
  onDeleteProgram: (id: string, name: string) => void;
  onDeleteYear: (id: string, label: string) => void;
  onDeleteSemester: (id: string, name: string) => void;
  onDeleteSection: (id: string, name: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#232323] bg-[#111111] overflow-hidden">
      <div className="p-3.5 flex items-center justify-between bg-[#161616]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded text-[#8A8A8A] hover:text-[#FAFAFA] cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <Building className="h-4 w-4 text-[#FACC15]" />
          <span className="text-sm font-semibold text-[#FAFAFA]">{dept.name}</span>
          <Badge variant="yellow">{dept.code}</Badge>
          <span className="text-xs font-mono text-[#8A8A8A]">
            ({dept.programs.length} program{dept.programs.length === 1 ? '' : 's'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddProgram(dept.id)}
            className="text-xs py-1 h-7"
          >
            <Plus className="h-3 w-3 mr-1" />
            Program
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteDepartment(dept.id, dept.name)}
            className="text-[#EF4444] hover:bg-[#EF4444]/10 h-7 w-7 p-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3 pl-8 space-y-2 border-t border-[#232323]">
          {dept.programs.length === 0 ? (
            <p className="text-xs font-mono text-[#8A8A8A] italic py-1">
              No programs yet. Click &quot;+ Program&quot; above to create one.
            </p>
          ) : (
            dept.programs.map((prog) => (
              <ProgramItem
                key={prog.id}
                prog={prog}
                isCollapsed={collapsedMap[prog.id] ?? false}
                onToggle={() => onToggleChild(prog.id)}
                collapsedMap={collapsedMap}
                onToggleChild={onToggleChild}
                onAddYear={onAddYear}
                onAddSemester={onAddSemester}
                onAddSection={onAddSection}
                onDeleteProgram={onDeleteProgram}
                onDeleteYear={onDeleteYear}
                onDeleteSemester={onDeleteSemester}
                onDeleteSection={onDeleteSection}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Program Item
// ----------------------------------------------------
function ProgramItem({
  prog,
  isCollapsed,
  onToggle,
  collapsedMap,
  onToggleChild,
  onAddYear,
  onAddSemester,
  onAddSection,
  onDeleteProgram,
  onDeleteYear,
  onDeleteSemester,
  onDeleteSection,
}: {
  prog: ProgramNode;
  isCollapsed: boolean;
  onToggle: () => void;
  collapsedMap: Record<string, boolean>;
  onToggleChild: (id: string) => void;
  onAddYear: (programId: string) => void;
  onAddSemester: (academicYearId: string) => void;
  onAddSection: (semesterId: string) => void;
  onDeleteProgram: (id: string, name: string) => void;
  onDeleteYear: (id: string, label: string) => void;
  onDeleteSemester: (id: string, name: string) => void;
  onDeleteSection: (id: string, name: string) => void;
}) {
  return (
    <div className="rounded border border-[#232323] bg-[#0E0E0E]">
      <div className="p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-0.5 rounded text-[#8A8A8A] hover:text-[#FAFAFA] cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <GraduationCap className="h-3.5 w-3.5 text-[#3B82F6]" />
          <span className="text-xs font-medium text-[#FAFAFA]">{prog.name}</span>
          <Badge variant="neutral">{prog.code}</Badge>
          <span className="text-[11px] font-mono text-[#8A8A8A]">
            {prog.durationYears} yrs • ({prog.academicYears.length} year{prog.academicYears.length === 1 ? '' : 's'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddYear(prog.id)}
            className="text-[11px] py-0.5 h-6 px-2"
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" />
            Year
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteProgram(prog.id, prog.name)}
            className="text-[#EF4444] hover:bg-[#EF4444]/10 h-6 w-6 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2.5 pl-6 space-y-2 border-t border-[#232323]">
          {prog.academicYears.length === 0 ? (
            <p className="text-[11px] font-mono text-[#8A8A8A] italic">
              No academic years configured.
            </p>
          ) : (
            prog.academicYears.map((ay) => (
              <AcademicYearItem
                key={ay.id}
                ay={ay}
                isCollapsed={collapsedMap[ay.id] ?? false}
                onToggle={() => onToggleChild(ay.id)}
                collapsedMap={collapsedMap}
                onToggleChild={onToggleChild}
                onAddSemester={onAddSemester}
                onAddSection={onAddSection}
                onDeleteYear={onDeleteYear}
                onDeleteSemester={onDeleteSemester}
                onDeleteSection={onDeleteSection}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Academic Year Item
// ----------------------------------------------------
function AcademicYearItem({
  ay,
  isCollapsed,
  onToggle,
  collapsedMap,
  onToggleChild,
  onAddSemester,
  onAddSection,
  onDeleteYear,
  onDeleteSemester,
  onDeleteSection,
}: {
  ay: AcademicYearNode;
  isCollapsed: boolean;
  onToggle: () => void;
  collapsedMap: Record<string, boolean>;
  onToggleChild: (id: string) => void;
  onAddSemester: (academicYearId: string) => void;
  onAddSection: (semesterId: string) => void;
  onDeleteYear: (id: string, label: string) => void;
  onDeleteSemester: (id: string, name: string) => void;
  onDeleteSection: (id: string, name: string) => void;
}) {
  return (
    <div className="rounded border border-[#1E1E1E] bg-[#0A0A0A]">
      <div className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-0.5 rounded text-[#8A8A8A] hover:text-[#FAFAFA] cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <CalendarDays className="h-3.5 w-3.5 text-[#8A8A8A]" />
          <span className="text-xs font-mono font-medium text-[#FAFAFA]">{ay.label}</span>
          <span className="text-[11px] font-mono text-[#8A8A8A]">
            (Year {ay.yearNumber} • {ay.semesters.length} sem{ay.semesters.length === 1 ? '' : 's'})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSemester(ay.id)}
            className="text-[10px] py-0.5 h-5 px-1.5"
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" />
            Semester
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteYear(ay.id, ay.label)}
            className="text-[#EF4444] hover:bg-[#EF4444]/10 h-5 w-5 p-0"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2 pl-5 space-y-1.5 border-t border-[#1E1E1E]">
          {ay.semesters.length === 0 ? (
            <p className="text-[11px] font-mono text-[#8A8A8A] italic">
              No semesters configured.
            </p>
          ) : (
            ay.semesters.map((sem) => (
              <SemesterItem
                key={sem.id}
                sem={sem}
                isCollapsed={collapsedMap[sem.id] ?? false}
                onToggle={() => onToggleChild(sem.id)}
                onAddSection={onAddSection}
                onDeleteSemester={onDeleteSemester}
                onDeleteSection={onDeleteSection}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Semester Item
// ----------------------------------------------------
function SemesterItem({
  sem,
  isCollapsed,
  onToggle,
  onAddSection,
  onDeleteSemester,
  onDeleteSection,
}: {
  sem: SemesterNode;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddSection: (semesterId: string) => void;
  onDeleteSemester: (id: string, name: string) => void;
  onDeleteSection: (id: string, name: string) => void;
}) {
  return (
    <div className="rounded border border-[#232323] bg-[#111111]">
      <div className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-0.5 rounded text-[#8A8A8A] hover:text-[#FAFAFA] cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <Clock className="h-3.5 w-3.5 text-[#22C55E]" />
          <span className="text-xs font-medium text-[#FAFAFA]">{sem.name}</span>
          <span className="text-[11px] font-mono text-[#8A8A8A]">
            #{sem.number} • {sem.startDate} to {sem.endDate}
          </span>
          {sem.active ? (
            <Badge variant="green">Active</Badge>
          ) : (
            <Badge variant="neutral">Inactive</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSection(sem.id)}
            className="text-[10px] py-0.5 h-5 px-1.5"
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" />
            Section
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteSemester(sem.id, sem.name)}
            className="text-[#EF4444] hover:bg-[#EF4444]/10 h-5 w-5 p-0"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2 pl-6 space-y-1.5 border-t border-[#232323]">
          {sem.sections.length === 0 ? (
            <p className="text-[11px] font-mono text-[#8A8A8A] italic">
              No sections created.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sem.sections.map((sec) => (
                <SectionItem
                  key={sec.id}
                  sec={sec}
                  onDeleteSection={onDeleteSection}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Section Item
// ----------------------------------------------------
function SectionItem({
  sec,
  onDeleteSection,
}: {
  sec: SectionNode;
  onDeleteSection: (id: string, name: string) => void;
}) {
  return (
    <div className="p-2 rounded border border-[#232323] bg-[#0A0A0A] flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-[#FACC15]" />
          <span className="text-xs font-semibold text-[#FAFAFA]">{sec.name}</span>
          <Badge variant="neutral">{sec.strength} students</Badge>
        </div>
        {sec.batches.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {sec.batches.map((b, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#8A8A8A]"
              >
                {b.name} ({b.size})
              </span>
            ))}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteSection(sec.id, sec.name)}
        className="text-[#EF4444] hover:bg-[#EF4444]/10 h-6 w-6 p-0"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
