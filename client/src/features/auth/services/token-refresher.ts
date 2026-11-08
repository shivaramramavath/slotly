// Service managing proactive access token refresh scheduling, tab visibility listeners, and online reconnection checks.

let refreshTimer: NodeJS.Timeout | null = null;
let currentTokenExp: number | null = null;
let activeRefreshFn: (() => Promise<void>) | null = null;

function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1] as string;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const parsed = JSON.parse(jsonPayload) as { exp?: number };
    return parsed.exp ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Schedules proactive refresh before token expiration, pausing while hidden. */
export function scheduleProactiveRefresh(
  accessToken: string | null,
  refreshFn: () => Promise<void>,
): void {
  activeRefreshFn = refreshFn;

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (!accessToken) {
    currentTokenExp = null;
    return;
  }

  const expMs = parseJwtExp(accessToken);
  if (!expMs) return;

  currentTokenExp = expMs;
  const now = Date.now();
  const timeUntilExp = expMs - now;

  // Refresh 60 seconds before expiry, or after 80% of remaining lifetime
  const refreshLeadTime = Math.min(60000, timeUntilExp * 0.2);
  const delay = Math.max(0, timeUntilExp - refreshLeadTime);

  if (typeof window !== 'undefined' && document.hidden) {
    // Pause scheduling while tab is hidden
    return;
  }

  refreshTimer = setTimeout(async () => {
    try {
      if (activeRefreshFn) {
        await activeRefreshFn();
      }
    } catch {
      // Refresh error handled within refresh pipeline
    }
  }, delay);
}

/** Checks whether the current token is close to expiry and triggers refresh if needed. */
export async function checkAndRefreshIfStale(): Promise<void> {
  if (!currentTokenExp || !activeRefreshFn) return;

  const now = Date.now();
  // If token is expired or within 60s of expiring, refresh immediately
  if (currentTokenExp - now <= 60000) {
    try {
      await activeRefreshFn();
    } catch {
      // Ignored here
    }
  }
}

// Setup visibility and online event listeners in browser environment
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      void checkAndRefreshIfStale();
    }
  });

  window.addEventListener('online', () => {
    void checkAndRefreshIfStale();
  });
}
