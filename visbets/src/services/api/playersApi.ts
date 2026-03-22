/**
 * Players API
 * Wraps backend /api/players/* endpoints.
 * Maps API-Sports response shapes to frontend-friendly interfaces.
 */

import { backendClient } from './backendClient';

export interface PlayerInfo {
  id: number;
  name: string;
  team: string;
  position: string;
  seasonAverages: {
    gamesPlayed: number;
    points: number;
    rebounds: number;
    assists: number;
    threes: number;
    steals: number;
    blocks: number;
    turnovers: number;
  } | null;
}

export interface PlayerLog {
  gameId: number;
  date: string;
  opponent: string;
  // Enriched fields (populated after backend fix)
  opponent_name: string;
  was_home_game: boolean;
  game_result: 'W' | 'L' | null;
  game_date: string;
  points: number;
  rebounds: number;
  assists: number;
  threes: number;
  steals: number;
  blocks: number;
  turnovers: number;
  minutes: string;
  plusMinus: string;
}

export interface PlayerProjection {
  playerId: number;
  stat: string;
  projection: number;
  line: number | null;
  edge: number | null;
  confidence: number;
}

// ── Player Analysis types (mirrors backend PlayerAnalysis) ────────────────────

export interface AnalysisGame {
  game_date: string;
  opponent_name: string;
  was_home_game: boolean;
  game_result: 'W' | 'L' | null;
  stat_value: number;
  hit: boolean;
  minutes_played: number;
}

export interface AnalysisValue {
  game_date: string;
  value: number;
  minutes: number;
}

export interface SplitData {
  games: number;
  avg: number;
  hitRate: number;  // 0–1
}

export interface BookLine {
  bookmaker_key: string;
  bookmaker_title: string;
  over_price: number;
  under_price: number;
  line: number;
  is_best_over: boolean;
  is_best_under: boolean;
}

export interface PlayerAnalysis {
  // Streak
  last20Games: AnalysisGame[];
  hitRate10: number;   // 0–1
  hitRate5: number;    // 0–1
  currentStreak: { type: 'hit' | 'miss'; count: number };

  // Trajectory
  last20Values: AnalysisValue[];
  trendDirection: 'up' | 'down' | 'flat';
  trendDelta: number;
  seasonAverage: number;
  last5Average: number;
  last10Average: number;

  // Edge
  edge: number;
  edgeDirection: 'over' | 'under';

  // Volatility
  standardDeviation: number;
  coefficientOfVariation: number;
  volatilityRating: 'low' | 'medium' | 'high';
  minutesTrend: number[];
  minutesAvg5: number;
  minutesAvg10: number;
  minutesFlag: boolean;

  // Splits
  homeSplits: SplitData;
  awaySplits: SplitData;
  b2bSplits: SplitData;
  restedSplits: SplitData;

  // Opponent
  opponent: { name: string; id: number } | null;
  opponentPaceRank: null;
  opponentDefRating: null;

  // Line shopping
  allBooks: BookLine[];
  bestOverBook: { bookmaker_title: string; line: number; price: number } | null;
  bestUnderBook: { bookmaker_title: string; line: number; price: number } | null;
  lineSpread: number;

  // Quota status
  oddsQuota: { remaining: number; used: number; isLow: boolean };
}

export interface AnalysisParams {
  stat: string;
  line: number;
  bookmaker?: string;
}

// ── Unified player detail response ──────────────────────────────────────────

