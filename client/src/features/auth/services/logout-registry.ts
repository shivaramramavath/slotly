// Observer pattern registry for components and features to register cleanup handlers on user logout or session expiration.

type CleanupCallback = () => void | Promise<void>;

const cleanupHandlers = new Map<string, CleanupCallback>();

/** Registers a cleanup callback to be executed when the user logs out or session expires. */
export function registerLogoutCleanup(
  id: string,
  callback: CleanupCallback,
): () => void {
  cleanupHandlers.set(id, callback);
  return () => {
    cleanupHandlers.delete(id);
  };
}

/** Executes all registered cleanup callbacks (stores, cache, sockets, timers). */
export async function executeLogoutCleanup(): Promise<void> {
  if (typeof document !== 'undefined') {
    document.cookie = 'slotly_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
  const handlers = Array.from(cleanupHandlers.entries());
  for (const [id, fn] of handlers) {
    try {
      await fn();
    } catch (err) {
      console.error(`[LogoutRegistry] Cleanup failed for ${id}:`, err);
    }
  }
}
