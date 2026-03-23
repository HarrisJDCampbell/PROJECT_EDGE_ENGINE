/**
 * Projection Engine v2
 * Exponential decay weighted average + normal distribution probability model.
 *
 * For each player prop:
 *   1. Extract valid game log values (exclude DNP / <5 min)
 *   2. Exponential decay weighted average (recent games weighted more)
 *   3. Apply opponent defensive factor, home/away, rest adjustments
 *   4. P(over line) via normal CDF
 *   5. Implied P(over) from American odds (devigged)
 *   6. Edge = our P(over) - market's implied P(over)
 *   7. VisBets Score = calibrated 0–100
 */

import type { ApiSportsPlayerStats } from './apiSports';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatKey = 'points' | 'totReb' | 'assists' | 'tpm' | 'steals' | 'blocks';
export type StatDisplay = 'PTS' | 'REB' | 'AST' | '3PM' | 'STL' | 'BLK';

export const STAT_DISPLAY: Record<StatKey, StatDisplay> = {
  points: 'PTS',
  totReb: 'REB',
  assists: 'AST',
  tpm: '3PM',
  steals: 'STL',
  blocks: 'BLK',
};

export const ODDS_API_MARKET_MAP: Record<string, StatKey> = {
  player_points: 'points',
  player_rebounds: 'totReb',
  player_assists: 'assists',
  player_threes: 'tpm',
  player_steals: 'steals',
  player_blocks: 'blocks',
};

export interface EnhancedProjection {
  stat: StatKey;
  statDisplay: StatDisplay;
  projection: number;       // model's predicted value
  line: number;             // betting line from TheOddsAPI
  stdDev: number;           // historical standard deviation (consistency measure)
  pOver: number;            // 0–1 probability of exceeding line
  impliedPOver: number;     // market's devigged implied P(over)
  edge: number;             // pOver - impliedPOver (positive = lean over)
  direction: 'over' | 'under';
  visbetsScore: number;     // 0–100 composite score
  confidence: 'low' | 'medium' | 'high';
  sampleSize: number;       // valid game logs used
  overOdds: number | null;
  underOdds: number | null;
  bookmaker: string | null;
}

export interface ProjectionInputV2 {
  gameLogs: ApiSportsPlayerStats[];   // sorted newest-first
  line: number;
  stat: StatKey;
  overOdds?: number | null;
  underOdds?: number | null;
  bookmaker?: string | null;
  opponentDefFactor?: number;         // 1.0 = league avg; >1 = weak defense; <1 = tough
  isHomeGame?: boolean;
  daysRest?: number;
}

// ── Math helpers ──────────────────────────────────────────────────────────────

/** Abramowitz & Stegun error function approximation (max error 1.5×10⁻⁷) */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-ax * ax);
  return sign * y;
}

/** P(X ≤ x) where X ~ N(mean, std) */
function normalCDF(x: number, mean: number, std: number): number {
  if (std <= 0) return x >= mean ? 1 : 0;
  return 0.5 * (1 + erf((x - mean) / (std * Math.SQRT2)));
}

/** American odds → raw implied probability */
function americanToProb(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
}

/**
 * Devig over/under pair to get true implied P(over).
 * If one side is missing, returns the raw implied probability of the available side.
 */
function devigged(over: number | null | undefined, under: number | null | undefined): number {
  if (over == null && under == null) return 0.5;
  if (over == null) return 1 - americanToProb(under!);
  if (under == null) return americanToProb(over);
  const rawOver = americanToProb(over);
  const rawUnder = americanToProb(under);
  const total = rawOver + rawUnder;
  return total > 0 ? rawOver / total : 0.5;
}

/**
 * Exponential decay weighted average.
 * gameLogs[0] = most recent; weights decay by factor lambda per game back.
 */