export interface PlayerDetailResponse {
  player: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    position: string;
    imageUrl: string | null;
    teamName: string;
    teamAbbreviation: string;
  };

  nextGame: {
    opponentName: string;
    opponentAbbreviation: string;
    isHome: boolean;
    gameDate: string;
    gameTime: string;
  } | null;

  projection: {
    value: number;
    line: number;
    edge: number;
    pOver: number;
    impliedPOver: number;
    direction: 'over' | 'under';
    visbetsScore: number;
    confidence: 'low' | 'medium' | 'high';
    confidenceScore: number;
    recommendation: 'OVER' | 'UNDER' | 'AVOID';
    stdDev: number;
    sampleSize: number;
    overOdds: number | null;
    underOdds: number | null;
    bookmaker: string | null;
  };

  hitRates: {
    last5: { hits: number; total: number; rate: number };
    last10: { hits: number; total: number; rate: number };
    last20: { hits: number; total: number; rate: number };
    season: { hits: number; total: number; rate: number };
    trend: 'up' | 'down' | 'flat';
  };

  currentStreak: { type: 'hit' | 'miss'; count: number };

  averages: {
    season: number;
    last5: number;
    last10: number;
  };

  momentum: {
    multiplier: number;
    trend: 'up' | 'down' | 'flat';
    recentVsAverage: number;
    consecutiveGames: number;
    description: string;
  };

  trajectory: {
    trendDirection: 'up' | 'down' | 'flat';
    trendDelta: number;
  };

  volatility: {
    standardDeviation: number;
    coefficientOfVariation: number;
    rating: 'low' | 'medium' | 'high';
    score: number;
  };

  consistency: {
    rating: 'High' | 'Medium' | 'Low';
    standardDeviation: number;
    coefficientOfVariation: number;
    floorValue: number;
    ceilingValue: number;
    rangeDescription: string;
  };

  distribution: {
    buckets: Array<{
      label: string;
      count: number;
      percentage: number;
      range: { min: number; max: number };
    }>;
    median: number;
    mode: number;
  };

  minutes: {
    avg5: number;
    avg10: number;
    trend: number[];
    flag: boolean;
    risk: 'Low' | 'Medium' | 'High';
    stdDev?: number;
  };

  edge: {
    value: number;
    direction: 'over' | 'under';
  };

  last20Games: Array<{
    game_date: string;
    opponent_name: string;
    opponent_abbreviation: string;
    was_home_game: boolean;
    game_result: 'W' | 'L' | null;
    stat_value: number;
    hit: boolean;
    minutes_played: number;
  }>;

  chartData: Array<{
    x: number;
    y: number;
    game_date: string;
    opponent: string;
    isHome: boolean;
    minutes: number;
    isOver: boolean;
  }>;

  splits: {
    home: SplitData;
    away: SplitData;
    b2b: SplitData;
    rested: SplitData;
  };

  opponent: { name: string; id: number } | null;

  vsOpponent: {
    average: number;
    gamesPlayed: number;
    hitRate: number;
    lastGame: { value: number; isOver: boolean } | null;
  } | null;

  lineShopping: {
    allBooks: BookLine[];
    bestOverBook: { bookmaker_title: string; line: number; price: number } | null;
    bestUnderBook: { bookmaker_title: string; line: number; price: number } | null;
    lineSpread: number;
  };

  radarMetrics: Array<{
    label: string;
    shortLabel: string;
    value: number;
    rawValue: string;
  }>;

  oddsQuota: { remaining: number; used: number; isLow: boolean };

  stat: string;
  line: number;
  bookmaker: string;
  generatedAt: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const playersApi = {
  getPlayer: async (playerId: number): Promise<PlayerInfo> => {
    const { data } = await backendClient.get(`/api/players/${playerId}`);
    const p = data.player;
    return {
      id: p?.id ?? playerId,
      name: p ? `${p.firstname ?? p.first_name ?? ''} ${p.lastname ?? p.last_name ?? ''}`.trim() : '',
      team: '',
      position: '',
      seasonAverages: data.seasonAverages ?? null,
    };
  },

  getRecentLogs: async (playerId: number, limit = 15): Promise<PlayerLog[]> => {
    const { data } = await backendClient.get(`/api/players/${playerId}/logs`, {
      params: { limit },
    });
    const logs: any[] = data.logs ?? [];
    return logs.map((g) => ({
      gameId: g.game?.id ?? 0,
      // Legacy fields (empty pre-enrichment)
      date: g.game_date ?? '',
      opponent: g.opponent_name ?? '',
      // Enriched fields
      opponent_name: g.opponent_name ?? '',
      was_home_game: g.was_home_game ?? false,
      game_result: g.game_result ?? null,
      game_date: g.game_date ?? '',
      points: g.points ?? 0,
      rebounds: g.totReb ?? 0,
      assists: g.assists ?? 0,
      threes: g.tpm ?? 0,
      steals: g.steals ?? 0,
      blocks: g.blocks ?? 0,
      turnovers: g.turnovers ?? 0,
      minutes: g.min ?? '0',
      plusMinus: g.plusMinus ?? '0',
    }));
  },

  getProps: async (playerId: number): Promise<PlayerProjection[]> => {
    const { data } = await backendClient.get(`/api/players/${playerId}/props`);
    return data.props ?? [];
  },

  getAnalysis: async (
    playerId: number,
    params: AnalysisParams
  ): Promise<PlayerAnalysis> => {
    const { data } = await backendClient.get(
      `/api/players/${playerId}/analysis`,
      { params }
    );
    return data.analysis as PlayerAnalysis;
  },

  /** Search players by name — returns API-Sports IDs. */
  searchByName: async (
    name: string
  ): Promise<Array<{ id: number; firstname: string; lastname: string; score: number }>> => {
    const { data } = await backendClient.get('/api/players/search', {
      params: { name },
    });
    return data.results ?? [];
  },

  /** Unified player detail — returns ALL data the player detail page needs. */
  getDetail: async (
    playerId: number,
    params: { stat: string; line: number; bookmaker: string }
  ): Promise<PlayerDetailResponse> => {
    const { data } = await backendClient.get(
      `/api/players/${playerId}/detail`,
      { params }
    );
    return data as PlayerDetailResponse;
  },
};
