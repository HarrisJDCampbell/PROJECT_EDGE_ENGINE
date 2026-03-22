/**
 * OpponentContextCard
 * Shows upcoming opponent, home/away context, and placeholder stat rows.
 * Visible to all subscription tiers.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { Skeleton } from '../player-v2/components/Skeleton';

interface OpponentContextCardProps {
  opponent: { name: string; id: number } | null;
  wasHomeGame: boolean | null;
  gameDate: string | null;
  isLoading?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Abbreviate team name to 3 chars
function abbrev(name: string): string {
  if (!name) return '—';
  const parts = name.toUpperCase().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 3);
  return parts[parts.length - 1].slice(0, 3);
}

export function OpponentContextCard({
  opponent,
  wasHomeGame,
  gameDate,
  isLoading = false,
}: OpponentContextCardProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton width="40%" height={18} />
        <View style={styles.mainRow}>
          <Skeleton width={64} height={64} borderRadius={32} style={{ marginTop: spacing.md }} />
          <View style={{ marginLeft: spacing.md, gap: spacing.xs }}>
            <Skeleton width={140} height={24} />
            <Skeleton width={80} height={20} />
          </View>
        </View>
        <Skeleton width="100%" height={1} style={{ marginVertical: spacing.md }} />
        <Skeleton width="60%" height={14} />
        <Skeleton width="60%" height={14} style={{ marginTop: spacing.xs }} />
      </View>
    );
  }

  const opponentName = opponent?.name ?? '—';
  const opponentAbbr = abbrev(opponentName);
  const locationLabel = wasHomeGame === null ? '—' : wasHomeGame ? 'HOME' : 'AWAY';
  const locationColor = wasHomeGame === true ? colors.primary.main : colors.text.secondary;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>NEXT OPPONENT</Text>

      <View style={styles.mainRow}>
        {/* Team logo placeholder — colored circle with abbreviation */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>{opponentAbbr}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.opponentName}>vs {opponentName}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.locationBadge, { borderColor: locationColor }]}>
              <Text style={[styles.locationText, { color: locationColor }]}>
                {locationLabel}
              </Text>
            </View>
          </View>
          {gameDate && (
            <Text style={styles.dateText}>{formatDate(gameDate)}</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Placeholder stat rows — intentional "coming soon" design */}
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Pace Rank</Text>
        <View style={styles.statValueRow}>
          <Text style={styles.dashValue}>—</Text>
          <Text style={styles.comingSoon}>Coming soon</Text>
        </View>
      </View>
      <View style={[styles.statRow, { marginTop: spacing.sm }]}>
        <Text style={styles.statLabel}>Def Rating vs {abbrev(opponentName)}</Text>
        <View style={styles.statValueRow}>
          <Text style={styles.dashValue}>—</Text>
          <Text style={styles.comingSoon}>Coming soon</Text>
        </View>
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
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1.2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  infoCol: {
    marginLeft: spacing.md,
    flex: 1,
  },
  opponentName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  locationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.8,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dashValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
  },
  comingSoon: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    fontStyle: 'italic',
  },
});
