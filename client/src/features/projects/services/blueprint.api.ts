import { apiClient } from '@/lib/api-client';
import type {
  ApplyOperationsDto,
  ApplyTemplateDto,
  BatchOperationResult,
  BlueprintGraphDto,
  BlueprintImpactDto,
  BlueprintReadinessDto,
  BlueprintRecommendationDto,
  CreateGraphTemplateDto,
  GraphTemplateDto,
} from '@slotly/contracts';

export const blueprintApi = {
  async getGraph(projectId: string): Promise<BlueprintGraphDto> {
    return apiClient.get<BlueprintGraphDto>(`/projects/${projectId}/blueprint`);
  },

  async applyOperations(
    projectId: string,
    dto: ApplyOperationsDto,
    revision?: number,
  ): Promise<BatchOperationResult> {
    const headers: Record<string, string> = {};
    if (typeof revision === 'number') {
      headers['If-Match'] = String(revision);
    }
    return apiClient.post<BatchOperationResult>(
      `/projects/${projectId}/blueprint/operations`,
      dto,
      { headers },
    );
  },

  async getReadiness(projectId: string): Promise<BlueprintReadinessDto> {
    return apiClient.get<BlueprintReadinessDto>(`/projects/${projectId}/blueprint/readiness`);
  },

  async getImpact(projectId: string, nodeId: string): Promise<BlueprintImpactDto> {
    return apiClient.get<BlueprintImpactDto>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/impact`,
    );
  },

  async getRecommendations(
    projectId: string,
    nodeId?: string,
  ): Promise<BlueprintRecommendationDto[]> {
    const qs = nodeId ? `?nodeId=${encodeURIComponent(nodeId)}` : '';
    return apiClient.get<BlueprintRecommendationDto[]>(
      `/projects/${projectId}/blueprint/recommendations${qs}`,
    );
  },

  // Templates & Kits
  async listTemplates(): Promise<GraphTemplateDto[]> {
    return apiClient.get<GraphTemplateDto[]>('/blueprint-templates');
  },

  async getTemplate(templateId: string): Promise<GraphTemplateDto> {
    return apiClient.get<GraphTemplateDto>(`/blueprint-templates/${templateId}`);
  },

  async createTemplate(dto: CreateGraphTemplateDto): Promise<GraphTemplateDto> {
    return apiClient.post<GraphTemplateDto>('/blueprint-templates', dto);
  },

  async duplicateTemplate(templateId: string): Promise<GraphTemplateDto> {
    return apiClient.post<GraphTemplateDto>(`/blueprint-templates/${templateId}/duplicate`, {});
  },

  async applyTemplate(
    projectId: string,
    templateId: string,
    dto: ApplyTemplateDto,
  ): Promise<BatchOperationResult> {
    return apiClient.post<BatchOperationResult>(
      `/blueprint-templates/${templateId}/apply?projectId=${encodeURIComponent(projectId)}`,
      dto,
    );
  },
};
