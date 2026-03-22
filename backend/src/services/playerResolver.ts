/**
 * Player Resolver
 * Maps player names from TheOddsAPI to API-Sports player IDs.
 *
 * API-Sports /players endpoint:
 *   - Requires: search=<name> (no league or season filter — those cause errors)
 *   - Returns: { id, name, ... } where name is "Lastname Firstname" format
 *
 * We use name matching via sorted-word normalization to handle the reversed format.
 * Results cached 24h.
 */

import axios from 'axios';
import { getOrFetch, TTL } from '../cache/gameCache';
import { normalizePlayerName } from './apiSports';

const client = axios.create({
  baseURL: 'https://v1.basketball.api-sports.io',
  headers: { 'x-apisports-key': process.env.API_SPORTS_KEY ?? '' },
  timeout: 10000,
});

interface ApiSportsPlayerBasic {
  id: number;
  name: string; // "Lastname Firstname" or abbreviated e.g. "Davis Anthony", "C. Flagg"
}

/** Resolve one player name → API-Sports player ID (null if not found) */
export async function resolvePlayerName(name: string): Promise<number | null> {
  const normTarget = normalizePlayerName(name);
  const cacheKey = `player-resolver-v2:${normTarget}`;

  return getOrFetch<number | null>(cacheKey, TTL.PLAYER_INFO, async () => {
    try {
      // Search by last name (last word of input name)
      const parts = name.trim().split(/\s+/);
      const lastName = parts[parts.length - 1];

      const res = await client.get('/players', { params: { search: lastName } });
      const players: ApiSportsPlayerBasic[] = res.data?.response ?? [];

      // Pass 1: sorted-word exact match (handles "Anthony Davis" ↔ "Davis Anthony")
      for (const p of players) {
        if (normalizePlayerName(p.name) === normTarget) return p.id;
      }

      // Pass 2: first name word of input matches any word in API name (covers abbreviations)
      const firstWord = parts[0].toLowerCase().replace(/[^a-z]/g, '');
      if (firstWord.length > 1) {
        for (const p of players) {
          const apiWords = p.name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
          const apiLast = apiWords[0]; // API format is Lastname first
          if (apiLast === lastName.toLowerCase()) return p.id;
        }
      }

      return null;
    } catch {
      return null;
    }
  });
}

/**
 * Resolve multiple names in parallel (batched 5 at a time).
 * NOTE: In the box-score pipeline, player IDs are used only for the
 * playerApiSportsId field (display only). Game logs come from box scores.
 */
export async function resolvePlayerNames(
  names: string[]
): Promise<Map<string, number | null>> {
  const unique = [...new Set(names)];
  const result = new Map<string, number | null>();

  const BATCH = 5;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const ids = await Promise.all(batch.map(resolvePlayerName));
    batch.forEach((name, idx) => result.set(name, ids[idx]));
  }

  return result;
}
