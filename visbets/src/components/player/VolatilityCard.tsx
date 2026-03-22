/**
 * VolatilityCard
 * Two-section card: Consistency Meter (left) + MPG Trend (right).
 * Starter+ only. Free tier shows blurred with upgrade prompt.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { Skeleton } from '../player-v2/components/Skeleton';
import { LockedFeatureWrapper } from '../common/LockedFeatureWrapper';

interface VolatilityCardProps {
  volatilityRating: 'low' | 'medium' | 'high';
  coefficientOfVariation: number;
  stdDev: number;
  minutesTrend: number[]; // last 5 games for sparkline
  minutesAvg5: number;
  minutesAvg10: number;
  minutesFlag: boolean;
  tier: 'free' | 'starter' | 'pro';
  onUpgradePress?: () => void;
  isLoading?: boolean;
}

const RATING_CONFIG: Record<
  VolatilityCardProps['volatilityRating'],
  { label: string; color: string }
> = {
  low: { label: 'LOW RISK', color: '#00FF88' },
  medium: { label: 'MODERATE', color: '#F5A623' },
  high: { label: 'HIGH RISK', color: '#FF4444' },
};

export function VolatilityCard({
  volatilityRating,
  coefficientOfVariation,
  stdDev,
  minutesTrend,
  minutesAvg5,
  minutesAvg10,
  minutesFlag,
  tier,
  onUpgradePress,
  isLoading = false,
}: VolatilityCardProps) {
  const isStarter = tier === 'starter' || tier === 'pro';

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.leftSection}>
            <Skeleton width={80} height={10} />
            <Skeleton width={120} height={22} style={{ marginTop: spacing.sm }} />
            <Skeleton width="100%" height={4} style={{ marginTop: spacing.sm }} />
            <View style={styles.subStatsRow}>
              <Skeleton width={70} height={10} />
              <Skeleton width={50} height={10} />
            </View>
          </View>
          <View style={styles.rightSection}>
            <Skeleton width={70} height={10} />
            <Skeleton width={40} height={22} style={{ marginTop: spacing.sm }} />
            <Skeleton width={60} height={10} style={{ marginTop: spacing.xs }} />
            <Skeleton width={90} height={10} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </View>
    );
  }

  const { label: ratingLabel, color: ratingColor } = RATING_CONFIG[volatilityRating];
  const meterFill = Math.min(coefficientOfVariation * 100, 100);

  const content = (
    <View style={styles.row}>
      {/* LEFT — Consistency Meter (60% width) */}
      <View style={styles.leftSection}>
        <Text style={styles.sectionLabel}>CONSISTENCY</Text>
        <Text style={[styles.ratingText, { color: ratingColor }]}>{ratingLabel}</Text>

        {/* Visual meter bar */}
        <View style={styles.meterTrack}>
          <View
            style={[
              styles.meterFill,
              {
                width: `${meterFill}%`,
                backgroundColor: ratingColor,
              },
            ]}
          />
        </View>

        {/* Sub stats */}
        <View style={styles.subStatsRow}>
          <Text style={styles.subStatText}>STD DEV: {stdDev.toFixed(1)}</Text>
          <Text style={styles.subStatText}>
            CV: {(coefficientOfVariation * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* RIGHT — Minutes Info (40% width) */}
      <View style={styles.rightSection}>
        <Text style={styles.sectionLabel}>MPG TREND</Text>
        <Text style={styles.minutesNumber}>{minutesAvg5.toFixed(0)}</Text>
        <Text style={styles.minutesSubLabel}>L5 AVG MIN</Text>

        {minutesFlag ? (
          <Text style={styles.minutesFlagWarning}>{'\u26A0'} MINUTES DROP</Text>
        ) : (
          <Text style={styles.minutesFlagStable}>{'\u2194'} STABLE MINS</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LockedFeatureWrapper
        requiredTier="starter"
        isLocked={!isStarter}
        featureName="Volatility Insights"
      >
        {content}
      </LockedFeatureWrapper>
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
  row: {
    flexDirection: 'row',
  },

  // LEFT — Consistency Meter
  leftSection: {
    flex: 6,
    paddingRight: spacing.md,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  meterTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#222222',
    overflow: 'hidden',
  },
  meterFill: {
    height: 4,
    borderRadius: 2,
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  subStatText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },

  // RIGHT — Minutes Info
  rightSection: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border.default,
    paddingLeft: spacing.md,
  },
  minutesNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  minutesSubLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  minutesFlagWarning: {
    fontSize: typography.fontSize.xs,
    color: '#F5A623',
    fontWeight: typography.fontWeight.semibold,
  },
  minutesFlagStable: {
    fontSize: typography.fontSize.xs,
    color: '#00FF88',
    fontWeight: typography.fontWeight.semibold,
  },

});
