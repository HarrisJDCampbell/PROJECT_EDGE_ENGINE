/**
 * OddsComparison - Sportsbook odds comparison table
 * Shows lines from multiple sportsbooks with best odds highlighted
 * Starter feature
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/styles';
interface OddsComparisonData {
  stat_type: string;
  books: Array<{
    sportsbook: string;
    line: number;
    over_odds: number;
    under_odds: number;
  }>;
  bestOver: { sportsbook: string; odds: number; line?: number } | null;
  bestUnder: { sportsbook: string; odds: number; line?: number } | null;
}

interface OddsComparisonProps {
  odds: OddsComparisonData[] | null;
  isLoading?: boolean;
  statType?: string;
  showArbitrage?: boolean;
}

// Format American odds
function formatOdds(odds: number): string {
  if (!odds || odds === 0) return '—';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

// Sportsbook abbreviation mapping
const BOOK_ABBREVS: Record<string, string> = {
  fanduel: 'FD',
  draftkings: 'DK',
  prizepicks: 'PP',
  underdog: 'UD',
  betmgm: 'MGM',
  caesars: 'CZR',
  pointsbet: 'PB',
  espnbet: 'ESPN',
};

// Get sportsbook display name
function getSportsbookName(sportsbook: string): string {
  const names: Record<string, string> = {
    draftkings: 'DraftKings',
    fanduel: 'FanDuel',
    prizepicks: 'PrizePicks',
    underdog: 'Underdog',
    betmgm: 'BetMGM',
    caesars: 'Caesars',
    pointsbet: 'PointsBet',
    espnbet: 'ESPN BET',
  };
  return names[sportsbook.toLowerCase()] || sportsbook;
}

// Get sportsbook abbreviation
function getSportsbookAbbrev(sportsbook: string): string {
  return BOOK_ABBREVS[sportsbook.toLowerCase()] || sportsbook.slice(0, 3).toUpperCase();
}

// Get sportsbook brand color
function getSportsbookColor(sportsbook: string): string {
  const brandColors: Record<string, string> = {
    draftkings: '#53D337',
    fanduel: '#1493FF',
    prizepicks: '#8B5CF6',
    underdog: '#FACC15',
    betmgm: '#BFA15C',
    caesars: '#0A3161',
    pointsbet: '#ED1C24',
    espnbet: '#FFCB05',
  };
  return brandColors[sportsbook.toLowerCase()] || colors.text.secondary;
}

export function OddsComparisonSection({
  odds,
  isLoading = false,
  statType,
  showArbitrage = false
}: OddsComparisonProps) {
  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>SPORTSBOOK ODDS</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading odds...</Text>
        </View>
      </View>
    );
  }

  // Get odds for the selected stat type (first match or fallback to first in array)
  const currentOdds = odds?.find(o =>
    statType ? o.stat_type === statType : true
  ) || odds?.[0];

  if (!currentOdds || currentOdds.books.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>SPORTSBOOK ODDS</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No odds available</Text>
        </View>
      </View>
    );
  }

  // Sort books by line (ascending)
  const sortedBooks = [...currentOdds.books].sort((a, b) => a.line - b.line);

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.container}>
      <Text style={styles.title}>SPORTSBOOK ODDS</Text>

      <View style={styles.table}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.bookColumn]}>Book</Text>
          <Text style={[styles.headerCell, styles.lineColumn]}>Line</Text>
          <Text style={[styles.headerCell, styles.oddsColumn]}>Over</Text>
          <Text style={[styles.headerCell, styles.oddsColumn]}>Under</Text>
        </View>

        {/* Rows */}
        {sortedBooks.map((book, index) => {
          const isBestOver = showArbitrage && currentOdds.bestOver?.sportsbook === book.sportsbook;
          const isBestUnder = showArbitrage && currentOdds.bestUnder?.sportsbook === book.sportsbook;

          return (
            <View key={`${book.sportsbook}-${index}`} style={styles.row}>
              <View style={[styles.cell, styles.bookColumn]}>
                <View
                  style={[
                    styles.bookBadge,
                    { backgroundColor: getSportsbookColor(book.sportsbook) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.bookText,
                      { color: getSportsbookColor(book.sportsbook) },
                    ]}
                  >
                    {getSportsbookAbbrev(book.sportsbook)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.cell, styles.lineColumn, styles.lineText]}>
                {book.line.toFixed(1)}
              </Text>

              <View style={[styles.cell, styles.oddsColumn]}>
                <Text
                  style={[
                    styles.oddsText,
                    isBestOver && styles.bestOdds,
                  ]}
                >
                  {formatOdds(book.over_odds)}
                </Text>
                {isBestOver && <Text style={styles.bestLabel}>BEST</Text>}
              </View>

              <View style={[styles.cell, styles.oddsColumn]}>
                <Text
                  style={[
                    styles.oddsText,
                    isBestUnder && styles.bestOdds,
                  ]}
                >
                  {formatOdds(book.under_odds)}
                </Text>
                {isBestUnder && <Text style={styles.bestLabel}>BEST</Text>}
              </View>
            </View>
          );
        })}
      </View>

      {/* Best odds summary (Pro only) */}
      {showArbitrage && (currentOdds.bestOver || currentOdds.bestUnder) && (
        <View style={styles.summaryRow}>
          {currentOdds.bestOver && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Best Over</Text>
              <Text style={[styles.summaryValue, { color: colors.semantic.success }]}>
                {getSportsbookName(currentOdds.bestOver.sportsbook)} ({formatOdds(currentOdds.bestOver.odds)})
              </Text>
            </View>
          )}
          {currentOdds.bestUnder && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Best Under</Text>
              <Text style={[styles.summaryValue, { color: colors.semantic.danger }]}>
                {getSportsbookName(currentOdds.bestUnder.sportsbook)} ({formatOdds(currentOdds.bestUnder.odds)})
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerCell: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookColumn: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  lineColumn: {
    flex: 0.8,
  },
  oddsColumn: {
    flex: 1,
  },
  bookBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  bookText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  lineText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  oddsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bestOdds: {
    color: colors.semantic.success,
    fontWeight: typography.fontWeight.bold,
  },
  bestLabel: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.success,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
