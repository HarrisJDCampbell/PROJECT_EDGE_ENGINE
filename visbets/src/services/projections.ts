/**
 * VisBets Mock Projection Generator
 * Generates realistic projections based on real player stats
 */

import { Player, GameStats, SeasonAverage, Projection, StatTypeKey, Team } from './api/types';
import {
  calculateRecentTrend,
  getSeasonAverage,
  calculateTrendFactor,
  generateDeterministicNoise,
  calculateVolatility,
  calculateConfidence,
  assessMinutesRisk,
  calculateExponentialWeightedAverage,
  calculateHomeAwaySplits,
  calculateDaysBetweenGames,
  getRestDayMultiplier,
  detectMomentumStreak,
  getMomentumMultiplier,
  calculateHitRate,
  calculateVsOpponentAverage,
  estimateDefensiveMultiplier,
  calculateMultiFactorConfidence,
  generateRecommendation,
  extractStatValues,
} from './calculations';
import { mean, standardDeviation } from '../utils/formatters';

/**
 * Map display stat types to API stat keys
 */
const STAT_TYPE_MAP: Record<string, StatTypeKey> = {
  'PTS': 'pts',
  'REB': 'reb',
  'AST': 'ast',
  '3PM': 'fg3m',
  'STL': 'stl',
  'BLK': 'blk',
  'TO': 'turnover',
};

/**
 * Generate ENSEMBLE projection for a player's stat
 * Implements 6-factor multi-model prediction per specification
 */
export function generateEnsembleProjection(
  player: Player,
  statType: string,
  seasonAvg: SeasonAverage | null,
  recentGames: GameStats[],
  opponent: Team | null,
  gameDate: string,
  isHome: boolean,
  bettingLine: number
): Projection {
  const statKey = STAT_TYPE_MAP[statType] || 'pts';

  // Get season average
  const seasonAvgValue = getSeasonAverage(seasonAvg, statKey);

  // Fallback if insufficient data
  if (recentGames.length < 5 || seasonAvgValue === 0) {
    return generateFallbackProjection(player, statType, seasonAvgValue || 10, recentGames);
  }

  // ========================================
  // FACTOR A: Recency-Weighted Performance (40%)
  // ========================================
  const weighted5 = calculateExponentialWeightedAverage(recentGames, statKey, 5);
  const weighted10 = calculateExponentialWeightedAverage(recentGames, statKey, 10);
  const weighted25 = calculateExponentialWeightedAverage(recentGames, statKey, 25);
  const recencyScore = (weighted5 * 0.5) + (weighted10 * 0.3) + (weighted25 * 0.2);

  // ========================================
  // FACTOR B: Matchup Analysis (25%)
  // ========================================
  let matchupScore = recencyScore; // Default to recency if no opponent data

  if (opponent) {
    const vsOpponentAvg = calculateVsOpponentAverage(recentGames, opponent.id, statKey);
    const defenseMultiplier = estimateDefensiveMultiplier(opponent, statType);

    if (vsOpponentAvg !== null && vsOpponentAvg > 0) {
      matchupScore = vsOpponentAvg * defenseMultiplier;
    } else {
      // No games vs this opponent - use recency with defensive adjustment
      matchupScore = recencyScore * defenseMultiplier;
    }
  }

  // ========================================
  // FACTOR C: Momentum & Trend Detection (20%)
  // ========================================
  const streak = detectMomentumStreak(recentGames, statKey, seasonAvgValue);
  const momentumMultiplier = getMomentumMultiplier(streak);
  const trendScore = seasonAvgValue * momentumMultiplier;

  // ========================================
  // FACTOR D: Contextual Factors (15%)
  // ========================================
  let contextScore = seasonAvgValue;

  // Rest days calculation
  let daysRest = 2; // Default
  if (recentGames.length > 0 && recentGames[0].game?.date) {
    daysRest = calculateDaysBetweenGames(recentGames[0].game.date, gameDate);
  }
  const restMultiplier = getRestDayMultiplier(daysRest);

  // Home/away splits
  const splits = calculateHomeAwaySplits(recentGames, statKey);
  const locationScore = isHome ?
    (splits.homeAvg > 0 ? splits.homeAvg : seasonAvgValue) :
    (splits.awayAvg > 0 ? splits.awayAvg : seasonAvgValue);

  contextScore = locationScore * restMultiplier;

  // ========================================
  // WEIGHTED ENSEMBLE COMBINATION
  // ========================================
  const basePrediction =
    (recencyScore * 0.40) +
    (matchupScore * 0.25) +
    (trendScore * 0.20) +
    (contextScore * 0.15);

  // ========================================
  // FACTOR E: Consistency & Variance
  // ========================================
  const values = extractStatValues(recentGames.slice(0, 10), statKey);
  const stdDev = values.length > 0 ? standardDeviation(values) : 0;
  const consistency = Math.max(0, 100 - (stdDev * 10));

  // ========================================
  // FACTOR F: Historical Hit Rate
  // ========================================
  const hitRate = calculateHitRate(recentGames, bettingLine, statKey, 20);

  // ========================================
  // FACTOR G: Multi-Factor Confidence
  // ========================================
  const confidence = calculateMultiFactorConfidence({
    consistency,
    sampleSize: recentGames.length,
    variance: stdDev,
    hitRate
  });

  // ========================================
  // FACTOR H: Recommendation Logic
  // ========================================
  const recommendation = generateRecommendation(basePrediction, bettingLine, confidence);

  // ========================================
  // FACTOR I: Volatility
  // ========================================
  const volatility = calculateVolatility(recentGames, statKey);

  // ========================================
  // FACTOR J: Minutes Risk
  // ========================================
  const minutesRisk = assessMinutesRisk(recentGames);

  // ========================================
  // Rationale Generation
  // ========================================
  const rationale = generateEnsembleRationale(
    recencyScore,
    matchupScore,
    trendScore,
    streak,
    daysRest,
    isHome,
    hitRate,
    statType
  );

  return {
    player_id: player.id,
    stat_type: statType,
    projected_value: Math.round(basePrediction * 10) / 10,
    confidence: Math.round(confidence),
    volatility: Math.round(volatility),
    minutes_risk: minutesRisk.level,
    rationale_short: rationale,
    recommendation,
    ensemble_breakdown: {
      recency: Math.round(recencyScore * 10) / 10,
      matchup: Math.round(matchupScore * 10) / 10,
      momentum: Math.round(trendScore * 10) / 10,
      context: Math.round(contextScore * 10) / 10,
      weights_used: [0.40, 0.25, 0.20, 0.15]
    }
  };
}

