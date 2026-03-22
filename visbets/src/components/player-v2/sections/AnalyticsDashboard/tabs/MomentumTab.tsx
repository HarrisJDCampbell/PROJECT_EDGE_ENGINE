/**
 * MomentumTab - Momentum and trend analysis
 *
 * Displays momentum multiplier, streak info, and
 * recent vs average comparison.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../../../../theme/colors';
import { typography } from '../../../../../theme/typography';
import { spacing, borderRadius } from '../../../../../theme/styles';
import type { MomentumData } from '../../../types';

interface MomentumTabProps {
  data: MomentumData;
}

function MomentumGauge({ multiplier }: { multiplier: number }) {
  // Convert multiplier (0.8 - 1.2) to percentage position
  const position = ((multiplier - 0.8) / 0.4) * 100;
  const clampedPosition = Math.max(0, Math.min(100, position));

  const gaugeColor =
    multiplier >= 1.1
      ? colors.semantic.success
      : multiplier <= 0.9
      ? colors.semantic.danger
      : colors.semantic.warning;

  return (
    <View style={styles.gaugeContainer}>
      <Text style={styles.gaugeLabel}>Momentum Multiplier</Text>

      {/* Gauge track */}
      <View style={styles.gaugeTrack}>
        {/* Gradient sections */}
        <View style={[styles.gaugeSection, styles.gaugeCold]} />
        <View style={[styles.gaugeSection, styles.gaugeNeutral]} />
        <View style={[styles.gaugeSection, styles.gaugeHot]} />

        {/* Indicator */}
        <View style={[styles.gaugeIndicator, { left: `${clampedPosition}%` }]}>
          <View style={[styles.indicatorDot, { backgroundColor: gaugeColor }]} />
        </View>
      </View>

      {/* Labels */}
      <View style={styles.gaugeLabels}>
        <Text style={styles.gaugeLabelText}>Cold</Text>
        <Text style={styles.gaugeLabelText}>Neutral</Text>
        <Text style={styles.gaugeLabelText}>Hot</Text>
      </View>

      {/* Value */}
      <Text style={[styles.multiplierValue, { color: gaugeColor }]}>
        {multiplier.toFixed(2)}x
      </Text>
    </View>
  );
}

export function MomentumTab({ data }: MomentumTabProps) {
  const isPositive = data.recentVsAverage > 0;
  const comparisonColor = isPositive ? colors.semantic.success : colors.semantic.danger;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Momentum gauge */}
      <MomentumGauge multiplier={data.multiplier} />

      {/* Streak info */}
      <View style={styles.streakSection}>
        <View style={styles.streakRow}>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor:
                  data.trend === 'up'
                    ? colors.semantic.success + '15'
                    : data.trend === 'down'
                    ? colors.semantic.danger + '15'
                    : colors.background.tertiary,
              },
            ]}
          >
            <Text
              style={[
                styles.streakValue,
                {
                  color:
                    data.trend === 'up'
                      ? colors.semantic.success
                      : data.trend === 'down'
                      ? colors.semantic.danger
                      : colors.text.primary,
                },
              ]}
            >
              {data.description}
            </Text>
            {data.consecutiveGames > 0 && (
              <Text style={styles.streakGames}>
                ({data.consecutiveGames} games)
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Recent vs Average */}
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>Recent vs Season Average</Text>
        <View style={styles.comparisonContent}>
          <Text style={[styles.comparisonValue, { color: comparisonColor }]}>
            {isPositive ? '+' : ''}{data.recentVsAverage}%
          </Text>
          <Text style={styles.comparisonText}>
            {isPositive
              ? 'Performing above season average'
              : 'Performing below season average'}
          </Text>
        </View>
      </View>

      {/* Insight */}
      <View style={styles.insightContainer}>
        <Text style={styles.insightText}>
          {data.multiplier >= 1.1
            ? 'Player is running hot! Recent performance suggests elevated production.'
            : data.multiplier <= 0.9
            ? 'Player is in a slump. Consider waiting for better spots.'
            : 'Momentum is neutral. Performance aligns with expectations.'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  gaugeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  gaugeTrack: {
    width: '100%',
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  gaugeSection: {
    flex: 1,
    height: '100%',
  },
  gaugeCold: {
    backgroundColor: colors.semantic.danger + '40',
  },
  gaugeNeutral: {
    backgroundColor: colors.semantic.warning + '40',
  },
  gaugeHot: {
    backgroundColor: colors.semantic.success + '40',
  },
  gaugeIndicator: {
    position: 'absolute',
    top: -4,
    transform: [{ translateX: -8 }],
  },
  indicatorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  gaugeLabelText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  multiplierValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  streakSection: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  streakValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  streakGames: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  comparisonSection: {
    paddingVertical: spacing.md,
  },
  comparisonTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  comparisonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  comparisonValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  comparisonText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  insightContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  insightText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
