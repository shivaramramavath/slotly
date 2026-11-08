// Zustand store managing application state for institution.store.
import { create } from 'zustand';

interface InstitutionUIState {
  activeTab: string;
  selectedDepartmentId: string | null;
  selectedProgramId: string | null;
  selectedAcademicYearId: string | null;
  selectedSemesterId: string | null;

  setActiveTab: (tab: string) => void;
  setSelectedDepartmentId: (id: string | null) => void;
  setSelectedProgramId: (id: string | null) => void;
  setSelectedAcademicYearId: (id: string | null) => void;
  setSelectedSemesterId: (id: string | null) => void;
  resetSelection: () => void;
}

/** Zustand store managing institution UI selection and tab state. */
export const useInstitutionStore = create<InstitutionUIState>((set) => ({
  activeTab: 'overview',
  selectedDepartmentId: null,
  selectedProgramId: null,
  selectedAcademicYearId: null,
  selectedSemesterId: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedDepartmentId: (id) => set({ selectedDepartmentId: id }),
  setSelectedProgramId: (id) => set({ selectedProgramId: id }),
  setSelectedAcademicYearId: (id) => set({ selectedAcademicYearId: id }),
  setSelectedSemesterId: (id) => set({ selectedSemesterId: id }),
  resetSelection: () =>
    set({
      selectedDepartmentId: null,
      selectedProgramId: null,
      selectedAcademicYearId: null,
      selectedSemesterId: null,
    }),
}));
