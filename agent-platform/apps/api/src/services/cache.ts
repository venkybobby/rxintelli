interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Tenant-scoped cache key.
 */
export function cacheKey(tenantId: string, ...parts: string[]): string {
  return ['tenant', tenantId, ...parts].join(':');
}

/**
 * Get cached value. Returns undefined if miss or expired.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set cached value with TTL in seconds.
 */
export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
