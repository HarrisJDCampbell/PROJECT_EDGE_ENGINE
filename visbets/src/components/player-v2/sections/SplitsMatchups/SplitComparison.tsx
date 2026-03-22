/**
 * SplitComparison - Animated bar race visualization
 *
 * Compares two values (e.g., home vs away) with
 * animated horizontal bars in a "race" format.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';

interface SplitComparisonProps {
  title: string;
  leftLabel: string;
  leftValue: number;
  leftSubtext?: string;
  rightLabel: string;
  rightValue: number;
  rightSubtext?: string;
  advantage: 'left' | 'right' | 'neutral';
}

export function SplitComparison({
  title,
  leftLabel,
  leftValue,
  leftSubtext,
  rightLabel,
  rightValue,
  rightSubtext,
  advantage,
}: SplitComparisonProps) {
  const leftProgress = useSharedValue(0);
  const rightProgress = useSharedValue(0);

  const maxValue = Math.max(leftValue, rightValue);
  const leftPercent = maxValue > 0 ? leftValue / maxValue : 0;
  const rightPercent = maxValue > 0 ? rightValue / maxValue : 0;

  useEffect(() => {
    leftProgress.value = withDelay(
      100,
      withTiming(leftPercent, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    rightProgress.value = withDelay(
      200,
      withTiming(rightPercent, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [leftPercent, rightPercent]);

  const leftBarStyle = useAnimatedStyle(() => ({
    width: `${leftProgress.value * 100}%`,
  }));

  const rightBarStyle = useAnimatedStyle(() => ({
    width: `${rightProgress.value * 100}%`,
  }));

  const leftColor =
    advantage === 'left' ? colors.semantic.success : colors.text.secondary;
  const rightColor =
    advantage === 'right' ? colors.semantic.success : colors.text.secondary;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {/* Left side */}
      <View style={styles.sideContainer}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: leftColor }]}>{leftLabel}</Text>
          <Text style={[styles.value, { color: leftColor }]}>
            {leftValue.toFixed(1)}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              { backgroundColor: leftColor },
              leftBarStyle,
            ]}
          />
        </View>
        {leftSubtext && <Text style={styles.subtext}>{leftSubtext}</Text>}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Right side */}
      <View style={styles.sideContainer}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: rightColor }]}>{rightLabel}</Text>
          <Text style={[styles.value, { color: rightColor }]}>
            {rightValue.toFixed(1)}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              { backgroundColor: rightColor },
              rightBarStyle,
            ]}
          />
        </View>
        {rightSubtext && <Text style={styles.subtext}>{rightSubtext}</Text>}
      </View>

      {/* Advantage badge */}
      {advantage !== 'neutral' && (
        <View style={styles.advantageBadge}>
          <Text style={styles.advantageText}>
            +{Math.abs(leftValue - rightValue).toFixed(1)} {advantage === 'left' ? leftLabel : rightLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sideContainer: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  subtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  advantageBadge: {
    backgroundColor: colors.semantic.success + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  advantageText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.success,
  },
});
