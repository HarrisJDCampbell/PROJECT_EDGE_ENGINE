/**
 * LineShoppingStrip
 * Horizontally scrollable strip of sportsbook cards for line comparison.
 * Pro-only. Starter users see first 2 books blurred + upgrade CTA.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { Skeleton } from '../player-v2/components/Skeleton';
import type { BookLine } from '../../services/api/playersApi';

// Color per book abbreviation for visual differentiation
const BOOK_COLORS: Record<string, string> = {
  fanduel: '#1493FF',
  draftkings: '#53D337',
  prizepicks: '#8B5CF6',
  underdog: '#FACC15',
  betmgm: '#BFA15C',
  caesars: '#C8102E',
  pointsbet: '#FF6B35',
  espnbet: '#FFCB05',
};

const BOOK_ABBREVS: Record<string, string> = {
  fanduel: 'FD',
  draftkings: 'DK',
  prizepicks: 'PP',
  underdog: 'UD',
  betmgm: 'MGM',
  caesars: 'CZR',
  pointsbet: 'PB',
  espnbet: 'EPN',
};

function formatAmericanOdds(price: number): string {
  if (!price || price === 0) return '—';
  if (price >= 0) return `+${price}`;
  return `${price}`;
}

const DFS_BOOKS = new Set(['prizepicks', 'underdog']);

interface BookCardProps {
  book: BookLine;
  blurred?: boolean;
}

function BookCard({ book, blurred = false }: BookCardProps) {
  const bookColor = BOOK_COLORS[book.bookmaker_key] ?? '#888888';
  const abbrev = BOOK_ABBREVS[book.bookmaker_key] ?? book.bookmaker_key.slice(0, 3).toUpperCase();
  const isDfs = DFS_BOOKS.has(book.bookmaker_key);

  return (
    <View
      style={[
        cardStyles.card,
        book.is_best_over && cardStyles.bestOver,
        book.is_best_under && cardStyles.bestUnder,
        blurred && cardStyles.blurred,
      ]}
    >
      {/* Book logo placeholder */}
      <View style={[cardStyles.logoBox, { backgroundColor: bookColor + '22', borderColor: bookColor }]}>
        <Text style={[cardStyles.logoText, { color: bookColor }]}>{abbrev}</Text>
      </View>

      <Text style={cardStyles.bookName} numberOfLines={1}>
        {book.bookmaker_title}
      </Text>

      {isDfs ? (
        /* DFS platforms: line only, no over/under odds */
        <View style={cardStyles.dfsLineRow}>
          <Text style={cardStyles.dfsLineLabel}>LINE</Text>
          <Text style={cardStyles.dfsLineVal}>{book.line}</Text>
        </View>
      ) : (
        <>
          {/* Over */}
          <View style={cardStyles.oddsRow}>
            <Text style={cardStyles.dirLabel}>OVER</Text>
            <Text style={cardStyles.lineVal}>{book.line}</Text>
            <Text style={cardStyles.priceVal}>{formatAmericanOdds(book.over_price)}</Text>
          </View>

          {/* Under */}
          <View style={cardStyles.oddsRow}>
            <Text style={cardStyles.dirLabel}>UNDER</Text>
            <Text style={cardStyles.lineVal}>{book.line}</Text>
            <Text style={cardStyles.priceVal}>{formatAmericanOdds(book.under_price)}</Text>
          </View>
        </>
      )}

      {/* Best badges */}
      {book.is_best_over && (
        <View style={cardStyles.bestOverBadge}>
          <Text style={cardStyles.bestOverBadgeText}>BEST OVER</Text>
        </View>
      )}
      {book.is_best_under && (
        <View style={cardStyles.bestUnderBadge}>
          <Text style={cardStyles.bestUnderBadgeText}>BEST UNDER</Text>
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: 110,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  bestOver: {
    borderColor: '#F5A623',
    backgroundColor: 'rgba(245,166,35,0.06)',
  },
  bestUnder: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0,255,136,0.06)',
  },
  blurred: {
    opacity: 0.15,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logoText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.extrabold,
  },
  bookName: {
    fontSize: 9,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dfsLineRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dfsLineLabel: {
    fontSize: 8,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  dfsLineVal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  oddsRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  dirLabel: {
    fontSize: 8,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.8,
  },
  lineVal: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  priceVal: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  bestOverBadge: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(245,166,35,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  bestOverBadgeText: {
    fontSize: 8,
    color: '#F5A623',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  bestUnderBadge: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(0,255,136,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  bestUnderBadgeText: {
    fontSize: 8,
    color: '#00FF88',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
});

interface LineShoppingStripProps {
  allBooks: BookLine[];
  lineSpread: number;
  statLabel: string;
  tier: 'free' | 'starter' | 'pro';
  onUpgradePress?: () => void;
  isLoading?: boolean;
}

export function LineShoppingStrip({
  allBooks,
  lineSpread,
  statLabel,
  tier,
  onUpgradePress,
  isLoading = false,
}: LineShoppingStripProps) {
  const isPro = tier === 'pro';
  const isStarter = tier === 'starter';

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton width="40%" height={16} />
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={110} height={140} style={{ marginRight: spacing.sm }} />
          ))}
        </View>
      </View>
    );
  }

  // Free tier: hidden
  if (tier === 'free') return null;

  // No books data
  if (allBooks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>LINE SHOPPING — {statLabel}</Text>
        <View style={styles.noDataBox}>
          <Text style={styles.noDataText}>No odds available for today's game</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>LINE SHOPPING — {statLabel}</Text>
        {!isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>VISMAX</Text>
          </View>
        )}
      </View>

      {/* Scrollable book cards */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={isPro}
        >
          {allBooks.map((book, i) => {
            const isLocked = !isPro && i >= 2;
            return (
              <BookCard
                key={book.bookmaker_key}
                book={book}
                blurred={isLocked}
              />
            );
          })}
        </ScrollView>

        {/* Starter: lock overlay over books 3+ */}
        {!isPro && isStarter && allBooks.length > 2 && (
          <TouchableOpacity
            style={styles.partialLockOverlay}
            onPress={onUpgradePress}
            activeOpacity={0.9}
          >
            <Ionicons name="lock-closed" size={18} color={colors.text.muted} />
            <Text style={styles.partialLockText}>Unlock with VISMAX</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Line spread callout */}
      {lineSpread > 0 && (
        <View style={styles.spreadRow}>
          <Text style={[styles.spreadText, lineSpread >= 0.5 && styles.spreadTextGold]}>
            Line spread: {lineSpread.toFixed(1)} pts across books
            {lineSpread >= 0.5 ? ' — shopping opportunity!' : ''}
          </Text>
        </View>
      )}
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1.2,
  },
  proBadge: {
    backgroundColor: 'rgba(245,166,35,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: '#F5A623',
    letterSpacing: 1,
  },
  scrollWrapper: {
    position: 'relative',
  },
  scrollContent: {
    paddingRight: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  partialLockOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(10,10,11,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  partialLockText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  spreadRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  spreadText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  spreadTextGold: {
    color: '#F5A623',
    fontWeight: typography.fontWeight.semibold,
  },
  noDataBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
});
