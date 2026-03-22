/**
 * SplitsMatchups - Splits and matchup analysis section
 *
 * Combines home/away splits, vs opponent data, and
 * matchup radar chart in a flowing design.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SplitComparison } from './SplitComparison';
import { MatchupRadar } from './MatchupRadar';
import { LockedFeatureWrapper } from '../../../common/LockedFeatureWrapper';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { SplitsMatchupsProps } from '../../types';

export function SplitsMatchups({
  data,
  radarMetrics,
  opponent,
  statType,
  isPremium,
}: SplitsMatchupsProps) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(700)} style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.title}>Splits & Matchups</Text>
        <Text style={styles.subtitle}>Situational performance analysis</Text>
      </View>

      {/* Home/Away Splits */}
      <LockedFeatureWrapper
        requiredTier="starter"
        isLocked={!isPremium}
        featureName="Home/Away Splits"
      >
        <SplitComparison
          title="Home vs Away"
          leftLabel="Home"
          leftValue={data.homeAway.home.average}
          leftSubtext={`${data.homeAway.home.gamesPlayed} games • ${data.homeAway.home.hitRate}% hit rate`}
          rightLabel="Away"
          rightValue={data.homeAway.away.average}
          rightSubtext={`${data.homeAway.away.gamesPlayed} games • ${data.homeAway.away.hitRate}% hit rate`}
          advantage={data.homeAway.advantage === 'home' ? 'left' : data.homeAway.advantage === 'away' ? 'right' : 'neutral'}
        />
      </LockedFeatureWrapper>

      {/* Minutes Stability */}
      <View style={styles.minutesSection}>
        <Text style={styles.sectionLabel}>Minutes Stability</Text>
        <View style={styles.minutesRow}>
          <View style={styles.minutesStat}>
            <Text style={styles.minutesValue}>{data.minutesStability.average.toFixed(1)}</Text>
            <Text style={styles.minutesLabel}>Avg Minutes</Text>
          </View>
          <View style={styles.minutesDivider} />
          <View style={styles.minutesStat}>
            <Text style={styles.minutesValue}>±{data.minutesStability.standardDeviation.toFixed(1)}</Text>
            <Text style={styles.minutesLabel}>Std Dev</Text>
          </View>
          <View style={styles.minutesDivider} />
          <View style={styles.minutesStat}>
            <View
              style={[
                styles.riskBadge,
                {
                  backgroundColor:
                    data.minutesStability.risk === 'Low'
                      ? colors.semantic.success + '20'
                      : data.minutesStability.risk === 'Medium'
                      ? colors.semantic.warning + '20'
                      : colors.semantic.danger + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.riskText,
                  {
                    color:
                      data.minutesStability.risk === 'Low'
                        ? colors.semantic.success
                        : data.minutesStability.risk === 'Medium'
                        ? colors.semantic.warning
                        : colors.semantic.danger,
                  },
                ]}
              >
                {data.minutesStability.risk}
              </Text>
            </View>
            <Text style={styles.minutesLabel}>Risk</Text>
          </View>
        </View>
      </View>

      {/* vs Opponent (if available) */}
      {data.vsOpponent && opponent && (
        <LockedFeatureWrapper
          requiredTier="pro"
          isLocked={!isPremium}
          featureName="vs Opponent History"
        >
          <View style={styles.opponentSection}>
            <Text style={styles.sectionLabel}>vs {opponent.abbreviation}</Text>
            <View style={styles.opponentStats}>
              <View style={styles.opponentStat}>
                <Text style={styles.opponentValue}>{data.vsOpponent.average.toFixed(1)}</Text>
                <Text style={styles.opponentLabel}>Average</Text>
              </View>
              <View style={styles.opponentStat}>
                <Text style={styles.opponentValue}>{data.vsOpponent.gamesPlayed}</Text>
                <Text style={styles.opponentLabel}>Games</Text>
              </View>
              <View style={styles.opponentStat}>
                <Text style={[styles.opponentValue, { color: data.vsOpponent.hitRate >= 50 ? colors.semantic.success : colors.semantic.danger }]}>
                  {data.vsOpponent.hitRate}%
                </Text>
                <Text style={styles.opponentLabel}>Hit Rate</Text>
              </View>
            </View>
            {data.vsOpponent.lastGame && (
              <Text style={styles.lastGameText}>
                Last game: {data.vsOpponent.lastGame.value.toFixed(0)} ({data.vsOpponent.lastGame.isOver ? 'OVER' : 'UNDER'})
              </Text>
            )}
          </View>
        </LockedFeatureWrapper>
      )}

      {/* Matchup Radar (Premium) */}
      {opponent && radarMetrics.length > 0 && (
        <LockedFeatureWrapper
          requiredTier="pro"
          isLocked={!isPremium}
          featureName="Matchup Radar"
        >
          <View style={styles.radarSection}>
            <MatchupRadar metrics={radarMetrics} opponent={opponent} />
          </View>
        </LockedFeatureWrapper>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  minutesSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  minutesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  minutesStat: {
    alignItems: 'center',
  },
  minutesValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  minutesLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  minutesDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.default,
  },
  riskBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  riskText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  opponentSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  opponentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  opponentStat: {
    alignItems: 'center',
  },
  opponentValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  opponentLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  lastGameText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  radarSection: {
    marginTop: spacing.sm,
  },
});
