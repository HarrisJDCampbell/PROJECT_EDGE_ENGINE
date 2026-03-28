/**
 * Parlays Screen
 * Curated high-likelihood parlay combinations
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useProjections } from '../../src/hooks/useProjections';
import type { ProjectedProp } from '../../src/hooks/useProjections';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { BlurUpgradeOverlay } from '../../src/components/common/BlurUpgradeOverlay';
import { DataLoadingScreen } from '../../src/components/common/DataLoadingScreen';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/styles';

interface CuratedParlay {
  id: string;
  name: string;
  description: string;
  legs: ParlayLeg[];
  confidence: number;
  estimatedOdds: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface ParlayLeg {
  playerId: number;
  playerName: string;
  team: string;
  opponent: string;
  statType: string;
  line: number;
  projection: number;
  pick: 'OVER' | 'UNDER';
  confidence: number;
}

function confNum(c: 'low' | 'medium' | 'high') {
  return c === 'high' ? 83 : c === 'medium' ? 65 : 43;
}

function toLeg(p: ProjectedProp): ParlayLeg {
  return {
    playerId: p.playerApiSportsId ?? 0,
    playerName: p.playerName,
    team: p.teamName,
    opponent: p.opponent,
    statType: p.statDisplay,
    line: p.line,
    projection: p.projection,
    pick: p.direction === 'over' ? 'OVER' : 'UNDER',
    confidence: confNum(p.confidence),
  };
}

/** Return only one projection per player (highest visbetsScore wins) */
function byUniquePlayer(props: ProjectedProp[]): ProjectedProp[] {
  const seen = new Set<string>();
  return props.filter(p => {
    if (seen.has(p.playerName)) return false;
    seen.add(p.playerName);
    return true;
  });
}

/**
 * Compute estimated American odds from an array of projection legs.
 * Combined probability = product of each leg's win probability.
 * Uses pOver for OVER picks and (1 - pOver) for UNDER picks.
 * Individual leg probabilities are clamped to [0.05, 0.95] to avoid degenerate values.
 */
function computeAmericanOdds(props: ProjectedProp[]): string {
  if (props.length === 0) return '+100';

  const combinedProb = props.reduce((acc, p) => {
    const legProb = p.direction === 'over' ? p.pOver : (1 - p.pOver);
    return acc * Math.min(0.95, Math.max(0.05, legProb));
  }, 1);

  if (combinedProb >= 0.5) {
    return `${Math.round(-(combinedProb / (1 - combinedProb)) * 100)}`;
  }
  return `+${Math.round(((1 - combinedProb) / combinedProb) * 100)}`;
}

/**
 * Generate curated parlays from real backend projections.
 *
 * Strategy:
 * - Sort all props by visbetsScore (best first)
 * - Generate 7 distinct parlay types with different risk/reward profiles
 * - Use adaptive thresholds based on available data (not fixed cutoffs)
 * - Ensure unique players per parlay (no duplicate player legs)
 * - Diversify across stat types when possible
 */
