/**
 * ConsistencyTab - Performance consistency analysis
 *
 * Shows standard deviation, floor/ceiling values,
 * and consistency rating.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../../../../theme/colors';
import { typography } from '../../../../../theme/typography';
import { spacing, borderRadius } from '../../../../../theme/styles';
import type { ConsistencyData } from '../../../types';

interface ConsistencyTabProps {
  data: ConsistencyData;
}

function ConsistencyBadge({ rating }: { rating: 'High' | 'Medium' | 'Low' }) {
  const config = {
    High: { color: colors.semantic.success, label: 'Highly Consistent' },
    Medium: { color: colors.semantic.warning, label: 'Moderately Consistent' },
    Low: { color: colors.semantic.danger, label: 'Volatile' },
  };

  const { color, label } = config[rating];

  return (
    <View style={[styles.badge, { backgroundColor: color + '15', borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    </View>
  );
}

export function ConsistencyTab({ data }: ConsistencyTabProps) {
  const rangeWidth = data.ceilingValue - data.floorValue;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Consistency rating */}
      <View style={styles.ratingSection}>
        <Text style={styles.sectionTitle}>Consistency Rating</Text>
        <ConsistencyBadge rating={data.rating} />
      </View>

      {/* Performance range visualization */}
      <View style={styles.rangeSection}>
        <Text style={styles.sectionTitle}>Performance Range</Text>

        <View style={styles.rangeVisualization}>
          {/* Range bar */}
          <View style={styles.rangeBar}>
            <View style={styles.rangeTrack} />
            <View style={styles.rangeValues}>
              <View style={styles.rangeEndpoint}>
                <View style={[styles.rangePoint, styles.floorPoint]} />
                <Text style={styles.floorLabel}>Floor</Text>
                <Text style={styles.floorValue}>{data.floorValue.toFixed(0)}</Text>
              </View>
              <View style={styles.rangeEndpoint}>
                <View style={[styles.rangePoint, styles.ceilingPoint]} />
                <Text style={styles.ceilingLabel}>Ceiling</Text>
                <Text style={styles.ceilingValue}>{data.ceilingValue.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.rangeDescription}>
          Range: {data.rangeDescription}
        </Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>

        <StatRow
          label="Standard Deviation"
          value={data.standardDeviation.toFixed(1)}
        />
        <StatRow
          label="Coefficient of Variation"
          value={`${(data.coefficientOfVariation * 100).toFixed(0)}%`}
          color={
            data.coefficientOfVariation < 0.2
              ? colors.semantic.success
              : data.coefficientOfVariation > 0.4
              ? colors.semantic.danger
              : colors.semantic.warning
          }
        />
      </View>

      {/* Insight */}
      <View style={styles.insightContainer}>
        <Text style={styles.insightText}>
          {data.rating === 'High'
            ? `This player is very predictable with low variance (±${data.standardDeviation.toFixed(1)}). Good for confident bets.`
            : data.rating === 'Low'
            ? `High variance player (±${data.standardDeviation.toFixed(1)}). Outcomes can swing widely from game to game.`
            : `Moderate consistency (±${data.standardDeviation.toFixed(1)}). Some game-to-game variation expected.`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  ratingSection: {
    marginBottom: spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  rangeSection: {
    marginBottom: spacing.xl,
  },
  rangeVisualization: {
    marginVertical: spacing.md,
  },
  rangeBar: {
    position: 'relative',
    height: 60,
    justifyContent: 'center',
  },
  rangeTrack: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
  },
  rangeValues: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeEndpoint: {
    alignItems: 'center',
  },
  rangePoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  floorPoint: {
    backgroundColor: colors.semantic.danger,
  },
  ceilingPoint: {
    backgroundColor: colors.semantic.success,
  },
  floorLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.semantic.danger,
    fontWeight: typography.fontWeight.medium,
  },
  floorValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.danger,
  },
  ceilingLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.semantic.success,
    fontWeight: typography.fontWeight.medium,
  },
  ceilingValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.success,
  },
  rangeDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
  statsSection: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
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
