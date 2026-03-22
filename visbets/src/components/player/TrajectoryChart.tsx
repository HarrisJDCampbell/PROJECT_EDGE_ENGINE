/**
 * TrajectoryChart
 * Enhanced line chart using react-native-wagmi-charts showing stat trajectory.
 * - Horizontal reference line at prop line value (gold)
 * - Green line + interactive tooltip
 * - Hit rate summary row with over/under counts
 * - Average indicator
 * - Hit/miss dot strip below chart
 * - Free: last 5 games. VisPlus: last 10. VISMAX: last 20.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-wagmi-charts';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { Skeleton } from '../player-v2/components/Skeleton';
import type { AnalysisValue } from '../../services/api/playersApi';

const LINE_COLOR = '#00FF88';
const MISS_COLOR = '#FF4444';
const PROP_LINE_COLOR = '#F5A623';
const CHART_HEIGHT = 180;

interface TrajectoryChartProps {
  dataPoints: AnalysisValue[];
  propLine: number;
  statLabel: string;
  trendDirection: 'up' | 'down' | 'flat';
  tier: 'free' | 'starter' | 'pro';
  onUpgradePress?: () => void;
  isLoading?: boolean;
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

const TREND_CONFIG = {
  up: { label: '↑ Trending Up', color: '#00FF88', icon: 'trending-up' as const },
  down: { label: '↓ Trending Down', color: '#FF4444', icon: 'trending-down' as const },
  flat: { label: '→ Steady', color: colors.text.muted, icon: 'remove' as const },
};

export function TrajectoryChart({
  dataPoints,
  propLine,
  statLabel,
  trendDirection,
  tier,
  onUpgradePress,
  isLoading = false,
}: TrajectoryChartProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const isStarter = tier === 'starter' || tier === 'pro';
  const isPro = tier === 'pro';

  // Slice data based on tier — free: 5, VisPlus: 10, VISMAX: 20
  const visibleData = useMemo(() => {
    const sorted = [...dataPoints]; // already oldest→newest
    if (isPro) return sorted.slice(-20);
    if (isStarter) return sorted.slice(-10);
    return sorted.slice(-5); // free tier: 5 games
  }, [dataPoints, isPro, isStarter]);

  const gameCount = visibleData.length;
  const tierLabel = isPro ? 'L20' : isStarter ? 'L10' : 'L5';

  // Convert to wagmi-charts format (needs { timestamp, value })
  const chartData = useMemo(
    () =>
      visibleData.map((d, i) => ({
        timestamp: i + 1,
        value: d.value,
      })),
    [visibleData]
  );

  // Stats computations
  const { overCount, underCount, hitRate, average } = useMemo(() => {
    const over = visibleData.filter((d) => d.value >= propLine).length;
    const under = visibleData.length - over;
    return {
      overCount: over,
      underCount: under,
      hitRate: visibleData.length > 0 ? Math.round((over / visibleData.length) * 100) : 0,
      average:
        visibleData.length > 0
          ? visibleData.reduce((sum, d) => sum + d.value, 0) / visibleData.length
          : 0,
    };
  }, [visibleData, propLine]);

  const minValue = useMemo(
    () => Math.max(0, Math.min(...chartData.map((d) => d.value), propLine) - 2),
    [chartData, propLine]
  );
  const maxValue = useMemo(
    () => Math.max(...chartData.map((d) => d.value), propLine) + 2,
    [chartData, propLine]
  );
  const valueRange = maxValue - minValue || 1;

  // Compute Y position of reference line as percentage from top
  const refLineTopPct = useMemo(
    () => Math.max(0, Math.min(1, 1 - (propLine - minValue) / valueRange)),
    [propLine, minValue, valueRange]
  );

  const trend = TREND_CONFIG[trendDirection];

  const handleLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton width="40%" height={16} />
        <Skeleton width="100%" height={CHART_HEIGHT} style={{ marginTop: spacing.md, borderRadius: borderRadius.md }} />
      </View>
    );
  }

  if (visibleData.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>TRAJECTORY — {statLabel}</Text>
        <View style={styles.noDataBox}>
          <Text style={styles.noDataText}>Not enough game data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionLabel}>TRAJECTORY — {statLabel}</Text>
          <Text style={styles.gameCountLabel}>{gameCount} games ({tierLabel})</Text>
        </View>
        <View style={styles.trendBadge}>
          <Ionicons name={trend.icon} size={12} color={trend.color} />
          <Text style={[styles.trendLabel, { color: trend.color }]}>
            {trend.label}
          </Text>
        </View>
      </View>

      {/* Hit Rate Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{average.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>AVG</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: LINE_COLOR }]}>{overCount}</Text>
          <Text style={styles.summaryLabel}>OVER</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: MISS_COLOR }]}>{underCount}</Text>
          <Text style={styles.summaryLabel}>UNDER</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: hitRate >= 50 ? LINE_COLOR : MISS_COLOR }]}>
            {hitRate}%
          </Text>
          <Text style={styles.summaryLabel}>HIT RATE</Text>
        </View>
      </View>

      {/* Upgrade hint for non-VISMAX users */}
      {!isPro && (
        <TouchableOpacity style={styles.proBadge} onPress={onUpgradePress}>
          <Text style={styles.proBadgeText}>
            {isStarter ? 'VISMAX: 20-game history' : 'VisPlus: 10-game history'}
          </Text>
          <Ionicons name="chevron-forward" size={10} color="#F5A623" />
        </TouchableOpacity>
      )}

      {/* Chart area with reference line overlay */}
      <View style={styles.chartWrapper} onLayout={handleLayout}>
        {chartWidth > 0 && (
          <>
            {/* Wagmi Line Chart */}
            <LineChart.Provider data={chartData}>
              <LineChart height={CHART_HEIGHT} width={chartWidth}>
                <LineChart.Path color={LINE_COLOR} width={2} />
                <LineChart.CursorCrosshair color={LINE_COLOR}>
                  <LineChart.Tooltip
                    textStyle={styles.tooltipText}
                    style={styles.tooltip}
                  />
                </LineChart.CursorCrosshair>
              </LineChart>
            </LineChart.Provider>

            {/* Reference line: absolute positioned over chart */}
            <View
              pointerEvents="none"
              style={[
                styles.refLine,
                { top: CHART_HEIGHT * refLineTopPct },
              ]}
            >
              <View style={styles.refLineDash} />
              <View style={styles.refLineLabel}>
                <Text style={styles.refLineLabelText}>{propLine}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* X-axis date labels */}
      {visibleData.length > 0 && (
        <View style={styles.xAxisRow}>
          <Text style={styles.xLabel}>
            {formatDateShort(visibleData[0]?.game_date)}
          </Text>
          {visibleData.length > 2 && (
            <Text style={styles.xLabel}>
              {formatDateShort(visibleData[Math.floor(visibleData.length / 2)]?.game_date)}
            </Text>
          )}
          <Text style={styles.xLabel}>
            {formatDateShort(visibleData[visibleData.length - 1]?.game_date)}
          </Text>
        </View>
      )}

      {/* Hit/Miss dot strip */}
      <View style={styles.dotStrip}>
        {visibleData.map((d, i) => {
          const isOver = d.value >= propLine;
          return (
            <View
              key={i}
              style={[
                styles.hitDot,
                { backgroundColor: isOver ? LINE_COLOR : MISS_COLOR },
              ]}
            />
          );
        })}
      </View>
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1.2,
  },
  gameCountLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  trendLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  // Summary row
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.default,
  },
  // Pro badge
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
  },
  proBadgeText: {
    fontSize: 10,
    color: '#F5A623',
    fontWeight: typography.fontWeight.semibold,
  },
  // Chart
  chartWrapper: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  refLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  refLineDash: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: PROP_LINE_COLOR,
    borderStyle: 'dashed',
  },
  refLineLabel: {
    backgroundColor: PROP_LINE_COLOR,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  refLineLabelText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#000000',
  },
  tooltip: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tooltipText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  // X axis
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  xLabel: {
    fontSize: 9,
    color: colors.text.muted,
  },
  // Dot strip
  dotStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  hitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Empty state
  noDataBox: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
});
