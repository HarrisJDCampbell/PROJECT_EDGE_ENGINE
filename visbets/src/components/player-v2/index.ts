/**
 * Player Detail V2 - Barrel exports
 *
 * Modern, interactive player analytics page with:
 * - Consolidated sections (5 vs 19+ cards)
 * - Gesture-based interactions
 * - Smooth animations
 * - wagmi-charts for interactive line charts
 */

// Main screen component
export { PlayerDetailScreenV2 } from './PlayerDetailScreen';

// Hooks
export { usePlayerDetail } from './hooks';

// Sections
export { HeroSection, PlayerAvatar, StatPillBar, ProjectionRow } from './sections/HeroSection';
export { ConfidenceHub, RadialGauge, MetricsGrid } from './sections/ConfidenceHub';
export { PerformanceTrends, InteractiveChart, GameChipCarousel } from './sections/PerformanceTrends';
export { AnalyticsDashboard, TabBar, HitRateTab, MomentumTab, ConsistencyTab, DistributionTab } from './sections/AnalyticsDashboard';
export { SplitsMatchups, SplitComparison, MatchupRadar } from './sections/SplitsMatchups';
export { OddsComparisonSection } from './sections/OddsComparison';

// Loading Components
export { Skeleton, PlayerDetailSkeleton, HeroSkeleton, ConfidenceSkeleton, ChartSkeleton, AnalyticsSkeleton, SplitsSkeleton } from './components/Skeleton';

// Types
export * from './types';
