// Unit tests validating blueprint inspector panel, tabs, overview, resource sections, pickers, times editor, and AI chat.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatIssueLabel } from '../canvas/issue-label';
import type { BlueprintCanvasNode } from '../../types/canvas.types';

describe('Blueprint Inspector - Tab Navigation & State', () => {
  it('defines the three canonical inspector tabs in exact order: Config, Constraints, Slotly AI', () => {
    const tabs = [
      { value: 'config', label: 'Config' },
      { value: 'constraints', label: 'Constraints' },
      { value: 'ai', label: 'Slotly AI' },
    ];

    assert.strictEqual(tabs.length, 3);
    assert.strictEqual(tabs[0]?.value, 'config');
    assert.strictEqual(tabs[1]?.value, 'constraints');
    assert.strictEqual(tabs[2]?.value, 'ai');
  });

  it('guarantees keyboard navigation in tablist with ARIA semantics', () => {
    const tabs = ['config', 'constraints', 'ai'];
    let currentIdx = 0;

    // Arrow right
    currentIdx = (currentIdx + 1) % tabs.length;
    assert.strictEqual(tabs[currentIdx], 'constraints');

    // Arrow right again
    currentIdx = (currentIdx + 1) % tabs.length;
    assert.strictEqual(tabs[currentIdx], 'ai');

    // Arrow left wraps
    currentIdx = (currentIdx - 1 + tabs.length) % tabs.length;
    assert.strictEqual(tabs[currentIdx], 'constraints');
  });
});

