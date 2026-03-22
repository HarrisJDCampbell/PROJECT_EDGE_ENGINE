/**
 * VisBets Calculations
 * Edge, volatility, confidence, and risk calculations
 */

import { GameStats, SeasonAverage, MinutesRisk, StatTypeKey } from './api/types';
import {
  mean,
  standardDeviation,
  coefficientOfVariation,
  clamp,
  getMinutesRiskLabel,
} from '../utils/formatters';
import { MINUTES_RISK_THRESHOLDS } from '../utils/constants';

/**
 * Calculate edge (projection - book line)
 */
export function calculateEdge(projection: number, bookLine: number): number {
  return projection - bookLine;
}

/**
 * Extract stat values from game logs
 * Handles 'pra' composite stat by summing pts + reb + ast
 */
export function extractStatValues(
  gameLogs: GameStats[],
  statKey: StatTypeKey
): number[] {
  return gameLogs.map(game => {
    if (statKey === 'pra') {
      // PRA = Points + Rebounds + Assists
      const pts = game.pts;
      const reb = game.reb;
      const ast = game.ast;

      // Validate all components exist
      if (pts === undefined || pts === null ||
          reb === undefined || reb === null ||
          ast === undefined || ast === null) {
        console.warn('[PRA Calculation] Missing component in game', {
          gameId: game.id,
          pts: pts,
          reb: reb,
          ast: ast
        });
        return null; // Filter out invalid calculations
      }

      return (pts as number) + (reb as number) + (ast as number);
    }
    return game[statKey] as number;
  }).filter((val): val is number => val !== undefined && val !== null);
}

/**
 * Extract minutes as numbers from game logs
 */
export function extractMinutes(gameLogs: GameStats[]): number[] {
  return gameLogs.map(game => {
    if (typeof game.min === 'string') {
      const parts = game.min.split(':');
      if (parts.length === 2) {
        return parseInt(parts[0], 10) + (parseInt(parts[1], 10) / 60);
      }
      return parseFloat(game.min) || 0;
    }
    return game.min || 0;
  }).filter(val => val > 0);
}

/**
 * Calculate volatility score (0-100) based on coefficient of variation
 */
export function calculateVolatility(gameLogs: GameStats[], statKey: StatTypeKey): number {
  if (gameLogs.length === 0) return 0;

  const values = extractStatValues(gameLogs, statKey);
  if (values.length === 0) return 0;

  const cv = coefficientOfVariation(values);

  // Convert CV to 0-100 scale
  // CV of 0.5 (50% variation) = 50 volatility
  // CV of 1.0 (100% variation) = 100 volatility
  const volatility = clamp(cv * 100, 0, 100);

  return Math.round(volatility);
}

/**
 * Calculate confidence score (0-100) based on consistency
 * Higher consistency = higher confidence
 */
export function calculateConfidence(gameLogs: GameStats[], statKey: StatTypeKey): number {
  if (gameLogs.length === 0) return 0;

  const values = extractStatValues(gameLogs, statKey);
  if (values.length === 0) return 0;

  const cv = coefficientOfVariation(values);

  // Inverse relationship: low CV = high confidence
  // CV of 0 = 100 confidence
  // CV of 0.5 = 50 confidence
  // CV >= 1.0 = 0 confidence
  const confidence = clamp(100 - (cv * 100), 0, 100);

  return Math.round(confidence);
}

/**
 * Assess minutes risk based on minute variance
 */
export function assessMinutesRisk(gameLogs: GameStats[]): MinutesRisk {
  if (gameLogs.length === 0) {
    return {
      level: 'Medium',
      averageMinutes: 0,
      stdDeviation: 0,
      explanation: 'Insufficient data',
    };
  }

  const minutes = extractMinutes(gameLogs);
  if (minutes.length === 0) {
    return {
      level: 'Medium',
      averageMinutes: 0,
      stdDeviation: 0,
      explanation: 'No minutes data available',
    };
  }

  const avgMinutes = mean(minutes);
  const stdDev = standardDeviation(minutes);
  const level = getMinutesRiskLabel(stdDev);

  let explanation = '';
  if (level === 'Low') {
    explanation = `Consistent minutes (avg ${avgMinutes.toFixed(1)}, ±${stdDev.toFixed(1)} min)`;
  } else if (level === 'Medium') {
    explanation = `Moderate variation (avg ${avgMinutes.toFixed(1)}, ±${stdDev.toFixed(1)} min)`;
  } else {
    explanation = `High variation in playing time (avg ${avgMinutes.toFixed(1)}, ±${stdDev.toFixed(1)} min)`;
  }

  return {
    level,
    averageMinutes: Math.round(avgMinutes),
    stdDeviation: Math.round(stdDev * 10) / 10,
    explanation,
  };
}

