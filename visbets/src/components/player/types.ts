/**
 * Player Detail Component Type Definitions
 * All prop interfaces for player detail screen components
 */

/**
 * Supported stat types (including combo stats)
 */
export type StatType =
  | 'PTS'   // Points
  | 'REB'   // Rebounds
  | 'AST'   // Assists
  | 'PRA'   // Points + Rebounds + Assists
  | '3PM'   // Three Pointers Made
  | 'STL'   // Steals
  | 'BLK'   // Blocks
  | 'TO';   // Turnovers

/**
 * Stat keys for API data access
 * Note: 'pra' is a composite key for Points + Rebounds + Assists
 */
export type StatTypeKey =
  | 'pts'
  | 'reb'
  | 'ast'
  | 'pra'
  | 'fg3m'
  | 'stl'
  | 'blk'
  | 'turnover';

/**
 * Sportsbook names (MVP supports DraftKings and PrizePicks only)
 */
export type SportsbookName = 'DraftKings' | 'PrizePicks';

/**
 * Book line data for a specific sportsbook
 */
export interface BookLine {
  name: SportsbookName;
  line: number;
  edge?: number;  // projection - line
}

/**
 * Risk level indicator
 */
export type RiskLevel = 'Low' | 'Medium' | 'High';

/**
 * Trend direction
 */
export type TrendDirection = 'up' | 'down' | 'flat';

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

/**
 * ProjectionVsLinesCard (HERO COMPONENT)
 * Shows VisBets projection vs DraftKings and PrizePicks lines
 */
export interface ProjectionVsLinesCardProps {
  statType: StatType;
  visProjection: number;
  books: BookLine[];
  onBookSelect?: (bookName: SportsbookName) => void;
}

/**
 * StatSelectorChips
 * Horizontal segmented control for switching stat types
 */
export interface StatSelectorChipsProps {
  availableStats: StatType[];
  selectedStat: StatType;
  onStatChange: (stat: StatType) => void;
}

/**
 * ConfidenceRiskBar
 * 3-module strip showing confidence, volatility, minutes risk
 */
export interface ConfidenceRiskBarProps {
  confidence: number;           // 0-100
  volatility: RiskLevel;
  minutesRisk: RiskLevel;
  onInfoPress?: (type: 'confidence' | 'volatility' | 'minutes') => void;
}

/**
 * RollingAverageTiles
 * 3-column grid showing L5, L10, Season averages
 */
export interface RollingAverageTilesProps {
  statType: StatType;
  last5Avg: number;
  last10Avg: number;
  seasonAvg: number;
  bookLine?: number;  // For comparison tick marks
}

/**
 * RollingAvgTile (Individual tile component)
 */
export interface RollingAvgTileProps {
  label: string;        // "L5", "L10", "Season"
  value: number;
  aboveLine?: boolean;  // Show green tick if above book line
}

/**
 * GameLogCarousel (PREMIUM)
 * Horizontal scroll of recent games
 */
export interface GameLogCarouselProps {
  statType: StatType;
  games: GameLogEntry[];
  isPremium: boolean;
}

/**
 * Individual game log entry
 */
export interface GameLogEntry {
  opponent: string;     // "LAL", "GSW", etc.
  minutes: number;
  statValue: number;
  gameDate?: string;
  isHome?: boolean;
}

/**
 * GameLogCard (Individual game card)
 */
export interface GameLogCardProps {
  game: GameLogEntry;
  statType: StatType;
  maxValue?: number;    // For spark bar scaling
}

/**
 * TrendLineCard (PREMIUM)
 * Victory Native line chart showing recent performance
 */
export interface TrendLineCardProps {
  statType: StatType;
  games: TrendDataPoint[];
  projection: number;
  bookLine: number;
  trendDirection?: TrendDirection;
  isPremium: boolean;
}

/**
 * Data point for trend chart
 */
export interface TrendDataPoint {
  gameNumber: number;   // 1-10 (most recent = 1)
  value: number;
  opponent?: string;
}

/**
 * TrendBadge
 * Small badge showing "Trending Up", "Trending Down", "Trending Flat"
 */
