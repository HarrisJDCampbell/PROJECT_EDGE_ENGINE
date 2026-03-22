/**
 * HitRateStreakBar
 * Horizontal row of game result squares (green=hit, red=miss).
 * Free tier: shows 5 squares; Starter+: shows 10.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { Skeleton } from '../player-v2/components/Skeleton';
import type { AnalysisGame } from '../../services/api/playersApi';

const HIT_COLOR = '#00FF88';
const MISS_COLOR = '#FF4444';
const HIT_BG = 'rgba(0,255,136,0.15)';
const MISS_BG = 'rgba(255,68,68,0.15)';
const LOCKED_BG = 'rgba(255,255,255,0.04)';

interface HitRateStreakBarProps {
  games: AnalysisGame[];
  line: number;
  statLabel: string;
  hitRate: number;  // 0–1
  currentStreak: { type: 'hit' | 'miss'; count: number };
  tier: 'free' | 'starter' | 'pro';
  onUpgradePress?: () => void;
  isLoading?: boolean;
}

function abbrevOpponent(name: string): string {
  if (!name) return '?';
  const parts = name.toUpperCase().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 3);
  return parts[parts.length - 1].slice(0, 3);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return '';
  }
}

export function HitRateStreakBar({
  games,
  line,
  statLabel,
  hitRate,
  currentStreak,
  tier,
  onUpgradePress,
  isLoading = false,
}: HitRateStreakBarProps) {
  const isStarter = tier === 'starter' || tier === 'pro';
  const visibleCount = isStarter ? 10 : 5;

  // Most-recent last = left-to-right oldest→newest
  const displayed = [...games].slice(-10);  // take last 10
  const visibleGames = displayed.slice(-visibleCount);
  const lockedGames = isStarter ? [] : displayed.slice(0, displayed.length - 5);

  const hitRatePct = Math.round(hitRate * 100);
  const hitRateColor =
    hitRatePct >= 60 ? HIT_COLOR : hitRatePct >= 40 ? '#F5A623' : MISS_COLOR;

  const streakEmoji = currentStreak.type === 'hit' ? '🔥' : '❄️';
  const streakLabel =
    currentStreak.type === 'hit'
      ? `${currentStreak.count} in a row`
      : `${currentStreak.count} miss${currentStreak.count !== 1 ? 'es' : ''}`;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton width="50%" height={16} />
        <View style={styles.barContainer}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} width={28} height={36} style={{ marginRight: 4 }} />
          ))}
        </View>
        <Skeleton width="30%" height={14} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionLabel}>HIT RATE — {statLabel}</Text>
          <View style={styles.rateRow}>
            <Text style={[styles.hitRateNumber, { color: hitRateColor }]}>
              {hitRatePct}%
            </Text>
            <Text style={styles.hitRateLabel}>
              {' '}in last {visibleCount} games
            </Text>
          </View>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>{streakEmoji}</Text>
          <Text style={styles.streakText}>{streakLabel}</Text>
        </View>
      </View>

      {/* Bar */}
      <View style={styles.barContainer}>
        {/* Locked slots (free tier) */}
        {lockedGames.length > 0 && !isStarter && (
          <TouchableOpacity
            onPress={onUpgradePress}
            activeOpacity={0.8}
            style={styles.lockedGroup}
          >
            {lockedGames.map((_, i) => (
              <View key={`locked-${i}`} style={styles.lockedSquare}>
                <View style={styles.blurOverlay} />
              </View>
            ))}
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color={colors.text.muted} />
              <Text style={styles.lockBadgeText}>VisPlus</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Visible game squares */}
        {visibleGames.map((game, i) => {
          const isLast = i === visibleGames.length - 1;
          const bgColor = game.hit ? HIT_BG : MISS_BG;
          const borderColor = game.hit ? HIT_COLOR : MISS_COLOR;
          const textColor = game.hit ? HIT_COLOR : MISS_COLOR;

          return (
            <View key={i} style={styles.squareWrapper}>
              <View
                style={[
                  styles.square,
                  {
                    backgroundColor: bgColor,
                    borderColor,
                  },
                  isLast && styles.squareLast,
                ]}
              >
                <Text style={[styles.squareValue, { color: textColor }]}>
                  {game.stat_value}
                </Text>
              </View>
              <Text style={styles.squareOpponent}>
                {abbrevOpponent(game.opponent_name)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Prop line label */}
      <Text style={styles.lineLabel}>Line: {line}</Text>
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
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hitRateNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
  },
  hitRateLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  lockedGroup: {
    flexDirection: 'row',
    gap: 4,
    position: 'relative',
  },
  lockedSquare: {
    width: 28,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: LOCKED_BG,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,11,0.6)',
  },
  lockBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -10 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  lockBadgeText: {
    fontSize: 9,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.bold,
  },
  squareWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  square: {
    width: 28,
    height: 36,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareLast: {
    // Subtle glow on most recent game
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  squareValue: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  squareOpponent: {
    fontSize: 8,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.semibold,
  },
  lineLabel: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});
