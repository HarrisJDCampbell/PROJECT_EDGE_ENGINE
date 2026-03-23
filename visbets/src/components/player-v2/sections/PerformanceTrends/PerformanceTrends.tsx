/**
 * PerformanceTrends - Interactive performance chart section
 *
 * Features:
 * - Line/bar chart toggle
 * - Time range selector (L5, L10, L20)
 * - Gesture scrubbing with haptics
 * - Game chip carousel
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { InteractiveChart } from './InteractiveChart';
import { GameChipCarousel } from './GameChipCarousel';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { PerformanceTrendsProps, ChartMode, TimeRange, GameChipData } from '../../types';
import { LockedFeatureWrapper } from '../../../common/LockedFeatureWrapper';

import { Ionicons } from '@expo/vector-icons';

const TIME_RANGES: TimeRange[] = ['L5', 'L10', 'L20'];
const CHART_MODES: { mode: ChartMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'line', label: 'Line', icon: 'analytics' },
  { mode: 'bar', label: 'Bar', icon: 'bar-chart' },
];

export function PerformanceTrends({
  data,
  statType,
  onTimeRangeChange,
  isPremium,
}: PerformanceTrendsProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('line');

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onTimeRangeChange(range);
    },
    [onTimeRangeChange]
  );

  const handleChartModeChange = useCallback((mode: ChartMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setChartMode(mode);
  }, []);

  const handleChipPress = useCallback((game: GameChipData, index: number) => {
    // Could open a bottom sheet with more details
    console.log('Chip pressed:', game, index);
  }, []);

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.container}>
      <LockedFeatureWrapper
        requiredTier="starter"
        isLocked={!isPremium}
        featureName="Performance Trends"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Performance Trends</Text>
            <Text style={styles.subtitle}>
              {data.overCount}/{data.chartData.length} OVER • Avg: {data.average.toFixed(1)}
            </Text>
          </View>

          {/* Chart mode toggle */}
          <View style={styles.modeToggle}>
            {CHART_MODES.map(({ mode, label, icon }) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  chartMode === mode && styles.modeButtonActive,
                ]}
                onPress={() => handleChartModeChange(mode)}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={chartMode === mode ? colors.primary.main : colors.text.muted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time range selector */}
        <View style={styles.timeRangeContainer}>
          {TIME_RANGES.map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                data.timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => handleTimeRangeChange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  data.timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interactive chart */}
        <InteractiveChart
          data={data.chartData}
          line={data.line}
          projection={data.projection}
          mode={chartMode}
        />

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.semantic.warning }]} />
            <Text style={styles.legendText}>Line: {data.line}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary.main }]} />
            <Text style={styles.legendText}>Proj: {data.projection.toFixed(1)}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.semantic.success }]} />
            <Text style={styles.legendText}>Over</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.semantic.danger }]} />
            <Text style={styles.legendText}>Under</Text>
          </View>
        </View>

        {/* Game chip carousel */}
        <GameChipCarousel games={data.gameChips} onChipPress={handleChipPress} />
      </LockedFeatureWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  modeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: colors.background.primary,
  },
  modeIcon: {
    fontSize: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  timeRangeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  timeRangeButtonActive: {
    backgroundColor: colors.primary.main,
  },
  timeRangeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  timeRangeTextActive: {
    color: colors.background.primary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});
