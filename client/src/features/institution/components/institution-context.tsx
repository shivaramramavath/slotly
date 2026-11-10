// React context provider managing institution hierarchy data, dialog states, and delete operations.
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { institutionApi } from '../services/institution.api';
import { useInstitutionStructure, institutionKeys } from '../hooks/use-institution';
import { DepartmentDialog } from './department-dialog';
import { ProgramDialog } from './program-dialog';
import { AcademicYearDialog } from './academic-year-dialog';
import { SemesterDialog } from './semester-dialog';
import { SectionDialog } from './section-dialog';
import { HolidayDialog } from './holiday-dialog';
import type {
  InstitutionStructureDto,
  DepartmentDto,
  ProgramDto,
  AcademicYearDto,
  SemesterDto,
  SectionDto,
} from '@slotly/contracts';

/** Interface defining institution context state and actions. */
export interface InstitutionContextValue {
  structure: InstitutionStructureDto | null | undefined;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
  openAddDepartment: () => void;
  openAddProgram: (departmentId?: string) => void;
  openAddAcademicYear: (programId?: string) => void;
  openAddSemester: (academicYearId?: string) => void;
  openAddSection: (semesterId?: string) => void;
  openAddHoliday: () => void;
  deleteDepartment: (id: string, name: string) => Promise<void>;
  deleteProgram: (id: string, name: string) => Promise<void>;
  deleteAcademicYear: (id: string, label: string) => Promise<void>;
  deleteSemester: (id: string, name: string) => Promise<void>;
  deleteSection: (id: string, name: string) => Promise<void>;
  deleteHoliday: (id: string, name: string) => Promise<void>;
}

const InstitutionContext = createContext<InstitutionContextValue | null>(null);

/** Props for InstitutionProvider component. */
export interface InstitutionProviderProps {
  children: ReactNode;
}

