/**
 * In-memory login throttle for a two-user household app. One Node process
 * serves the whole site, so a process-local map is enough to stop a script
 * from hammering bcrypt. Keys are the client address and the username so a
 * stranger cannot lock the household out by guessing at one name alone.
 */
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;

type Bucket = { failures: number; first: number; lockedUntil: number };

const globalForLimiter = globalThis as unknown as { loginBuckets?: Map<string, Bucket> };
const buckets = (globalForLimiter.loginBuckets ??= new Map<string, Bucket>());

function bucketFor(key: string, now: number): Bucket {
  const existing = buckets.get(key);
  if (existing && now - existing.first < WINDOW_MS) return existing;
  const fresh: Bucket = { failures: 0, first: now, lockedUntil: 0 };
  buckets.set(key, fresh);
  return fresh;
}

function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, b] of buckets) {
    if (now - b.first >= WINDOW_MS && b.lockedUntil <= now) buckets.delete(key);
  }
}

export function loginLocked(keys: string[], now = Date.now()): boolean {
  return keys.some((key) => {
    const b = buckets.get(key);
    return Boolean(b && b.lockedUntil > now);
  });
}

export function recordLoginFailure(keys: string[], now = Date.now()) {
  sweep(now);
  for (const key of keys) {
    const b = bucketFor(key, now);
    b.failures += 1;
    if (b.failures >= MAX_FAILURES) b.lockedUntil = now + WINDOW_MS;
  }
}

export function clearLoginFailures(keys: string[]) {
  for (const key of keys) buckets.delete(key);
}

/** Exposed for tests. */
export const LOGIN_LIMITS = { WINDOW_MS, MAX_FAILURES } as const;
