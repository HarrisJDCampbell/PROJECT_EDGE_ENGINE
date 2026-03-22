/**
 * Odds API Quota Tracker
 * Tracks TheOddsAPI request budget from response headers.
 * Updated on every TheOddsAPI response via updateFromHeaders().
 */

interface QuotaState {
  remaining: number;
  used: number;
  lastUpdated: Date | null;
}

const state: QuotaState = {
  remaining: -1, // -1 = unknown (no response received yet)
  used: -1,
  lastUpdated: null,
};

const LOW_THRESHOLD = 50;

/**
 * Update quota state from TheOddsAPI response headers.
 * Call this after every TheOddsAPI response.
 */
export function updateFromHeaders(headers: Record<string, string | string[] | undefined>): void {
  const remaining = headers['x-requests-remaining'];
  const used = headers['x-requests-used'];

  if (remaining !== undefined) state.remaining = Number(remaining);
  if (used !== undefined) state.used = Number(used);
  state.lastUpdated = new Date();

  if (state.remaining >= 0 && state.remaining < LOW_THRESHOLD) {
    console.warn(`⚠️ Odds API quota low: ${state.remaining} remaining`);
  }
}

/** Returns current quota state. */
export function getStatus(): {
  remaining: number;
  used: number;
  isLow: boolean;
  lastUpdated: string | null;
} {
  return {
    remaining: state.remaining,
    used: state.used,
    isLow: isLow(),
    lastUpdated: state.lastUpdated?.toISOString() ?? null,
  };
}

/** True if remaining quota is known and below the safety threshold. */
export function isLow(): boolean {
  if (state.remaining < 0) return false; // unknown — assume ok
  return state.remaining < LOW_THRESHOLD;
}
