/**
 * Player Detail V2 - Type Definitions
 *
 * Enhanced types for the redesigned player detail page with
 * consolidated sections and interactive visualizations.
 */

import { GameStats, Player, Team, SeasonAverage } from '../../services/api/types';

// Re-export base types from v1 for compatibility
export type {
  StatType,
  StatTypeKey,
  RiskLevel,
  TrendDirection,
  BookLine,
  GameLogEntry,
  TrendDataPoint,
} from '../player/types';

import type {
  StatType,
  StatTypeKey,
  RiskLevel,
  TrendDirection,
  BookLine,
  GameLogEntry,
  TrendDataPoint,
} from '../player/types';

// ============================================================================
// CONSOLIDATED ANALYTICS DATA
// ============================================================================

/**
 * Hero section display data
 */
export interface HeroData {
  player: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    position: string;
    jerseyNumber: string | null;
    imageUrl: string | null;
  };
  team: {
    abbreviation: string;
    name: string;
    city: string;
  };
  opponent: {
    abbreviation: string;
    name: string;
  } | null;
  injury: {
    status: string;
    description: string;
  } | null;
}

/**
 * Projection comparison data (PP | VIS | DK)
 */
export interface ProjectionComparison {
  prizePicksLine: number | null;
  visProjection: number;
  draftKingsLine: number | null;
  /** When the right book had no data and we fell back to another book, this is the fallback label */
  resolvedRightLabel?: string;
  edge: number; // visProjection - prizePicksLine
  recommendation: 'OVER' | 'UNDER' | 'AVOID';
}

/**
 * Confidence hub consolidated data
 */
export interface ConfidenceData {
  confidence: number; // 0-100
  projection: number;
  line: number;
  edge: number;
  volatility: number; // 0-100
  minutesRisk: RiskLevel;
  streak: StreakData;
  rollingAverages: {
    last5: number;
    last10: number;
    season: number;
  };
}

/**
 * Streak indicator data
 */
export interface StreakData {
  type: 'hot' | 'cold' | 'neutral';
  intensity: 'extreme' | 'moderate' | 'mild';
  gamesCount: number;
  description: string; // "ON FIRE", "HOT STREAK", "COLD SPELL", "ICE COLD", "NEUTRAL"
}

/**
 * Performance trends chart data
 */
export interface TrendsData {
  chartData: ChartDataPoint[];
  timeRange: 'L5' | 'L10' | 'L20';
  line: number;
  projection: number;
  average: number;
  overCount: number;
  underCount: number;
  gameChips: GameChipData[];
}

/**
 * Chart data point with enhanced metadata
 */
export interface ChartDataPoint {
  x: number; // game index
  y: number; // stat value
  opponent: string;
  date: string;
  isHome: boolean;
  minutes: number;
  isOver: boolean;
}

/**
 * Game chip for horizontal carousel
 */
export interface GameChipData {
  opponent: string;
  value: number;
  isOver: boolean;
  isHome: boolean;
  date: string;
  minutes: number;
}

/**
 * Analytics dashboard tab data
 */
export interface AnalyticsData {
  hitRate: HitRateData;
  momentum: MomentumData;
  consistency: ConsistencyData;
  distribution: DistributionData;
}

/**
 * Hit rate analysis data
 */
export interface HitRateData {
  last5: { hits: number; total: number; percentage: number };
  last10: { hits: number; total: number; percentage: number };
  last20: { hits: number; total: number; percentage: number };
  season: { hits: number; total: number; percentage: number };
  trend: TrendDirection;
}

/**
 * Momentum analysis data
 */
export interface MomentumData {
  multiplier: number; // 0.8 - 1.2
  trend: TrendDirection;
  recentVsAverage: number; // percentage above/below season avg
  consecutiveGames: number; // streak length
  description: string;
}

/**
 * Consistency analysis data
 */
export interface ConsistencyData {
  rating: 'High' | 'Medium' | 'Low';
  standardDeviation: number;
  coefficientOfVariation: number; // CV = stdDev / mean
  floorValue: number; // worst recent performance
  ceilingValue: number; // best recent performance
  rangeDescription: string;
}

/**
 * Stat distribution data
 */
export interface DistributionData {
  buckets: DistributionBucket[];
  median: number;
  mode: number;
}

/**
 * Distribution bucket
 */
