/**
 * SplitsCard
 * Pro-only card showing location splits (Home/Away) and rest splits (B2B/Rested).
 * Starter users see locked state. Free users: hidden.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { Skeleton } from '../player-v2/components/Skeleton';
import type { SplitData } from '../../services/api/playersApi';

const MIN_GAMES = 3; // minimum sample size to show data

interface SplitsCardProps {
  homeSplits: SplitData;
  awaySplits: SplitData;
  b2bSplits: SplitData;
  restedSplits: SplitData;
  statLabel: string;
  tier: 'free' | 'starter' | 'pro';
  onUpgradePress?: () => void;
  isLoading?: boolean;
}

function SplitColumn({
  label,
  split,
  highlight,
}: {
  label: string;
  split: SplitData;
  highlight: boolean;
}) {
  const hasData = split.games >= MIN_GAMES;
  const hitPct = Math.round(split.hitRate * 100);

  return (
    <View
      style={[
        colStyles.col,
        highlight && colStyles.colHighlight,
      ]}
    >
      <Text style={colStyles.label}>{label}</Text>
      {hasData ? (
        <>
          <Text style={colStyles.avg}>{split.avg.toFixed(1)}</Text>
          <Text style={colStyles.games}>{split.games} games</Text>
          <Text
            style={[
              colStyles.hitRate,
              {
                color:
                  hitPct >= 60
                    ? '#00FF88'
                    : hitPct >= 40
                    ? '#F5A623'
                    : '#FF4444',
              },
            ]}
          >
            {hitPct}% hits
          </Text>
        </>
      ) : (
        <Text style={colStyles.noData}>Not enough{'\n'}data</Text>
      )}
    </View>
  );
}

const colStyles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  colHighlight: {
    borderWidth: 1,
    borderColor: '#F5A623',
    backgroundColor: 'rgba(245,166,35,0.06)',
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  avg: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
  },
  games: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  hitRate: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 4,
  },
  noData: {
    fontSize: 10,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: spacing.xs,
  },
});

export function SplitsCard({
  homeSplits,
  awaySplits,
  b2bSplits,
  restedSplits,
  statLabel,
  tier,
  onUpgradePress,
  isLoading = false,
}: SplitsCardProps) {
  const isPro = tier === 'pro';
  const isStarter = tier === 'starter';

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton width="40%" height={16} />
        <Skeleton width="100%" height={90} style={{ marginTop: spacing.md }} />
        <Skeleton width="100%" height={90} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  // Free tier: don't render (HitRateStreakBar already gates free users)
  if (tier === 'free') return null;

  // Determine better split for highlights
  const homeAvg = homeSplits.games >= MIN_GAMES ? homeSplits.avg : -1;
  const awayAvg = awaySplits.games >= MIN_GAMES ? awaySplits.avg : -1;
  const highlightHome = homeAvg > awayAvg;
  const highlightAway = awayAvg > homeAvg;

  const b2bAvg = b2bSplits.games >= MIN_GAMES ? b2bSplits.avg : -1;
  const restedAvg = restedSplits.games >= MIN_GAMES ? restedSplits.avg : -1;
  const highlightRested = restedAvg > b2bAvg;
  const highlightB2B = b2bAvg > restedAvg;

  const cardContent = (
    <>
      {/* Location splits */}
      <Text style={styles.subsectionLabel}>LOCATION</Text>
      <View style={styles.splitRow}>
        <SplitColumn label="HOME" split={homeSplits} highlight={highlightHome} />
        <View style={styles.vsLabel}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <SplitColumn label="AWAY" split={awaySplits} highlight={highlightAway} />
      </View>

      <View style={styles.divider} />

      {/* Rest splits */}
      <Text style={styles.subsectionLabel}>REST</Text>
      <View style={styles.splitRow}>
        <SplitColumn label="RESTED (2+ d)" split={restedSplits} highlight={highlightRested} />
        <View style={styles.vsLabel}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <SplitColumn label="B2B (0–1 d)" split={b2bSplits} highlight={highlightB2B} />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>SPLITS — {statLabel}</Text>
        {!isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>VISMAX</Text>
          </View>
        )}
      </View>

      {!isPro && isStarter ? (
        <TouchableOpacity
          onPress={onUpgradePress}
          activeOpacity={0.9}
          style={styles.lockedWrapper}
        >
          <View style={styles.blurContent} pointerEvents="none">
            {cardContent}
          </View>
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={22} color={colors.text.muted} />
            <Text style={styles.lockTitle}>VISMAX</Text>
            <Text style={styles.lockSub}>Unlock detailed splits</Text>
          </View>
        </TouchableOpacity>
      ) : (
        cardContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1.2,
  },
  proBadge: {
    backgroundColor: 'rgba(245,166,35,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: '#F5A623',
    letterSpacing: 1,
  },
  subsectionLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.disabled,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vsLabel: {
    width: 24,
    alignItems: 'center',
  },
  vsText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  // Locked state
  lockedWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  blurContent: {
    opacity: 0.12,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,11,0.8)',
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  lockTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  lockSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
