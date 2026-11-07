import { apiClient } from '@/lib/api-client';
import type {
  CreateProjectDto,
  DuplicateProjectDto,
  ProjectDto,
  UpdateProjectDto,
} from '@slotly/contracts';

export const projectsApi = {
  async listProjects(params?: {
    status?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }): Promise<{ items: ProjectDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient<{ items: ProjectDto[]; total: number; page: number; limit: number; totalPages: number }>(
      `/projects${qs ? `?${qs}` : ''}`,
    );
  },

  async getProject(projectId: string): Promise<ProjectDto> {
    return apiClient<ProjectDto>(`/projects/${projectId}`);
  },

  async createProject(dto: CreateProjectDto): Promise<ProjectDto> {
    return apiClient<ProjectDto>('/projects', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateProject(
    projectId: string,
    dto: UpdateProjectDto,
    revision?: number,
  ): Promise<ProjectDto> {
    const headers: Record<string, string> = {};
    if (typeof revision === 'number') {
      headers['If-Match'] = String(revision);
    }
    return apiClient<ProjectDto>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
      headers,
    });
  },

  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  async duplicateProject(projectId: string, dto: DuplicateProjectDto): Promise<ProjectDto> {
    return apiClient<ProjectDto>(`/projects/${projectId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async archiveProject(projectId: string): Promise<ProjectDto> {
    return apiClient<ProjectDto>(`/projects/${projectId}/archive`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
