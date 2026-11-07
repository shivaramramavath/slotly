import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
import * as crypto from 'crypto';
import type { CacheService } from '../../../common/cache/cache.interface';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import { BlueprintService } from '../../blueprint/services/blueprint.service';
import { ProjectsService } from '../../projects/services/projects.service';
import { ValidationService } from '../core/validation.service';
import type {
  EngineInput,
  Slot,
  ValidationReportDto,
  EngineSection,
  EngineBatch,
  EngineFaculty,
  EngineRoom,
  EngineSubject,
  EngineElectiveGroup,
} from '../core';
import type { BlueprintNodeDto } from '@slotly/contracts';

@Injectable()
export class EngineValidationService {
  private readonly pureValidator: ValidationService;

  constructor(
    @Inject(CACHE_SERVICE) private readonly cacheService: CacheService,
    @Inject(forwardRef(() => BlueprintService))
    private readonly blueprintService: BlueprintService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {
    this.pureValidator = new ValidationService();
  }

  getPureValidator(): ValidationService {
    return this.pureValidator;
  }

  /**
   * Validates a project graph and optional slot allocations.
   * Results are cached in Redis by input hash with tag invalidation on project changes.
   */
  async validateProject(projectId: string, slots: Slot[] = []): Promise<ValidationReportDto> {
    const project = await this.projectsService.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const graph = await this.blueprintService.getGraph(projectId);
    const input = this.buildEngineInput(project, graph.nodes);

    // Compute input hash for Redis caching
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ projectId, revision: graph.revision, input, slots }))
      .digest('hex');

    const cacheKey = `slotly:validation:${hash}`;

    return this.cacheService.remember<ValidationReportDto>(
      cacheKey,
      300, // 5 min TTL
      async () => this.pureValidator.validate(input, slots),
      [`project:${projectId}`],
    );
  }

  /**
   * Validates a version's slots and academic constraints.
   */
  async validateVersion(versionId: string, slots: Slot[] = []): Promise<ValidationReportDto> {
    // Hash input for caching
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ versionId, slots }))
      .digest('hex');

    const cacheKey = `slotly:validation:version:${hash}`;

    return this.cacheService.remember<ValidationReportDto>(
      cacheKey,
      300,
      async () => {
        // Fallback or default engine input when validating raw version slots
        const defaultInput: EngineInput = {
          settings: {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            periodsPerDay: 7,
            periodDuration: 50,
            breaks: [{ period: 4, name: 'Lunch' }],
          },
          calendar: { holidays: [] },
          sections: [],
          batches: [],
          faculty: [],
          rooms: [],
          subjects: [],
          electiveGroups: [],
          lockedSlots: [],
        };
        return this.pureValidator.validate(defaultInput, slots);
      },
      [`version:${versionId}`],
    );
  }

  /**
   * Derives EngineInput data structure from blueprint graph nodes and project configuration.
   */
  buildEngineInput(project: any, nodes: BlueprintNodeDto[]): EngineInput {
    const sections: EngineSection[] = [];
    const batches: EngineBatch[] = [];
    const faculty: EngineFaculty[] = [];
    const rooms: EngineRoom[] = [];
    const subjects: EngineSubject[] = [];
    const electiveGroups: EngineElectiveGroup[] = [];

    for (const node of nodes) {
      const data = node.data || {};

      switch (node.type) {
        case 'section':
          sections.push({
            id: node.id,
            name: String(data.name || data.label || 'Section'),
            strength: Number(data.strength || 60),
            departmentId: node.parentId || undefined,
          });
          break;

        case 'batch':
          batches.push({
            id: node.id,
            sectionId: node.parentId || '',
            name: String(data.name || data.label || 'Batch'),
            size: Number(data.size || 30),
          });
          break;

        case 'faculty':
          faculty.push({
            id: node.id,
            name: String(data.name || data.label || 'Faculty'),
            code: String(data.code || 'FAC'),
            availability: data.availability as boolean[][] | undefined,
            unavailableSlots: data.unavailableSlots as Array<{ day: number; period: number }> | undefined,
            preferredPeriods: data.preferredPeriods as Array<{ day: number; period: number }> | undefined,
            maxHoursPerDay: data.maxHoursPerDay ? Number(data.maxHoursPerDay) : 4,
            maxHoursPerWeek: data.maxHoursPerWeek ? Number(data.maxHoursPerWeek) : 18,
            minHoursPerWeek: data.minHoursPerWeek ? Number(data.minHoursPerWeek) : 0,
            departmentId: node.parentId || undefined,
          });
          break;

        case 'room':
          rooms.push({
            id: node.id,
            name: String(data.name || data.label || 'Room'),
            type: (data.type as 'lecture' | 'lab' | 'seminar') || 'lecture',
            capacity: Number(data.capacity || 60),
            equipment: (data.equipment as string[]) || [],
            availability: data.availability as boolean[][] | undefined,
            departmentId: node.parentId || undefined,
          });
          break;

        case 'subjectAssignment':
          subjects.push({
            id: node.id,
            name: String(data.name || data.label || 'Subject'),
            code: String(data.code || 'SUB'),
            type: (data.type as 'theory' | 'lab' | 'tutorial' | 'seminar') || 'theory',
            weeklyHours: Number(data.weeklyHours || 3),
            consecutivePeriods: data.consecutivePeriods
              ? Number(data.consecutivePeriods)
              : data.type === 'lab'
              ? 2
              : 1,
            requirements: data.requirements as { roomType?: string; minCapacity?: number; equipment?: string[] } | undefined,
            isElective: Boolean(data.isElective),
            electiveGroupId: data.electiveGroupId as string | undefined,
            facultyIds: data.facultyId ? [String(data.facultyId)] : [],
          });
          break;

        case 'electiveGroup':
          electiveGroups.push({
            id: node.id,
            name: String(data.name || data.label || 'Elective Group'),
            mustBeSimultaneous: data.mustBeSimultaneous !== false,
            subjectIds: (data.subjectIds as string[]) || [],
          });
          break;
      }
    }

    const settings = {
      days: project.settings?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periodsPerDay: project.settings?.periodsPerDay || 7,
      periodDuration: project.settings?.periodDuration || 50,
      startTime: project.settings?.startTime || '09:00',
      breaks: project.settings?.breaks || [{ period: 4, name: 'Lunch' }],
      perDayOverrides: project.settings?.perDayOverrides,
    };

    return {
      settings,
      calendar: { holidays: [] },
      sections,
      batches,
      faculty,
      rooms,
      subjects,
      electiveGroups,
      lockedSlots: [],
      effectiveConstraints: project.settings?.constraints,
    };
  }
}
