/**
 * RadialGauge - Confidence gauge using SVG arc fill
 *
 * A beautiful confidence gauge with color coding and streak indicator.
 * Uses react-native-svg for a proper animated arc fill.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  useAnimatedStyle,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/styles';
import type { RadialGaugeProps, StreakData } from '../../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const GAUGE_SIZE = 160;
const STROKE_WIDTH = 14;
const R = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function getConfidenceColor(confidence: number): string {
  if (confidence >= 75) return colors.semantic.success;
  if (confidence >= 60) return '#81C784'; // Light green
  if (confidence >= 45) return colors.semantic.warning;
  if (confidence >= 30) return '#FF8A65'; // Light orange
  return colors.semantic.danger;
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 75) return 'HIGH';
  if (confidence >= 60) return 'GOOD';
  if (confidence >= 45) return 'MODERATE';
  if (confidence >= 30) return 'LOW';
  return 'VERY LOW';
}

function StreakBadge({ streak }: { streak?: StreakData }) {
  if (!streak || streak.type === 'neutral') return null;

  const isHot = streak.type === 'hot';
  const bgColor = isHot ? colors.semantic.success : colors.semantic.danger;
  const icon = isHot ? '🔥' : '❄️';

  return (
    <View style={[styles.streakBadge, { backgroundColor: bgColor + '20', borderColor: bgColor }]}>
      <Text style={styles.streakIcon}>{icon}</Text>
      <Text style={[styles.streakText, { color: bgColor }]}>{streak.description}</Text>
    </View>
  );
}

export function RadialGauge({ confidence, projection, line, edge, streak }: RadialGaugeProps) {
  const animatedProgress = useSharedValue(0);

  // Ensure all values are valid numbers
  const safeConfidence = typeof confidence === 'number' && !isNaN(confidence) ? confidence : 50;
  const clampedConfidence = Math.max(0, Math.min(100, safeConfidence));
  const safeProjection = typeof projection === 'number' && !isNaN(projection) ? projection : 0;
  const safeLine = typeof line === 'number' && !isNaN(line) ? line : 0;
  const safeEdge = typeof edge === 'number' && !isNaN(edge) ? edge : 0;

  useEffect(() => {
    animatedProgress.value = withTiming(clampedConfidence / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedConfidence]);

  const confidenceColor = getConfidenceColor(clampedConfidence);
  const confidenceLabel = getConfidenceLabel(clampedConfidence);

  // Animated styles for the center content fade-in
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedProgress.value, [0, 0.5, 1], [0.5, 0.8, 1]),
  }));

  // SVG arc: strokeDashoffset drives how much of the circle is filled
  const animatedArcProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  const edgeColor =
    safeEdge > 0
      ? colors.semantic.success
      : safeEdge < 0
      ? colors.semantic.danger
      : colors.text.muted;

  return (
    <View style={styles.container}>
      {/* Gauge */}
      <View style={styles.gaugeWrapper}>
        <View style={styles.gauge}>
          {/* SVG ring: rotated -90° so arc starts from top */}
          <Svg
            width={GAUGE_SIZE}
            height={GAUGE_SIZE}
            style={styles.svgAbsolute}
          >
            {/* Background track */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={R}
              stroke={colors.background.tertiary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Animated progress arc */}
            <AnimatedCircle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={R}
              stroke={confidenceColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeLinecap="round"
              animatedProps={animatedArcProps}
            />
          </Svg>

          {/* Center content */}
          <Animated.View style={[styles.gaugeCenter, animatedTextStyle]}>
            <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
              {clampedConfidence.toFixed(0)}%
            </Text>
            <Text style={[styles.confidenceLabel, { color: confidenceColor }]}>
              {confidenceLabel}
            </Text>
          </Animated.View>
        </View>

        {/* Streak badge below gauge */}
        <StreakBadge streak={streak} />
      </View>

      {/* Projection metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Projection</Text>
          <Text style={[styles.metricValue, styles.projectionValue]}>
            {safeProjection.toFixed(1)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Line</Text>
          <Text style={styles.metricValue}>{safeLine.toFixed(1)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Edge</Text>
          <Text style={[styles.metricValue, styles.edgeValue, { color: edgeColor }]}>
            {safeEdge > 0 ? '+' : ''}{safeEdge.toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  gaugeWrapper: {
    alignItems: 'center',
  },
  gauge: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgAbsolute: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  gaugeCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceValue: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
  },
  confidenceLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  metricsContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  projectionValue: {
    color: colors.primary.main,
  },
  edgeValue: {
    fontSize: typography.fontSize.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
});