function generateCuratedParlays(projections: ProjectedProp[]): CuratedParlay[] {
  if (!projections || projections.length < 2) return [];

  const sorted = byUniquePlayer([...projections].sort((a, b) => b.visbetsScore - a.visbetsScore));
  const parlays: CuratedParlay[] = [];
  const avg = (legs: ParlayLeg[]) => Math.round(legs.reduce((s, l) => s + l.confidence, 0) / legs.length);

  // Adaptive thresholds: use top percentiles instead of fixed score cutoffs
  const topTier = sorted.slice(0, Math.max(2, Math.floor(sorted.length * 0.2)));   // top 20%
  const midTier = sorted.slice(topTier.length, Math.max(4, Math.floor(sorted.length * 0.5))); // next 30%

  // Helper: pick N unique players from a pool, excluding already-used names
  const pickUnique = (pool: ProjectedProp[], n: number, exclude?: Set<string>): ProjectedProp[] => {
    const result: ProjectedProp[] = [];
    const used = new Set(exclude ?? []);
    for (const p of pool) {
      if (used.has(p.playerName)) continue;
      result.push(p);
      used.add(p.playerName);
      if (result.length >= n) break;
    }
    return result;
  };

  // 1. Safe Double — 2 highest confidence picks
  if (topTier.length >= 2) {
    const srcProps = pickUnique(topTier, 2);
    if (srcProps.length >= 2) {
      const legs = srcProps.map(toLeg);
      parlays.push({ id: '2-leg-safe', name: 'Safe Double', description: 'Two highest-confidence picks', legs, confidence: avg(legs), estimatedOdds: computeAmericanOdds(srcProps), riskLevel: 'Low' });
    }
  }

  // 2. Balanced Triple — 2 top + 1 mid tier
  if (topTier.length >= 2 && midTier.length >= 1) {
    const topPicks = pickUnique(topTier, 2);
    const usedNames = new Set(topPicks.map(p => p.playerName));
    const midPick = pickUnique(midTier, 1, usedNames);
    if (topPicks.length >= 2 && midPick.length >= 1) {
      const srcProps = [...topPicks, ...midPick];
      const legs = srcProps.map(toLeg);
      parlays.push({ id: '3-leg-balanced', name: 'Balanced Triple', description: 'Strong core with value add', legs, confidence: avg(legs), estimatedOdds: computeAmericanOdds(srcProps), riskLevel: 'Medium' });
    }
  }

  // 3. Value Quad — top 4 overall
  if (sorted.length >= 4) {
    const srcProps = pickUnique(sorted, 4);
    if (srcProps.length >= 4) {
      const legs = srcProps.map(toLeg);
      parlays.push({ id: '4-leg-value', name: 'Value Quad', description: 'Best 4 picks of the night', legs, confidence: avg(legs), estimatedOdds: computeAmericanOdds(srcProps), riskLevel: 'Medium' });
    }
  }

  // 4. Scorers Special — points-only picks
  const pts = byUniquePlayer(sorted.filter(p => p.statDisplay === 'PTS'));
  if (pts.length >= 3) {
    const srcProps = pts.slice(0, 3);
    const legs = srcProps.map(toLeg);
    parlays.push({ id: '3-leg-points', name: 'Scorers Special', description: 'Points props from top performers', legs, confidence: avg(legs), estimatedOdds: computeAmericanOdds(srcProps), riskLevel: 'Medium' });
  }

  // 5. Boards & Dimes — rebounds + assists mix
  const rebAst = byUniquePlayer(sorted.filter(p => p.statDisplay === 'REB' || p.statDisplay === 'AST'));
  if (rebAst.length >= 2) {
    const srcProps = rebAst.slice(0, Math.min(3, rebAst.length));
    const legs = srcProps.map(toLeg);
    parlays.push({ id: 'reb-ast-mix', name: 'Boards & Dimes', description: 'Rebounds and assists combo', legs, confidence: avg(legs), estimatedOdds: computeAmericanOdds(srcProps), riskLevel: 'Medium' });
  }

  // 6. Edge Hunter — highest model edge (biggest disagreement with the books)
  const edgeProps = byUniquePlayer([...projections].filter(p => Math.abs(p.edge) > 0).sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge)));
  if (edgeProps.length >= 2) {
    const srcProps = edgeProps.slice(0, Math.min(3, edgeProps.length));
    const legs = srcProps.map(toLeg);
    parlays.push({ id: '3-leg-edge', name: 'Edge Hunter', description: 'Biggest model edge plays', legs, confidence: avg(legs), estimatedOdds: computeAmericanOdds(srcProps), riskLevel: 'High' });
  }

  // 7. Long Shot 5-Leg — high risk, high reward
  if (sorted.length >= 5) {
    const srcProps = pickUnique(sorted, 5);
    if (srcProps.length >= 5) {
      const legs = srcProps.map(toLeg);
      parlays.push({ id: '5-leg-longshot', name: 'Long Shot', description: '5-leg high-reward parlay', legs, confidence: avg(legs), estimatedOdds: computeAmericanOdds(srcProps), riskLevel: 'High' });
    }
  }

  return parlays;
}

