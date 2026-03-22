/**
 * usePlayerDetail — Single-source hook for the player detail page.
 *
 * Replaces usePlayerAnalytics + usePlayerAnalysis + usePlayerBettingOdds +
 * usePlayerRankings + useTeamStanding with one backend call.
 *
 * One endpoint. One response. Zero client-side analytics computation.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { playersApi, PlayerDetailResponse, AnalysisGame, AnalysisValue } from '../../../services/api/playersApi';
import { useUserPreferences, shortLabel } from '../../../hooks/useUserPreferences';
import type {
  HeroData,
  ProjectionComparison,
  ConfidenceData,
  StreakData,
  TrendsData,
  ChartDataPoint,
  GameChipData,
  AnalyticsData,
  HitRateData,
  MomentumData,
  ConsistencyData,
  DistributionData,
  DistributionBucket,
  SplitsData,
  RadarMetric,
  StatType,
  TimeRange,
} from '../types';

// ── Stat type mapping ───────────────────────────────────────────────────────

const STAT_TO_BACKEND: Record<string, string> = {
  PTS: 'points',
  REB: 'rebounds',
  AST: 'assists',
  PRA: 'pra',
  '3PM': 'threes',
  STL: 'steals',
  BLK: 'blocks',
  TO: 'turnovers',
};

// ── Distribution bucket colors ──────────────────────────────────────────────

const BUCKET_COLORS: Record<string, string> = {
  'Way Under': '#FF0055',
  Under: '#FF6B35',
  'Near Line': '#FFB800',
  Over: '#66CC66',
  'Way Over': '#00FF88',
};

// OddsComparison shape for the OddsComparisonSection component
export interface OddsComparison {
  stat_type: string;
  books: Array<{
    sportsbook: string;
    line: number;
    over_odds: number;
    under_odds: number;
  }>;
  bestOver: { sportsbook: string; odds: number } | null;
  bestUnder: { sportsbook: string; odds: number } | null;
}

// ── Hook return type ────────────────────────────────────────────────────────

export interface UsePlayerDetailReturn {
  // Section data (matches existing component prop interfaces)
  hero: HeroData;
  projection: ProjectionComparison;
  confidence: ConfidenceData;
  trends: TrendsData;
  analytics: AnalyticsData;
  splits: SplitsData;
  radarMetrics: RadarMetric[];

  // Data for new gated components
  opponentContext: {
    opponent: { name: string; id: number } | null;
    wasHomeGame: boolean | null;
    gameDate: string | null;
  };
  hitRateStreak: {
    games: AnalysisGame[];
    line: number;
    statLabel: string;
    hitRate: number;
    currentStreak: { type: 'hit' | 'miss'; count: number };
  };
  statsInsight: {
    seasonAverage: number;
    last5Average: number;
    volatilityRating: 'low' | 'medium' | 'high';
    edge: number;
    edgeDirection: 'over' | 'under';
    minutesAvg5: number;
    minutesFlag: boolean;
  };
  volatilityCard: {
    volatilityRating: 'low' | 'medium' | 'high';
    coefficientOfVariation: number;
    stdDev: number;
    minutesTrend: number[];
    minutesAvg5: number;
    minutesAvg10: number;
    minutesFlag: boolean;
  };
  trajectoryChart: {
    dataPoints: AnalysisValue[];
    propLine: number;
    statLabel: string;
    trendDirection: 'up' | 'down' | 'flat';
  };
  splitsCard: {
    homeSplits: { games: number; avg: number; hitRate: number };
    awaySplits: { games: number; avg: number; hitRate: number };
    b2bSplits: { games: number; avg: number; hitRate: number };
    restedSplits: { games: number; avg: number; hitRate: number };
    statLabel: string;
  };
  lineShopping: {
    allBooks: PlayerDetailResponse['lineShopping']['allBooks'];
    lineSpread: number;
    statLabel: string;
  };
  oddsComparison: OddsComparison[];

  // State
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  setTimeRange: (range: TimeRange) => void;
}

// ── Default / empty values ──────────────────────────────────────────────────

const EMPTY_HERO: HeroData = {
  player: { id: 0, firstName: '', lastName: '', fullName: '', position: '', jerseyNumber: null, imageUrl: null },
  team: { abbreviation: '???', name: '', city: '' },
  opponent: null,
  injury: null,
};

const EMPTY_PROJECTION: ProjectionComparison = {
  prizePicksLine: null, visProjection: 0, draftKingsLine: null, edge: 0, recommendation: 'AVOID',
};

const EMPTY_CONFIDENCE: ConfidenceData = {
  confidence: 50, projection: 0, line: 0, edge: 0, volatility: 50,
  minutesRisk: 'Low',
  streak: { type: 'neutral', intensity: 'mild', gamesCount: 0, description: 'NEUTRAL' },
  rollingAverages: { last5: 0, last10: 0, season: 0 },
};

const EMPTY_TRENDS: TrendsData = {
  chartData: [], timeRange: 'L10', line: 0, projection: 0, average: 0, overCount: 0, underCount: 0, gameChips: [],
};

const EMPTY_ANALYTICS: AnalyticsData = {
  hitRate: {
    last5: { hits: 0, total: 0, percentage: 0 },
    last10: { hits: 0, total: 0, percentage: 0 },
    last20: { hits: 0, total: 0, percentage: 0 },
    season: { hits: 0, total: 0, percentage: 0 },
    trend: 'flat',
  },
  momentum: { multiplier: 1, trend: 'flat', recentVsAverage: 0, consecutiveGames: 0, description: 'STEADY' },
  consistency: { rating: 'Medium', standardDeviation: 0, coefficientOfVariation: 0, floorValue: 0, ceilingValue: 0, rangeDescription: '' },
  distribution: { buckets: [], median: 0, mode: 0 },
};

const EMPTY_SPLITS: SplitsData = {
  homeAway: {
    home: { average: 0, gamesPlayed: 0, hitRate: 0 },
    away: { average: 0, gamesPlayed: 0, hitRate: 0 },
    advantage: 'neutral',
  },
  vsOpponent: null,
  restDays: {
    backToBack: { average: 0, gamesPlayed: 0 },
    oneDay: { average: 0, gamesPlayed: 0 },
    twoPlusDays: { average: 0, gamesPlayed: 0 },
  },
  minutesStability: { average: 0, standardDeviation: 0, risk: 'Low', trend: 'flat' },
};

// ── Mapping functions ───────────────────────────────────────────────────────

function mapStreak(data: PlayerDetailResponse): StreakData {
  const { currentStreak, momentum } = data;
  const isHot = currentStreak.type === 'hit' && currentStreak.count >= 3;
  const isCold = currentStreak.type === 'miss' && currentStreak.count >= 3;

  return {
    type: isHot ? 'hot' : isCold ? 'cold' : 'neutral',
    intensity: currentStreak.count >= 5 ? 'extreme' : currentStreak.count >= 3 ? 'moderate' : 'mild',
    gamesCount: currentStreak.count,
    description: momentum.description,
  };
}

function mapChartData(data: PlayerDetailResponse, timeRange: TimeRange): ChartDataPoint[] {
  const limit = timeRange === 'L5' ? 5 : timeRange === 'L10' ? 10 : 20;
  // chartData is already chronological (oldest first, x=1)
  const sliced = data.chartData.slice(-limit);
  return sliced.map((p, i) => ({
    x: i + 1,
    y: p.y,
    opponent: p.opponent,
    date: p.game_date,
    isHome: p.isHome,
    minutes: p.minutes,
    isOver: p.isOver,
  }));
}

function mapGameChips(data: PlayerDetailResponse, timeRange: TimeRange): GameChipData[] {
  const limit = timeRange === 'L5' ? 5 : timeRange === 'L10' ? 10 : 20;
  const sliced = data.chartData.slice(-limit);
  return sliced.map((p) => ({
    opponent: p.opponent,
    value: p.y,
    isOver: p.isOver,
    isHome: p.isHome,
    date: p.game_date,
    minutes: p.minutes,
  }));
}

function mapHitRate(data: PlayerDetailResponse): HitRateData {
  return {
    last5: { hits: data.hitRates.last5.hits, total: data.hitRates.last5.total, percentage: Math.round(data.hitRates.last5.rate * 100) },
    last10: { hits: data.hitRates.last10.hits, total: data.hitRates.last10.total, percentage: Math.round(data.hitRates.last10.rate * 100) },
    last20: { hits: data.hitRates.last20.hits, total: data.hitRates.last20.total, percentage: Math.round(data.hitRates.last20.rate * 100) },
    season: { hits: data.hitRates.season.hits, total: data.hitRates.season.total, percentage: Math.round(data.hitRates.season.rate * 100) },
    trend: data.hitRates.trend,
  };
}

function mapDistribution(data: PlayerDetailResponse): DistributionData {
  const buckets: DistributionBucket[] = data.distribution.buckets.map((b) => ({
    label: b.label,
    count: b.count,
    percentage: b.percentage,
    color: BUCKET_COLORS[b.label] ?? '#666666',
    range: b.range,
  }));
  return { buckets, median: data.distribution.median, mode: data.distribution.mode };
}

function mapOddsComparison(data: PlayerDetailResponse, statType: string): OddsComparison[] {
  if (!data.lineShopping.allBooks.length) return [];

  const books = data.lineShopping.allBooks.map((b) => ({
    sportsbook: b.bookmaker_key,
    line: b.line,
    over_odds: b.over_price,
    under_odds: b.under_price,
  }));

  const bestOver = data.lineShopping.bestOverBook
    ? { sportsbook: data.lineShopping.bestOverBook.bookmaker_title.toLowerCase().replace(/\s/g, ''), odds: data.lineShopping.bestOverBook.price }
    : null;
  const bestUnder = data.lineShopping.bestUnderBook
    ? { sportsbook: data.lineShopping.bestUnderBook.bookmaker_title.toLowerCase().replace(/\s/g, ''), odds: data.lineShopping.bestUnderBook.price }
    : null;

  return [{ stat_type: statType, books, bestOver, bestUnder }];
}

// ── Main hook ───────────────────────────────────────────────────────────────

export function usePlayerDetail(
  playerId: number,
  statType: StatType,
  playerName?: string,
  headshotUrl?: string
): UsePlayerDetailReturn {
  const [timeRange, setTimeRange] = useState<TimeRange>('L10');
  const { leftBook, rightBook } = useUserPreferences();

  const backendStat = STAT_TO_BACKEND[statType] ?? 'points';
  const statLabel = statType;

  // Resolve player ID from name when playerId=0 (name-based navigation)
  const {
    data: resolvedId,
    isLoading: isResolvingId,
  } = useQuery({
    queryKey: ['player-search', playerName],
    queryFn: async () => {
      if (!playerName) return 0;
      const results = await playersApi.searchByName(playerName);
      return results.length > 0 ? results[0].id : 0;
    },
    enabled: playerId === 0 && !!playerName,
    staleTime: 30 * 60 * 1000,  // 30 minutes — player IDs don't change
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  const effectivePlayerId = playerId > 0 ? playerId : (resolvedId ?? 0);

  // Single API call — use the user's preferred sportsbook
  const {
    data: raw,
    isLoading: isLoadingDetail,
    error,
    refetch,
  } = useQuery<PlayerDetailResponse, Error>({
    queryKey: ['player-detail', effectivePlayerId, backendStat, leftBook],
    queryFn: () => playersApi.getDetail(effectivePlayerId, { stat: backendStat, line: 0, bookmaker: leftBook }),
    enabled: effectivePlayerId > 0,
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
    retry: 2,
  });

  const isLoading = isResolvingId || isLoadingDetail;

  // ── Map to component prop shapes (pure transforms, no network) ──────────

  const hero = useMemo<HeroData>(() => {
    if (!raw) return EMPTY_HERO;
    return {
      player: {
        id: raw.player.id,
        firstName: raw.player.firstName,
        lastName: raw.player.lastName,
        fullName: raw.player.fullName,
        position: raw.player.position,
        jerseyNumber: null,
        imageUrl: headshotUrl || raw.player.imageUrl,
      },
      team: {
        abbreviation: raw.player.teamAbbreviation,
        name: raw.player.teamName,
        city: '',
      },
      opponent: raw.nextGame
        ? { abbreviation: raw.nextGame.opponentAbbreviation, name: raw.nextGame.opponentName }
        : null,
      injury: null, // Not available from API-Sports
    };
  }, [raw, headshotUrl]);

  const projection = useMemo<ProjectionComparison>(() => {
    if (!raw) return EMPTY_PROJECTION;
    // Left book line comes from the API call (bookmaker param = leftBook)
    const leftLine = raw.projection.line;
    // Right book line: look up from lineShopping, fall back to first available book
    let rightLine: number | null = null;
    let resolvedRightLabel: string | undefined;
    if (rightBook === leftBook) {
      rightLine = leftLine;
    } else {
      const rightBookEntry = raw.lineShopping.allBooks.find((b) => b.bookmaker_key === rightBook);
      if (rightBookEntry) {
        rightLine = rightBookEntry.line;
      } else {
        // Preferred book not in lineShopping — fall back to first available
        const fallback = raw.lineShopping.allBooks.find((b) => b.bookmaker_key !== leftBook && b.line != null);
        if (fallback) {
          rightLine = fallback.line;
          resolvedRightLabel = shortLabel(fallback.bookmaker_key);
        }
      }
    }
    return {
      prizePicksLine: leftLine,
      visProjection: raw.projection.value,
      draftKingsLine: rightLine,
      resolvedRightLabel,
      edge: raw.projection.value - raw.projection.line,
      recommendation: raw.projection.recommendation,
    };
  }, [raw, rightBook, leftBook]);

  const confidence = useMemo<ConfidenceData>(() => {
    if (!raw) return EMPTY_CONFIDENCE;
    return {
      confidence: raw.projection.confidenceScore,
      projection: raw.projection.value,
      line: raw.projection.line,
      edge: raw.projection.value - raw.projection.line,
      volatility: raw.volatility.score,
      minutesRisk: raw.minutes.risk,
      streak: mapStreak(raw),
      rollingAverages: {
        last5: raw.averages.last5,
        last10: raw.averages.last10,
        season: raw.averages.season,
      },
    };
  }, [raw]);

  const trends = useMemo<TrendsData>(() => {
    if (!raw) return EMPTY_TRENDS;
    const chartData = mapChartData(raw, timeRange);
    const gameChips = mapGameChips(raw, timeRange);
    const overCount = chartData.filter((p) => p.isOver).length;
    const underCount = chartData.length - overCount;
    const average = chartData.length > 0
      ? Math.round((chartData.reduce((s, p) => s + p.y, 0) / chartData.length) * 10) / 10
      : 0;

    return {
      chartData,
      timeRange,
      line: raw.projection.line,
      projection: raw.projection.value,
      average,
      overCount,
      underCount,
      gameChips,
    };
  }, [raw, timeRange]);

  const analytics = useMemo<AnalyticsData>(() => {
    if (!raw) return EMPTY_ANALYTICS;
    return {
      hitRate: mapHitRate(raw),
      momentum: raw.momentum,
      consistency: raw.consistency,
      distribution: mapDistribution(raw),
    };
  }, [raw]);

  const splits = useMemo<SplitsData>(() => {
    if (!raw) return EMPTY_SPLITS;

    const homeAdv = raw.splits.home.avg > raw.splits.away.avg + 0.5
      ? 'home' as const
      : raw.splits.away.avg > raw.splits.home.avg + 0.5
        ? 'away' as const
        : 'neutral' as const;

    return {
      homeAway: {
        home: { average: raw.splits.home.avg, gamesPlayed: raw.splits.home.games, hitRate: Math.round(raw.splits.home.hitRate * 100) },
        away: { average: raw.splits.away.avg, gamesPlayed: raw.splits.away.games, hitRate: Math.round(raw.splits.away.hitRate * 100) },
        advantage: homeAdv,
      },
      vsOpponent: raw.vsOpponent
        ? {
            average: raw.vsOpponent.average,
            gamesPlayed: raw.vsOpponent.gamesPlayed,
            hitRate: Math.round(raw.vsOpponent.hitRate * 100),
            lastGame: raw.vsOpponent.lastGame
              ? { opponent: '', value: raw.vsOpponent.lastGame.value, isOver: raw.vsOpponent.lastGame.isOver, isHome: false, date: '', minutes: 0 }
              : null,
          }
        : null,
      restDays: {
        backToBack: { average: raw.splits.b2b.avg, gamesPlayed: raw.splits.b2b.games },
        oneDay: { average: 0, gamesPlayed: 0 },
        twoPlusDays: { average: raw.splits.rested.avg, gamesPlayed: raw.splits.rested.games },
      },
      minutesStability: {
        average: raw.minutes.avg5,
        standardDeviation: raw.minutes.stdDev ?? 0,
        risk: raw.minutes.risk,
        trend: raw.trajectory.trendDirection,
      },
    };
  }, [raw]);

  const radarMetrics = useMemo<RadarMetric[]>(() => {
    if (!raw) return [];
    return raw.radarMetrics;
  }, [raw]);

  // ── New gated component props ─────────────────────────────────────────────

  const opponentContext = useMemo(() => {
    if (!raw) return { opponent: null, wasHomeGame: null, gameDate: null };
    // Use nextGame opponent (upcoming game), not raw.opponent (last game played)
    const nextOpponent = raw.nextGame
      ? { name: raw.nextGame.opponentName, id: 0 }
      : raw.opponent;
    return {
      opponent: nextOpponent,
      wasHomeGame: raw.nextGame?.isHome ?? null,
      gameDate: raw.nextGame?.gameDate ?? null,
    };
  }, [raw]);

  const hitRateStreak = useMemo(() => {
    if (!raw) return { games: [], line: 0, statLabel, hitRate: 0, currentStreak: { type: 'miss' as const, count: 0 } };
    return {
      games: raw.last20Games.map((g) => ({
        game_date: g.game_date,
        opponent_name: g.opponent_abbreviation || g.opponent_name,
        was_home_game: g.was_home_game,
        game_result: g.game_result,
        stat_value: g.stat_value,
        hit: g.hit,
        minutes_played: g.minutes_played,
      })),
      line: raw.projection.line,
      statLabel,
      hitRate: raw.hitRates.last10.rate,
      currentStreak: raw.currentStreak,
    };
  }, [raw, statLabel]);

  const statsInsight = useMemo(() => {
    if (!raw) return { seasonAverage: 0, last5Average: 0, volatilityRating: 'medium' as const, edge: 0, edgeDirection: 'over' as const, minutesAvg5: 0, minutesFlag: false };
    return {
      seasonAverage: raw.averages.season,
      last5Average: raw.averages.last5,
      volatilityRating: raw.volatility.rating,
      edge: raw.edge.value,
      edgeDirection: raw.edge.direction,
      minutesAvg5: raw.minutes.avg5,
      minutesFlag: raw.minutes.flag,
    };
  }, [raw]);

  const volatilityCardData = useMemo(() => {
    if (!raw) return { volatilityRating: 'medium' as const, coefficientOfVariation: 0, stdDev: 0, minutesTrend: [], minutesAvg5: 0, minutesAvg10: 0, minutesFlag: false };
    return {
      volatilityRating: raw.volatility.rating,
      coefficientOfVariation: raw.volatility.coefficientOfVariation,
      stdDev: raw.volatility.standardDeviation,
      minutesTrend: raw.minutes.trend,
      minutesAvg5: raw.minutes.avg5,
      minutesAvg10: raw.minutes.avg10,
      minutesFlag: raw.minutes.flag,
    };
  }, [raw]);

  const trajectoryChartData = useMemo(() => {
    if (!raw) return { dataPoints: [], propLine: 0, statLabel, trendDirection: 'flat' as const };
    // Reverse chartData to newest-first for TrajectoryChart (which expects oldest→newest in last20Values format)
    const dataPoints = raw.chartData.map((p) => ({
      value: p.y,
      game_date: p.game_date,
      minutes: p.minutes,
    }));
    return {
      dataPoints,
      propLine: raw.projection.line,
      statLabel,
      trendDirection: raw.trajectory.trendDirection,
    };
  }, [raw, statLabel]);

  const splitsCardData = useMemo(() => {
    if (!raw) return { homeSplits: { games: 0, avg: 0, hitRate: 0 }, awaySplits: { games: 0, avg: 0, hitRate: 0 }, b2bSplits: { games: 0, avg: 0, hitRate: 0 }, restedSplits: { games: 0, avg: 0, hitRate: 0 }, statLabel };
    return {
      homeSplits: raw.splits.home,
      awaySplits: raw.splits.away,
      b2bSplits: raw.splits.b2b,
      restedSplits: raw.splits.rested,
      statLabel,
    };
  }, [raw, statLabel]);

  const lineShoppingData = useMemo(() => {
    if (!raw) return { allBooks: [], lineSpread: 0, statLabel };
    // Sort books so user's preferred sportsbooks appear first
    const sorted = [...raw.lineShopping.allBooks].sort((a, b) => {
      const aIsPreferred = a.bookmaker_key === leftBook ? -1 : 0;
      const bIsPreferred = b.bookmaker_key === leftBook ? -1 : 0;
      return aIsPreferred - bIsPreferred;
    });
    return {
      allBooks: sorted,
      lineSpread: raw.lineShopping.lineSpread,
      statLabel,
    };
  }, [raw, statLabel, leftBook]);

  const oddsComparison = useMemo<OddsComparison[]>(() => {
    if (!raw) return [];
    return mapOddsComparison(raw, statType);
  }, [raw, statType]);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    hero,
    projection,
    confidence,
    trends,
    analytics,
    splits,
    radarMetrics,

    opponentContext,
    hitRateStreak,
    statsInsight,
    volatilityCard: volatilityCardData,
    trajectoryChart: trajectoryChartData,
    splitsCard: splitsCardData,
    lineShopping: lineShoppingData,
    oddsComparison,

    isLoading,
    error: error && effectivePlayerId > 0
      ? (console.error('[usePlayerDetail]', { playerId: effectivePlayerId, statType, error: error.message }), error)
      : null,
    refetch,
    setTimeRange,
  };
}
