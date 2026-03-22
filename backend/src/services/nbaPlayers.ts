/**
 * NBA Player Lookup
 * Fetches the NBA static player index (cdn.nba.com) and resolves
 * player names → NBA personId for headshot URLs.
 *
 * Headshot URL format:
 *   https://cdn.nba.com/headshots/nba/latest/260x190/{personId}.png
 *
 * The player index is a static file — cached for 24h.
 * All errors are caught silently; resolveNBAPersonId never throws.
 */

import axios from 'axios';
import { getOrFetch } from '../cache/gameCache';

const PLAYER_INDEX_URL =
  'https://cdn.nba.com/static/json/staticData/playerIndex.json';

const HEADSHOT_BASE = 'https://cdn.nba.com/headshots/nba/latest/260x190';

interface NBAPlayerEntry {
  personId: number;
  lastName: string;
  firstName: string;
}

/** Strip diacritics so "Jokić" → "jokic", "Dončić" → "doncic", etc. */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function fetchPlayerIndex(): Promise<NBAPlayerEntry[]> {
  try {
    const res = await axios.get(PLAYER_INDEX_URL, { timeout: 10000 });
    const rs = res.data?.resultSets?.[0];
    if (!rs) return [];

    const headers: string[] = rs.headers;
    const pidIdx   = headers.indexOf('PERSON_ID');
    const lastIdx  = headers.indexOf('PLAYER_LAST_NAME');
    const firstIdx = headers.indexOf('PLAYER_FIRST_NAME');
    if (pidIdx === -1) return [];

    return (rs.rowSet as unknown[][]).map((row) => ({
      personId:  row[pidIdx]  as number,
      lastName:  stripDiacritics(row[lastIdx]  as string),
      firstName: stripDiacritics(row[firstIdx] as string),
    }));
  } catch {
    console.warn('[NBA Players] Failed to fetch player index — headshots will use fallback');
    return [];
  }
}

let playerMap: Map<string, number> | null = null;

async function getPlayerMap(): Promise<Map<string, number>> {
  if (playerMap) return playerMap;

  try {
    const players = await getOrFetch<NBAPlayerEntry[]>(
      'nba:player-index',
      24 * 60 * 60,
      fetchPlayerIndex
    );
    playerMap = new Map<string, number>();
    for (const p of players) {
      playerMap.set(`${p.firstName} ${p.lastName}`, p.personId);
      if (!playerMap.has(p.lastName)) {
        playerMap.set(p.lastName, p.personId);
      }
    }
  } catch {
    playerMap = new Map(); // empty — graceful degradation, headshots show initials
  }

  return playerMap;
}

/**
 * Resolve a player name (any format) to an NBA personId.
 * Returns null if not found or on error.
 */
export async function resolveNBAPersonId(name: string): Promise<number | null> {
  try {
    const map = await getPlayerMap();
    const lower = stripDiacritics(name);

    // Pass 1: exact "firstname lastname"
    if (map.has(lower)) return map.get(lower)!;

    // Pass 2: try "lastname firstname" reversed
    const parts = lower.split(/\s+/);
    if (parts.length === 2) {
      const reversed = `${parts[1]} ${parts[0]}`;
      if (map.has(reversed)) return map.get(reversed)!;
    }

    // Pass 3: last name only (avoid short names)
    const lastName = parts[parts.length - 1];
    if (lastName.length > 3 && map.has(lastName)) return map.get(lastName)!;

    return null;
  } catch {
    return null;
  }
}

/** Build a CDL headshot URL for an NBA personId. */
export function headshotUrl(personId: number): string {
  return `${HEADSHOT_BASE}/${personId}.png`;
}
