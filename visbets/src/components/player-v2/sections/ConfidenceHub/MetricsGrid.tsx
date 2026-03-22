/**
 * MetricsGrid - Rolling averages and risk indicators
 *
 * Displays L5, L10, Season averages as animated bar indicators
 * along with volatility and minutes risk.
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
import type { RiskLevel } from '../../types';

interface MetricsGridProps {
  rollingAverages: {
    last5: number;
    last10: number;
    season: number;
  };
  line: number;
  volatility: number;
  minutesRisk: RiskLevel;
}

interface RollingBarProps {
  label: string;
  value: number;
  line: number;
  maxValue: number;
  delay: number;
}

function RollingBar({ label, value, line, maxValue, delay }: RollingBarProps) {
  const progress = useSharedValue(0);
  const isOverLine = value > line;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(value / maxValue, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [value, maxValue, delay]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const barColor = isOverLine ? colors.semantic.success : colors.semantic.danger;

  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barValue, { color: barColor }]}>
          {value.toFixed(1)}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: barColor }, animatedBarStyle]}
        />
        {/* Line indicator */}
        <View
          style={[
            styles.lineIndicator,
            { left: `${(line / maxValue) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

interface RiskIndicatorProps {
  label: string;
  level: RiskLevel | number;
  isPercentage?: boolean;
}

function RiskIndicator({ label, level, isPercentage }: RiskIndicatorProps) {
  let displayValue: string;
  let indicatorColor: string;

  if (isPercentage && typeof level === 'number') {
    displayValue = `${level.toFixed(0)}%`;
    indicatorColor =
      level < 25
        ? colors.semantic.success
        : level < 50
        ? colors.semantic.warning
        : colors.semantic.danger;
  } else {
    displayValue = String(level);
    indicatorColor =
      level === 'Low'
        ? colors.semantic.success
        : level === 'Medium'
        ? colors.semantic.warning
        : colors.semantic.danger;
  }

  return (
    <View style={styles.riskContainer}>
      <Text style={styles.riskLabel}>{label}</Text>
      <View style={[styles.riskBadge, { backgroundColor: indicatorColor + '20', borderColor: indicatorColor }]}>
        <Text style={[styles.riskValue, { color: indicatorColor }]}>{displayValue}</Text>
      </View>
    </View>
  );
}

export function MetricsGrid({ rollingAverages, line, volatility, minutesRisk }: MetricsGridProps) {
  // Calculate max value for bar scaling
  const maxValue = Math.max(
    rollingAverages.last5,
    rollingAverages.last10,
    rollingAverages.season,
    line
  ) * 1.2;

  return (
    <View style={styles.container}>
      {/* Section title */}
      <Text style={styles.sectionTitle}>Performance Averages</Text>

      {/* Rolling averages */}
      <View style={styles.barsSection}>
        <RollingBar
          label="Last 5"
          value={rollingAverages.last5}
          line={line}
          maxValue={maxValue}
          delay={0}
        />
        <RollingBar
          label="Last 10"
          value={rollingAverages.last10}
          line={line}
          maxValue={maxValue}
          delay={100}
        />
        <RollingBar
          label="Season"
          value={rollingAverages.season}
          line={line}
          maxValue={maxValue}
          delay={200}
        />
      </View>

      {/* Line reference */}
      <View style={styles.lineRef}>
        <View style={styles.lineDot} />
        <Text style={styles.lineText}>Line: {line.toFixed(1)}</Text>
      </View>

      {/* Risk indicators */}
      <View style={styles.risksRow}>
        <RiskIndicator label="Volatility" level={volatility} isPercentage />
        <RiskIndicator label="Minutes Risk" level={minutesRisk} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  barsSection: {
    gap: spacing.md,
  },
  barContainer: {
    gap: spacing.xs,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  barValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  lineIndicator: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 16,
    backgroundColor: colors.semantic.warning,
    borderRadius: 1,
    transform: [{ translateX: -1 }],
  },
  lineRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  lineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.warning,
  },
  lineText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  risksRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  riskContainer: {
    flex: 1,
  },
  riskLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  riskBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  riskValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
