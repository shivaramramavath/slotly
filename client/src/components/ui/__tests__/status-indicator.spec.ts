// Unit tests for status indicator configuration and label formatting logic.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getIndicatorConfig } from '../progress-bars';
import { formatStatusLabel } from '../status-indicator';

describe('getIndicatorConfig', () => {
  it('maps draft and archived to single muted bar', () => {
    assert.deepStrictEqual(getIndicatorConfig('draft'), {
      activeBars: 1,
      colorClass: 'bg-[#8A8A8A]',
    });
    assert.deepStrictEqual(getIndicatorConfig('archived'), {
      activeBars: 1,
      colorClass: 'bg-[#8A8A8A]',
    });
  });

  it('maps building and pending_approval to two yellow bars', () => {
    assert.deepStrictEqual(getIndicatorConfig('building'), {
      activeBars: 2,
      colorClass: 'bg-[#FACC15]',
    });
    assert.deepStrictEqual(getIndicatorConfig('pending_approval'), {
      activeBars: 2,
      colorClass: 'bg-[#FACC15]',
    });
  });

  it('maps ready to two green bars', () => {
    assert.deepStrictEqual(getIndicatorConfig('ready'), {
      activeBars: 2,
      colorClass: 'bg-[#22C55E]',
    });
  });

  it('maps published to three green bars', () => {
    assert.deepStrictEqual(getIndicatorConfig('published'), {
      activeBars: 3,
      colorClass: 'bg-[#22C55E]',
    });
  });
});

describe('formatStatusLabel', () => {
  it('formats base status name without progress', () => {
    assert.strictEqual(formatStatusLabel('draft'), 'Draft');
    assert.strictEqual(formatStatusLabel('ready', null), 'Ready');
    assert.strictEqual(formatStatusLabel('published', undefined), 'Published');
    assert.strictEqual(formatStatusLabel('pending_approval'), 'Pending Approval');
  });

  it('formats status with percentage set up when progress is provided', () => {
    assert.strictEqual(formatStatusLabel('draft', 40), 'Draft · 40% set up');
    assert.strictEqual(formatStatusLabel('draft', 0), 'Draft · 0% set up');
    assert.strictEqual(formatStatusLabel('building', 75), 'Building · 75% set up');
    assert.strictEqual(formatStatusLabel('published', 100), 'Published · 100% set up');
  });
});
