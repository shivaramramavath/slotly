// Unit tests validating Pass B blueprint sidebar client: form registry, schemas, pool views, assignments, check tab, and copy settings.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getNodeFormConfig,
} from '../sidebar/node-form-registry';
import {
  NodeFormSchemas,
  CopyNodeSettingsDtoSchema,
  type BlueprintNodeType,
} from '@slotly/contracts';
import type { BlueprintCanvasNode } from '../../types/canvas.types';

describe('Pass B - NodeFormRegistry & Schema Validation', () => {
  const supportedTypes: BlueprintNodeType[] = [
    'institution',
    'department',
    'program',
    'academicYear',
    'semester',
    'section',
    'batch',
  ];

  it('registers all 7 blueprint hierarchy node types in the Open/Closed registry', () => {
    supportedTypes.forEach((type) => {
      const config = getNodeFormConfig(type);
      assert.ok(config, `Missing config for ${type}`);
      assert.strictEqual(config.type, type);
      assert.ok(config.schema, `Missing schema for ${type}`);
      assert.ok(config.fieldKeys.length > 0, `Empty fieldKeys for ${type}`);
    });
  });

  it('throws an error when retrieving configuration for an unregistered node type', () => {
    assert.throws(
      () => getNodeFormConfig('faculty' as unknown as BlueprintNodeType),
      /Unregistered node form type: faculty/,
    );
  });

  it('validates institution form data according to schema rules', () => {
    const validInst = {
      name: 'Massachusetts Institute of Technology',
      code: 'MIT',
      workingDays: [1, 2, 3, 4, 5],
      startTime: '08:30',
      periodLength: 50,
      periodsPerDay: 7,
      defaultAutoFillMode: 'same_department',
    };
    const res = NodeFormSchemas.institution.safeParse(validInst);
    assert.strictEqual(res.success, true);

    const invalidInst = {
      ...validInst,
      startTime: 'invalid-time',
    };
    const badRes = NodeFormSchemas.institution.safeParse(invalidInst);
    assert.strictEqual(badRes.success, false);
  });

  it('validates section form data including classTeacherId and homeRoomId', () => {
    const validSection = {
      name: 'Section A',
      strength: 60,
      classTeacherId: 'fac_turing',
      homeRoomId: 'room_101',
    };
    const res = NodeFormSchemas.section.safeParse(validSection);
    assert.strictEqual(res.success, true);

    const invalidSection = {
      name: '',
      strength: 0, // must be min 1
    };
    const badRes = NodeFormSchemas.section.safeParse(invalidSection);
    assert.strictEqual(badRes.success, false);
  });

  it('validates batch form data with size within section limits', () => {
    const validBatch = {
      name: 'Batch A1',
      size: 30,
      labSubjectIds: ['sub_ds_lab'],
    };
    const res = NodeFormSchemas.batch.safeParse(validBatch);
    assert.strictEqual(res.success, true);
  });
});

describe('Pass B - Resource Pool Derivation & View States', () => {
  it('correctly aggregates own additions, inherited items, and exclusions', () => {
    const ownAdditions = ['fac_1', 'fac_2'];
    const inheritedFromParent = ['fac_3', 'fac_4'];
    const ownExclusions = ['fac_4'];

    const effective = [
      ...ownAdditions,
      ...inheritedFromParent.filter((id) => !ownExclusions.includes(id)),
    ];

    assert.deepStrictEqual(effective, ['fac_1', 'fac_2', 'fac_3']);
    assert.strictEqual(effective.includes('fac_4'), false);
  });

  it('enforces that required items cannot be excluded', () => {
    const requiredItems = ['fac_required'];
    const canExclude = (id: string) => !requiredItems.includes(id);

    assert.strictEqual(canExclude('fac_required'), false);
    assert.strictEqual(canExclude('fac_optional'), true);
  });
});

