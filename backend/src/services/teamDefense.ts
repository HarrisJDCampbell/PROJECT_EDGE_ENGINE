/**
 * Team Defensive Ratings — NBA Season
 *
 * Defensive rating = points allowed per 100 possessions.
 * League average: ~114.2
 *
 * Primary source: computed dynamically from game_logs (points allowed).
 * Fallback: hardcoded baseline ratings (refreshed periodically).
 *
 * opponentDefFactor for a given stat:
 *   base = teamDefRating / LEAGUE_AVG  (>1 = weak defense = more scoring)
 *   The factor is then scaled per stat type, since rebounds/assists are
 *   less sensitive to opponent quality than points.
 */

import type { StatKey } from './projections';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import logger from '../lib/logger';

const LEAGUE_AVG_DEF_RATING = 114.2;

// ── Dynamic rating cache ─────────────────────────────────────────────────────
let _dynamicRatings: Record<string, number> | null = null;
let _dynamicRatingsExpiry = 0;
const DYNAMIC_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Compute defensive ratings from game_logs: average points scored
 * AGAINST each team (higher = weaker defense).
 * Falls back to hardcoded ratings if DB is unavailable or empty.
 */
async function fetchDynamicDefRatings(): Promise<Record<string, number>> {
  try {
    // Get points scored against each team in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('game_logs')
      .select('opponent_name, points')
      .gte('game_date', thirtyDaysAgo)
      .not('points', 'is', null);

    if (error || !data || data.length < 100) {
      // Not enough data — fall back to hardcoded
      return {};
    }

    // Aggregate: average points scored against each opponent
    const teamPoints: Record<string, { total: number; games: number }> = {};
    for (const row of data) {
      const team = row.opponent_name;
      if (!team || row.points == null) continue;
      if (!teamPoints[team]) teamPoints[team] = { total: 0, games: 0 };
      teamPoints[team].total += row.points;
      teamPoints[team].games += 1;
    }

    const ratings: Record<string, number> = {};
    for (const [team, stats] of Object.entries(teamPoints)) {
      if (stats.games >= 5) {
        // Approximate defensive rating from avg points allowed
        ratings[team] = Math.round((stats.total / stats.games) * 10) / 10;
      }
    }

    if (Object.keys(ratings).length >= 20) {
      logger.info(`[TeamDefense] Dynamic ratings computed for ${Object.keys(ratings).length} teams`);
      return ratings;
    }
    return {};
  } catch (err: any) {
    logger.warn({ err: err.message }, '[TeamDefense] Failed to compute dynamic ratings — using fallback');
    return {};
  }
}

/**
 * Get the best available defensive rating for a team.
 * Prefers dynamic (game_logs) if available, otherwise uses hardcoded fallback.
 */
async function getDefRating(teamName: string): Promise<number> {
  // Refresh dynamic cache if expired
  if (!_dynamicRatings || Date.now() > _dynamicRatingsExpiry) {
    _dynamicRatings = await fetchDynamicDefRatings();
    _dynamicRatingsExpiry = Date.now() + DYNAMIC_CACHE_TTL;
  }

  const name = normalizeTeamName(teamName);

  // Try dynamic first
  if (_dynamicRatings && Object.keys(_dynamicRatings).length > 0) {
    // Try exact match, then normalized match
    const dynamicRating = _dynamicRatings[name] ?? _dynamicRatings[teamName];
    if (dynamicRating != null) return dynamicRating;
  }

  // Fall back to hardcoded
  return TEAM_DEF_RATINGS[name] ?? LEAGUE_AVG_DEF_RATING;
}

// How much each stat type is influenced by opponent defensive quality.
// 1.0 = full sensitivity (points), lower = less sensitive to opponent.
const STAT_SENSITIVITY: Record<StatKey, number> = {
  points:  1.00,
  tpm:     0.80,  // 3PM correlated with pace + defense
  totReb:  0.45,  // rebounding driven more by individual/positional skill
  assists: 0.40,  // assists driven more by offensive scheme
  steals:  0.25,  // steals driven more by individual skill/gambling
  blocks:  0.30,  // blocks driven by individual skill + matchup size
};

