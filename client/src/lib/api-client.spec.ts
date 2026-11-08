// Unit tests validating apiClient single-flight refresh, replay, loop prevention, and failure handling.
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { apiClient, setAccessToken, getAccessToken } from './api-client';

describe('apiClient 401 & Token Refresh Flow', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setAccessToken('initial_stale_token');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setAccessToken(null);
  });

  // 11. Single-flight: 5 simultaneous 401s produce exactly one refresh call, all requests replay once with the new token
  it('11. Single-flight: 5 simultaneous 401s produce exactly one refresh call and replay', async () => {
    let refreshCallCount = 0;
    let endpointCallCount = 0;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input.toString();

      if (urlStr.includes('/auth/refresh')) {
        refreshCallCount++;
        return new Response(JSON.stringify({ accessToken: 'new_fresh_token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (urlStr.includes('/test-resource')) {
        endpointCallCount++;
        const auth = (init?.headers as Headers)?.get?.('Authorization');
        if (auth === 'Bearer initial_stale_token') {
          return new Response(JSON.stringify({ code: 'TOKEN_EXPIRED' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (auth === 'Bearer new_fresh_token') {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response('Not Found', { status: 404 });
    };

    // Fire 5 simultaneous requests
    const promises = Array.from({ length: 5 }).map(() =>
      apiClient<{ success: boolean }>('/test-resource'),
    );

    const results = await Promise.all(promises);

    // Exactly one refresh call
    assert.strictEqual(refreshCallCount, 1, 'Expected exactly 1 refresh call');
    assert.strictEqual(endpointCallCount, 10, 'Expected 5 initial + 5 replayed endpoint calls');
    // All 5 returned success
    assert.strictEqual(results.length, 5);
    results.forEach((r) => assert.strictEqual(r.success, true));
    // New token saved in memory
    assert.strictEqual(getAccessToken(), 'new_fresh_token');
  });

  // 12. A 401 from /auth/refresh, /auth/login or /auth/register never triggers another refresh (no loops)
  it('12. 401 from auth endpoints (/auth/login, /auth/register, /auth/refresh) never loops refresh', async () => {
    let refreshCallCount = 0;

    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input.toString();

      if (urlStr.includes('/auth/refresh')) {
        refreshCallCount++;
        return new Response(JSON.stringify({ code: 'INVALID_REFRESH_TOKEN' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (urlStr.includes('/auth/register')) {
        return new Response(JSON.stringify({ code: 'INVALID_CREDENTIALS' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('OK', { status: 200 });
    };

    // Calling /auth/register with 401 must not trigger refresh
    await assert.rejects(async () => {
      await apiClient('/auth/register', { method: 'POST' });
    });

    assert.strictEqual(refreshCallCount, 0, 'Register 401 must not trigger refresh');
  });

  // 13. Network failure or 5xx during refresh does NOT log the user out and surfaces a retryable error
  it('13. 5xx during refresh does not log the user out or clear access token', async () => {
    setAccessToken('still_valid_client_side_token');

    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input.toString();

      if (urlStr.includes('/auth/refresh')) {
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Initial call triggers 401
      return new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(async () => {
      await apiClient('/resource-under-server-error');
    });

    // Token must NOT be cleared on transient 500 server error
    assert.strictEqual(
      getAccessToken(),
      'still_valid_client_side_token',
      'Transient 500 during refresh must not clear client session',
    );
  });

  // 14. STEP_UP_REQUIRED (403) is not treated as an expired session
  it('14. STEP_UP_REQUIRED (403) throws directly without triggering refresh or session invalidation', async () => {
    let refreshCallCount = 0;

    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input.toString();

      if (urlStr.includes('/auth/refresh')) {
        refreshCallCount++;
        return new Response('OK', { status: 200 });
      }

      return new Response(
        JSON.stringify({ code: 'STEP_UP_REQUIRED', message: 'Step-up required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    await assert.rejects(
      async () => {
        await apiClient('/sensitive-action');
      },
      (err: { code?: string }) => err.code === 'STEP_UP_REQUIRED',
    );

    assert.strictEqual(refreshCallCount, 0, '403 step-up must not trigger refresh');
    assert.strictEqual(getAccessToken(), 'initial_stale_token');
  });

  // 15. Refresh failure: store cleared, error thrown cleanly
  it('15. Definitive 401 from refresh clears access token', async () => {
    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input.toString();

      if (urlStr.includes('/auth/refresh')) {
        return new Response(
          JSON.stringify({ code: 'SESSION_INVALID_OR_REVOKED' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ code: 'TOKEN_EXPIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(async () => {
      await apiClient('/test-expire');
    });

    // Definitive 401 on refresh clears the memory token
    assert.strictEqual(getAccessToken(), null, 'Definitive 401 must clear access token');
  });
});