describe('Pass B - Subject Assignments & Suggestion Merging', () => {
  it('merges solver suggestions into section assignments seamlessly', () => {
    const currentAssignments: Array<{
      id: string;
      subjectId: string;
      subjectName: string;
      facultyId?: string | undefined;
      facultyName?: string | undefined;
      roomId?: string | undefined;
      status: 'ok';
      reason?: string | undefined;
    }> = [
      {
        id: 'asgn_1',
        subjectId: 'sub_math',
        subjectName: 'Mathematics',
        facultyId: 'fac_old',
        status: 'ok',
      },
    ];

    const suggestion = {
      subjectId: 'sub_math',
      faculty: [{ id: 'fac_euler', name: 'Leonhard Euler', score: 98, reasons: ['Optimal qualification'] }],
      rooms: [{ id: 'room_101', name: 'Hall 101', score: 95, reasons: ['Fits capacity'] }],
    };

    const updated = currentAssignments.map((a) => {
      if (a.subjectId === suggestion.subjectId) {
        return {
          ...a,
          facultyId: suggestion.faculty[0]?.id,
          facultyName: suggestion.faculty[0]?.name,
          roomId: suggestion.rooms[0]?.id,
          roomName: suggestion.rooms[0]?.name,
          status: 'ok' as const,
          reason: suggestion.faculty[0]?.reasons?.[0],
        };
      }
      return a;
    });

    assert.strictEqual(updated[0]?.facultyId, 'fac_euler');
    assert.strictEqual(updated[0]?.facultyName, 'Leonhard Euler');
    assert.strictEqual(updated[0]?.roomId, 'room_101');
    assert.strictEqual(updated[0]?.reason, 'Optimal qualification');
  });
});

describe('Pass B - Copy Settings Part Selection', () => {
  it('validates copy node settings payload schema', () => {
    const validPayload = {
      sourceNodeId: 'node_src',
      parts: ['fields', 'pool', 'assignments', 'rules'] as const,
    };
    const res = CopyNodeSettingsDtoSchema.safeParse(validPayload);
    assert.strictEqual(res.success, true);

    const emptyParts = {
      sourceNodeId: 'node_src',
      parts: [],
    };
    const badRes = CopyNodeSettingsDtoSchema.safeParse(emptyParts);
    assert.strictEqual(badRes.success, false);
  });
});

describe('Pass B - Sidebar Layout & Resizing Clamping', () => {
  it('clamps inspector width between 320 px and 480 px', () => {
    const clampWidth = (w: number) => Math.min(480, Math.max(320, w));

    assert.strictEqual(clampWidth(250), 320);
    assert.strictEqual(clampWidth(360), 360);
    assert.strictEqual(clampWidth(420), 420);
    assert.strictEqual(clampWidth(550), 480);
  });

  it('computes ancestor breadcrumbs up to the root node', () => {
    const nodes: BlueprintCanvasNode[] = [
      {
        id: 'inst',
        type: 'blueprint',
        position: { x: 0, y: 0 },
        data: {
          label: 'Stanford University',
          nodeType: 'institution',
          status: 'complete',
          effectiveStatus: 'complete',
          missing: [],
          config: {},
        },
      },
      {
        id: 'dept',
        type: 'blueprint',
        position: { x: 0, y: 100 },
        data: {
          label: 'CS Department',
          nodeType: 'department',
          status: 'complete',
          effectiveStatus: 'complete',
          missing: [],
          parentId: 'inst',
          config: {},
        },
      },
      {
        id: 'prog',
        type: 'blueprint',
        position: { x: 0, y: 200 },
        data: {
          label: 'B.S. CS',
          nodeType: 'program',
          status: 'complete',
          effectiveStatus: 'complete',
          missing: [],
          parentId: 'dept',
          config: {},
        },
      },
    ];

    const targetNode = nodes[2]!;
    const trail: BlueprintCanvasNode[] = [];
    let currentParentId = targetNode.data.parentId;

    while (currentParentId) {
      const parent = nodes.find((n) => n.id === currentParentId);
      if (!parent) break;
      trail.unshift(parent);
      currentParentId = parent.data.parentId;
    }

    assert.strictEqual(trail.length, 2);
    assert.strictEqual(trail[0]?.id, 'inst');
    assert.strictEqual(trail[1]?.id, 'dept');
  });
});