// 2025-26 NBA team defensive ratings (through ~March 2026)
// Teams not listed default to league average (114.2)
const TEAM_DEF_RATINGS: Record<string, number> = {
  // Elite defenses
  'Oklahoma City Thunder':      108.8,
  'Cleveland Cavaliers':        109.2,
  'Boston Celtics':             109.8,
  'Houston Rockets':            110.4,
  'Minnesota Timberwolves':     110.8,
  'Orlando Magic':              111.2,
  'Memphis Grizzlies':          111.5,
  'New York Knicks':            112.0,
  'Denver Nuggets':             112.2,
  'Golden State Warriors':      112.5,

  // Average defenses
  'Dallas Mavericks':           113.0,
  'Milwaukee Bucks':            113.2,
  'Miami Heat':                 113.5,
  'Indiana Pacers':             113.8,
  'Los Angeles Lakers':         114.0,
  'Phoenix Suns':               114.2,
  'Sacramento Kings':           114.2,

  // Below-average defenses
  'New Orleans Pelicans':       114.8,
  'San Antonio Spurs':          115.0,
  'Chicago Bulls':              115.2,
  'Atlanta Hawks':              115.5,
  'Los Angeles Clippers':       115.8,
  'Toronto Raptors':            116.0,
  'Philadelphia 76ers':         116.2,

  // Weak defenses
  'Detroit Pistons':            116.5,
  'Brooklyn Nets':              117.0,
  'Portland Trail Blazers':     117.2,
  'Utah Jazz':                  117.5,
  'Charlotte Hornets':          118.0,
  'Washington Wizards':         118.8,
};

/**
 * Return the opponent defensive factor for a given team + stat.
 * Values > 1.0 → play projects higher (weak defense); < 1.0 → play projects lower.
 * Async to support dynamic ratings from game_logs; synchronous fallback available.
 */
export async function getOpponentDefFactorAsync(opponentTeamName: string, stat: StatKey): Promise<number> {
  const defRating = await getDefRating(opponentTeamName);
  const sensitivity = STAT_SENSITIVITY[stat];
  const baseFactor = defRating / LEAGUE_AVG_DEF_RATING;
  const scaledFactor = 1 + (baseFactor - 1) * sensitivity;
  return Math.round(scaledFactor * 10000) / 10000;
}

/**
 * Synchronous version using hardcoded fallback ratings only.
 * Use this in hot paths where async is not feasible.
 */
export function getOpponentDefFactor(opponentTeamName: string, stat: StatKey): number {
  const name = normalizeTeamName(opponentTeamName);
  const defRating = TEAM_DEF_RATINGS[name] ?? LEAGUE_AVG_DEF_RATING;
  const sensitivity = STAT_SENSITIVITY[stat];
  const baseFactor = defRating / LEAGUE_AVG_DEF_RATING;
  const scaledFactor = 1 + (baseFactor - 1) * sensitivity;
  return Math.round(scaledFactor * 10000) / 10000;
}

/** Normalize team name to match TEAM_DEF_RATINGS keys */
function normalizeTeamName(name: string): string {
  const n = name.trim();
  const aliases: Record<string, string> = {
    'LA Lakers':             'Los Angeles Lakers',
    'LA Clippers':           'Los Angeles Clippers',
    'GS Warriors':           'Golden State Warriors',
    'Golden State':          'Golden State Warriors',
    'OKC Thunder':           'Oklahoma City Thunder',
    'Oklahoma City':         'Oklahoma City Thunder',
    'NY Knicks':             'New York Knicks',
    'New York':              'New York Knicks',
    'NO Pelicans':           'New Orleans Pelicans',
    'New Orleans':           'New Orleans Pelicans',
    'SA Spurs':              'San Antonio Spurs',
    'San Antonio':           'San Antonio Spurs',
    'Portland':              'Portland Trail Blazers',
    'Washington':            'Washington Wizards',
    'Charlotte':             'Charlotte Hornets',
    'Cleveland':             'Cleveland Cavaliers',
    'Minnesota':             'Minnesota Timberwolves',
  };
  return aliases[n] ?? n;
}
