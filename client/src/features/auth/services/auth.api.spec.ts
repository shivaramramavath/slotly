// Unit tests for auth.api client methods and OAuth URL formatting.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { authApi } from './auth.api';

describe('authApi.getOAuthStartUrl', () => {
  it('builds start URL for google with default mode=login', () => {
    const url = authApi.getOAuthStartUrl('google');
    assert.match(url, /\/auth\/oauth\/google\/start\?mode=login$/);
  });

  it('builds start URL for github with mode=link', () => {
    const url = authApi.getOAuthStartUrl('github', 'link');
    assert.match(url, /\/auth\/oauth\/github\/start\?mode=link$/);
  });

  it('appends next redirect query param when provided', () => {
    const url = authApi.getOAuthStartUrl('google', 'login', '/projects/abc');
    assert.match(url, /mode=login/);
    assert.match(url, /next=%2Fprojects%2Fabc/);
  });
});
