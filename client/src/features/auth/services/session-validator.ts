// Service utility validating authentication sessions against the server session endpoint.

/**
 * Extracts a normalized session identifier from a raw cookie value or refresh token.
 * Returns null if the value is empty, malformed, or not in a recognizable session format.
 */
export function extractSessionId(cookieValue: string | null | undefined): string | null {
  if (!cookieValue) {
    return null;
  }
  const trimmed = cookieValue.trim();
  if (trimmed.startsWith('s_ses_')) {
    const match = trimmed.match(/^s_(ses_[a-zA-Z0-9]+)(?:_.*)?$/);
    return match && match[1] ? match[1] : null;
  }
  if (trimmed.startsWith('ses_')) {
    const match = trimmed.match(/^(ses_[a-zA-Z0-9]+)/);
    return match && match[1] ? match[1] : null;
  }
  return null;
}

/**
 * Validates a session against the Redis-backed session endpoint on the backend server.
 * Returns true only when the session exists, is active, and has not expired or been revoked.
 */
export async function validateSessionServer(
  cookieValue: string | null | undefined,
  baseUrl?: string,
): Promise<boolean> {
  const sessionId = extractSessionId(cookieValue);
  if (!sessionId) {
    return false;
  }

  const apiHost =
    baseUrl ||
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000';

  try {
    const res = await fetch(`${apiHost}/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as { valid?: boolean };
    return data?.valid === true;
  } catch {
    return false;
  }
}

/**
 * Resolves destination redirect URL for root landing page requests.
 * Returns '/dashboard' when session is active and verified, or null when visitor should view landing page.
 */
export async function getLandingAuthRedirect(
  cookieValue: string | null | undefined,
  validator: (cookie: string | null | undefined) => Promise<boolean> = validateSessionServer,
): Promise<string | null> {
  if (!cookieValue) {
    return null;
  }
  const isValid = await validator(cookieValue);
  return isValid ? '/dashboard' : null;
}
