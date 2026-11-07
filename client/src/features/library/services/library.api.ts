import { apiClient } from '@/lib/api-client';
import type {
  FacultyDto,
  CreateFacultyDto,
  UpdateFacultyDto,
  FacultyWorkloadDto,
  SubjectDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  ElectiveGroupDto,
  CreateElectiveGroupDto,
  UpdateElectiveGroupDto,
  RoomDto,
  CreateRoomDto,
  UpdateRoomDto,
  RoomMatchRequest,
  RoomMatchResult,
  FacultyQualificationRequest,
  FacultyQualificationResult,
  ImportEntity,
  ImportValidationReport,
  LibraryCountsDto,
} from '@slotly/contracts';

export const libraryApi = {
  // ==========================================
  // COUNTS
  // ==========================================
  async getCounts(params?: {
    departmentId?: string | undefined;
    archived?: boolean | undefined;
    institutionId?: string | undefined;
  }): Promise<LibraryCountsDto> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (typeof params?.archived === 'boolean') query.set('archived', String(params.archived));
    if (params?.institutionId) query.set('institutionId', params.institutionId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<LibraryCountsDto>(`/library/counts${qs}`);
  },

  // ==========================================
  // FACULTY
  // ==========================================
  async listFaculty(params?: {
    departmentId?: string | undefined;
    archived?: boolean | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    institutionId?: string | undefined;
  }): Promise<{ items: FacultyDto[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (typeof params?.archived === 'boolean') query.set('archived', String(params.archived));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.institutionId) query.set('institutionId', params.institutionId);

    const qs = query.toString();
    return apiClient<{ items: FacultyDto[]; total: number }>(
      `/library/faculty${qs ? `?${qs}` : ''}`,
    );
  },

  async getFaculty(id: string): Promise<FacultyDto> {
    return apiClient<FacultyDto>(`/library/faculty/${id}`);
  },

  async createFaculty(dto: CreateFacultyDto, institutionId?: string): Promise<FacultyDto> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<FacultyDto>(`/library/faculty${qs}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateFaculty(id: string, dto: UpdateFacultyDto): Promise<FacultyDto> {
    return apiClient<FacultyDto>(`/library/faculty/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async archiveFaculty(id: string, archived: boolean): Promise<FacultyDto> {
    return apiClient<FacultyDto>(`/library/faculty/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
  },

  async deleteFaculty(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/library/faculty/${id}`, {
      method: 'DELETE',
    });
  },

  async getFacultyWorkload(id: string): Promise<FacultyWorkloadDto> {
    return apiClient<FacultyWorkloadDto>(`/library/faculty/${id}/workload`);
  },

  // ==========================================
  // SUBJECTS
  // ==========================================
  async listSubjects(params?: {
    departmentId?: string | undefined;
    type?: string | undefined;
    archived?: boolean | undefined;
    isElective?: boolean | undefined;
    electiveGroupId?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    institutionId?: string | undefined;
  }): Promise<{ items: SubjectDto[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.type) query.set('type', params.type);
    if (typeof params?.archived === 'boolean') query.set('archived', String(params.archived));
    if (typeof params?.isElective === 'boolean') query.set('isElective', String(params.isElective));
    if (params?.electiveGroupId) query.set('electiveGroupId', params.electiveGroupId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.institutionId) query.set('institutionId', params.institutionId);

    const qs = query.toString();
    return apiClient<{ items: SubjectDto[]; total: number }>(
      `/library/subjects${qs ? `?${qs}` : ''}`,
    );
  },

  async getSubject(id: string): Promise<SubjectDto> {
    return apiClient<SubjectDto>(`/library/subjects/${id}`);
  },

  async createSubject(dto: CreateSubjectDto, institutionId?: string): Promise<SubjectDto> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<SubjectDto>(`/library/subjects${qs}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateSubject(id: string, dto: UpdateSubjectDto): Promise<SubjectDto> {
    return apiClient<SubjectDto>(`/library/subjects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async archiveSubject(id: string, archived: boolean): Promise<SubjectDto> {
    return apiClient<SubjectDto>(`/library/subjects/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
  },

  async deleteSubject(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/library/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // ELECTIVE GROUPS
  // ==========================================
  async listElectiveGroups(institutionId?: string): Promise<ElectiveGroupDto[]> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<ElectiveGroupDto[]>(`/library/elective-groups${qs}`);
  },

  async createElectiveGroup(
    dto: CreateElectiveGroupDto,
    institutionId?: string,
  ): Promise<ElectiveGroupDto> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<ElectiveGroupDto>(`/library/elective-groups${qs}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateElectiveGroup(id: string, dto: UpdateElectiveGroupDto): Promise<ElectiveGroupDto> {
    return apiClient<ElectiveGroupDto>(`/library/elective-groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async deleteElectiveGroup(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/library/elective-groups/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // ROOMS
  // ==========================================
  async listRooms(params?: {
    departmentId?: string | undefined;
    type?: string | undefined;
    building?: string | undefined;
    minCapacity?: number | undefined;
    archived?: boolean | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    institutionId?: string | undefined;
  }): Promise<{ items: RoomDto[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.type) query.set('type', params.type);
    if (params?.building) query.set('building', params.building);
    if (typeof params?.minCapacity === 'number') query.set('minCapacity', String(params.minCapacity));
    if (typeof params?.archived === 'boolean') query.set('archived', String(params.archived));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.institutionId) query.set('institutionId', params.institutionId);

    const qs = query.toString();
    return apiClient<{ items: RoomDto[]; total: number }>(
      `/library/rooms${qs ? `?${qs}` : ''}`,
    );
  },

  async getRoom(id: string): Promise<RoomDto> {
    return apiClient<RoomDto>(`/library/rooms/${id}`);
  },

  async createRoom(dto: CreateRoomDto, institutionId?: string): Promise<RoomDto> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<RoomDto>(`/library/rooms${qs}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateRoom(id: string, dto: UpdateRoomDto): Promise<RoomDto> {
    return apiClient<RoomDto>(`/library/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async archiveRoom(id: string, archived: boolean): Promise<RoomDto> {
    return apiClient<RoomDto>(`/library/rooms/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
  },

  async deleteRoom(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/library/rooms/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // MATCHERS
  // ==========================================
  async matchRooms(req: RoomMatchRequest, institutionId?: string): Promise<RoomMatchResult[]> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<RoomMatchResult[]>(`/library/match/rooms${qs}`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async qualifyFaculty(
    req: FacultyQualificationRequest,
    institutionId?: string,
  ): Promise<FacultyQualificationResult[]> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<FacultyQualificationResult[]>(`/library/match/faculty${qs}`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  // ==========================================
  // IMPORT & EXPORT
  // ==========================================
  async previewImportFile(entity: ImportEntity, file: File): Promise<ImportValidationReport> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<ImportValidationReport>(`/library/import/${entity}/preview`, {
      method: 'POST',
      body: formData,
    });
  },

  async executeImport(
    entity: ImportEntity,
    rows: Record<string, unknown>[],
    institutionId?: string,
  ): Promise<{ inserted: number; errors: number }> {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<{ inserted: number; errors: number }>(`/library/import/${entity}${qs}`, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  getExportUrl(entity: ImportEntity, format: 'xlsx' | 'csv' = 'xlsx', institutionId?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const qs = new URLSearchParams({ format });
    if (institutionId) qs.set('institutionId', institutionId);
    return `${baseUrl}/library/export/${entity}?${qs.toString()}`;
  },
};