/**
 * Calculate recent trend (last N games average)
 */
export function calculateRecentTrend(
  gameLogs: GameStats[],
  statKey: StatTypeKey,
  numGames: number = 5
): number {
  if (gameLogs.length === 0) return 0;

  const recentGames = gameLogs.slice(0, Math.min(numGames, gameLogs.length));
  const values = extractStatValues(recentGames, statKey);

  return mean(values);
}

/**
 * Calculate season average for a stat
 * Handles 'pra' composite stat by summing pts + reb + ast season averages
 */
export function getSeasonAverage(
  seasonAvg: SeasonAverage | null,
  statKey: StatTypeKey
): number {
  if (!seasonAvg) return 0;
  if (statKey === 'pra') {
    // PRA = Points + Rebounds + Assists season averages
    const pts = seasonAvg.pts;
    const reb = seasonAvg.reb;
    const ast = seasonAvg.ast;

    // Validate all components exist
    if (pts === undefined || pts === null ||
        reb === undefined || reb === null ||
        ast === undefined || ast === null) {
      console.warn('[PRA Season Average] Missing component', {
        playerId: seasonAvg.player_id,
        pts: pts,
        reb: reb,
        ast: ast
      });
      return 0; // Return 0 for invalid season averages
    }

    return (pts as number) + (reb as number) + (ast as number);
  }
  return (seasonAvg[statKey] as number) || 0;
}

/**
 * Generate trend factor (recent avg / season avg)
 */
export function calculateTrendFactor(
  recentAvg: number,
  seasonAvg: number
): number {
  if (seasonAvg === 0) return 1;
  return recentAvg / seasonAvg;
}

/**
 * Generate deterministic noise based on player ID
 * This ensures projections are consistent for the same player
 */
export function generateDeterministicNoise(playerId: number, range: number = 0.05): number {
  const seed = playerId % 100;
  return (seed / 100) * (range * 2) - range; // ±range
}

/**
 * Calculate score for ranking props
 * Used in VisBets discovery feed
 */
export function calculatePropScore(
  edge: number,
  confidence: number,
  volatility: number
): number {
  // Score = (edge × confidence) - volatility penalty
  // Higher edge and confidence = better score
  // Higher volatility = worse score
  const confidenceFactor = confidence / 100;
  const volatilityPenalty = volatility / 100;

  return (edge * confidenceFactor) - (volatilityPenalty * 5);
}

/**
 * Calculate combined odds for a parlay (simplified)
 */
export function calculateParlayOdds(individualOdds: number[]): number {
  // Convert American odds to decimal, multiply, convert back
  const decimalOdds = individualOdds.map(americanToDecimal);
  const combinedDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  return decimalToAmerican(combinedDecimal);
}

/**
 * Convert American odds to decimal odds
 */
function americanToDecimal(american: number): number {
  if (american === 0) return 1;
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
}

/**
 * Convert decimal odds to American odds
 */
function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) return 0;
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

// ============================================================================
// ENSEMBLE PREDICTION ENGINE - New Functions
// ============================================================================

/**
 * Calculate exponential weighted average
 * Recent games weighted more heavily than older games
 */
