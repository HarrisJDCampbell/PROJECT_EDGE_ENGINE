/**
 * DistributionTab - Stat distribution visualization
 *
 * Shows how performance values are distributed across
 * different buckets relative to the betting line.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../../../../theme/colors';
import { typography } from '../../../../../theme/typography';
import { spacing, borderRadius } from '../../../../../theme/styles';
import type { DistributionData, DistributionBucket } from '../../../types';

interface DistributionTabProps {
  data: DistributionData;
  line: number;
}

function DistributionBar({
  bucket,
  maxPercentage,
  index,
}: {
  bucket: DistributionBucket;
  maxPercentage: number;
  index: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 100,
      withTiming(bucket.percentage / maxPercentage, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [bucket.percentage, maxPercentage, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.barContainer}>
      <View style={styles.barLabelContainer}>
        <Text style={styles.barLabel}>{bucket.label}</Text>
        <Text style={styles.barCount}>
          {bucket.count} ({bucket.percentage}%)
        </Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: bucket.color },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

export function DistributionTab({ data, line }: DistributionTabProps) {
  if (data.buckets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Insufficient data for distribution analysis</Text>
      </View>
    );
  }

  const maxPercentage = Math.max(...data.buckets.map((b) => b.percentage), 1);

  // Calculate over/under percentages
  const overBuckets = data.buckets.filter(
    (b) => b.label === 'Over' || b.label === 'Way Over'
  );
  const underBuckets = data.buckets.filter(
    (b) => b.label === 'Under' || b.label === 'Way Under'
  );

  const overPercentage = overBuckets.reduce((sum, b) => sum + b.percentage, 0);
  const underPercentage = underBuckets.reduce((sum, b) => sum + b.percentage, 0);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Summary badges */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBadge, { backgroundColor: colors.semantic.success + '15' }]}>
          <Text style={[styles.summaryValue, { color: colors.semantic.success }]}>
            {overPercentage}%
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.semantic.success }]}>OVER</Text>
        </View>

        <View style={styles.lineIndicator}>
          <Text style={styles.lineValue}>{line.toFixed(1)}</Text>
          <Text style={styles.lineLabel}>Line</Text>
        </View>

        <View style={[styles.summaryBadge, { backgroundColor: colors.semantic.danger + '15' }]}>
          <Text style={[styles.summaryValue, { color: colors.semantic.danger }]}>
            {underPercentage}%
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.semantic.danger }]}>UNDER</Text>
        </View>
      </View>

      {/* Distribution bars */}
      <View style={styles.barsSection}>
        <Text style={styles.sectionTitle}>Performance Distribution</Text>
        {data.buckets.map((bucket, index) => (
          <DistributionBar
            key={bucket.label}
            bucket={bucket}
            maxPercentage={maxPercentage}
            index={index}
          />
        ))}
      </View>

      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.median.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Median</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.mode.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Mode</Text>
        </View>
      </View>

      {/* Insight */}
      <View style={styles.insightContainer}>
        <Text style={styles.insightText}>
          {overPercentage >= 60
            ? `Strong lean OVER - ${overPercentage}% of games exceeded similar lines.`
            : underPercentage >= 60
            ? `Strong lean UNDER - ${underPercentage}% of games fell short of similar lines.`
            : `Mixed distribution - no strong lean either direction.`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  summaryBadge: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginTop: 2,
  },
  lineIndicator: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  lineValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  lineLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  barsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  barContainer: {
    marginBottom: spacing.md,
  },
  barLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  barLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  barCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  barTrack: {
    height: 24,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border.default,
  },
  insightContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  insightText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
