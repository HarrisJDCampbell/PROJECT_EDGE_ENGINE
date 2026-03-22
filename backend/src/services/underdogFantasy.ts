/**
 * Underdog Fantasy Service
 * Fetches NBA player over/under lines from Underdog's public API.
 * Caches aggressively to minimize requests.
 */

import axios from 'axios';
import { getOrFetch, oddsTTL } from '../cache/gameCache';
import logger from '../lib/logger';

const client = axios.create({
  baseURL: 'https://api.underdogfantasy.com',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'VisBets/2.0',
  },
});

// ── Stat type mapping: Underdog stat names → our internal stat keys ──────────

const STAT_MAP: Record<string, string> = {
  'points':                   'points',
  'rebounds':                 'rebounds',
  'assists':                  'assists',
  'three_pointers_made':      'threes',
  'pts_rebs_asts':            'pra',
  'blocked_shots':            'blocks',
  'steals':                   'steals',
  'turnovers':                'turnovers',
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface UDLine {
  playerName: string;
  stat: string;       // our internal stat key
  line: number;
}

// ── Fetch + cache ────────────────────────────────────────────────────────────

/**
 * Returns a Map of "playerName:stat" → line value for all NBA over/under lines.
 * Cached with the same TTL as odds data.
 */
export async function getUnderdogLines(): Promise<Map<string, UDLine>> {
  return getOrFetch<Map<string, UDLine>>(
    'underdog:nba-lines',
    oddsTTL(),
    async () => {
      const map = new Map<string, UDLine>();
      try {
        const res = await client.get('/beta/v5/over_under_lines', {
          params: { sport: 'NBA' },
        });

        const body = res.data;

        // Build player ID → name lookup from appearances + players
        const playerNames = new Map<string, string>();
        const appearancePlayer = new Map<string, string>(); // appearance_id → player_id

        if (Array.isArray(body?.players)) {
          for (const p of body.players) {
            if (p.id && (p.first_name || p.last_name)) {
              playerNames.set(
                String(p.id),
                `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
              );
            }
          }
        }

        if (Array.isArray(body?.appearances)) {
          for (const a of body.appearances) {
            if (a.id && a.player_id) {
              appearancePlayer.set(String(a.id), String(a.player_id));
            }
          }
        }

        const lines = body?.over_under_lines ?? [];
        if (!Array.isArray(lines)) return map;

        for (const line of lines) {
          // Resolve stat type
          const statRaw =
            line.over_under?.appearance_stat?.stat ??
            line.over_under?.appearance_stat?.display_stat ??
            '';
          const internalStat = STAT_MAP[statRaw.toLowerCase()] ?? STAT_MAP[statRaw];
          if (!internalStat) continue;

          const lineValue = parseFloat(line.stat_value);
          if (isNaN(lineValue) || lineValue <= 0) continue;

          // Resolve player name
          const appearanceId =
            line.over_under?.appearance_id ??
            line.appearance_id ??
            '';
          const playerId = appearancePlayer.get(String(appearanceId));
          const name = playerId ? playerNames.get(playerId) : null;
          if (!name) continue;

          const key = `${name.toLowerCase()}:${internalStat}`;
          map.set(key, { playerName: name, stat: internalStat, line: lineValue });
        }

        logger.info({ count: map.size }, 'Underdog lines loaded');
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Underdog fetch failed');
      }
      return map;
    }
  );
}

/**
 * Look up a single player's Underdog line for a given stat.
 * Returns null if not found.
 */
export async function getUnderdogLine(
  playerName: string,
  stat: string
): Promise<number | null> {
  try {
    const lines = await getUnderdogLines();
    const key = `${playerName.toLowerCase()}:${stat}`;
    return lines.get(key)?.line ?? null;
  } catch {
    return null;
  }
}