/** React provider wrapping institution sub-routes to retain hierarchy state and dialog control. */
export function InstitutionProvider({ children }: InstitutionProviderProps) {
  const queryClient = useQueryClient();
  const { data: structure = null, isLoading, refetch } = useInstitutionStructure();

  // Dialog open & selection states
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [selectedDept] = useState<DepartmentDto | null>(null);

  const [progDialogOpen, setProgDialogOpen] = useState(false);
  const [selectedProg] = useState<ProgramDto | null>(null);
  const [targetDeptId, setTargetDeptId] = useState<string | null>(null);

  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [selectedYear] = useState<AcademicYearDto | null>(null);
  const [targetProgId, setTargetProgId] = useState<string | null>(null);

  const [semDialogOpen, setSemDialogOpen] = useState(false);
  const [selectedSem] = useState<SemesterDto | null>(null);
  const [targetYearId, setTargetYearId] = useState<string | null>(null);

  const [secDialogOpen, setSecDialogOpen] = useState(false);
  const [selectedSec] = useState<SectionDto | null>(null);
  const [targetSemId, setTargetSemId] = useState<string | null>(null);

  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);

  // Open modal handlers
  const openAddDepartment = useCallback(() => {
    setDeptDialogOpen(true);
  }, []);

  const openAddProgram = useCallback((departmentId?: string) => {
    setTargetDeptId(departmentId || null);
    setProgDialogOpen(true);
  }, []);

  const openAddAcademicYear = useCallback((programId?: string) => {
    setTargetProgId(programId || null);
    setYearDialogOpen(true);
  }, []);

  const openAddSemester = useCallback((academicYearId?: string) => {
    setTargetYearId(academicYearId || null);
    setSemDialogOpen(true);
  }, []);

  const openAddSection = useCallback((semesterId?: string) => {
    setTargetSemId(semesterId || null);
    setSecDialogOpen(true);
  }, []);

  const openAddHoliday = useCallback(() => {
    setHolidayDialogOpen(true);
  }, []);

  // Delete handlers
  const deleteDepartment = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Are you sure you want to delete department '${name}'?`)) return;
      try {
        await institutionApi.deleteDepartment(id);
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Department Deleted', `Removed '${name}'.`);
        void refetch();
      } catch {
        // server dependency error is displayed by apiClient
      }
    },
    [queryClient, refetch],
  );

  const deleteProgram = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Are you sure you want to delete program '${name}'?`)) return;
      try {
        await institutionApi.deleteProgram(id);
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Program Deleted', `Removed '${name}'.`);
        void refetch();
      } catch {
        // error handled
      }
    },
    [queryClient, refetch],
  );

  const deleteAcademicYear = useCallback(
    async (id: string, label: string) => {
      if (!confirm(`Are you sure you want to delete academic year '${label}'?`)) return;
      try {
        await institutionApi.deleteAcademicYear(id);
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Academic Year Deleted', `Removed '${label}'.`);
        void refetch();
      } catch {
        // error handled
      }
    },
    [queryClient, refetch],
  );

  const deleteSemester = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Are you sure you want to delete semester '${name}'?`)) return;
      try {
        await institutionApi.deleteSemester(id);
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Semester Deleted', `Removed '${name}'.`);
        void refetch();
      } catch {
        // error handled
      }
    },
    [queryClient, refetch],
  );

  const deleteSection = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Are you sure you want to delete section '${name}'?`)) return;
      try {
        await institutionApi.deleteSection(id);
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Section Deleted', `Removed '${name}'.`);
        void refetch();
      } catch {
        // error handled
      }
    },
    [queryClient, refetch],
  );

  const deleteHoliday = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Are you sure you want to remove holiday '${name}'?`)) return;
      try {
        await institutionApi.deleteHoliday(id);
        await queryClient.invalidateQueries({ queryKey: institutionKeys.all });
        toast.success('Holiday Removed', `Removed '${name}'.`);
        void refetch();
      } catch {
        // error handled
      }
    },
    [queryClient, refetch],
  );

  const departments = useMemo(() => structure?.departments || [], [structure?.departments]);
  const programs = useMemo(() => departments.flatMap((d) => d.programs), [departments]);
  const academicYears = useMemo(() => programs.flatMap((p) => p.academicYears), [programs]);
  const semesters = useMemo(() => academicYears.flatMap((ay) => ay.semesters), [academicYears]);

  const value = useMemo<InstitutionContextValue>(
    () => ({
      structure,
      isLoading,
      refetch,
      openAddDepartment,
      openAddProgram,
      openAddAcademicYear,
      openAddSemester,
      openAddSection,
      openAddHoliday,
      deleteDepartment,
      deleteProgram,
      deleteAcademicYear,
      deleteSemester,
      deleteSection,
      deleteHoliday,
    }),
    [
      structure,
      isLoading,
      refetch,
      openAddDepartment,
      openAddProgram,
      openAddAcademicYear,
      openAddSemester,
      openAddSection,
      openAddHoliday,
      deleteDepartment,
      deleteProgram,
      deleteAcademicYear,
      deleteSemester,
      deleteSection,
      deleteHoliday,
    ],
  );

  return (
    <InstitutionContext.Provider value={value}>
      {children}

      <DepartmentDialog
        open={deptDialogOpen}
        onOpenChange={setDeptDialogOpen}
        department={selectedDept}
        institutionId={structure?.institution.id}
        onSuccess={() => void refetch()}
      />

      <ProgramDialog
        open={progDialogOpen}
        onOpenChange={setProgDialogOpen}
        program={selectedProg}
        departments={departments}
        defaultDepartmentId={targetDeptId}
        institutionId={structure?.institution.id}
        onSuccess={() => void refetch()}
      />

      <AcademicYearDialog
        open={yearDialogOpen}
        onOpenChange={setYearDialogOpen}
        academicYear={selectedYear}
        programs={programs}
        defaultProgramId={targetProgId}
        institutionId={structure?.institution.id}
        onSuccess={() => void refetch()}
      />

      <SemesterDialog
        open={semDialogOpen}
        onOpenChange={setSemDialogOpen}
        semester={selectedSem}
        academicYears={academicYears}
        defaultAcademicYearId={targetYearId}
        institutionId={structure?.institution.id}
        onSuccess={() => void refetch()}
      />

      <SectionDialog
        open={secDialogOpen}
        onOpenChange={setSecDialogOpen}
        section={selectedSec}
        semesters={semesters}
        defaultSemesterId={targetSemId}
        institutionId={structure?.institution.id}
        onSuccess={() => void refetch()}
      />

      <HolidayDialog
        open={holidayDialogOpen}
        onOpenChange={setHolidayDialogOpen}
        institutionId={structure?.institution.id}
        onSuccess={() => void refetch()}
      />
    </InstitutionContext.Provider>
  );
}

/** Hook to access institution hierarchy context data and modal dialog actions. */
export function useInstitutionContext(): InstitutionContextValue {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitutionContext must be used within an InstitutionProvider');
  }
  return context;
}
