/**
 * BoardSkeleton - Loading skeleton for the board screen
 *
 * Displays animated placeholder cards while props are loading.
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ShimmerPulse } from '../common/AnimatedComponents';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/styles';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = spacing.md;
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;
const CARD_HEIGHT = 160;

function SkeletonCard({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(index * 50)}
      style={styles.card}
    >
      {/* Header - Avatar and name */}
      <View style={styles.cardHeader}>
        <ShimmerPulse width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <ShimmerPulse width={80} height={14} borderRadius={4} />
          <ShimmerPulse width={50} height={10} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Stat type badge */}
      <ShimmerPulse width={40} height={20} borderRadius={10} style={{ marginTop: spacing.sm }} />

      {/* Line and projection */}
      <View style={styles.cardStats}>
        <ShimmerPulse width={60} height={28} borderRadius={6} />
        <ShimmerPulse width={40} height={16} borderRadius={4} />
      </View>

      {/* Edge indicator */}
      <ShimmerPulse width="100%" height={32} borderRadius={8} style={{ marginTop: spacing.sm }} />
    </Animated.View>
  );
}

export function BoardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <ShimmerPulse width={120} height={32} borderRadius={8} />
        <ShimmerPulse width={60} height={40} borderRadius={8} />
      </View>

      {/* Chips skeleton */}
      <View style={styles.chipsSkeleton}>
        {[0, 1, 2, 3, 4].map((i) => (
          <ShimmerPulse
            key={i}
            width={60}
            height={36}
            borderRadius={18}
          />
        ))}
      </View>

      {/* Grid skeleton */}
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.secondary,
  },
  chipsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.md,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
