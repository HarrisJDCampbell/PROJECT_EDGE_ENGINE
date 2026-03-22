/**
 * InteractiveChart - Wagmi-charts powered interactive visualization
 *
 * Supports both line and bar chart modes with gesture scrubbing,
 * haptic feedback, and smooth animations.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LineChart } from 'react-native-wagmi-charts';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { ChartDataPoint, ChartMode } from '../../types';

interface InteractiveChartProps {
  data: ChartDataPoint[];
  line: number;
  projection: number;
  mode: ChartMode;
  onDataPointPress?: (point: ChartDataPoint) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 2;

export function InteractiveChart({
  data,
  line,
  projection,
  mode,
  onDataPointPress,
}: InteractiveChartProps) {
  // Transform data for wagmi-charts format
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      timestamp: index,
      value: point.y,
    }));
  }, [data]);

  // Calculate chart bounds
  const { minY, maxY } = useMemo(() => {
    const values = data.map((d) => d.y);
    const allValues = [...values, line, projection];
    return {
      minY: Math.min(...allValues) * 0.8,
      maxY: Math.max(...allValues) * 1.1,
    };
  }, [data, line, projection]);

  // Haptic feedback on gesture
  const handleGestureActive = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  if (mode === 'bar') {
    // Render bar chart using custom implementation
    return <BarChartView data={data} line={line} projection={projection} />;
  }

  // Render line chart using wagmi-charts
  return (
    <View style={styles.chartContainer}>
      <LineChart.Provider data={chartData}>
        <LineChart height={CHART_HEIGHT} width={CHART_WIDTH}>
          {/* Main line path */}
          <LineChart.Path
            color={colors.primary.main}
            width={3}
          >
            <LineChart.Gradient />
          </LineChart.Path>

          {/* Interactive cursor with tooltip */}
          <LineChart.CursorCrosshair
            color={colors.primary.main}
            onActivated={handleGestureActive}
          >
            <LineChart.Tooltip
              textStyle={{
                color: colors.text.primary,
                fontWeight: 'bold',
              }}
            />
          </LineChart.CursorCrosshair>
        </LineChart>
      </LineChart.Provider>

      {/* Reference lines overlay */}
      <View style={styles.referenceLinesOverlay}>
        <View
          style={[
            styles.referenceLineHorizontal,
            {
              bottom: `${((line - minY) / (maxY - minY)) * 100}%`,
              borderColor: colors.semantic.warning,
            },
          ]}
        />
        <View style={styles.referenceLabel}>
          <Text style={styles.referenceLabelText}>Line: {line}</Text>
        </View>
      </View>
    </View>
  );
}

// Bar chart implementation
function BarChartView({
  data,
  line,
  projection,
}: {
  data: ChartDataPoint[];
  line: number;
  projection: number;
}) {
  const { maxY } = useMemo(() => {
    const values = data.map((d) => d.y);
    const allValues = [...values, line, projection];
    return {
      maxY: Math.max(...allValues) * 1.1,
    };
  }, [data, line, projection]);

  const barWidth = Math.min(24, (CHART_WIDTH - spacing.md * 2) / data.length - 4);
  const linePosition = (line / maxY) * 100;

  return (
    <View style={styles.barChartContainer}>
      {/* Reference line */}
      <View style={styles.referenceLineContainer}>
        <View
          style={[
            styles.horizontalReferenceLine,
            { bottom: `${linePosition}%` },
          ]}
        />
      </View>

      {/* Bars */}
      <View style={styles.barsContainer}>
        {data.map((point, index) => {
          const barHeight = (point.y / maxY) * 100;
          const isOver = point.y > line;

          return (
            <View key={index} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${barHeight}%`,
                    width: barWidth,
                    backgroundColor: isOver
                      ? colors.semantic.success
                      : colors.semantic.danger,
                  },
                ]}
              >
                <Text style={styles.barValueText}>{point.y.toFixed(0)}</Text>
              </View>
              <Text style={styles.barLabelText}>{point.opponent}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    height: CHART_HEIGHT,
    marginHorizontal: spacing.md,
    position: 'relative',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
  },
  referenceLinesOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  referenceLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  referenceLabel: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  referenceLabelText: {
    fontSize: typography.fontSize.xs,
    color: colors.semantic.warning,
    fontWeight: typography.fontWeight.medium,
  },
  // Bar chart styles
  barChartContainer: {
    height: CHART_HEIGHT,
    marginHorizontal: spacing.md,
    position: 'relative',
  },
  referenceLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
  },
  horizontalReferenceLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.semantic.warning,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 24,
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    minHeight: 20,
  },
  barValueText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  barLabelText: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 4,
  },
});
