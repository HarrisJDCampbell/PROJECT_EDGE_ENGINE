/**
 * HeroSection - Main hero header for player detail page
 *
 * Combines player avatar, team info, stat selector, and projection comparison
 * in a modern flowing design without explicit card borders.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { PlayerAvatar } from './PlayerAvatar';
import { StatPillBar } from './StatPillBar';
import { ProjectionRow } from './ProjectionRow';
import { BackButton } from '../../../common/BackButton';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { HeroSectionProps, StatType } from '../../types';

const AVAILABLE_STATS: StatType[] = ['PTS', 'REB', 'AST', 'PRA', '3PM'];

export function HeroSection({
  hero,
  projection,
  statType,
  availableStats = AVAILABLE_STATS,
  onStatChange,
}: HeroSectionProps) {
  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={[colors.background.secondary, colors.background.primary]}
        style={styles.gradient}
      />

      {/* Back button */}
      <View style={styles.backButtonContainer}>
        <BackButton variant="pill" label="Back" />
      </View>

      {/* Player info */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(100)}
        style={styles.playerInfo}
      >
        <PlayerAvatar
          imageUrl={hero.player.imageUrl}
          recommendation={projection.recommendation}
          size={100}
        />

        <View style={styles.nameContainer}>
          <Text style={styles.playerName}>{hero.player.fullName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.teamText}>
              {hero.team.abbreviation}
              {hero.player.position ? ` • ${hero.player.position}` : ''}
            </Text>
            {hero.opponent && (
              <Text style={styles.opponentText}>vs {hero.opponent.abbreviation}</Text>
            )}
          </View>

          {/* Injury badge */}
          {hero.injury && (
            <View style={styles.injuryBadge}>
              <Text style={styles.injuryText}>
                {hero.injury.status}: {hero.injury.description}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Stat selector */}
      <Animated.View entering={FadeIn.duration(300).delay(200)}>
        <StatPillBar
          stats={availableStats}
          selected={statType}
          onSelect={onStatChange}
        />
      </Animated.View>

      {/* Projection comparison */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(300)}
        style={styles.projectionContainer}
      >
        <ProjectionRow projection={projection} statType={statType} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  nameContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  opponentText: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },
  injuryBadge: {
    marginTop: spacing.xs,
    backgroundColor: colors.semantic.danger + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  injuryText: {
    fontSize: typography.fontSize.xs,
    color: colors.semantic.danger,
    fontWeight: typography.fontWeight.medium,
  },
  projectionContainer: {
    paddingHorizontal: spacing.md,
  },
});
