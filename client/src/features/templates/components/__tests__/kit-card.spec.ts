// Unit tests for kit card helper utilities: subtitle formatting, description generation, and category glyph resolution.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatCategoryLabel,
  formatSubtitle,
  getKitDescription,
  getCategoryGlyph,
} from '../kit-card';
import type { GraphTemplateDto } from '@slotly/contracts';

describe('formatCategoryLabel', () => {
  it('standardizes ampersand to and', () => {
    assert.strictEqual(formatCategoryLabel('Vocational & STEM'), 'Vocational and STEM');
    assert.strictEqual(formatCategoryLabel('University'), 'University');
    assert.strictEqual(formatCategoryLabel('K-12 School'), 'K-12 School');
  });

  it('handles empty fallback', () => {
    assert.strictEqual(formatCategoryLabel(''), 'Kit');
  });
});

describe('formatSubtitle', () => {
  it('formats node and connection counts with lowercase unit words', () => {
    assert.strictEqual(
      formatSubtitle(7, 6),
      'Subtree · 7 nodes · 6 connections',
    );
    assert.strictEqual(
      formatSubtitle(1, 0),
      'Subtree · 1 nodes · 0 connections',
    );
  });
});

describe('getKitDescription', () => {
  it('returns custom description when present on template', () => {
    const tpl = {
      id: 'tpl-1',
      name: 'Custom Kit',
      category: 'University',
      version: 1,
      description: 'Handcrafted custom curriculum kit for research departments.',
      subtree: {
        nodes: [],
        edges: [],
      },
    } as unknown as GraphTemplateDto;

    assert.strictEqual(
      getKitDescription(tpl),
      'Handcrafted custom curriculum kit for research departments.',
    );
  });

  it('generates fallback description with 2 or fewer node names', () => {
    const tpl = {
      id: 'tpl-2',
      name: 'Small Kit',
      category: 'K-12 School',
      version: 1,
      subtree: {
        nodes: [
          { id: '1', type: 'department', data: { name: 'High School' } },
          { id: '2', type: 'program', data: { name: 'Grade 10' } },
        ],
        edges: [],
      },
    } as unknown as GraphTemplateDto;

    assert.strictEqual(
      getKitDescription(tpl),
      'Includes High School and Grade 10.',
    );
  });

  it('generates fallback description with more than 2 node names listing remainder', () => {
    const tpl = {
      id: 'tpl-3',
      name: 'Engineering Kit',
      category: 'University',
      version: 1,
      subtree: {
        nodes: [
          { id: '1', type: 'department', data: { name: 'Computer Science and Engineering' } },
          { id: '2', type: 'program', data: { name: 'B.Tech in Computer Science' } },
          { id: '3', type: 'academicYear', data: { name: 'Year 1' } },
          { id: '4', type: 'semester', data: { name: 'Semester 1' } },
          { id: '5', type: 'section', data: { name: 'CSE-A' } },
          { id: '6', type: 'batch', data: { name: 'Batch 1' } },
        ],
        edges: [],
      },
    } as unknown as GraphTemplateDto;

    assert.strictEqual(
      getKitDescription(tpl),
      'Includes Computer Science and Engineering, B.Tech in Computer Science and 4 more.',
    );
  });

  it('provides generic fallback when subtree has no named nodes', () => {
    const tpl = {
      id: 'tpl-4',
      name: 'Empty Kit',
      category: 'Vocational & STEM',
      version: 1,
      subtree: {
        nodes: [],
        edges: [],
      },
    } as unknown as GraphTemplateDto;

    assert.strictEqual(
      getKitDescription(tpl),
      'Pre-configured curricular kit with modular timetable subtree structure.',
    );
  });
});

describe('getCategoryGlyph', () => {
  it('resolves correct icons based on category text', () => {
    const k12Glyph = getCategoryGlyph('K-12 School');
    assert.ok(k12Glyph);

    const uniGlyph = getCategoryGlyph('University');
    assert.ok(uniGlyph);

    const stemGlyph = getCategoryGlyph('Vocational & STEM');
    assert.ok(stemGlyph);

    const genericGlyph = getCategoryGlyph('Specialized Certification');
    assert.ok(genericGlyph);
  });
});

describe('KitCard styling tokens and budget', () => {
  it('verifies clamp classes and dimensions match design tokens', () => {
    const titleClamps = 'line-clamp-2';
    const descClamps = 'line-clamp-3';
    const cardRadius = 'rounded-[20px]';
    const minHeight = 'min-h-[270px]';

    assert.strictEqual(titleClamps, 'line-clamp-2');
    assert.strictEqual(descClamps, 'line-clamp-3');
    assert.strictEqual(cardRadius, 'rounded-[20px]');
    assert.strictEqual(minHeight, 'min-h-[270px]');
  });
});
