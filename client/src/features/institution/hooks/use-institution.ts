// Custom React hooks for institution data fetching and cache management via TanStack Query.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { institutionApi } from '../services/institution.api';
import type {
  InstitutionStructureDto,
  DepartmentDto,
  InstitutionDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateProgramDto,
  UpdateProgramDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSemesterDto,
  UpdateSemesterDto,
  CreateSectionDto,
  UpdateSectionDto,
} from '@slotly/contracts';

/** Query key factory for institution domain cache. */
export const institutionKeys = {
  all: ['institution'] as const,
  structure: (id?: string) => [...institutionKeys.all, 'structure', id ?? 'current'] as const,
  departments: (id?: string) => [...institutionKeys.all, 'departments', id ?? 'current'] as const,
  profile: (id?: string) => [...institutionKeys.all, 'profile', id ?? 'current'] as const,
};

/** Hook fetching the complete institution hierarchy structure with caching and revalidation. */
export function useInstitutionStructure(institutionId?: string) {
  return useQuery<InstitutionStructureDto>({
    queryKey: institutionKeys.structure(institutionId),
    queryFn: () => institutionApi.getStructure(institutionId),
    staleTime: 60 * 1000,
  });
}

/** Hook fetching the department list for an institution. */
export function useDepartments(institutionId?: string) {
  return useQuery<DepartmentDto[]>({
    queryKey: institutionKeys.departments(institutionId),
    queryFn: () => institutionApi.listDepartments(institutionId),
    staleTime: 60 * 1000,
  });
}

/** Hook fetching the institution profile. */
export function useInstitution(institutionId?: string) {
  return useQuery<InstitutionDto>({
    queryKey: institutionKeys.profile(institutionId),
    queryFn: () => institutionApi.getInstitution(institutionId),
    staleTime: 60 * 1000,
  });
}

/** Hook providing mutations for modifying institution structure with cache invalidation. */
export function useInstitutionMutations() {
  const queryClient = useQueryClient();

  const invalidateStructure = () => {
    void queryClient.invalidateQueries({ queryKey: institutionKeys.all });
  };

  const createDepartment = useMutation({
    mutationFn: (dto: CreateDepartmentDto) => institutionApi.createDepartment(dto),
    onSuccess: invalidateStructure,
  });

  const updateDepartment = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDepartmentDto }) =>
      institutionApi.updateDepartment(id, dto),
    onSuccess: invalidateStructure,
  });

  const deleteDepartment = useMutation({
    mutationFn: (id: string) => institutionApi.deleteDepartment(id),
    onSuccess: invalidateStructure,
  });

  const createProgram = useMutation({
    mutationFn: (dto: CreateProgramDto) => institutionApi.createProgram(dto),
    onSuccess: invalidateStructure,
  });

  const updateProgram = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProgramDto }) =>
      institutionApi.updateProgram(id, dto),
    onSuccess: invalidateStructure,
  });

  const deleteProgram = useMutation({
    mutationFn: (id: string) => institutionApi.deleteProgram(id),
    onSuccess: invalidateStructure,
  });

  const createAcademicYear = useMutation({
    mutationFn: (dto: CreateAcademicYearDto) => institutionApi.createAcademicYear(dto),
    onSuccess: invalidateStructure,
  });

  const updateAcademicYear = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAcademicYearDto }) =>
      institutionApi.updateAcademicYear(id, dto),
    onSuccess: invalidateStructure,
  });

  const deleteAcademicYear = useMutation({
    mutationFn: (id: string) => institutionApi.deleteAcademicYear(id),
    onSuccess: invalidateStructure,
  });

  const createSemester = useMutation({
    mutationFn: (dto: CreateSemesterDto) => institutionApi.createSemester(dto),
    onSuccess: invalidateStructure,
  });

  const updateSemester = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSemesterDto }) =>
      institutionApi.updateSemester(id, dto),
    onSuccess: invalidateStructure,
  });

  const deleteSemester = useMutation({
    mutationFn: (id: string) => institutionApi.deleteSemester(id),
    onSuccess: invalidateStructure,
  });

  const createSection = useMutation({
    mutationFn: (dto: CreateSectionDto) => institutionApi.createSection(dto),
    onSuccess: invalidateStructure,
  });

  const updateSection = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSectionDto }) =>
      institutionApi.updateSection(id, dto),
    onSuccess: invalidateStructure,
  });

  const deleteSection = useMutation({
    mutationFn: (id: string) => institutionApi.deleteSection(id),
    onSuccess: invalidateStructure,
  });

  return {
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createProgram,
    updateProgram,
    deleteProgram,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    createSemester,
    updateSemester,
    deleteSemester,
    createSection,
    updateSection,
    deleteSection,
    invalidateStructure,
  };
}