export function calculateExponentialWeightedAverage(
  gameLogs: GameStats[],
  statKey: StatTypeKey,
  numGames: number
): number {
  if (gameLogs.length === 0) return 0;

  const recentGames = gameLogs.slice(0, Math.min(numGames, gameLogs.length));
  const values = extractStatValues(recentGames, statKey);

  if (values.length === 0) return 0;

  // Exponential decay weights: 1.0, 0.9, 0.8, 0.7, 0.6, ...
  const weights = values.map((_, index) => Math.max(1.0 - (index * 0.1), 0.1));

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i++) {
    weightedSum += values[i] * weights[i];
    totalWeight += weights[i];
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate home/away splits
 * Uses game.team?.id which is the player's team for that game
 */
export function calculateHomeAwaySplits(
  gameLogs: GameStats[],
  statKey: StatTypeKey
): { homeAvg: number; awayAvg: number; homeGames: number; awayGames: number } {
  // Filter home games: player's team is the home team
  const homeGames = gameLogs.filter(game =>
    game.team?.id === game.game?.home_team?.id
  );
  // Filter away games: player's team is the visitor team
  const awayGames = gameLogs.filter(game =>
    game.team?.id === game.game?.visitor_team?.id
  );

  const homeValues = extractStatValues(homeGames, statKey);
  const awayValues = extractStatValues(awayGames, statKey);

  return {
    homeAvg: homeValues.length > 0 ? mean(homeValues) : 0,
    awayAvg: awayValues.length > 0 ? mean(awayValues) : 0,
    homeGames: homeGames.length,
    awayGames: awayGames.length,
  };
}

/**
 * Calculate days between two game dates
 */
export function calculateDaysBetweenGames(
  lastGameDate: string,
  currentGameDate: string
): number {
  const last = new Date(lastGameDate);
  const current = new Date(currentGameDate);
  const diffTime = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Get rest day multiplier based on days of rest
 * Spec: 0 days: 0.93x, 1 day: 0.97x, 2 days: 1.00x, 3+ days: 1.02x
 */
export function getRestDayMultiplier(days: number): number {
  if (days === 0) return 0.93;  // Back-to-back penalty
  if (days === 1) return 0.97;  // 1 day rest
  if (days === 2) return 1.00;  // Normal rest
  return 1.02;  // 3+ days rest boost
}

/**
 * Detect hot/cold/neutral momentum streak
 * Adapts threshold based on available games:
 * - 7+ games: requires 5+ above/below avg
 * - 5-6 games: requires 4+ above/below avg
 * - 3-4 games: requires 3+ above/below avg
 */
export function detectMomentumStreak(
  gameLogs: GameStats[],
  statKey: StatTypeKey,
  seasonAvg: number
): 'hot' | 'cold' | 'neutral' {
  // Need at least 3 games to detect any streak
  if (gameLogs.length < 3 || seasonAvg === 0) return 'neutral';

  const gamesAvailable = Math.min(gameLogs.length, 7);
  const recentGames = gameLogs.slice(0, gamesAvailable);
  const values = extractStatValues(recentGames, statKey);

  if (values.length < 3) return 'neutral';

  // Adaptive threshold based on sample size
  let threshold: number;
  if (values.length >= 7) {
    threshold = 5; // 5 of 7
  } else if (values.length >= 5) {
    threshold = 4; // 4 of 5-6
  } else {
    threshold = 3; // 3 of 3-4
  }

  // Count games above/below season average
  const aboveAvg = values.filter(v => v > seasonAvg).length;
  const belowAvg = values.filter(v => v < seasonAvg).length;

  // Calculate trend slope (recent vs older)
  const midpoint = Math.floor(values.length / 2);
  const recentHalf = values.slice(0, midpoint || 1);
  const olderHalf = values.slice(midpoint);
  const trendSlope = mean(recentHalf) - mean(olderHalf);

  // Hot: threshold+ games above avg AND positive or flat trend
  if (aboveAvg >= threshold && trendSlope >= -0.5) {
    return 'hot';
  }

  // Cold: threshold+ games below avg AND negative or flat trend
  if (belowAvg >= threshold && trendSlope <= 0.5) {
    return 'cold';
  }

  return 'neutral';
}

/**
 * Get momentum multiplier
 * Spec: Hot: 1.08x, Cold: 0.92x, Neutral: 1.00x
 */
export function getMomentumMultiplier(streak: 'hot' | 'cold' | 'neutral'): number {
  if (streak === 'hot') return 1.08;
  if (streak === 'cold') return 0.92;
  return 1.00;
}

/**
 * Calculate historical hit rate
 * Returns percentage (0-100) of games where player went OVER the line
 */
export function calculateHitRate(
  gameLogs: GameStats[],
  line: number,
  statKey: StatTypeKey,
  numGames: number = 20
): number {
  if (gameLogs.length === 0 || line === 0) return 50; // Default 50% if no data

  const recentGames = gameLogs.slice(0, Math.min(numGames, gameLogs.length));
  const values = extractStatValues(recentGames, statKey);

  if (values.length === 0) return 50;

  const overs = values.filter(v => v > line).length;
  return (overs / values.length) * 100;
}

/**
 * Calculate average stat value vs specific opponent
 */
export function calculateVsOpponentAverage(
  gameLogs: GameStats[],
  opponentId: number,
  statKey: StatTypeKey
): number | null {
  const vsOpponent = gameLogs.filter(game => {
    const homeId = game.game?.home_team?.id;
    const awayId = game.game?.visitor_team?.id;
    return homeId === opponentId || awayId === opponentId;
  });

  if (vsOpponent.length === 0) return null;

  const values = extractStatValues(vsOpponent, statKey);
  return values.length > 0 ? mean(values) : null;
}

/**
 * Estimate defensive multiplier for opponent
 * Returns 0.90-1.10 based on opponent strength
 * Note: Ball Don't Lie API doesn't have defensive ratings, so we use team win % as proxy
 */
export function estimateDefensiveMultiplier(
  opponentTeam: any,
  statType: string
): number {
  // For MVP, use neutral 1.00 multiplier
  // In production, this would:
  // 1. Fetch opponent's defensive rating for the stat category
  // 2. Compare to league average
  // 3. Return multiplier: Top-5 defense: 0.90x, Bottom-5: 1.10x

  // Placeholder: Return neutral multiplier
  return 1.00;
}

/**
 * Multi-factor confidence scoring
 * Spec: Base 50, then adjust based on consistency, sample size, variance, hit rate
 */
export function calculateMultiFactorConfidence(params: {
  consistency: number;
  sampleSize: number;
  variance: number;
  hitRate: number;
}): number {
  const { consistency, sampleSize, variance, hitRate } = params;

  let confidence = 50; // Base confidence

  // Consistency factor
  if (consistency > 80) confidence += 20;
  else if (consistency > 60) confidence += 10;
  else if (consistency < 40) confidence -= 15;

  // Sample size factor
  if (sampleSize >= 25) confidence += 10;
  else if (sampleSize < 10) confidence -= 10;

  // Variance factor
  if (variance < 3) confidence += 15;
  else if (variance > 6) confidence -= 10;

  // Hit rate factor
  if (hitRate > 65) confidence += 15;
  else if (hitRate < 35) confidence += 10; // High confidence in UNDER

  // Cap between 0-100
  return clamp(confidence, 0, 100);
}

/**
 * Generate recommendation: OVER, UNDER, or AVOID
 * Spec: Require 8% edge threshold, confidence-based
 */
export function generateRecommendation(
  projection: number,
  line: number,
  confidence: number
): 'OVER' | 'UNDER' | 'AVOID' {
  const difference = projection - line;
  const threshold = line * 0.08; // 8% edge required

  // Low confidence = AVOID
  if (confidence < 55) return 'AVOID';

  // Strong edge + high confidence = OVER/UNDER
  if (difference > threshold && confidence >= 70) return 'OVER';
  if (difference < -threshold && confidence >= 70) return 'UNDER';

  // Medium edge + very high confidence = OVER/UNDER
  if (Math.abs(difference) > threshold * 0.5 && confidence >= 80) {
    return difference > 0 ? 'OVER' : 'UNDER';
  }

  return 'AVOID';
}

// ============================================================================
// DISCOVERY & CURATION FUNCTIONS
// ============================================================================

/**
 * Rank props by edge score (highest first)
 */
export function rankPropsByEdge(props: any[]): any[] {
  return [...props].sort((a, b) => b.edge - a.edge);
}

/**
 * Filter props by minimum confidence threshold
 */
export function filterByConfidence(
  props: any[],
  minConfidence: number
): any[] {
  return props.filter(p => p.projection?.confidence >= minConfidence);
}

/**
 * Calculate upside potential for a prop
 * Formula: (Edge * Confidence) - (Volatility penalty)
 */
export function calculateUpsidePotential(prop: any): number {
  if (!prop.projection) return 0;

  const edge = Math.abs(prop.edge);
  const confidence = prop.projection.confidence;
  const volatility = prop.projection.volatility;

  return (edge * confidence / 100) - (volatility / 10);
}

/**
 * Rank props by upside potential
 */
export function rankPropsByUpside(props: any[]): any[] {
  return [...props].sort((a, b) =>
    calculateUpsidePotential(b) - calculateUpsidePotential(a)
  );
}

// ============================================================================
// PARLAY INTELLIGENCE FUNCTIONS
// ============================================================================

/**
 * Check if two props conflict
 * Conflicts: Same player, same game opposite sides
 */
export function detectPropConflict(
  prop1: any,
  prop2: any
): boolean {
  // Same player = conflict (correlated outcomes)
  if (prop1.prop?.player_id === prop2.prop?.player_id) {
    return true;
  }

  // Same game = potential conflict
  // In production, would check for opposing team totals, etc.
  if (prop1.prop?.game_id === prop2.prop?.game_id) {
    // For now, allow same-game parlays but could add more logic
    return false;
  }

  return false;
}

/**
 * Generate parlay combinations (avoiding conflicts)
 */
export function generateParlayLegs(
  props: any[],
  numLegs: number,
  maxResults: number = 100
): any[][] {
  const combinations: any[][] = [];

  function combine(start: number, current: any[]) {
    if (current.length === numLegs) {
      // Check for conflicts
      let hasConflict = false;
      for (let i = 0; i < current.length; i++) {
        for (let j = i + 1; j < current.length; j++) {
          if (detectPropConflict(current[i], current[j])) {
            hasConflict = true;
            break;
          }
        }
        if (hasConflict) break;
      }

      if (!hasConflict) {
        combinations.push([...current]);
        // Limit results to avoid performance issues
        if (combinations.length >= maxResults) return;
      }
      return;
    }

    for (let i = start; i < props.length && combinations.length < maxResults; i++) {
      combine(i + 1, [...current, props[i]]);
    }
  }

  combine(0, []);
  return combinations;
}

/**
 * Calculate combined parlay odds from legs
 */
export function calculateCombinedParlayOdds(legs: any[]): number {
  const decimalOdds = legs.map(leg => {
    // Determine if picking OVER or UNDER
    const isOver = leg.edge > 0;
    const americanOdds = isOver ? leg.prop.over_odds : leg.prop.under_odds;
    return americanToDecimal(americanOdds || 100);
  });

  const combinedDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
  return decimalToAmerican(combinedDecimal);
}

/**
 * Score parlay quality
 * Higher average confidence and edge = better quality
 */
export function scoreParlayQuality(legs: any[]): number {
  if (legs.length === 0) return 0;

  const avgConfidence = legs.reduce((sum, leg) =>
    sum + (leg.projection?.confidence || 0), 0) / legs.length;

  const avgEdge = legs.reduce((sum, leg) =>
    sum + Math.abs(leg.edge || 0), 0) / legs.length;

  // Quality = avg confidence * avg edge
  return avgConfidence * avgEdge;
}

/**
 * Suggest best parlays
 */
export function suggestParlays(
  props: any[],
  numLegs: number,
  maxResults: number = 10
): any[] {
  // Filter to high-quality props first (confidence >= 60)
  const viableProps = filterByConfidence(props, 60);

  if (viableProps.length < numLegs) {
    return [];
  }

  // Generate combinations
  const combinations = generateParlayLegs(viableProps, numLegs, 200);

  // Score and sort
  const suggestions = combinations
    .map((legs, index) => ({
      id: `parlay-${numLegs}leg-${index}`,
      legs,
      combinedOdds: calculateCombinedParlayOdds(legs),
      qualityScore: scoreParlayQuality(legs),
      avgConfidence: legs.reduce((sum, l) =>
        sum + (l.projection?.confidence || 0), 0) / legs.length
    }))
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, maxResults);

  return suggestions;
}