export interface DistributionBucket {
  label: string; // "Way Under", "Under", "Near Line", "Over", "Way Over"
  count: number;
  percentage: number;
  color: string;
  range: { min: number; max: number };
}

/**
 * Splits and matchups section data
 */
export interface SplitsData {
  homeAway: {
    home: { average: number; gamesPlayed: number; hitRate: number };
    away: { average: number; gamesPlayed: number; hitRate: number };
    advantage: 'home' | 'away' | 'neutral';
  };
  vsOpponent: {
    average: number;
    gamesPlayed: number;
    hitRate: number;
    lastGame: GameChipData | null;
  } | null;
  restDays: {
    backToBack: { average: number; gamesPlayed: number };
    oneDay: { average: number; gamesPlayed: number };
    twoPlusDays: { average: number; gamesPlayed: number };
  };
  minutesStability: {
    average: number;
    standardDeviation: number;
    risk: RiskLevel;
    trend: TrendDirection;
  };
}

/**
 * Matchup radar chart metrics
 */
export interface RadarMetric {
  label: string;
  shortLabel: string;
  value: number; // 0-100
  rawValue: string;
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

/**
 * Main screen props
 */
export interface PlayerDetailScreenProps {
  playerId: number;
  initialStatType?: StatType;
  gameId?: number;
}

/**
 * Hero section props
 */
export interface HeroSectionProps {
  hero: HeroData;
  projection: ProjectionComparison;
  statType: StatType;
  availableStats: StatType[];
  onStatChange: (stat: StatType) => void;
}

/**
 * Stat pill bar props (horizontal selector)
 */
export interface StatPillBarProps {
  stats: StatType[];
  selected: StatType;
  onSelect: (stat: StatType) => void;
}

/**
 * Projection row props
 */
export interface ProjectionRowProps {
  projection: ProjectionComparison;
  statType: StatType;
}

/**
 * Confidence hub props
 */
export interface ConfidenceHubProps {
  data: ConfidenceData;
  statType: StatType;
  onLongPress?: () => void;
}

/**
 * Radial gauge props
 */
export interface RadialGaugeProps {
  confidence: number;
  projection: number;
  line: number;
  edge: number;
  streak?: StreakData;
}

/**
 * Performance trends props
 */
export interface PerformanceTrendsProps {
  data: TrendsData;
  statType: StatType;
  onTimeRangeChange: (range: 'L5' | 'L10' | 'L20') => void;
  isPremium: boolean;
}

/**
 * Interactive chart props (wagmi-charts)
 */
export interface InteractiveChartProps {
  data: ChartDataPoint[];
  line: number;
  projection: number;
  mode: 'line' | 'bar';
  onDataPointPress?: (point: ChartDataPoint) => void;
}

/**
 * Analytics dashboard props
 */
export interface AnalyticsDashboardProps {
  data: AnalyticsData;
  statType: StatType;
  line: number;
  isPremium: boolean;
}

/**
 * Splits matchups props
 */
export interface SplitsMatchupsProps {
  data: SplitsData;
  radarMetrics: RadarMetric[];
  opponent: { name: string; abbreviation: string } | null;
  statType: StatType;
  isPremium: boolean;
}

// ============================================================================
// CONSOLIDATED HOOK RETURN TYPE
// ============================================================================

/**
 * usePlayerAnalytics hook return type
 */
export interface PlayerAnalyticsData {
  // Section data
  hero: HeroData;
  projection: ProjectionComparison;
  confidence: ConfidenceData;
  trends: TrendsData;
  analytics: AnalyticsData;
  splits: SplitsData;
  radarMetrics: RadarMetric[];

  // State
  isLoading: boolean;
  hasRealData: boolean; // true if using real API data
  error: Error | null;

  // Actions
  refetch: () => void;
  setTimeRange: (range: 'L5' | 'L10' | 'L20') => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Subscription feature keys for premium gating
 */
export type FeatureKey =
  | 'advancedStats'
  | 'advancedSplits'
  | 'trendCharts'
  | 'gameLogs'
  | 'matchupEngine';

/**
 * Tab identifiers for analytics dashboard
 */
export type AnalyticsTab = 'hitRate' | 'momentum' | 'consistency';

/**
 * Chart mode toggle
 */
export type ChartMode = 'line' | 'bar';

/**
 * Time range for trend analysis
 */
export type TimeRange = 'L5' | 'L10' | 'L20';
