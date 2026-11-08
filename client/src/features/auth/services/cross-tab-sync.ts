// Cross-tab coordination utilizing Web Locks API and BroadcastChannel for serialized refresh and unified auth states.

type AuthChannelMessage =
  | { type: 'token_refreshed'; timestamp: number }
  | { type: 'logout' }
  | { type: 'login' };

let channel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel('slotly_auth_sync');
  }
  return channel;
}

/** Broadcasts an authentication state event across all browser tabs. */
export function broadcastAuthEvent(message: AuthChannelMessage): void {
  const ch = getBroadcastChannel();
  if (ch) {
    try {
      ch.postMessage(message);
    } catch {
      // Fallback or ignore in restricted contexts
    }
  }
}

/** Subscribes to cross-tab auth state events with an incoming message callback. */
export function subscribeToAuthEvents(
  callback: (message: AuthChannelMessage) => void,
): () => void {
  const ch = getBroadcastChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<AuthChannelMessage>) => {
    callback(event.data);
  };

  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
  };
}

/** Serializes a critical operation (such as token refresh) across browser tabs using Web Locks API with fallback. */
export async function withCrossTabLock<T>(
  lockName: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (
    typeof navigator !== 'undefined' &&
    'locks' in navigator &&
    typeof navigator.locks?.request === 'function'
  ) {
    return navigator.locks.request(lockName, async () => {
      return operation();
    });
  }

  // Fallback to direct execution when Web Locks API is unavailable
  return operation();
}