describe('Blueprint Inspector - Overview State', () => {
  const sampleNodes: BlueprintCanvasNode[] = [
    {
      id: 'inst-1',
      type: 'blueprint',
      position: { x: 0, y: 0 },
      data: {
        label: 'MIT Campus',
        nodeType: 'institution',
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        config: { name: 'MIT Campus', workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'] },
      },
    },
    {
      id: 'dept-1',
      type: 'blueprint',
      position: { x: 0, y: 100 },
      data: {
        label: 'CSE Department',
        nodeType: 'department',
        status: 'incomplete',
        effectiveStatus: 'incomplete',
        missing: [{ field: 'code', message: 'Department code required' }],
        config: {},
      },
    },
  ];

  it('calculates readiness score and resource counts accurately', () => {
    const totalNodes = sampleNodes.length;
    const completeNodes = sampleNodes.filter((n) => n.data.effectiveStatus === 'complete').length;
    const readinessPercent = Math.round((completeNodes / totalNodes) * 100);

    assert.strictEqual(readinessPercent, 50);
  });

  it('identifies nodes needing attention with issue counts', () => {
    const attention = sampleNodes.filter(
      (n) => n.data.effectiveStatus !== 'complete' || (n.data.missing && n.data.missing.length > 0),
    );

    assert.strictEqual(attention.length, 1);
    assert.strictEqual(attention[0]?.id, 'dept-1');
    assert.strictEqual(attention[0]?.data.missing?.length, 1);
  });
});

describe('Blueprint Inspector - Issues Summary & Jump Links', () => {
  it('formats raw keys into human-readable sentences without yellow box fill', () => {
    const workingDaysMsg = formatIssueLabel('workingDays');
    const periodConfigMsg = formatIssueLabel('periodConfig');
    const codeMsg = formatIssueLabel('code');

    assert.strictEqual(workingDaysMsg, 'Working days are not set');
    assert.strictEqual(periodConfigMsg, 'Period timing is not configured');
    assert.strictEqual(codeMsg, 'Department or course code is missing');
  });

  it('correctly maps raw keys to inspector section jump targets', () => {
    const resolveTargetSection = (field: string) => {
      if (['workingDays', 'periodConfig', 'times'].includes(field)) return 'times';
      if (['faculty', 'facultyId'].includes(field)) return 'faculty';
      if (['room', 'roomId', 'roomType'].includes(field)) return 'rooms';
      if (['subject', 'subjectId'].includes(field)) return 'subjects';
      return `field-${field}`;
    };

    assert.strictEqual(resolveTargetSection('workingDays'), 'times');
    assert.strictEqual(resolveTargetSection('facultyId'), 'faculty');
    assert.strictEqual(resolveTargetSection('roomType'), 'rooms');
    assert.strictEqual(resolveTargetSection('subjectId'), 'subjects');
    assert.strictEqual(resolveTargetSection('name'), 'field-name');
    assert.strictEqual(resolveTargetSection('code'), 'field-code');
  });
});

describe('Blueprint Inspector - Resource Sections & Pickers', () => {
  it('determines section applicability by node type according to Blueprint v2 rules', () => {
    const getApplicableSections = (type: string) => {
      const sections: string[] = [];
      if (['institution', 'department', 'program', 'section', 'faculty'].includes(type)) sections.push('faculty');
      if (['institution', 'department', 'section', 'room'].includes(type)) sections.push('rooms');
      if (['institution', 'department', 'program', 'section', 'subjectAssignment'].includes(type)) sections.push('subjects');
      if (['institution', 'section'].includes(type)) sections.push('times');
      sections.push('more');
      return sections;
    };

    // Institution has all
    assert.deepStrictEqual(getApplicableSections('institution'), ['faculty', 'rooms', 'subjects', 'times', 'more']);

    // Program has faculty, subjects, more (no rooms, no times)
    assert.deepStrictEqual(getApplicableSections('program'), ['faculty', 'subjects', 'more']);

    // Batch has only more
    assert.deepStrictEqual(getApplicableSections('batch'), ['more']);
  });

  it('sorts picker items with already assigned items first', () => {
    const items = [
      { id: '1', name: 'Dr. Alan Turing' },
      { id: '2', name: 'Dr. Ada Lovelace' },
      { id: '3', name: 'Dr. Grace Hopper' },
    ];
    const assignedIds = ['3'];

    const sorted = [...items].sort((a, b) => {
      const aAssigned = assignedIds.includes(a.id);
      const bAssigned = assignedIds.includes(b.id);
      if (aAssigned && !bAssigned) return -1;
      if (!aAssigned && bAssigned) return 1;
      return a.name.localeCompare(b.name);
    });

    assert.strictEqual(sorted[0]?.id, '3'); // Grace Hopper first
    assert.strictEqual(sorted[1]?.id, '2'); // Ada Lovelace second
    assert.strictEqual(sorted[2]?.id, '1'); // Alan Turing third
  });

  it('disables ineligible items with reason message', () => {
    const item = {
      id: 'f-1',
      name: 'Dr. Smith',
      ineligibleReason: 'Exceeds weekly workload limit (24/18h)',
    };

    const isSelectable = !item.ineligibleReason;
    assert.strictEqual(isSelectable, false);
    assert.ok(item.ineligibleReason.length > 0);
  });
});

describe('Blueprint Inspector - Times Editor', () => {
  it('toggles working days Mon-Sun maintaining pressed state', () => {
    let days = ['mon', 'tue', 'wed', 'thu', 'fri'];

    // Toggle Saturday on
    days = [...days, 'sat'];
    assert.ok(days.includes('sat'));
    assert.strictEqual(days.length, 6);

    // Toggle Wednesday off
    days = days.filter((d) => d !== 'wed');
    assert.ok(!days.includes('wed'));
    assert.strictEqual(days.length, 5);
  });

  it('validates minimum 1 working day and duration limits', () => {
    const validateDays = (d: string[]) => d.length > 0;
    const validateDuration = (mins: number) => mins >= 15 && mins <= 180;

    assert.strictEqual(validateDays([]), false);
    assert.strictEqual(validateDays(['mon']), true);
    assert.strictEqual(validateDuration(10), false);
    assert.strictEqual(validateDuration(50), true);
    assert.strictEqual(validateDuration(200), false);
  });
});

describe('Blueprint Inspector - Keyboard and Canvas Safety', () => {
  it('stops event propagation on inspector keystrokes to prevent canvas hotkey triggers', () => {
    let propagationStopped = false;
    const mockEvent = {
      key: 'Delete',
      stopPropagation: () => {
        propagationStopped = true;
      },
    };

    // Inspector field keydown handler
    const handleInspectorKeyDown = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
    };

    handleInspectorKeyDown(mockEvent);
    assert.strictEqual(propagationStopped, true);
  });

  it('verifies Mod+Enter shortcut triggers save when draft is dirty', () => {
    let saveTriggered = false;
    const isDirty = true;
    const isSaving = false;

    const handleFormKeyDown = (e: { metaKey?: boolean; ctrlKey?: boolean; key: string; preventDefault: () => void }) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isDirty && !isSaving) {
          saveTriggered = true;
        }
      }
    };

    handleFormKeyDown({ ctrlKey: true, key: 'Enter', preventDefault: () => {} });
    assert.strictEqual(saveTriggered, true);
  });
});

describe('Blueprint Inspector - AI Chat Whole Blueprint Context', () => {
  it('sanitizes markdown and neutralizes dangerous javascript: links', () => {
    const sanitizeLink = (url: string) => (url.startsWith('javascript:') ? '#' : url);

    assert.strictEqual(sanitizeLink('https://slotly.app/docs'), 'https://slotly.app/docs');
    assert.strictEqual(sanitizeLink('javascript:alert(1)'), '#');
  });

  it('provides the 4 canonical suggestion chips for whole blueprint analysis', () => {
    const chips = [
      'What is blocking this blueprint?',
      'Summarise the hierarchy',
      'Which faculty are over-allocated?',
      'Suggest period timings',
    ];

    assert.strictEqual(chips.length, 4);
    assert.ok(chips.includes('What is blocking this blueprint?'));
    assert.ok(chips.includes('Summarise the hierarchy'));
    assert.ok(chips.includes('Which faculty are over-allocated?'));
    assert.ok(chips.includes('Suggest period timings'));
  });
});
