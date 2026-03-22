/**
 * MatchupRadar - Radar chart for matchup analysis
 *
 * Uses Skia to render a radar/spider chart showing
 * multiple metrics for matchup visualization.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Path, Skia, Circle, Line, vec } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { RadarMetric } from '../../types';

class SkiaCanvasBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface MatchupRadarProps {
  metrics: RadarMetric[];
  opponent: { name: string; abbreviation: string };
}

const CHART_SIZE = 200;
const CENTER = CHART_SIZE / 2;
const RADIUS = 70;
const LEVELS = 4;

function polarToCartesian(
  angle: number,
  radius: number,
  centerX: number,
  centerY: number
): { x: number; y: number } {
  // Adjust angle to start from top (-90 degrees)
  const adjustedAngle = angle - Math.PI / 2;
  return {
    x: centerX + radius * Math.cos(adjustedAngle),
    y: centerY + radius * Math.sin(adjustedAngle),
  };
}

function createPolygonPath(
  values: number[],
  maxRadius: number,
  centerX: number,
  centerY: number
): string {
  const angleStep = (2 * Math.PI) / values.length;
  const points = values.map((value, index) => {
    const angle = index * angleStep;
    const radius = (value / 100) * maxRadius;
    return polarToCartesian(angle, radius, centerX, centerY);
  });

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  return `${pathData} Z`;
}

function MetricBarFallback({ metrics, opponent }: MatchupRadarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matchup Analysis</Text>
        <Text style={styles.subtitle}>vs {opponent.name}</Text>
      </View>
      <View style={styles.barList}>
        {metrics.map((metric, i) => (
          <View key={i} style={styles.barRow}>
            <Text style={styles.barLabel}>{metric.shortLabel ?? metric.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${metric.value}%` }]} />
            </View>
            <Text style={styles.barValue}>{metric.rawValue}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MatchupRadar({ metrics, opponent }: MatchupRadarProps) {
  if (metrics.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Matchup Analysis</Text>
          <Text style={styles.subtitle}>vs {opponent.name}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Not enough historical data against {opponent.abbreviation} to generate a matchup radar.
          </Text>
        </View>
      </View>
    );
  }

  // Attempt to build Skia paths — fall back to bar chart if Skia isn't available
  let skiaReady = false;
  let dataPath: ReturnType<typeof Skia.Path.MakeFromSVGString> = null;
  let levelPaths: ReturnType<typeof Skia.Path.MakeFromSVGString>[] = [];

  try {
    dataPath = Skia.Path.MakeFromSVGString(
      createPolygonPath(metrics.map((m) => m.value), RADIUS, CENTER, CENTER)
    );
    levelPaths = Array.from({ length: LEVELS }, (_, i) => {
      const values = metrics.map(() => ((i + 1) / LEVELS) * 100);
      return Skia.Path.MakeFromSVGString(createPolygonPath(values, RADIUS, CENTER, CENTER));
    });
    skiaReady = true;
  } catch {
    skiaReady = false;
  }

  if (!skiaReady) {
    return <MetricBarFallback metrics={metrics} opponent={opponent} />;
  }

  const fallback = <MetricBarFallback metrics={metrics} opponent={opponent} />;

  const angleStep = (2 * Math.PI) / metrics.length;

  const labelPositions = metrics.map((metric, index) => {
    const angle = index * angleStep;
    const labelRadius = RADIUS + 25;
    return {
      ...polarToCartesian(angle, labelRadius, CENTER, CENTER),
      label: metric.shortLabel,
      value: metric.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matchup Analysis</Text>
        <Text style={styles.subtitle}>vs {opponent.name}</Text>
      </View>

      <View style={styles.chartContainer}>
        <SkiaCanvasBoundary fallback={fallback}>
        <Canvas style={styles.canvas}>
          {levelPaths.map(
            (path, index) =>
              path && (
                <Path
                  key={`level-${index}`}
                  path={path}
                  style="stroke"
                  strokeWidth={1}
                  color={colors.border.default}
                />
              )
          )}

          {metrics.map((_, index) => {
            const angle = index * angleStep;
            const endPoint = polarToCartesian(angle, RADIUS, CENTER, CENTER);
            return (
              <Line
                key={`axis-${index}`}
                p1={vec(CENTER, CENTER)}
                p2={vec(endPoint.x, endPoint.y)}
                color={colors.border.default}
                strokeWidth={1}
              />
            );
          })}

          {dataPath && (
            <Path path={dataPath} style="fill" color={colors.primary.main + '30'} />
          )}
          {dataPath && (
            <Path path={dataPath} style="stroke" strokeWidth={2} color={colors.primary.main} />
          )}

          {metrics.map((metric, index) => {
            const angle = index * angleStep;
            const pointRadius = (metric.value / 100) * RADIUS;
            const point = polarToCartesian(angle, pointRadius, CENTER, CENTER);
            return (
              <Circle key={`point-${index}`} cx={point.x} cy={point.y} r={4} color={colors.primary.main} />
            );
          })}
        </Canvas>
        </SkiaCanvasBoundary>

        {labelPositions.map((pos, index) => (
          <View
            key={`label-${index}`}
            style={[styles.labelContainer, { left: pos.x - 25, top: pos.y - 15 }]}
          >
            <Text style={styles.labelText}>{pos.label}</Text>
            <Text style={styles.labelValue}>{pos.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.legendItem}>
            <Text style={styles.legendLabel}>{metric.label}</Text>
            <Text style={styles.legendValue}>{metric.rawValue}</Text>
          </View>
        ))}
      </View>
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    marginTop: 2,
  },
  chartContainer: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  canvas: {
    width: CHART_SIZE,
    height: CHART_SIZE,
  },
  labelContainer: {
    position: 'absolute',
    width: 50,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  labelValue: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  legend: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  legendLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  legendValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  barList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    width: 40,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 4,
  },
  barValue: {
    width: 36,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    textAlign: 'left',
  },
});
