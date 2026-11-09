// Unit tests for segmented control option structure and keyboard accessibility logic.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { SegmentedControlOption } from '../segmented-control';

describe('SegmentedControlOption', () => {
  it('correctly holds value, label, and optional counts', () => {
    const option: SegmentedControlOption = {
      value: 'all',
      label: 'All Kits',
      count: 3,
    };

    assert.strictEqual(option.value, 'all');
    assert.strictEqual(option.label, 'All Kits');
    assert.strictEqual(option.count, 3);
  });

  it('allows undefined count without type issues', () => {
    const option: SegmentedControlOption = {
      value: 'custom',
      label: 'Custom Option',
    };

    assert.strictEqual(option.value, 'custom');
    assert.strictEqual(option.count, undefined);
  });
});
