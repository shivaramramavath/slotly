// Core implementation for api-client with single-flight refresh, cross-tab locks, replay validation, and cleanup.
import { toast } from '@/components/ui/toast';
import { executeLogoutCleanup } from '@/features/auth/services/logout-registry';
import {
  withCrossTabLock,
  broadcastAuthEvent,
} from '@/features/auth/services/cross-tab-sync';
import { scheduleProactiveRefresh } from '@/features/auth/services/token-refresher';

let memoryAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** Sets the active in-memory access token and resets proactive refresh scheduling. */
export function setAccessToken(token: string | null) {
  memoryAccessToken = token;
  if (token) {
    scheduleProactiveRefresh(token, async () => {
      await silentRefresh();
    });
  } else {
    scheduleProactiveRefresh(null, async () => {});
  }
}

/** Returns the active in-memory access token. */
export function getAccessToken(): string | null {
  return memoryAccessToken;
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Silently refreshes the access token using the httpOnly cookie. */
export async function silentRefresh(): Promise<string> {
  return withCrossTabLock('slotly_token_refresh', async () => {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const data = (await refreshRes.json()) as { accessToken: string; user?: unknown };
      setAccessToken(data.accessToken);
      if (data.user) {
        try {
          const { useAuthStore } = await import('@/features/auth/store/auth.store');
          useAuthStore.getState().setAuth(data.user as never, data.accessToken);
        } catch {
          // ignore
        }
      }
      broadcastAuthEvent({ type: 'token_refreshed', timestamp: Date.now() });
      return data.accessToken;
    }

    if (refreshRes.status === 401 || refreshRes.status === 403) {
      setAccessToken(null);
      try {
        const { useAuthStore } = await import('@/features/auth/store/auth.store');
        useAuthStore.getState().clearAuth();
      } catch {
        // ignore
      }
      await executeLogoutCleanup();
      broadcastAuthEvent({ type: 'logout' });
      toast.error('Session expired', 'Please sign in again.');
      throw new Error('Session expired');
    }

    // 5xx or transient network error: do NOT log out, throw retryable error
    throw new Error('Authentication service temporarily unavailable');
  });
}

/** Dispatches HTTP requests with automatic auth headers, single-flight refresh on 401, and safe retry. */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers);

  if (memoryAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${memoryAccessToken}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends httpOnly refresh token cookie
  });

  const isAuthEndpoint =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/register');

  if (response.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const freshToken = await silentRefresh();
        processQueue(null, freshToken);

        // Replay original request once
        headers.set('Authorization', `Bearer ${freshToken}`);
        const retryRes = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });

        if (!retryRes.ok) {
          let errData: { code?: string; message?: string } = {};
          try {
            errData = (await retryRes.json()) as { code?: string; message?: string };
          } catch {
            // ignore
          }
          throw errData;
        }

        if (retryRes.status === 204) return null as T;
        return (await retryRes.json()) as T;
      } catch (err) {
        processQueue(err, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      // Queue requests while refreshing
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: async (token: string) => {
            try {
              headers.set('Authorization', `Bearer ${token}`);
              const retryRes = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
              });

              if (!retryRes.ok) {
                let errData: { code?: string; message?: string } = {};
                try {
                  errData = (await retryRes.json()) as { code?: string; message?: string };
                } catch {
                  // ignore
                }
                reject(errData);
                return;
              }

              if (retryRes.status === 204) {
                resolve(null as T);
              } else {
                resolve((await retryRes.json()) as T);
              }
            } catch (err) {
              reject(err);
            }
          },
          reject,
        });
      });
    }
  }

  if (!response.ok) {
    let errorData: { code?: string; message?: string } = {};
    try {
      errorData = (await response.json()) as { code?: string; message?: string };
    } catch {
      // ignore JSON parse error
    }

    const isSilentRefresh =
      endpoint.includes('/auth/refresh') && response.status === 401;
    if (!isSilentRefresh) {
      if (errorData.code) {
        toast.fromErrorCode(errorData.code, errorData.message);
      } else {
        toast.error('Request failed', errorData.message || response.statusText);
      }
    }
    throw errorData;
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
