import { create } from 'zustand';
import type { InstitutionStructureDto } from '@slotly/contracts';

interface InstitutionState {
  structure: InstitutionStructureDto | null;
  loading: boolean;
  activeTab: string;
  selectedDepartmentId: string | null;
  selectedProgramId: string | null;
  selectedAcademicYearId: string | null;
  selectedSemesterId: string | null;

  setStructure: (structure: InstitutionStructureDto | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSelectedDepartmentId: (id: string | null) => void;
  setSelectedProgramId: (id: string | null) => void;
  setSelectedAcademicYearId: (id: string | null) => void;
  setSelectedSemesterId: (id: string | null) => void;
}

export const useInstitutionStore = create<InstitutionState>((set) => ({
  structure: null,
  loading: false,
  activeTab: 'overview',
  selectedDepartmentId: null,
  selectedProgramId: null,
  selectedAcademicYearId: null,
  selectedSemesterId: null,

  setStructure: (structure) => set({ structure }),
  setLoading: (loading) => set({ loading }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),
  setSelectedProgramId: (id) => set({ selectedProgramId: id }),
  setSelectedAcademicYearId: (id) => set({ selectedAcademicYearId: id }),
  setSelectedSemesterId: (id) => set({ selectedSemesterId: id }),
}));
