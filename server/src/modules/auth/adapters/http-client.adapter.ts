// Network HTTP client adapter providing injectable request abstraction for OAuth providers.
import { Injectable } from '@nestjs/common';

/** Dependency injection token for HTTP client adapter. */
export const HTTP_CLIENT = Symbol('HTTP_CLIENT');

/** Interface defining minimal HTTP client operations. */
export interface HttpClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<T>;
  post<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<T>;
}

/** Default implementation of HttpClient using native fetch. */
@Injectable()
export class FetchHttpClient implements HttpClient {
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      headers: headers || {},
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `HTTP GET ${url} failed with status ${res.status}: ${text}`,
      );
    }
    return (await res.json()) as T;
  }

  async post<T>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const isUrlEncoded =
      headers?.['Content-Type'] === 'application/x-www-form-urlencoded';
    const payload = isUrlEncoded
      ? new URLSearchParams(body as Record<string, string>).toString()
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);

    const mergedHeaders: Record<string, string> = {
      ...(isUrlEncoded
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : { 'Content-Type': 'application/json' }),
      ...headers,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: mergedHeaders,
      body: payload,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(
        `HTTP POST ${url} failed with status ${res.status}: ${text}`,
      );
    }
    return (await res.json()) as T;
  }
}
