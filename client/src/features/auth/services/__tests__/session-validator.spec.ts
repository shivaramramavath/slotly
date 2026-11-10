// Unit tests for session-validator utility functions and server session verification.
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { extractSessionId, validateSessionServer } from '../session-validator';

describe('extractSessionId', () => {
  it('returns null for null, undefined, or empty values', () => {
    assert.strictEqual(extractSessionId(null), null);
    assert.strictEqual(extractSessionId(undefined), null);
    assert.strictEqual(extractSessionId(''), null);
    assert.strictEqual(extractSessionId('   '), null);
  });

  it('returns null for legacy boolean flags or malformed values', () => {
    assert.strictEqual(extractSessionId('1'), null);
    assert.strictEqual(extractSessionId('true'), null);
    assert.strictEqual(extractSessionId('invalid_session_id'), null);
    assert.strictEqual(extractSessionId('s_invalid_token'), null);
  });

  it('extracts sessionId starting directly with ses_', () => {
    assert.strictEqual(
      extractSessionId('ses_0123456789abcdef'),
      'ses_0123456789abcdef',
    );
  });

  it('extracts sessionId from raw refresh token formatted as s_ses_...', () => {
    assert.strictEqual(
      extractSessionId('s_ses_9988776655aabbcc_0123456789abcdef'),
      'ses_9988776655aabbcc',
    );
  });
});

describe('validateSessionServer', () => {
  it('returns false immediately when no valid sessionId is present in cookie', async () => {
    const valid = await validateSessionServer('1');
    assert.strictEqual(valid, false);
  });

  it('returns true when server returns valid: true', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      return new Response(JSON.stringify({ valid: true, sessionId: 'ses_test123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    try {
      const valid = await validateSessionServer('ses_test123', 'http://test-server');
      assert.strictEqual(valid, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns false when server returns 401 unauthorized (expired or revoked session)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({
          statusCode: 401,
          message: 'Your session has ended or been revoked.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    try {
      const valid = await validateSessionServer('ses_expired', 'http://test-server');
      assert.strictEqual(valid, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns false when network or fetch error occurs', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      throw new Error('Connection refused');
    });

    try {
      const valid = await validateSessionServer('ses_down', 'http://test-server');
      assert.strictEqual(valid, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
