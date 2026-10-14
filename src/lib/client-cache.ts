"use client";
// In-memory stale-while-revalidate cache for dashboard reads. Revisiting a
// section shows the last result instantly while a fresh copy loads. Memory
// only (nothing persists on the device) and scoped to one signed-in user.
const store = new Map<string, { at: number; value: unknown }>();
let scope = "";
// Entries older than this are not shown at all; newer ones show while refreshing.
const MAX_AGE_MS = 5 * 60 * 1000;

export function setCacheScope(userId: string) {
  if (scope !== userId) store.clear();
  scope = userId;
}

export function readCache<T>(key: string): T | undefined {
  const hit = store.get(`${scope}:${key}`);
  if (!hit || Date.now() - hit.at > MAX_AGE_MS) return undefined;
  return hit.value as T;
}

export function writeCache(key: string, value: unknown) {
  store.set(`${scope}:${key}`, { at: Date.now(), value });
}

export function clearCache() {
  store.clear();
}
