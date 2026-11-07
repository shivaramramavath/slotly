// Domain service orchestrating builds.api business logic.
import { apiClient } from '@/lib/api-client';
import type {
  CreateBuildDto,
  ScheduleVersionDto,
  BlueprintReadinessDto,
} from '@slotly/contracts';

/** Constant representing builds api. */
export const buildsApi = {
  async startBuild(
    projectId: string,
    dto: CreateBuildDto,
  ): Promise<ScheduleVersionDto[]> {
    return apiClient<ScheduleVersionDto[]>(`/projects/${projectId}/builds`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getCurrentBuild(
    projectId: string,
  ): Promise<{ running: boolean; buildInfo?: unknown }> {
    return apiClient<{ running: boolean; buildInfo?: unknown }>(
      `/projects/${projectId}/builds/current`,
    );
  },

  async cancelBuild(projectId: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(
      `/projects/${projectId}/builds/cancel`,
      {
        method: 'POST',
      },
    );
  },

  async getVersions(projectId: string): Promise<ScheduleVersionDto[]> {
    return apiClient<ScheduleVersionDto[]>(`/projects/${projectId}/versions`);
  },

  async getVersion(versionId: string): Promise<ScheduleVersionDto> {
    return apiClient<ScheduleVersionDto>(`/versions/${versionId}`);
  },

  async getReadiness(projectId: string): Promise<BlueprintReadinessDto> {
    return apiClient<BlueprintReadinessDto>(
      `/projects/${projectId}/blueprint/readiness`,
    );
  },
};
