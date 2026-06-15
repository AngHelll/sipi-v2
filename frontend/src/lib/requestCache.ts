/**
 * In-memory TTL cache for read-heavy API calls (filters, status, dashboard).
 * Reduces burst traffic when navigating between pages that share the same data.
 */
const cache = new Map<string, { expires: number; value: unknown }>();

export async function getCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) {
    return hit.value as T;
  }

  const value = await loader();
  cache.set(key, { expires: now + ttlMs, value });
  return value;
}

export function invalidateCached(keyPrefix?: string): void {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}
