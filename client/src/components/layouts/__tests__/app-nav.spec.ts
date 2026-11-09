// Unit tests for navigation active route matching logic.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isNavActive } from '../app-nav';

describe('isNavActive', () => {
  it('identifies exact path matches', () => {
    assert.strictEqual(isNavActive('/projects', '/projects'), true);
    assert.strictEqual(isNavActive('/library', '/library'), true);
    assert.strictEqual(isNavActive('/institutions', '/institutions'), true);
    assert.strictEqual(isNavActive('/blueprint-templates', '/blueprint-templates'), true);
    assert.strictEqual(isNavActive('/templates', '/blueprint-templates'), true);
    assert.strictEqual(isNavActive('/kits', '/blueprint-templates'), true);
  });

  it('matches sub-routes to parent navigation link', () => {
    assert.strictEqual(isNavActive('/projects/6af090e2060203a50de54b2f/blueprint', '/projects'), true);
    assert.strictEqual(isNavActive('/projects/new', '/projects'), true);
    assert.strictEqual(isNavActive('/institutions/departments', '/institutions'), true);
    assert.strictEqual(isNavActive('/library/faculty', '/library'), true);
  });

  it('treats /dashboard as active on projects navigation link', () => {
    assert.strictEqual(isNavActive('/dashboard', '/projects'), true);
  });

  it('rejects unrelated paths', () => {
    assert.strictEqual(isNavActive('/settings', '/projects'), false);
    assert.strictEqual(isNavActive('/profile', '/library'), false);
    assert.strictEqual(isNavActive('/library', '/projects'), false);
  });
});
