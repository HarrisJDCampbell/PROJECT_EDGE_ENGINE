/**
 * Cache Layer
 * Uses node-cache (in-memory) with TTLs tuned for live game data.
 * All NBA endpoints are aware of "game hours" (noon–midnight ET).
 */

import NodeCache from 'node-cache';

// ── TTL constants (seconds) ──────────────────────────────────────────────────
export const TTL = {
  SCHEDULE: 6 * 60 * 60,             // 6 hours
  PLAYER_STATS: 2 * 60 * 60,         // 2 hours
  STANDINGS: 12 * 60 * 60,           // 12 hours
  PLAYER_INFO: 24 * 60 * 60,         // 24 hours
  LIVE_ODDS_GAME_HOURS: 10 * 60,     // 10 minutes during game hours
  LIVE_ODDS_OFF_HOURS: 60 * 60,      // 1 hour outside game hours
  LIVE_BOXSCORE: 2 * 60,             // 2 minutes during active games
} as const;

const cache = new NodeCache({ stdTTL: TTL.PLAYER_STATS, checkperiod: 120 });

// In-flight request deduplication: prevents N concurrent callers from all hitting
// the API for the same key before the first one has cached the result.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inFlight = new Map<string, Promise<any>>();

/** Returns true if the current ET time is between noon and midnight (game hours). */
export function isGameHours(): boolean {
  const etHour = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(new Date()),
    10
  );
  return etHour >= 12; // noon–midnight ET
}

/** Returns the appropriate odds/props TTL based on time of day. */
export function oddsTTL(): number {
  return isGameHours() ? TTL.LIVE_ODDS_GAME_HOURS : TTL.LIVE_ODDS_OFF_HOURS;
}

/**
 * Fetch from cache or execute the fetcher.
 * @param key   Cache key
 * @param ttl   TTL in seconds
 * @param fn    Async function that fetches the data
 */
export async function getOrFetch<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;

  // Return the already-in-flight promise to avoid duplicate API calls
  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;

  const promise = (async () => {
    try {
      const data = await fn();
      cache.set(key, data, ttl);
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export function invalidate(key: string): void {
  cache.del(key);
}

export function invalidatePattern(prefix: string): void {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  cache.del(keys);
}

export default cache;
