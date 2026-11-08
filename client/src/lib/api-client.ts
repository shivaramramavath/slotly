// Core implementation for api-client in client/src/lib.
import { toast } from '@/components/ui/toast';

let memoryAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** Function performing set access token. */
export function setAccessToken(token: string | null) {
  memoryAccessToken = token;
}

/** Function performing get access token. */
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

/** Function performing api client. */
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

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const data = (await refreshRes.json()) as { accessToken: string };
          setAccessToken(data.accessToken);
          processQueue(null, data.accessToken);
          // Retry original request
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
          return (await retryRes.json()) as T;
        } else {
          processQueue(new Error('Session expired'), null);
          setAccessToken(null);
          toast.error('Session expired', 'Please sign in again.');
        }
      } catch (err) {
        processQueue(err, null);
      } finally {
        isRefreshing = false;
      }
    } else {
      // Queue requests while refreshing
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: async (token: string) => {
            headers.set('Authorization', `Bearer ${token}`);
            const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
            resolve((await retryRes.json()) as T);
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
