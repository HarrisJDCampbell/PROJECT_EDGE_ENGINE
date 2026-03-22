/**
 * PlayerDetailScreen V2 — Unified Player Detail Page
 *
 * Powered by a single backend endpoint: GET /api/players/:id/detail
 * Zero client-side analytics computation. The phone renders, the server thinks.
 *
 * Section order (free-first layout):
 * 1. HeroSection — Player info, stat selector, projection comparison
 * 2. ConfidenceHub — Radial gauge, metrics, streak indicator
 * 3. StatsInsightRow (FREE) — season avg vs L5, model edge, minutes
 * 4. TrajectoryChart (FREE limited) — line chart (5/10/20 games by tier)
 * 5. OpponentContextCard (FREE) — opponent, home/away
 * 6. HitRateStreakBar (FREE: L5, VisPlus+: L10) — game-by-game hit/miss
 * ── VisPlus / VISMAX gated ──
 * 7. VolatilityCard (VisPlus) — consistency + MPG trend
 * 8. OddsComparison (VisPlus) — Multi-sportsbook odds table
 * 9. PerformanceTrends (VisPlus) — Interactive charts
 * 10. AnalyticsDashboard (VisPlus) — Hit rate, momentum, consistency, distribution
 * 11. SplitsCard (VISMAX) — home/away + rest splits
 * 12. LineShoppingStrip (VISMAX) — multi-book odds comparison
 * 13. SplitsMatchups (VisPlus/VISMAX) — situational analysis + radar
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { usePlayerDetail } from './hooks/usePlayerDetail';
import { HeroSection } from './sections/HeroSection';
import { ConfidenceHub } from './sections/ConfidenceHub';
import { PerformanceTrends } from './sections/PerformanceTrends';
import { AnalyticsDashboard } from './sections/AnalyticsDashboard';
import { DistributionSection } from './sections/DistributionSection';
import { SplitsMatchups } from './sections/SplitsMatchups';
import { OddsComparisonSection } from './sections/OddsComparison';
import { DataLoadingScreen } from '../common/DataLoadingScreen';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { LockedFeatureWrapper } from '../common/LockedFeatureWrapper';
import { useUserStatsStore } from '../../stores/userStatsStore';
import { analyticsService } from '../../services/analytics/analyticsService';

// Data-driven gated components
import { OpponentContextCard } from '../player/OpponentContextCard';
import { HitRateStreakBar } from '../player/HitRateStreakBar';
import { StatsInsightRow } from '../player/StatsInsightRow';
import { VolatilityCard } from '../player/VolatilityCard';
import { SplitsCard } from '../player/SplitsCard';
import { LineShoppingStrip } from '../player/LineShoppingStrip';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/styles';
import type { StatType, TimeRange } from './types';

const AVAILABLE_STATS: StatType[] = ['PTS', 'REB', 'AST', 'PRA', '3PM'];

interface PlayerDetailScreenV2Props {
  playerId: number;
  initialStatType?: StatType;
  gameId?: number;
  playerName?: string;
  headshotUrl?: string;
}

export function PlayerDetailScreenV2({
  playerId,
  initialStatType = 'PTS',
  gameId,
  playerName,
  headshotUrl,
}: PlayerDetailScreenV2Props) {
  const router = useRouter();
  const [selectedStat, setSelectedStat] = useState<StatType>(initialStatType);

  // Subscription state — drives gating on components
  const tier = useSubscriptionStore((s) => s.tier) as 'free' | 'starter' | 'pro';
  const isStarter = useSubscriptionStore((s) => s.isStarter());
  const isPro = useSubscriptionStore((s) => s.isPro());

  // ── SINGLE UNIFIED HOOK — replaces 6+ hooks ──────────────────────────────
  const {
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
    volatilityCard,
    trajectoryChart,
    splitsCard,
    lineShopping,
    oddsComparison,
    isLoading,
    error,
    refetch,
    setTimeRange,
  } = usePlayerDetail(playerId, selectedStat, playerName, headshotUrl);

  // ── Staggered section rendering for scroll performance ─────────────────
  const [sectionsVisible, setSectionsVisible] = useState({
    hero: true,
    confidence: false,
    performance: false,
    analytics: false,
    splits: false,
    odds: false,
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setSectionsVisible(prev => ({ ...prev, confidence: true }));
      setTimeout(() => setSectionsVisible(prev => ({ ...prev, performance: true })), 100);
      setTimeout(() => setSectionsVisible(prev => ({ ...prev, analytics: true })), 200);
      setTimeout(() => setSectionsVisible(prev => ({ ...prev, splits: true, odds: true })), 350);
    });
    return () => task.cancel();
  }, []);

  // ── Upgrade handler ──────────────────────────────────────────────────────
  const handleUpgradePress = useCallback(
    (feature: string) => {
      analyticsService.track('UPGRADE_PROMPT_TAPPED', {
        feature,
        current_tier: tier,
        required_tier: feature === 'line_shopping' || feature === 'splits' ? 'pro' : 'starter',
      });
      router.push({
        pathname: '/subscription',
        params: { source: 'player_detail', feature },
      } as any);
    },
    [router, tier]
  );

  const trackUpgradeShown = useCallback(
    (feature: string, requiredTier: 'starter' | 'pro') => {
      analyticsService.track('UPGRADE_PROMPT_SHOWN', {
        feature,
        current_tier: tier,
        required_tier: requiredTier,
        source: 'player_detail',
      });
    },
    [tier]
  );

  // User stats
  const incrementPropsViewed = useUserStatsStore((state) => state.incrementPropsViewed);

  // ── Analytics events ───────────────────────────────────────────────────────
  useEffect(() => {
    incrementPropsViewed();
    analyticsService.track('PLAYER_DETAIL_VIEWED', {
      player_id: playerId,
      player_name: hero.player.fullName || playerName || '',
      stat: selectedStat,
      line: confidence.line,
    });
  }, [playerId]);

  useEffect(() => {
    if (!isLoading && hitRateStreak.games.length > 0) {
      analyticsService.track('STREAK_BAR_SEEN', {
        player_id: playerId,
        hit_rate_10: hitRateStreak.hitRate,
        current_streak: hitRateStreak.currentStreak,
      });

      if (isPro) {
        analyticsService.track('LINE_SHOPPING_SEEN', {
          player_id: playerId,
          line_spread: lineShopping.lineSpread,
          best_book: null,
        });
        analyticsService.track('SPLITS_VIEWED', {
          player_id: playerId,
          home_hit_rate: splitsCard.homeSplits.hitRate,
          away_hit_rate: splitsCard.awaySplits.hitRate,
        });
      }
    }
  }, [isLoading, hitRateStreak.games.length, selectedStat]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStatChange = useCallback((stat: StatType) => {
    setSelectedStat(stat);
  }, []);

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range);
    },
    [setTimeRange]
  );

  const handleConfidenceLongPress = useCallback(() => {
    console.log('Confidence long press');
  }, []);

  // ── Render states ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.semantic.danger} />
          <Text style={[styles.errorText, { marginTop: spacing.md }]}>Failed to load player data</Text>
          <Text style={styles.errorSubtext}>{error.message || 'Player stats unavailable right now.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <DataLoadingScreen />;
  }

  if (!hero?.player?.fullName) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Text style={styles.errorText}>Player Not Found</Text>
        <Text style={styles.errorSubtext}>
          This player may not have props available today.
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {/* ═══ FREE TIER — Hero only ═══ */}

        {/* 1. Hero Header (FREE) */}
        <HeroSection
          hero={hero}
          projection={projection}
          statType={selectedStat}
          availableStats={AVAILABLE_STATS}
          onStatChange={handleStatChange}
        />

        {/* ═══ FREE — Confidence Hub (blurred analytics for free users) ═══ */}

        {/* 2. Confidence Hub (FREE with blurred projections) — deferred */}
        {sectionsVisible.confidence && (
          <LockedFeatureWrapper
            requiredTier="starter"
            isLocked={tier === 'free'}
            featureName="VIS Projections"
          >
            <ConfidenceHub
              data={confidence}
              statType={selectedStat}
              onLongPress={handleConfidenceLongPress}
            />
          </LockedFeatureWrapper>
        )}

        {/* ═══ VisPlus GATED ═══ */}

        {/* 3-6. Performance sections (VisPlus) — deferred */}
        {sectionsVisible.performance && (
          <>
            <LockedFeatureWrapper requiredTier="starter" isLocked={!isStarter && !isPro} featureName="Performance Averages">
              <StatsInsightRow
                seasonAverage={statsInsight.seasonAverage}
                last5Average={statsInsight.last5Average}
                volatilityRating={statsInsight.volatilityRating}
                edge={statsInsight.edge}
                edgeDirection={statsInsight.edgeDirection}
                minutesAvg5={statsInsight.minutesAvg5}
                minutesFlag={statsInsight.minutesFlag}
                tier={tier}
                isLoading={false}
              />
            </LockedFeatureWrapper>

            {hitRateStreak.games.length >= 3 && (
              <LockedFeatureWrapper requiredTier="starter" isLocked={!isStarter && !isPro} featureName="Hit Rate & Streaks">
                <HitRateStreakBar
                  games={hitRateStreak.games}
                  line={hitRateStreak.line}
                  statLabel={hitRateStreak.statLabel}
                  hitRate={hitRateStreak.hitRate}
                  currentStreak={hitRateStreak.currentStreak}
                  tier={tier}
                  onUpgradePress={() => {
                    trackUpgradeShown('streak_bar', 'starter');
                    handleUpgradePress('streak_bar');
                  }}
                  isLoading={false}
                />
              </LockedFeatureWrapper>
            )}

            <LockedFeatureWrapper requiredTier="starter" isLocked={!isStarter && !isPro} featureName="Volatility Analysis">
              <VolatilityCard
                volatilityRating={volatilityCard.volatilityRating}
                coefficientOfVariation={volatilityCard.coefficientOfVariation}
                stdDev={volatilityCard.stdDev}
                minutesTrend={volatilityCard.minutesTrend}
                minutesAvg5={volatilityCard.minutesAvg5}
                minutesAvg10={volatilityCard.minutesAvg10}
                minutesFlag={volatilityCard.minutesFlag}
                tier={tier}
                onUpgradePress={() => {
                  trackUpgradeShown('volatility', 'starter');
                  handleUpgradePress('volatility');
                }}
                isLoading={false}
              />
            </LockedFeatureWrapper>
          </>
        )}

        {/* 7-9. Performance Trends / Analytics / Distribution (VisPlus) — deferred */}
        {sectionsVisible.analytics && trends.chartData.length >= 3 && (
          <>
            <LockedFeatureWrapper requiredTier="starter" isLocked={!isStarter && !isPro} featureName="Performance Trends">
              <PerformanceTrends
                data={trends}
                statType={selectedStat}
                onTimeRangeChange={handleTimeRangeChange}
                isPremium={isStarter || isPro}
              />
            </LockedFeatureWrapper>

            <LockedFeatureWrapper requiredTier="starter" isLocked={!isStarter && !isPro} featureName="Analytics Dashboard">
              <AnalyticsDashboard
                data={analytics}
                statType={selectedStat}
                line={confidence.line}
                isPremium={isStarter || isPro}
              />
            </LockedFeatureWrapper>

            <LockedFeatureWrapper requiredTier="starter" isLocked={!isStarter && !isPro} featureName="Distribution Analysis">
              <DistributionSection
                data={analytics.distribution}
                line={confidence.line}
                isPremium={isStarter || isPro}
              />
            </LockedFeatureWrapper>
          </>
        )}

        {/* ═══ VISMAX GATED ═══ */}

        {/* 10. Splits Card (VISMAX) — deferred, only if 3+ home+away games recorded */}
        {sectionsVisible.splits && (splitsCard.homeSplits.games + splitsCard.awaySplits.games >= 3) && (
          <LockedFeatureWrapper requiredTier="pro" isLocked={!isPro} featureName="Situational Splits">
            <SplitsCard
              homeSplits={splitsCard.homeSplits}
              awaySplits={splitsCard.awaySplits}
              b2bSplits={splitsCard.b2bSplits}
              restedSplits={splitsCard.restedSplits}
              statLabel={splitsCard.statLabel}
              tier={tier}
              onUpgradePress={() => {
                trackUpgradeShown('splits', 'pro');
                handleUpgradePress('splits');
              }}
              isLoading={false}
            />
          </LockedFeatureWrapper>
        )}

        {/* 11. Sportsbook Odds Comparison (VISMAX) — deferred */}
        {sectionsVisible.odds && oddsComparison.length > 0 && (
          <LockedFeatureWrapper requiredTier="pro" isLocked={!isPro} featureName="Odds Comparison">
            <OddsComparisonSection
              odds={oddsComparison}
              isLoading={false}
              statType={selectedStat}
              showArbitrage={true}
            />
          </LockedFeatureWrapper>
        )}

        {/* 12. Line Shopping Strip (VISMAX) — deferred */}
        {sectionsVisible.odds && lineShopping.allBooks.length >= 2 && (
          <LockedFeatureWrapper requiredTier="pro" isLocked={!isPro} featureName="Line Shopping">
            <LineShoppingStrip
              allBooks={lineShopping.allBooks}
              lineSpread={lineShopping.lineSpread}
              statLabel={lineShopping.statLabel}
              tier={tier}
              onUpgradePress={() => {
                trackUpgradeShown('line_shopping', 'pro');
                handleUpgradePress('line_shopping');
              }}
              isLoading={false}
            />
          </LockedFeatureWrapper>
        )}

        {/* 13. Splits & Matchups (VISMAX) — deferred */}
        {sectionsVisible.splits && trends.chartData.length >= 3 && (
          <LockedFeatureWrapper requiredTier="pro" isLocked={!isPro} featureName="Matchup Analysis">
            <SplitsMatchups
              data={splits}
              radarMetrics={radarMetrics}
              opponent={hero.opponent}
              statType={selectedStat}
              isPremium={isPro}
            />
          </LockedFeatureWrapper>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  backButton: {
    padding: spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.text.muted,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  bottomPadding: {
    height: spacing['3xl'],
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.muted,
    letterSpacing: 1.5,
  },
});