function expWeightedAvg(values: number[], lambda = 0.88): number {
  if (values.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (let i = 0; i < values.length; i++) {
    const w = Math.pow(lambda, i);
    num += values[i] * w;
    den += w;
  }
  return num / den;
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return values[0] != null ? values[0] * 0.3 : 3;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// ── Stat extraction ───────────────────────────────────────────────────────────

/** Returns the stat value for a game log, or null if the player didn't meaningfully play. */
export function extractStatValue(
  gs: ApiSportsPlayerStats,
  stat: StatKey
): number | null {
  // Exclude DNP / injury sits
  if (gs.comment && /dnp|did not play|inactive|out|dtd/i.test(gs.comment)) {
    return null;
  }
  const minutes = gs.min ? parseFloat(gs.min) : 0;
  if (isNaN(minutes) || minutes < 5) return null; // garbage time / DNP

  switch (stat) {
    case 'points':  return gs.points  ?? null;
    case 'totReb':  return gs.totReb  ?? null;
    case 'assists': return gs.assists ?? null;
    case 'tpm':     return gs.tpm     ?? null;
    case 'steals':  return gs.steals  ?? null;
    case 'blocks':  return gs.blocks  ?? null;
  }
}

// ── Main model ────────────────────────────────────────────────────────────────

export function buildEnhancedProjection(
  input: ProjectionInputV2
): EnhancedProjection | null {
  const {
    gameLogs,
    line,
    stat,
    overOdds,
    underOdds,
    bookmaker = null,
    opponentDefFactor = 1.0,
    isHomeGame,
    daysRest,
  } = input;

  // --- 1. Extract valid stat values (newest first) ---
  const allValues = gameLogs
    .map((g) => extractStatValue(g, stat))
    .filter((v): v is number => v !== null);

  if (allValues.length < 3) return null; // need at least 3 meaningful games to project

  // Cap at last 60 meaningful games for the model
  const sampleSize = Math.min(allValues.length, 60);
  const recentValues = allValues.slice(0, sampleSize);

  // --- 2. Exponential decay weighted average ---
  let projection = expWeightedAvg(recentValues, 0.88);

  // --- 2b. Shrink toward the market line for low-sample players ---
  // Prevents outlier single-game performances from inflating projections.
  // At 12+ games we trust the EWMA fully; at 3-7 games we blend 40% toward the line.
  if (line > 0) {
    const shrinkage = sampleSize >= 12 ? 0 : sampleSize >= 8 ? 0.15 : 0.40;
    if (shrinkage > 0) {
      projection = projection * (1 - shrinkage) + line * shrinkage;
    }
  }

  // --- 3. Standard deviation ---
  const sd = sampleStdDev(recentValues);

  // --- 4. Context adjustments ---
  // Opponent defensive factor (1.0 = league avg)
  projection *= opponentDefFactor;

  // Road game penalty (~3%)
  if (isHomeGame === false) projection *= 0.97;

  // Rest days: back-to-back = −4%, one day rest = −1%
  if (daysRest === 0) projection *= 0.96;
  else if (daysRest === 1) projection *= 0.99;

  projection = Math.max(0, projection);

  // Enforce minimum uncertainty floor at 15% of projection
  const sdAdjusted = Math.max(sd, projection * 0.15);

  // --- 5. P(over line) via normal CDF ---
  const pOver = 1 - normalCDF(line, projection, sdAdjusted);

  // --- 6. Implied P(over) from market odds (devigged) ---
  const impliedPOver = devigged(overOdds, underOdds);

  // --- 7. Raw edge ---
  const rawEdge = pOver - impliedPOver;
  const direction: 'over' | 'under' = rawEdge >= 0 ? 'over' : 'under';

  // --- 8. Confidence shrinkage ---
  // Coefficient of variation: lower = more consistent player
  const cv = projection > 0 ? sd / projection : 1;
  const consistencyFactor = Math.max(0, 1 - Math.min(cv, 1));
  const sampleFactor = Math.min(1, sampleSize / 12); // full confidence at 12+ games
  // confidenceFactor: 0.4 (worst) → 1.0 (best)
  const confidenceFactor = 0.4 + 0.6 * consistencyFactor * sampleFactor;
  const adjustedEdge = rawEdge * confidenceFactor;

  // --- 9. VisBets Score ---
  // 50 = no edge, 75 = solid (+10% edge w/ full confidence), 100 = exceptional
  const visbetsScore = Math.round(
    Math.max(0, Math.min(100, 50 + adjustedEdge * 250))
  );

  // --- 10. Confidence label ---
  const absEdge = Math.abs(adjustedEdge);
  const confidence: 'low' | 'medium' | 'high' =
    absEdge > 0.08 && sampleSize >= 8
      ? 'high'
      : absEdge > 0.04 && sampleSize >= 5
      ? 'medium'
      : 'low';

  return {
    stat,
    statDisplay: STAT_DISPLAY[stat],
    projection: Math.round(projection * 10) / 10,
    line,
    stdDev: Math.round(sd * 10) / 10,
    pOver: Math.round(pOver * 1000) / 1000,
    impliedPOver: Math.round(impliedPOver * 1000) / 1000,
    edge: Math.round(rawEdge * 1000) / 1000,
    direction,
    visbetsScore,
    confidence,
    sampleSize,
    overOdds: overOdds ?? null,
    underOdds: underOdds ?? null,
    bookmaker,
  };
}

// ── Legacy shim (keeps existing callers compiling) ────────────────────────────

export interface StatProjection {
  stat: string;
  projection: number;
  line: number;
  edge: number;
  confidence: number;
  direction: 'over' | 'under';
}

/** @deprecated Use buildEnhancedProjection instead */
export function buildProjection(input: {
  seasonStats: ApiSportsPlayerStats[];
  last5Stats: ApiSportsPlayerStats[];
  line: number;
  stat: StatKey;
  opponentDefRating?: number;
  opponentPace?: number;
}): StatProjection {
  const LEAGUE_AVG_DEF_RATING = 113.5;
  const LEAGUE_AVG_PACE = 99.5;
  const combined = [...input.last5Stats, ...input.seasonStats];
  const result = buildEnhancedProjection({
    gameLogs: combined,
    line: input.line,
    stat: input.stat,
    opponentDefFactor:
      input.opponentDefRating != null
        ? 1 + (LEAGUE_AVG_DEF_RATING - input.opponentDefRating) / 100
        : input.opponentPace != null
        ? input.opponentPace / LEAGUE_AVG_PACE
        : 1.0,
  });
  if (!result) {
    return { stat: input.stat, projection: 0, line: input.line, edge: 0, confidence: 0, direction: 'over' };
  }
  return {
    stat: result.stat,
    projection: result.projection,
    line: result.line,
    edge: Math.round(((result.projection - result.line) / result.line) * 1000) / 10,
    confidence: result.visbetsScore,
    direction: result.direction,
  };
}
