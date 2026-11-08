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
  const handlers = Array.from(cleanupHandlers.entries());
  for (const [id, fn] of handlers) {
    try {
      await fn();
    } catch (err) {
      console.error(`[LogoutRegistry] Cleanup failed for ${id}:`, err);
    }
  }
}