export interface TrendBadgeProps {
  direction: TrendDirection;
}


/**
 * PlayerHeaderCard (NEW)
 * Sticky header with three-way comparison (PrizePicks, Our Projection, DraftKings)
 * Color-coded: RED (below both), YELLOW (between), GREEN (above both)
 */
export interface PlayerHeaderCardProps {
  player: any;  // Player type from API
  statType: StatType;
  ourProjection: number;
  prizePicksLine: number | null;
  draftKingsLine: number | null;
}

/**
 * HitRateTrackerCard (NEW)
 * Shows historical hit rate vs betting line over last 5, 10, 20 games
 */
export interface HitRateTrackerCardProps {
  statType: StatType;
  recentGames: any[];  // GameStats[] from API
  line: number;
  statKey: string;  // 'pts', 'reb', 'ast', etc.
}

/**
 * MomentumIndicatorCard (NEW)
 * Hot/cold streak visualization with trend analysis
 */
export interface MomentumIndicatorCardProps {
  statType: StatType;
  recentGames: any[];  // GameStats[] from API
  seasonAvg: number;
  statKey: string;  // 'pts', 'reb', 'ast', etc.
}

/**
 * HistoricalVsOpponentCard (NEW - PREMIUM)
 * Shows player's historical performance vs upcoming opponent
 */
export interface HistoricalVsOpponentCardProps {
  statType: StatType;
  recentGames: any[];  // GameStats[] from API
  opponent: any | null;  // Team type from API
  statKey: string;  // 'pts', 'reb', 'ast', etc.
  isPremium: boolean;
}

/**
 * VolatilityIndicator (Sub-component of ConfidenceRiskBar)
 */
export interface VolatilityIndicatorProps {
  level: RiskLevel;
  onPress?: () => void;
}

/**
 * MinutesRiskIndicator (Sub-component of ConfidenceRiskBar)
 */
export interface MinutesRiskIndicatorProps {
  level: RiskLevel;
  averageMinutes?: number;
  stdDeviation?: number;
  onPress?: () => void;
}

// ============================================================================
// DATA TRANSFORMATION TYPES
// ============================================================================

/**
 * Projection data for a specific stat
 * (Combines projection + book lines + edge calculations)
 */
export interface StatProjectionData {
  statType: StatType;
  projection: number;
  confidence: number;
  volatility: number;
  minutesRisk: RiskLevel;
  books: BookLine[];
  last5Avg: number;
  last10Avg: number;
  seasonAvg: number;
  recentGames: GameLogEntry[];
  trendDirection: TrendDirection;
}

/**
 * Helper type for volatility as risk level
 */
export function volatilityToRiskLevel(volatility: number): RiskLevel {
  if (volatility > 70) return 'High';
  if (volatility > 40) return 'Medium';
  return 'Low';
}

/**
 * Helper to calculate PRA (combo stat)
 */
export interface PRAComponents {
  pts: number;
  reb: number;
  ast: number;
}

export function calculatePRA(components: PRAComponents): number {
  return components.pts + components.reb + components.ast;
}

// ============================================================================
// NEW ANALYTICS COMPONENT INTERFACES
// ============================================================================

/**
 * LinePerformanceCard
 * Shows past 5 games performance vs current betting line
 */
export interface LinePerformanceCardProps {
  statType: StatType;
  recentGames: any[];  // GameStats[] from API
  line: number;
  statKey: StatTypeKey;
  isPremium: boolean;
}

/**
 * HomeAwaySplitsCard
 * Shows home vs away performance comparison
 */
export interface HomeAwaySplitsCardProps {
  statType: StatType;
  recentGames: any[];  // GameStats[] from API
  statKey: StatTypeKey;
  line: number;
  isPremium: boolean;
}

/**
 * ConsistencyCard
 * Shows performance volatility analysis
 */
export interface ConsistencyCardProps {
  statType: StatType;
  recentGames: any[];  // GameStats[] from API
  statKey: StatTypeKey;
  line: number;
  isPremium: boolean;
}

/**
 * Consistency rating type
 */
export type ConsistencyRating = 'High' | 'Medium' | 'Low';
