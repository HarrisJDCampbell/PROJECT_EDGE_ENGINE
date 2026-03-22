/**
 * Free Daily Unlocks
 * Determines which player props are unlocked for free-tier users each day.
 * Uses a deterministic hash based on the date + player ID so the same
 * set of players is unlocked for all free users on a given day, but
 * the set rotates daily for variety.
 */

const FREE_UNLOCKS_PER_DAY = 5;

/**
 * Simple deterministic hash for seeding.
 * Produces a consistent number from a string.
 */
function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if a prop should be unlocked for free users today.
 * Uses the current date + prop ID to produce a stable daily set.
 *
 * @param propId  Unique prop identifier (e.g. "LeBronJames-PTS")
 * @param totalProps  Total number of props in today's slate (used for distribution)
 */
export function isFreeUnlocked(propId: string, totalProps: number = 100): boolean {
  const today = new Date().toISOString().split('T')[0]; // "2026-03-21"
  const seed = hashSeed(today);
  const propHash = hashSeed(propId);

  // Combine date seed with prop hash and check if it falls in the unlock window
  const combined = (seed + propHash) % Math.max(totalProps, 1);
  return combined < FREE_UNLOCKS_PER_DAY;
}
