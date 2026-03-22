/**
 * Skeleton - Shimmer loading placeholder
 *
 * Animated skeleton components for loading states with
 * smooth shimmer effect using Reanimated.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme/styles';

interface SkeletonProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  borderRadius: radius = borderRadius.md,
  style,
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  // Calculate shimmer distance - use 300 for percentage widths
  const shimmerDistance = typeof width === 'number' ? width + 200 : 300;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-200, shimmerDistance]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            colors.background.tertiary + '60',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Pre-built skeleton layouts for common components
export function HeroSkeleton() {
  return (
    <View style={skeletonStyles.heroContainer}>
      {/* Player avatar */}
      <View style={skeletonStyles.heroRow}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <View style={skeletonStyles.heroInfo}>
          <Skeleton width={140} height={24} />
          <Skeleton width={100} height={16} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
      {/* Stat pills */}
      <View style={skeletonStyles.pillRow}>
        <Skeleton width={60} height={36} borderRadius={borderRadius.full} />
        <Skeleton width={60} height={36} borderRadius={borderRadius.full} />
        <Skeleton width={60} height={36} borderRadius={borderRadius.full} />
        <Skeleton width={60} height={36} borderRadius={borderRadius.full} />
      </View>
      {/* Projection row */}
      <View style={skeletonStyles.projectionRow}>
        <Skeleton width={90} height={48} />
        <Skeleton width={90} height={48} />
        <Skeleton width={90} height={48} />
      </View>
    </View>
  );
}

export function ConfidenceSkeleton() {
  return (
    <View style={skeletonStyles.confidenceContainer}>
      {/* Radial gauge placeholder */}
      <Skeleton width={160} height={160} borderRadius={80} style={{ alignSelf: 'center' }} />
      {/* Metrics grid */}
      <View style={skeletonStyles.metricsRow}>
        <Skeleton width={70} height={56} />
        <Skeleton width={70} height={56} />
        <Skeleton width={70} height={56} />
        <Skeleton width={70} height={56} />
      </View>
    </View>
  );
}

export function ChartSkeleton() {
  return (
    <View style={skeletonStyles.chartContainer}>
      {/* Header */}
      <View style={skeletonStyles.chartHeader}>
        <Skeleton width={120} height={20} />
        <View style={skeletonStyles.toggleRow}>
          <Skeleton width={50} height={28} borderRadius={borderRadius.full} />
          <Skeleton width={50} height={28} borderRadius={borderRadius.full} />
        </View>
      </View>
      {/* Chart area */}
      <Skeleton width="100%" height={180} style={{ marginTop: spacing.md }} />
      {/* Game chips */}
      <View style={skeletonStyles.chipsRow}>
        <Skeleton width={70} height={80} />
        <Skeleton width={70} height={80} />
        <Skeleton width={70} height={80} />
        <Skeleton width={70} height={80} />
      </View>
    </View>
  );
}

export function AnalyticsSkeleton() {
  return (
    <View style={skeletonStyles.analyticsContainer}>
      {/* Tab bar */}
      <View style={skeletonStyles.tabBar}>
        <Skeleton width="100%" height={44} borderRadius={borderRadius.lg} />
      </View>
      {/* Content area */}
      <View style={skeletonStyles.analyticsContent}>
        <Skeleton width="100%" height={60} />
        <Skeleton width="100%" height={60} style={{ marginTop: spacing.sm }} />
        <Skeleton width="100%" height={60} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function SplitsSkeleton() {
  return (
    <View style={skeletonStyles.splitsContainer}>
      {/* Section header */}
      <Skeleton width={100} height={16} style={{ marginBottom: spacing.md }} />
      {/* Split comparison */}
      <View style={skeletonStyles.splitRow}>
        <View style={skeletonStyles.splitColumn}>
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={32} style={{ marginTop: spacing.xs }} />
        </View>
        <Skeleton width={120} height={12} borderRadius={6} />
        <View style={skeletonStyles.splitColumn}>
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={32} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
      {/* Radar chart placeholder */}
      <Skeleton width={200} height={200} borderRadius={100} style={{ alignSelf: 'center', marginTop: spacing.lg }} />
    </View>
  );
}

// Full page loading skeleton
export function PlayerDetailSkeleton() {
  return (
    <View style={skeletonStyles.pageContainer}>
      <HeroSkeleton />
      <ConfidenceSkeleton />
      <ChartSkeleton />
      <AnalyticsSkeleton />
      <SplitsSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
});

const skeletonStyles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  // Hero
  heroContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroInfo: {
    marginLeft: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  // Confidence
  confidenceContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  // Chart
  chartContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  // Analytics
  analyticsContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  tabBar: {
    marginBottom: spacing.md,
  },
  analyticsContent: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
  },
  // Splits
  splitsContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitColumn: {
    alignItems: 'center',
  },
});
