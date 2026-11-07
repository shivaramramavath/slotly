'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { institutionApi } from '@/features/institution/services/institution.api';
import {
  StructureTree,
  DepartmentDialog,
  ProgramDialog,
  AcademicYearDialog,
  SemesterDialog,
  SectionDialog,
  HolidayDialog,
  HolidayCalendar,
  WorkingDaysConfig,
} from '@/features/institution';
import type {
  InstitutionStructureDto,
  DepartmentDto,
  ProgramDto,
  AcademicYearDto,
  SemesterDto,
  SectionDto,
} from '@slotly/contracts';
import { toast } from '@/components/ui/toast';
import {
  Building2,
  GraduationCap,
  Clock,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';

export default function InstitutionsPage() {
  const [structure, setStructure] = useState<InstitutionStructureDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog open states
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(null);

  const [progDialogOpen, setProgDialogOpen] = useState(false);
  const [selectedProg, setSelectedProg] = useState<ProgramDto | null>(null);
  const [targetDeptId, setTargetDeptId] = useState<string | null>(null);

  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYearDto | null>(null);
  const [targetProgId, setTargetProgId] = useState<string | null>(null);

  const [semDialogOpen, setSemDialogOpen] = useState(false);
  const [selectedSem, setSelectedSem] = useState<SemesterDto | null>(null);
  const [targetYearId, setTargetYearId] = useState<string | null>(null);

  const [secDialogOpen, setSecDialogOpen] = useState(false);
  const [selectedSec, setSelectedSec] = useState<SectionDto | null>(null);
  const [targetSemId, setTargetSemId] = useState<string | null>(null);

  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);

  const fetchStructure = useCallback(async () => {
    try {
      const data = await institutionApi.getStructure();
      setStructure(data);
    } catch {
      // error handled
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    institutionApi
      .getStructure()
      .then((data) => {
        if (!ignore) {
          setStructure(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Handlers for Add Child
  const handleOpenAddDepartment = () => {
    setSelectedDept(null);
    setDeptDialogOpen(true);
  };

  const handleOpenAddProgram = (departmentId?: string) => {
    setSelectedProg(null);
    setTargetDeptId(departmentId || null);
    setProgDialogOpen(true);
  };

  const handleOpenAddYear = (programId?: string) => {
    setSelectedYear(null);
    setTargetProgId(programId || null);
    setYearDialogOpen(true);
  };

  const handleOpenAddSemester = (academicYearId?: string) => {
    setSelectedSem(null);
    setTargetYearId(academicYearId || null);
    setSemDialogOpen(true);
  };

  const handleOpenAddSection = (semesterId?: string) => {
    setSelectedSec(null);
    setTargetSemId(semesterId || null);
    setSecDialogOpen(true);
  };

  // Handlers for Delete
  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete department '${name}'?`)) return;
    try {
      await institutionApi.deleteDepartment(id);
      toast.success('Department Deleted', `Removed '${name}'.`);
      void fetchStructure();
    } catch {
      // server dependency check error handled by apiClient
    }
  };

  const handleDeleteProgram = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete program '${name}'?`)) return;
    try {
      await institutionApi.deleteProgram(id);
      toast.success('Program Deleted', `Removed '${name}'.`);
      void fetchStructure();
    } catch {
      // error handled
    }
  };

  const handleDeleteYear = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete academic year '${label}'?`)) return;
    try {
      await institutionApi.deleteAcademicYear(id);
      toast.success('Academic Year Deleted', `Removed '${label}'.`);
      void fetchStructure();
    } catch {
      // error handled
    }
  };

  const handleDeleteSemester = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete semester '${name}'?`)) return;
    try {
      await institutionApi.deleteSemester(id);
      toast.success('Semester Deleted', `Removed '${name}'.`);
      void fetchStructure();
    } catch {
      // error handled
    }
  };

  const handleDeleteSection = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete section '${name}'?`)) return;
    try {
      await institutionApi.deleteSection(id);
      toast.success('Section Deleted', `Removed '${name}'.`);
      void fetchStructure();
    } catch {
      // error handled
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove event '${name}'?`)) return;
    try {
      await institutionApi.deleteHoliday(id);
      toast.success('Event Removed', `Removed '${name}'.`);
      void fetchStructure();
    } catch {
      // error handled
    }
  };

  // Extract flat lists for select dropdowns
  const departments = structure?.departments || [];
  const programs = departments.flatMap((d) => d.programs);
  const academicYears = programs.flatMap((p) => p.academicYears);
  const semesters = academicYears.flatMap((ay) => ay.semesters);
  const sections = semesters.flatMap((sem) => sem.sections);

  return (
    <AppLayout activePath="/institutions">
      <div className="space-y-6 max-w-7xl pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA]">
                {structure?.institution.name || 'Institution Architecture'}
              </h1>
              {structure?.institution.code && (
                <Badge variant="yellow">{structure.institution.code}</Badge>
              )}
            </div>
            <p className="text-xs font-mono text-[#8A8A8A] mt-1">
              Hierarchical academic management, working calendar, period timing, and structural dependencies.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void fetchStructure()}>
              Refresh Tree
            </Button>
          </div>
        </div>

        {/* Quick Statistics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardDescription className="text-[10px] uppercase font-mono">Departments</CardDescription>
              <CardTitle className="text-lg font-mono font-bold text-[#FAFAFA]">
                {structure?.stats.totalDepartments || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardDescription className="text-[10px] uppercase font-mono">Programs</CardDescription>
              <CardTitle className="text-lg font-mono font-bold text-[#FAFAFA]">
                {structure?.stats.totalPrograms || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardDescription className="text-[10px] uppercase font-mono">Cohorts / Years</CardDescription>
              <CardTitle className="text-lg font-mono font-bold text-[#FAFAFA]">
                {structure?.stats.totalAcademicYears || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardDescription className="text-[10px] uppercase font-mono">Semesters</CardDescription>
              <CardTitle className="text-lg font-mono font-bold text-[#FAFAFA]">
                {structure?.stats.totalSemesters || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardDescription className="text-[10px] uppercase font-mono">Sections</CardDescription>
              <CardTitle className="text-lg font-mono font-bold text-[#FAFAFA]">
                {structure?.stats.totalSections || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardDescription className="text-[10px] uppercase font-mono">Total Students</CardDescription>
              <CardTitle className="text-lg font-mono font-bold text-[#FACC15]">
                {structure?.stats.totalStudents || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Tabbed Navigation */}
        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap gap-1 bg-[#111111] p-1 border border-[#232323] rounded-lg">
            <TabsTrigger value="overview">Overview Tree</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="academic-years">Academic Years</TabsTrigger>
            <TabsTrigger value="semesters">Semesters</TabsTrigger>
            <TabsTrigger value="sections">Sections &amp; Batches</TabsTrigger>
            <TabsTrigger value="calendar">Calendar &amp; Holidays</TabsTrigger>
            <TabsTrigger value="working-days">Working Days &amp; Timing</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW TREE */}
          <TabsContent value="overview" className="mt-6">
            {loading ? (
              <p className="text-xs font-mono text-[#8A8A8A]">Loading academic hierarchy...</p>
            ) : (
              <StructureTree
                departments={departments}
                onAddDepartment={handleOpenAddDepartment}
                onAddProgram={handleOpenAddProgram}
                onAddYear={handleOpenAddYear}
                onAddSemester={handleOpenAddSemester}
                onAddSection={handleOpenAddSection}
                onDeleteDepartment={handleDeleteDepartment}
                onDeleteProgram={handleDeleteProgram}
                onDeleteYear={handleDeleteYear}
                onDeleteSemester={handleDeleteSemester}
                onDeleteSection={handleDeleteSection}
              />
            )}
          </TabsContent>

          {/* TAB 2: DEPARTMENTS */}
          <TabsContent value="departments" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#FAFAFA]">Academic Departments</h2>
                <p className="text-xs font-mono text-[#8A8A8A]">
                  Primary organizational units responsible for programs, faculty, and room allocations.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={handleOpenAddDepartment}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Department
              </Button>
            </div>

            {departments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-xs font-mono text-[#8A8A8A]">
                  No departments created yet. Click &quot;Add Department&quot; above to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((d) => (
                  <Card key={d.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#FACC15]" />
                          <CardTitle className="text-sm font-semibold">{d.name}</CardTitle>
                        </div>
                        <Badge variant="yellow">{d.code}</Badge>
                      </div>
                      <CardDescription className="text-xs font-mono">
                        Contains {d.programs.length} program(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddProgram(d.id)}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Program
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDepartment(d.id, d.name)}
                        className="text-[#EF4444] hover:bg-[#EF4444]/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: PROGRAMS */}
          <TabsContent value="programs" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#FAFAFA]">Degree Programs</h2>
                <p className="text-xs font-mono text-[#8A8A8A]">
                  Curricula tracks (e.g., B.Tech, M.S.) offered within a department.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddProgram()}
                disabled={departments.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Program
              </Button>
            </div>

            {departments.length === 0 ? (
              <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
                ⚠ Action Disabled: You must create at least one Department before creating degree programs.
              </div>
            ) : programs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-xs font-mono text-[#8A8A8A]">
                  No programs created yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {programs.map((p) => (
                  <Card key={p.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-[#3B82F6]" />
                          <CardTitle className="text-sm font-semibold">{p.name}</CardTitle>
                        </div>
                        <Badge variant="neutral">{p.code}</Badge>
                      </div>
                      <CardDescription className="text-xs font-mono">
                        Duration: {p.durationYears} Years • {p.academicYears.length} cohort(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddYear(p.id)}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Year
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProgram(p.id, p.name)}
                        className="text-[#EF4444] hover:bg-[#EF4444]/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 4: ACADEMIC YEARS */}
          <TabsContent value="academic-years" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#FAFAFA]">Academic Years / Cohorts</h2>
                <p className="text-xs font-mono text-[#8A8A8A]">
                  Year numbers (e.g. Year 1, Year 2) established under a program.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddYear()}
                disabled={programs.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Academic Year
              </Button>
            </div>

            {programs.length === 0 ? (
              <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
                ⚠ Action Disabled: You must create at least one Program before adding academic years.
              </div>
            ) : academicYears.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-xs font-mono text-[#8A8A8A]">
                  No academic years created yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {academicYears.map((ay) => (
                  <Card key={ay.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">{ay.label}</CardTitle>
                        <Badge variant="neutral">Year {ay.yearNumber}</Badge>
                      </div>
                      <CardDescription className="text-xs font-mono">
                        Contains {ay.semesters.length} semester(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddSemester(ay.id)}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Semester
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteYear(ay.id, ay.label)}
                        className="text-[#EF4444] hover:bg-[#EF4444]/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 5: SEMESTERS */}
          <TabsContent value="semesters" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#FAFAFA]">Instructional Semesters</h2>
                <p className="text-xs font-mono text-[#8A8A8A]">
                  Active scheduling terms with specific start and end calendar boundaries.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddSemester()}
                disabled={academicYears.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Semester
              </Button>
            </div>

            {academicYears.length === 0 ? (
              <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
                ⚠ Action Disabled: You must create at least one Academic Year cohort first.
              </div>
            ) : semesters.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-xs font-mono text-[#8A8A8A]">
                  No semesters created yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {semesters.map((sem) => (
                  <Card key={sem.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#22C55E]" />
                          <CardTitle className="text-sm font-semibold">{sem.name}</CardTitle>
                        </div>
                        {sem.active ? (
                          <Badge variant="green">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs font-mono">
                        #{sem.number} • {sem.startDate} to {sem.endDate} • {sem.sections.length} section(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddSection(sem.id)}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Section
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSemester(sem.id, sem.name)}
                        className="text-[#EF4444] hover:bg-[#EF4444]/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 6: SECTIONS & BATCHES */}
          <TabsContent value="sections" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#FAFAFA]">Sections &amp; Batches</h2>
                <p className="text-xs font-mono text-[#8A8A8A]">
                  Student groups scheduled for core lecture periods and divided for lab/tutorial batches.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddSection()}
                disabled={semesters.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Section
              </Button>
            </div>

            {semesters.length === 0 ? (
              <div className="p-3 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#EF4444]">
                ⚠ Action Disabled: You must create at least one Semester before creating student sections.
              </div>
            ) : sections.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-xs font-mono text-[#8A8A8A]">
                  No sections created yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sections.map((sec) => (
                  <Card key={sec.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#FACC15]" />
                          <CardTitle className="text-sm font-semibold">{sec.name}</CardTitle>
                        </div>
                        <Badge variant="neutral">{sec.strength} Students</Badge>
                      </div>
                      <CardDescription className="text-xs font-mono">
                        {sec.batches.length} sub-batch(es) defined
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {sec.batches.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {sec.batches.map((b, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#FAFAFA]"
                            >
                              {b.name}: {b.size} students
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSection(sec.id, sec.name)}
                          className="text-[#EF4444] hover:bg-[#EF4444]/10 h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 7: CALENDAR & HOLIDAYS */}
          <TabsContent value="calendar" className="mt-6">
            <HolidayCalendar
              holidays={structure?.holidays || []}
              onAddHoliday={() => setHolidayDialogOpen(true)}
              onDeleteHoliday={handleDeleteHoliday}
            />
          </TabsContent>

          {/* TAB 8: WORKING DAYS & PERIOD TIMING */}
          <TabsContent value="working-days" className="mt-6">
            {structure?.institution && (
              <WorkingDaysConfig
                institution={structure.institution}
                onSuccess={() => void fetchStructure()}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL DIALOGS */}
      <DepartmentDialog
        open={deptDialogOpen}
        onOpenChange={setDeptDialogOpen}
        department={selectedDept}
        onSuccess={() => void fetchStructure()}
      />

      <ProgramDialog
        open={progDialogOpen}
        onOpenChange={setProgDialogOpen}
        program={selectedProg}
        departments={departments}
        defaultDepartmentId={targetDeptId}
        onSuccess={() => void fetchStructure()}
      />

      <AcademicYearDialog
        open={yearDialogOpen}
        onOpenChange={setYearDialogOpen}
        academicYear={selectedYear}
        programs={programs}
        defaultProgramId={targetProgId}
        onSuccess={() => void fetchStructure()}
      />

      <SemesterDialog
        open={semDialogOpen}
        onOpenChange={setSemDialogOpen}
        semester={selectedSem}
        academicYears={academicYears}
        defaultAcademicYearId={targetYearId}
        onSuccess={() => void fetchStructure()}
      />

      <SectionDialog
        open={secDialogOpen}
        onOpenChange={setSecDialogOpen}
        section={selectedSec}
        semesters={semesters}
        defaultSemesterId={targetSemId}
        onSuccess={() => void fetchStructure()}
      />

      <HolidayDialog
        open={holidayDialogOpen}
        onOpenChange={setHolidayDialogOpen}
        onSuccess={() => void fetchStructure()}
      />
    </AppLayout>
  );
}
