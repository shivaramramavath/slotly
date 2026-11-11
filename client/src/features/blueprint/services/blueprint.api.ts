// Domain service orchestrating blueprint.api business logic.
import { apiClient } from '@/lib/api-client';
import type {
  ApplyOperationsDto,
  ApplyTemplateDto,
  AssignmentSuggestRequestDto,
  AssignmentSuggestResponseDto,
  BatchOperationResult,
  BlueprintAiChatRequestDto,
  BlueprintAiChatResponseDto,
  BlueprintCommentDto,
  BlueprintGraphDto,
  BlueprintHistoryEntryDto,
  BlueprintImpactDto,
  BlueprintReadinessDto,
  BlueprintRecommendationDto,
  BlueprintSnapshotDto,
  CopyNodeSettingsDto,
  CopyNodeSettingsResponseDto,
  CreateBlueprintCommentDto,
  CreateBlueprintSnapshotDto,
  CreateGraphTemplateDto,
  GraphTemplateDto,
  LibraryPeekDto,
  NodeCheckResponseDto,
  PoolCandidatesQueryDto,
  PoolCandidatesResponseDto,
  PoolOpPayload,
  ResolvedPool,
  ValidateProjectDto,
  ValidateVersionDto,
  ValidationReportDto,
} from '@slotly/contracts';

/** Constant representing blueprint api. */
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

  async validateProject(
    projectId: string,
    dto: ValidateProjectDto = {},
  ): Promise<ValidationReportDto> {
    return apiClient<ValidationReportDto>(`/projects/${projectId}/validate`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async validateVersion(
    versionId: string,
    dto: ValidateVersionDto = {},
  ): Promise<ValidationReportDto> {
    return apiClient<ValidationReportDto>(`/versions/${versionId}/validate`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
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
  async getHistory(projectId: string, nodeId?: string): Promise<BlueprintHistoryEntryDto[]> {
    const qs = nodeId ? `?nodeId=${encodeURIComponent(nodeId)}` : '';
    return apiClient<BlueprintHistoryEntryDto[]>(`/projects/${projectId}/blueprint/history${qs}`);
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

  // Slotly AI Chat for the whole blueprint
  async chatAi(
    projectId: string,
    dto: BlueprintAiChatRequestDto,
  ): Promise<BlueprintAiChatResponseDto> {
    return apiClient<BlueprintAiChatResponseDto>(
      `/projects/${projectId}/blueprint/ai/chat`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  },

  // Resource Pools
  async getNodePool(projectId: string, nodeId: string): Promise<ResolvedPool> {
    return apiClient<ResolvedPool>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/pool`,
    );
  },

  async mutatePool(
    projectId: string,
    nodeId: string,
    payload: PoolOpPayload,
  ): Promise<unknown> {
    return apiClient<unknown>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/pool`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  // Pool Candidates
  async getPoolCandidates(
    projectId: string,
    nodeId: string,
    params: PoolCandidatesQueryDto,
  ): Promise<PoolCandidatesResponseDto> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.set(k, String(v));
      }
    });
    return apiClient<PoolCandidatesResponseDto>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/pool/candidates?${qs.toString()}`,
    );
  },

  // Library Hover Peek
  async getLibraryPeek(type: 'faculty' | 'subjects' | 'rooms', id: string): Promise<LibraryPeekDto> {
    return apiClient<LibraryPeekDto>(`/library/${type}/${id}/peek`);
  },

  // Node Check
  async checkNode(projectId: string, nodeId: string): Promise<NodeCheckResponseDto> {
    return apiClient<NodeCheckResponseDto>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/check`,
    );
  },

  // Assignment Suggestion
  async suggestAssignments(
    projectId: string,
    nodeId: string,
    dto: AssignmentSuggestRequestDto = { mode: 'all' },
  ): Promise<AssignmentSuggestResponseDto> {
    return apiClient<AssignmentSuggestResponseDto>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/assignments/suggest`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  },

  // Copy Node Settings
  async copyNodeSettings(
    projectId: string,
    nodeId: string,
    dto: CopyNodeSettingsDto,
  ): Promise<CopyNodeSettingsResponseDto> {
    return apiClient<CopyNodeSettingsResponseDto>(
      `/projects/${projectId}/blueprint/nodes/${nodeId}/copy-settings`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  },
};