/**
 * Legacy function - now calls ENSEMBLE engine
 * Kept for backwards compatibility
 */
export function generateProjection(
  player: Player,
  statType: string,
  seasonAvg: SeasonAverage | null,
  recentGames: GameStats[]
): Projection {
  // Call ENSEMBLE with default values
  return generateEnsembleProjection(
    player,
    statType,
    seasonAvg,
    recentGames,
    null, // No opponent
    new Date().toISOString().split('T')[0], // Today
    true, // Assume home
    0 // No betting line
  );
}

/**
 * Generate fallback projection when no season average exists
 */
function generateFallbackProjection(
  player: Player,
  statType: string,
  recentAvg: number,
  recentGames: GameStats[]
): Projection {
  const statKey = STAT_TYPE_MAP[statType] || 'pts';
  const noise = generateDeterministicNoise(player.id, 0.05);
  const projection = recentAvg * (1 + noise);

  const confidence = calculateConfidence(recentGames, statKey);
  const volatility = calculateVolatility(recentGames, statKey);
  const minutesRisk = assessMinutesRisk(recentGames);

  return {
    player_id: player.id,
    stat_type: statType,
    projected_value: Math.round(projection * 10) / 10,
    confidence: Math.round(confidence),
    volatility: Math.round(volatility),
    minutes_risk: minutesRisk.level,
    rationale_short: `Based on recent ${recentGames.length} game average`,
  };
}

/**
 * Generate human-readable rationale (legacy)
 */
function generateRationale(
  trendFactor: number,
  recentAvg: number,
  seasonAvg: number,
  statType: string
): string {
  if (trendFactor > 1.15) {
    return `Trending up, averaging ${recentAvg.toFixed(1)} ${statType} in last 5`;
  } else if (trendFactor < 0.85) {
    return `Trending down, averaging ${recentAvg.toFixed(1)} ${statType} in last 5`;
  } else {
    return `Consistent with season average of ${seasonAvg.toFixed(1)} ${statType}`;
  }
}

/**
 * Generate ensemble-based rationale
 */
function generateEnsembleRationale(
  recencyScore: number,
  matchupScore: number,
  trendScore: number,
  streak: 'hot' | 'cold' | 'neutral',
  daysRest: number,
  isHome: boolean,
  hitRate: number,
  statType: string
): string {
  const parts: string[] = [];

  // Momentum
  if (streak === 'hot') {
    parts.push('On hot streak');
  } else if (streak === 'cold') {
    parts.push('Cooling off recently');
  }

  // Location
  if (isHome) {
    parts.push('home');
  } else {
    parts.push('on road');
  }

  // Rest
  if (daysRest === 0) {
    parts.push('back-to-back');
  } else if (daysRest >= 3) {
    parts.push('well-rested');
  }

  // Hit rate
  if (hitRate > 65) {
    parts.push(`hits ${Math.round(hitRate)}% of time`);
  } else if (hitRate < 35) {
    parts.push(`under ${Math.round(100 - hitRate)}% of time`);
  }

  // Recency highlight
  parts.push(`averaging ${recencyScore.toFixed(1)} ${statType} recently`);

  return parts.slice(0, 3).join(', ');
}

/**
 * Generate quick projection (without full game logs)
 * Used when we only have season averages
 */
export function generateQuickProjection(
  player: Player,
  statType: string,
  seasonAvg: SeasonAverage
): Projection {
  const statKey = STAT_TYPE_MAP[statType] || 'pts';
  const base = getSeasonAverage(seasonAvg, statKey);
  const noise = generateDeterministicNoise(player.id, 0.05);
  const projection = base * (1 + noise);

  // Default to medium confidence/volatility without game logs
  return {
    player_id: player.id,
    stat_type: statType,
    projected_value: Math.round(projection * 10) / 10,
    confidence: 65,
    volatility: 35,
    minutes_risk: 'Medium',
    rationale_short: `Season average: ${base.toFixed(1)} ${statType}`,
  };
}

/**
 * Batch generate projections for multiple props
 */
export async function generateProjectionsForProps(
  props: Array<{
    player: Player;
    statType: string;
    seasonAvg: SeasonAverage | null;
    recentGames: GameStats[];
  }>
): Promise<Projection[]> {
  return props.map(({ player, statType, seasonAvg, recentGames }) =>
    generateProjection(player, statType, seasonAvg, recentGames)
  );
}
