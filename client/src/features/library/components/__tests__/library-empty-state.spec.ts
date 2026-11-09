// Unit tests for library empty state messaging and action button label helpers.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getLibraryEmptyMessage,
  getLibraryAddLabel,
} from '../library-empty-state';

describe('getLibraryEmptyMessage', () => {
  it('returns exact expected copy for faculty directory', () => {
    assert.strictEqual(
      getLibraryEmptyMessage('faculty'),
      "No faculty found. Click 'Add faculty' or use 'Import' to populate.",
    );
  });

  it('returns exact expected copy for subject catalog', () => {
    assert.strictEqual(
      getLibraryEmptyMessage('subjects'),
      "No subjects found. Click 'Add subject' or use 'Import' to populate.",
    );
  });

  it('returns exact expected copy for rooms facilities', () => {
    assert.strictEqual(
      getLibraryEmptyMessage('rooms'),
      "No rooms registered. Click 'Add room' or use 'Import' to populate.",
    );
  });
});

describe('getLibraryAddLabel', () => {
  it('returns primary button label matching active resource type', () => {
    assert.strictEqual(getLibraryAddLabel('faculty'), 'Add faculty');
    assert.strictEqual(getLibraryAddLabel('subjects'), 'Add subject');
    assert.strictEqual(getLibraryAddLabel('rooms'), 'Add room');
  });
});
