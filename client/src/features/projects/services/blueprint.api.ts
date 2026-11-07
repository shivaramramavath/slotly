import { apiClient } from '@/lib/api-client';
import type {
  ApplyOperationsDto,
  ApplyTemplateDto,
  BatchOperationResult,
  BlueprintCommentDto,
  BlueprintGraphDto,
  BlueprintHistoryEntryDto,
  BlueprintImpactDto,
  BlueprintReadinessDto,
  BlueprintRecommendationDto,
  BlueprintSnapshotDto,
  CreateBlueprintCommentDto,
  CreateBlueprintSnapshotDto,
  CreateGraphTemplateDto,
  GraphTemplateDto,
} from '@slotly/contracts';

export const blueprintApi = {
  async getGraph(projectId: string): Promise<BlueprintGraphDto> {
    return apiClient<BlueprintGraphDto>(`/projects/${projectId}/blueprint`);
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
    return apiClient<BatchOperationResult>(
      `/projects/${projectId}/blueprint/operations`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
        headers,
      },
    );
  },

  async getReadiness(projectId: string): Promise<BlueprintReadinessDto> {
    return apiClient<BlueprintReadinessDto>(`/projects/${projectId}/blueprint/readiness`);
  },

  async getImpact(projectId: string, nodeId: string): Promise<BlueprintImpactDto> {
    return apiClient<BlueprintImpactDto>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/impact`,
    );
  },

  async getRecommendations(
    projectId: string,
    nodeId?: string,
  ): Promise<BlueprintRecommendationDto[]> {
    const qs = nodeId ? `?nodeId=${encodeURIComponent(nodeId)}` : '';
    return apiClient<BlueprintRecommendationDto[]>(
      `/projects/${projectId}/blueprint/recommendations${qs}`,
    );
  },

  // History & Snapshots
  async getHistory(projectId: string): Promise<BlueprintHistoryEntryDto[]> {
    return apiClient<BlueprintHistoryEntryDto[]>(`/projects/${projectId}/blueprint/history`);
  },

  async listSnapshots(projectId: string): Promise<BlueprintSnapshotDto[]> {
    return apiClient<BlueprintSnapshotDto[]>(`/projects/${projectId}/blueprint/snapshots`);
  },

  async createSnapshot(
    projectId: string,
    dto: CreateBlueprintSnapshotDto,
  ): Promise<BlueprintSnapshotDto> {
    return apiClient<BlueprintSnapshotDto>(`/projects/${projectId}/blueprint/snapshots`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async restoreSnapshot(projectId: string, snapshotId: string): Promise<BlueprintGraphDto> {
    return apiClient<BlueprintGraphDto>(
      `/projects/${projectId}/blueprint/snapshots/${snapshotId}/restore`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
  },

  async compareSnapshot(projectId: string, snapshotId: string): Promise<{
    snapshot: BlueprintSnapshotDto;
    diff: {
      addedNodes: string[];
      removedNodes: string[];
      modifiedNodes: string[];
    };
  }> {
    return apiClient<{
      snapshot: BlueprintSnapshotDto;
      diff: {
        addedNodes: string[];
        removedNodes: string[];
        modifiedNodes: string[];
      };
    }>(`/projects/${projectId}/blueprint/snapshots/${snapshotId}/compare`);
  },

  // Node Comments
  async getComments(projectId: string, nodeId: string): Promise<BlueprintCommentDto[]> {
    return apiClient<BlueprintCommentDto[]>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/comments`,
    );
  },

  async addComment(
    projectId: string,
    nodeId: string,
    dto: CreateBlueprintCommentDto,
  ): Promise<BlueprintCommentDto> {
    return apiClient<BlueprintCommentDto>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  },

  // Import & Export
  async exportGraph(
    projectId: string,
    format: 'json' | 'svg' | 'png' = 'json',
  ): Promise<Blob | Record<string, unknown>> {
    return apiClient<Record<string, unknown>>(
      `/projects/${projectId}/blueprint/export?format=${format}`,
    );
  },

  async importGraph(
    projectId: string,
    data: Record<string, unknown>,
  ): Promise<BatchOperationResult> {
    return apiClient<BatchOperationResult>(`/projects/${projectId}/blueprint/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Templates & Kits
  async listTemplates(): Promise<GraphTemplateDto[]> {
    return apiClient<GraphTemplateDto[]>('/blueprint-templates');
  },

  async getTemplate(templateId: string): Promise<GraphTemplateDto> {
    return apiClient<GraphTemplateDto>(`/blueprint-templates/${templateId}`);
  },

  async createTemplate(dto: CreateGraphTemplateDto): Promise<GraphTemplateDto> {
    return apiClient<GraphTemplateDto>('/blueprint-templates', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async duplicateTemplate(templateId: string): Promise<GraphTemplateDto> {
    return apiClient<GraphTemplateDto>(`/blueprint-templates/${templateId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async applyTemplate(
    projectId: string,
    templateId: string,
    dto: ApplyTemplateDto,
  ): Promise<BatchOperationResult> {
    return apiClient<BatchOperationResult>(
      `/blueprint-templates/${templateId}/apply?projectId=${encodeURIComponent(projectId)}`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  },
};
