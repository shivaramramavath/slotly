import { apiClient } from '@/lib/api-client';
import type {
  InstitutionDto,
  UpdateInstitutionDto,
  InstitutionStructureDto,
  DepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ProgramDto,
  CreateProgramDto,
  UpdateProgramDto,
  AcademicYearDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  SemesterDto,
  CreateSemesterDto,
  UpdateSemesterDto,
  SectionDto,
  CreateSectionDto,
  UpdateSectionDto,
  HolidayDto,
  CreateHolidayDto,
} from '@slotly/contracts';

export const institutionApi = {
  // Structure (cached tree)
  async getStructure(institutionId?: string): Promise<InstitutionStructureDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<InstitutionStructureDto>(`/institution/structure${query}`);
  },

  // Institution Profile
  async getInstitution(institutionId?: string): Promise<InstitutionDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<InstitutionDto>(`/institution${query}`);
  },

  async updateInstitution(
    dto: UpdateInstitutionDto,
    institutionId?: string,
  ): Promise<InstitutionDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<InstitutionDto>(`/institution${query}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  // Departments
  async listDepartments(institutionId?: string): Promise<DepartmentDto[]> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<DepartmentDto[]>(`/institution/departments${query}`);
  },

  async createDepartment(
    dto: CreateDepartmentDto,
    institutionId?: string,
  ): Promise<DepartmentDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<DepartmentDto>(`/institution/departments${query}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    return apiClient<DepartmentDto>(`/institution/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteDepartment(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/institution/departments/${id}`, {
      method: 'DELETE',
    });
  },

  // Programs
  async listPrograms(institutionId?: string): Promise<ProgramDto[]> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<ProgramDto[]>(`/institution/programs${query}`);
  },

  async createProgram(
    dto: CreateProgramDto,
    institutionId?: string,
  ): Promise<ProgramDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<ProgramDto>(`/institution/programs${query}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateProgram(
    id: string,
    dto: UpdateProgramDto,
  ): Promise<ProgramDto> {
    return apiClient<ProgramDto>(`/institution/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteProgram(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/institution/programs/${id}`, {
      method: 'DELETE',
    });
  },

  // Academic Years
  async listAcademicYears(institutionId?: string): Promise<AcademicYearDto[]> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<AcademicYearDto[]>(`/institution/academic-years${query}`);
  },

  async createAcademicYear(
    dto: CreateAcademicYearDto,
    institutionId?: string,
  ): Promise<AcademicYearDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<AcademicYearDto>(`/institution/academic-years${query}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateAcademicYear(
    id: string,
    dto: UpdateAcademicYearDto,
  ): Promise<AcademicYearDto> {
    return apiClient<AcademicYearDto>(`/institution/academic-years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteAcademicYear(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/institution/academic-years/${id}`, {
      method: 'DELETE',
    });
  },

  // Semesters
  async listSemesters(institutionId?: string): Promise<SemesterDto[]> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<SemesterDto[]>(`/institution/semesters${query}`);
  },

  async createSemester(
    dto: CreateSemesterDto,
    institutionId?: string,
  ): Promise<SemesterDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<SemesterDto>(`/institution/semesters${query}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateSemester(
    id: string,
    dto: UpdateSemesterDto,
  ): Promise<SemesterDto> {
    return apiClient<SemesterDto>(`/institution/semesters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteSemester(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/institution/semesters/${id}`, {
      method: 'DELETE',
    });
  },

  // Sections
  async listSections(institutionId?: string): Promise<SectionDto[]> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<SectionDto[]>(`/institution/sections${query}`);
  },

  async createSection(
    dto: CreateSectionDto,
    institutionId?: string,
  ): Promise<SectionDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<SectionDto>(`/institution/sections${query}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateSection(
    id: string,
    dto: UpdateSectionDto,
  ): Promise<SectionDto> {
    return apiClient<SectionDto>(`/institution/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async deleteSection(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/institution/sections/${id}`, {
      method: 'DELETE',
    });
  },

  // Holidays
  async listHolidays(institutionId?: string): Promise<HolidayDto[]> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<HolidayDto[]>(`/institution/holidays${query}`);
  },

  async createHoliday(
    dto: CreateHolidayDto,
    institutionId?: string,
  ): Promise<HolidayDto> {
    const query = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return apiClient<HolidayDto>(`/institution/holidays${query}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async deleteHoliday(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/institution/holidays/${id}`, {
      method: 'DELETE',
    });
  },
};
