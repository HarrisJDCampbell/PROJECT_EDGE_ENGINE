/**
 * PrizePicks Service
 * Fetches NBA player projections from PrizePicks' public API.
 * Caches aggressively to minimize requests.
 */

import axios from 'axios';
import { getOrFetch, oddsTTL } from '../cache/gameCache';
import logger from '../lib/logger';

const client = axios.create({
  baseURL: 'https://api.prizepicks.com',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'VisBets/2.0',
  },
});

// ── Stat type mapping: PrizePicks stat names → our internal stat keys ────────

const STAT_MAP: Record<string, string> = {
  'Points':               'points',
  'Rebounds':             'rebounds',
  'Assists':              'assists',
  '3-Pt Made':            'threes',
  'Pts+Rebs+Asts':        'pra',
  'Blocked Shots':        'blocks',
  'Steals':               'steals',
  'Turnovers':            'turnovers',
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface PPProjection {
  playerName: string;
  stat: string;       // our internal stat key
  line: number;
}

// ── Fetch + cache ────────────────────────────────────────────────────────────

/**
 * Returns a Map of "playerName:stat" → line value for all NBA projections.
 * Cached with the same TTL as odds data.
 */
export async function getPrizePicksProjections(): Promise<Map<string, PPProjection>> {
  return getOrFetch<Map<string, PPProjection>>(
    'prizepicks:nba-projections',
    oddsTTL(),
    async () => {
      const map = new Map<string, PPProjection>();
      try {
        const res = await client.get('/projections', {
          params: { league_id: 7, per_page: 250 },
        });

        const data = res.data?.data;
        const included = res.data?.included;
        if (!Array.isArray(data)) return map;

        // Build player ID → display name lookup from "included"
        const playerNames = new Map<string, string>();
        if (Array.isArray(included)) {
          for (const item of included) {
            if (item.type === 'new_player' && item.attributes?.display_name) {
              playerNames.set(item.id, item.attributes.display_name);
            }
          }
        }

        for (const proj of data) {
          if (proj.type !== 'projection') continue;
          const attrs = proj.attributes;
          if (!attrs || attrs.status !== 'pre_game') continue;

          const statType = attrs.stat_type;
          const internalStat = STAT_MAP[statType];
          if (!internalStat) continue;

          const lineScore = parseFloat(attrs.line_score);
          if (isNaN(lineScore) || lineScore <= 0) continue;

          // Resolve player name from relationship → included
          const playerId = proj.relationships?.new_player?.data?.id;
          const name = playerId ? playerNames.get(playerId) : attrs.description;
          if (!name) continue;

          const key = `${name.toLowerCase()}:${internalStat}`;
          map.set(key, { playerName: name, stat: internalStat, line: lineScore });
        }

        logger.info({ count: map.size }, 'PrizePicks projections loaded');
      } catch (err: any) {
        logger.warn({ error: err.message }, 'PrizePicks fetch failed');
      }
      return map;
    }
  );
}

/**
 * Look up a single player's PrizePicks line for a given stat.
 * Returns null if not found.
 */
export async function getPrizePicksLine(
  playerName: string,
  stat: string
): Promise<number | null> {
  try {
    const projections = await getPrizePicksProjections();
    const key = `${playerName.toLowerCase()}:${stat}`;
    return projections.get(key)?.line ?? null;
  } catch {
    return null;
  }
}
