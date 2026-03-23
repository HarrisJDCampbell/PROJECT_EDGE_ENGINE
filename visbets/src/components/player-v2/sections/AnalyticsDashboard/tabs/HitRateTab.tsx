/**
 * HitRateTab - Hit rate analysis visualization
 *
 * Shows hit rate percentages for L5, L10, L20 with
 * visual progress rings and trend indicator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../../../../theme/colors';
import { typography } from '../../../../../theme/typography';
import { spacing, borderRadius } from '../../../../../theme/styles';
import type { HitRateData, TrendDirection } from '../../../types';

interface HitRateTabProps {
  data: HitRateData;
  line: number;
}

function HitRateRing({
  label,
  hits,
  total,
  percentage,
  delay,
}: {
  label: string;
  hits: number;
  total: number;
  percentage: number;
  delay: number;
}) {
  const ringColor =
    percentage >= 60
      ? colors.semantic.success
      : percentage >= 40
      ? colors.semantic.warning
      : colors.semantic.danger;

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(delay)}
      style={styles.ringContainer}
    >
      {/* Progress ring (simplified as a circle with fill) */}
      <View style={[styles.ringOuter, { borderColor: colors.background.tertiary }]}>
        <View
          style={[
            styles.ringProgress,
            {
              borderColor: ringColor,
              borderWidth: 4,
              transform: [{ rotate: `-${90 - (percentage / 100) * 360}deg` }],
            },
          ]}
        />
        <View style={styles.ringInner}>
          <Text style={[styles.percentage, { color: ringColor }]}>
            {percentage}%
          </Text>
          <Text style={styles.fraction}>
            {hits}/{total}
          </Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </Animated.View>
  );
}

function TrendBadge({ trend }: { trend: TrendDirection }) {
  const config = {
    up: { icon: '↑', color: colors.semantic.success, text: 'Improving' },
    down: { icon: '↓', color: colors.semantic.danger, text: 'Declining' },
    flat: { icon: '→', color: colors.text.muted, text: 'Stable' },
  };

  const { icon, color, text } = config[trend];

  return (
    <View style={[styles.trendBadge, { backgroundColor: color + '15', borderColor: color + '40' }]}>
      <Text style={[styles.trendIcon, { color }]}>{icon}</Text>
      <Text style={[styles.trendText, { color }]}>{text}</Text>
    </View>
  );
}

export function HitRateTab({ data, line }: HitRateTabProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hit Rate vs Line</Text>
        <Text style={styles.subtitle}>Line: {line.toFixed(1)}</Text>
      </View>

      {/* Hit rate rings */}
      <View style={styles.ringsRow}>
        <HitRateRing
          label="Last 5"
          hits={data.last5.hits}
          total={data.last5.total}
          percentage={data.last5.percentage}
          delay={0}
        />
        <HitRateRing
          label="Last 10"
          hits={data.last10.hits}
          total={data.last10.total}
          percentage={data.last10.percentage}
          delay={100}
        />
        <HitRateRing
          label="Last 20"
          hits={data.last20.hits}
          total={data.last20.total}
          percentage={data.last20.percentage}
          delay={200}
        />
      </View>

      {/* Trend indicator */}
      <View style={styles.trendContainer}>
        <Text style={styles.trendLabel}>Recent Trend</Text>
        <TrendBadge trend={data.trend} />
      </View>

      {/* Insight */}
      <View style={styles.insightContainer}>
        <Text style={styles.insightText}>
          {data.last5.percentage >= 60
            ? `Strong recent performance - exceeding the line ${data.last5.percentage}% of the time in last 5 games.`
            : data.last5.percentage <= 40
            ? `Struggling recently - exceeding the line only ${data.last5.percentage}% in last 5 games.`
            : `Mixed results - ${data.last5.percentage}% hit rate in recent games.`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  ringContainer: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringProgress: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  ringInner: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  fraction: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  ringLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  trendLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  trendIcon: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  trendText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
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
