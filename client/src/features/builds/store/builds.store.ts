// Zustand store managing application state for builds.store.
import { create } from 'zustand';
import type {
  BuildProgressPayload,
  BlueprintReadinessDto,
  BlueprintMissingItem,
  CreateBuildDto,
  ScheduleVersionDto,
} from '@slotly/contracts';

/** Interface defining structure for build log entry. */
export interface BuildLogEntry {
  id: string;
  timestamp: string;
  step: string;
  message: string;
}

/** Interface defining structure for builds state. */
export interface BuildsState {
  projectId: string | null;
  status: 'idle' | 'building' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  currentMessage: string;
  logs: BuildLogEntry[];
  versions: ScheduleVersionDto[];
  selectedVersion: ScheduleVersionDto | null;
  readiness: BlueprintReadinessDto | null;
  isBlocked: boolean;
  missingItems: BlueprintMissingItem[];
  error: string | null;
  comparePair: [ScheduleVersionDto | null, ScheduleVersionDto | null];
  isCompareOpen: boolean;
  config: CreateBuildDto;

  // Actions
  setProjectId: (projectId: string) => void;
  setConfig: (config: Partial<CreateBuildDto>) => void;
  setReadiness: (readiness: BlueprintReadinessDto) => void;
  handleProgress: (payload: BuildProgressPayload) => void;
  handleCompleted: (payload: BuildProgressPayload) => void;
  handleFailed: (payload: BuildProgressPayload) => void;
  setVersions: (versions: ScheduleVersionDto[]) => void;
  selectVersion: (version: ScheduleVersionDto | null) => void;
  toggleCompareVersion: (version: ScheduleVersionDto) => void;
  setCompareOpen: (open: boolean) => void;
  resetLogs: () => void;
}

/** Zustand store managing use builds store state. */
export const useBuildsStore = create<BuildsState>((set, get) => ({
  projectId: null,
  status: 'idle',
  progress: 0,
  currentStep: '',
  currentMessage: '',
  logs: [],
  versions: [],
  selectedVersion: null,
  readiness: null,
  isBlocked: false,
  missingItems: [],
  error: null,
  comparePair: [null, null],
  isCompareOpen: false,
  config: {
    alternatives: 3,
    profile: 'standard',
    mode: 'fresh',
    seed: 1001,
    timeLimitMs: 10000,
  },

  setProjectId: (projectId) => set({ projectId }),

  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),

  setReadiness: (readiness) =>
    set({
      readiness,
      isBlocked: !readiness.isReadyForBuild,
      missingItems: readiness.missingItems || [],
    }),

  handleProgress: (payload) =>
    set((state) => ({
      status: 'building',
      progress: payload.progress,
      currentStep: payload.step,
      currentMessage: payload.message,
      logs: [
        ...state.logs,
        {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          step: payload.step,
          message: payload.message,
        },
      ],
    })),

  handleCompleted: (payload) =>
    set((state) => {
      const versions = payload.versions || [];
      return {
        status: 'completed',
        progress: 100,
        currentStep: 'COMPLETED',
        currentMessage: payload.message || 'Build completed successfully.',
        versions: versions.length > 0 ? versions : state.versions,
        selectedVersion: versions[0] || state.selectedVersion,
        logs: [
          ...state.logs,
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            step: 'COMPLETED',
            message: payload.message || 'Build completed.',
          },
        ],
      };
    }),

  handleFailed: (payload) =>
    set((state) => ({
      status: 'failed',
      progress: 0,
      currentStep: 'FAILED',
      currentMessage: payload.message || 'Build failed.',
      error: payload.error || payload.message,
      logs: [
        ...state.logs,
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          step: 'FAILED',
          message: payload.message || 'Build failed.',
        },
      ],
    })),

  setVersions: (versions) =>
    set({
      versions,
      selectedVersion: versions[0] || null,
    }),

  selectVersion: (version) => set({ selectedVersion: version }),

  toggleCompareVersion: (version) => {
    const [first, second] = get().comparePair;
    if (first?.id === version.id) {
      set({ comparePair: [second, null] });
    } else if (second?.id === version.id) {
      set({ comparePair: [first, null] });
    } else if (!first) {
      set({ comparePair: [version, null] });
    } else if (!second) {
      set({ comparePair: [first, version], isCompareOpen: true });
    } else {
      // Replace second
      set({ comparePair: [first, version], isCompareOpen: true });
    }
  },

  setCompareOpen: (isCompareOpen) => set({ isCompareOpen }),

  resetLogs: () =>
    set({
      logs: [],
      progress: 0,
      currentStep: '',
      currentMessage: '',
      error: null,
      status: 'idle',
    }),
}));