export default function ParlaysScreen() {
  const router = useRouter();
  const { data: projections, isLoading, error, refetch } = useProjections();
  const hasParlayOptimizer = useSubscriptionStore((state) => state.hasFeature('parlayOptimizer'));
  const curatedParlays = useMemo(() => {
    if (!projections) return [];
    return generateCuratedParlays(projections);
  }, [projections]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return colors.semantic.success;
      case 'Medium': return colors.semantic.warning;
      case 'High': return colors.semantic.danger;
      default: return colors.text.secondary;
    }
  };

  if (isLoading) {
    return <DataLoadingScreen />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load parlays</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render content (used both for premium users and as background for blur)
  const renderParlayContent = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Curated Parlays</Text>
        <Text style={styles.subtitle}>AI-optimized parlay combinations</Text>
      </View>

      {/* Parlay Cards */}
      {curatedParlays.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="layers-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>No parlays available</Text>
          <Text style={styles.emptySubtext}>Check back when games are scheduled</Text>
        </View>
      ) : (
        curatedParlays.map((parlay) => (
          <View key={parlay.id} style={styles.parlayCard}>
            <LinearGradient
              colors={[colors.background.secondary, colors.background.tertiary]}
              style={StyleSheet.absoluteFill}
            />

            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.nameRow}>
                  <Text style={styles.parlayName}>{parlay.name}</Text>
                  <View style={styles.legsBadge}>
                    <Text style={styles.legsBadgeText}>{parlay.legs.length}-LEG</Text>
                  </View>
                </View>
                <Text style={styles.parlayDescription}>{parlay.description}</Text>
              </View>
              <View style={styles.oddsContainer}>
                <Text style={styles.oddsLabel}>Est. Odds</Text>
                <Text style={styles.oddsValue}>{parlay.estimatedOdds}</Text>
              </View>
            </View>

            {/* Confidence & Risk */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Confidence</Text>
                <View style={styles.confidenceRow}>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { width: `${parlay.confidence}%` }]} />
                  </View>
                  <Text style={styles.confidenceText}>{parlay.confidence}%</Text>
                </View>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(parlay.riskLevel) + '20' }]}>
                <Text style={[styles.riskText, { color: getRiskColor(parlay.riskLevel) }]}>
                  {parlay.riskLevel} Risk
                </Text>
              </View>
            </View>

            {/* Legs */}
            <View style={styles.legsContainer}>
              {parlay.legs.map((leg) => (
                <View key={`${leg.playerId}-${leg.statType}`} style={styles.legRow}>
                  <View style={styles.legInfo}>
                    <Text style={styles.legPlayerName} numberOfLines={1}>{leg.playerName}</Text>
                    <Text style={styles.legMatchup}>{leg.team} vs {leg.opponent}</Text>
                  </View>
                  <View style={styles.legPick}>
                    <Text style={styles.legStatType}>{leg.statType}</Text>
                    <View style={[
                      styles.pickBadge,
                      { backgroundColor: leg.pick === 'OVER' ? colors.semantic.success + '20' : colors.semantic.danger + '20' }
                    ]}>
                      <Text style={[
                        styles.pickText,
                        { color: leg.pick === 'OVER' ? colors.semantic.success : colors.semantic.danger }
                      ]}>
                        {leg.pick} {leg.line}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

          </View>
        ))
      )}

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // If user doesn't have parlay optimizer, show blur overlay
  if (!hasParlayOptimizer) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <BlurUpgradeOverlay
          requiredTier="starter"
          title="Unlock AI Parlays"
          description="Get AI-optimized parlay combinations, personalized picks, and higher win probability analysis."
          icon="layers"
        >
          {renderParlayContent()}
        </BlurUpgradeOverlay>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderParlayContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.danger,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  parlayCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default + '40',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '30',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  parlayName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  legsBadge: {
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  legsBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  parlayDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  oddsContainer: {
    alignItems: 'flex-end',
  },
  oddsLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginBottom: 2,
  },
  oddsValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '30',
  },
  statBox: {
    flex: 1,
    marginRight: spacing.md,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    minWidth: 36,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  riskText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  legsContainer: {
    padding: spacing.sm,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '20',
  },
  legInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  legPlayerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  legMatchup: {
    fontSize: 11,
    color: colors.text.muted,
  },
  legPick: {
    alignItems: 'flex-end',
  },
  legStatType: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  pickBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  pickText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
});
