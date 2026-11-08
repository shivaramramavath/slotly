// Utility for sanitizing post-authentication redirect targets to prevent open redirect vulnerabilities.

const DEFAULT_REDIRECT = '/dashboard';

/**
 * Validates and sanitizes a post-auth redirect path ensuring it is strictly relative.
 * Rejects absolute URLs, protocol-relative paths, backslashes, and control characters.
 */
export function sanitizeNext(next?: unknown): string {
  if (typeof next !== 'string' || !next.trim()) {
    return DEFAULT_REDIRECT;
  }

  const trimmed = next.trim();

  // Must begin with a single slash and not a double slash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  // Must not contain backslashes
  if (trimmed.includes('\\')) {
    return DEFAULT_REDIRECT;
  }

  // Must not contain control characters or newlines (ASCII 0-31 or 127)
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code <= 31 || code === 127) {
      return DEFAULT_REDIRECT;
    }
  }

  // Must not contain schemes
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed.slice(1))) {
    return DEFAULT_REDIRECT;
  }

  return trimmed;
}
