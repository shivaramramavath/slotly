// Unit tests validating BlueprintAiService context summarization and chat assistance.
import { Test, TestingModule } from '@nestjs/testing';
import { BlueprintAiService } from '../services/blueprint-ai.service';
import { BlueprintService } from '../services/blueprint.service';
import type {
  BlueprintGraphDto,
  BlueprintReadinessDto,
} from '@slotly/contracts';

describe('BlueprintAiService', () => {
  let service: BlueprintAiService;
  let blueprintService: jest.Mocked<Partial<BlueprintService>>;

  const mockGraph: BlueprintGraphDto = {
    projectId: 'p1',
    revision: 1,
    nodes: [
      {
        id: 'inst-1',
        projectId: 'p1',
        type: 'institution',
        position: { x: 0, y: 0 },
        data: {
          name: 'Main Campus',
          workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
      },
      {
        id: 'dept-1',
        projectId: 'p1',
        type: 'department',
        parentId: 'inst-1',
        position: { x: 0, y: 100 },
        data: { name: 'CSE Department' },
        status: 'incomplete',
        effectiveStatus: 'incomplete',
        missing: [{ field: 'code', message: 'Department code required' }],
        locked: false,
        hidden: false,
      },
      {
        id: 'sec-1',
        projectId: 'p1',
        type: 'section',
        parentId: 'dept-1',
        position: { x: 0, y: 200 },
        data: { name: 'Section A' },
        status: 'incomplete',
        effectiveStatus: 'blocked',
        missing: [{ field: 'strength', message: 'Strength required' }],
        locked: false,
        hidden: false,
      },
    ],
    edges: [
      {
        id: 'e1',
        projectId: 'p1',
        source: 'inst-1',
        target: 'dept-1',
        type: 'hierarchy',
      },
      {
        id: 'e2',
        projectId: 'p1',
        source: 'dept-1',
        target: 'sec-1',
        type: 'hierarchy',
      },
    ],
  };

  const mockReadiness: BlueprintReadinessDto = {
    totalNodes: 3,
    completedCount: 1,
    incompleteCount: 1,
    blockedCount: 1,
    percentComplete: 33,
    healthScore: 33,
    isReadyForBuild: false,
    missingItems: [
      {
        nodeId: 'dept-1',
        field: 'code',
        message: 'Department code required',
        fixHint: { nodeId: 'dept-1', field: 'code' },
        nodeType: 'department',
        nodeName: 'CSE Department',
      },
    ],
  };

  beforeEach(async () => {
    blueprintService = {
      getGraph: jest.fn().mockResolvedValue(mockGraph),
      getReadiness: jest.fn().mockResolvedValue(mockReadiness),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlueprintAiService,
        { provide: BlueprintService, useValue: blueprintService },
      ],
    }).compile();

    service = module.get<BlueprintAiService>(BlueprintAiService);
  });

  it('builds a compact context summary capped below 3500 chars', () => {
    const summary = service.buildContextSummary(
      mockGraph,
      mockReadiness,
      'dept-1',
      true,
    );
    expect(summary).toContain('Blueprint Total Nodes: 3');
    expect(summary).toContain('Readiness Score: 33%');
    expect(summary).toContain('CSE Department');
    expect(summary.length).toBeLessThan(3500);
  });

  it('answers "What is blocking this blueprint?" and returns suggested node IDs', async () => {
    const response = await service.chat('p1', {
      message: 'What is blocking this blueprint?',
    });

    expect(response.reply).toContain('needing attention');
    expect(response.reply).toContain('CSE Department');
    expect(response.suggestedNodeIds).toContain('dept-1');
  });

  it('summarises the hierarchy when asked', async () => {
    const response = await service.chat('p1', {
      message: 'Summarise the hierarchy',
    });

    expect(response.reply).toContain('### Blueprint Hierarchy Summary');
    expect(response.reply).toContain('Main Campus');
    expect(response.reply).toContain('CSE Department');
  });

  it('suggests period timings based on working days', async () => {
    const response = await service.chat('p1', {
      message: 'Suggest period timings',
    });

    expect(response.reply).toContain('Recommended Period Timings');
    expect(response.reply).toContain('08:30 AM');
    expect(response.reply).toContain('50 minutes');
  });

  it('answers faculty allocation questions safely', async () => {
    const response = await service.chat('p1', {
      message: 'Which faculty are over-allocated?',
    });

    expect(response.reply).toContain('Faculty Allocation Analysis');
  });
});
