/**
 * Parlay Analysis Screen
 * Detailed analysis of custom parlay with confidence, correlation, and risk assessment
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useParlayBuilderStore, ParlayLeg } from '../src/stores/parlayBuilderStore';
import { useProjections, ProjectedProp } from '../src/hooks/useProjections';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/styles';
import { getInitials } from '../src/utils/formatters';
import { analyticsService } from '../src/services/analytics/analyticsService';

interface AnalysisResult {
  combinedConfidence: number;
  correlationFactor: string;
  correlationDescription: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  estimatedOdds: string;
  warnings: string[];
}

function getProjectionForLeg(leg: ParlayLeg, projections: ProjectedProp[] | undefined): ProjectedProp | null {
  if (!projections) return null;
  const fullName = `${leg.player.first_name} ${leg.player.last_name}`.toLowerCase();
  return projections.find(p =>
    p.playerName.toLowerCase() === fullName && p.statDisplay === leg.statType
  ) ?? null;
}

/**
 * Analyze the parlay for insights
 */
function analyzeParlay(legs: ParlayLeg[], projections?: ProjectedProp[]): AnalysisResult {
  if (legs.length === 0) {
    return {
      combinedConfidence: 0,
      correlationFactor: 'N/A',
      correlationDescription: 'Add players to analyze',
      riskLevel: 'Low',
      estimatedOdds: '+0',
      warnings: [],
    };
  }

  // Use real visbetsScore if available; skip legs without projection data
  const baseConfidences = legs.map((leg) => {
    const proj = getProjectionForLeg(leg, projections);
    return proj ? proj.visbetsScore : null;
  });

  const validConfidences = baseConfidences.filter((c): c is number => c !== null);
  const hasAllData = validConfidences.length === legs.length;

  // Combined confidence decreases with more legs (only if we have real data)
  const combinedConfidence = hasAllData
    ? Math.round(
        validConfidences.reduce((acc, conf) => acc * (conf / 100), 1) * 100 * (1 - (legs.length - 2) * 0.03)
      )
    : 0;

  // Check for correlations
  const teams = legs.map((leg) => leg.player.team.abbreviation);
  const uniqueTeams = new Set(teams);
  const sameTeamPlayers = teams.length - uniqueTeams.size;

  let correlationFactor: string;
  let correlationDescription: string;

  if (sameTeamPlayers >= 2) {
    correlationFactor = 'Positive';
    correlationDescription = `${sameTeamPlayers + 1} players from same team - stats may trend together`;
  } else if (sameTeamPlayers === 1) {
    correlationFactor = 'Moderate';
    correlationDescription = '2 teammates - consider game script impact';
  } else {
    correlationFactor = 'Independent';
    correlationDescription = 'Players on different teams - low correlation';
  }

  // Risk level based on legs and confidence
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  if (legs.length <= 2 && combinedConfidence >= 40) {
    riskLevel = 'Low';
  } else if (legs.length <= 3 && combinedConfidence >= 30) {
    riskLevel = 'Medium';
  } else if (legs.length <= 4 && combinedConfidence >= 20) {
    riskLevel = 'High';
  } else {
    riskLevel = 'Very High';
  }

  // Estimate odds based on leg count
  const oddsMap: Record<number, string> = {
    2: '+180',
    3: '+350',
    4: '+650',
    5: '+1100',
    6: '+2000',
  };
  const estimatedOdds = oddsMap[legs.length] || `+${legs.length * 400}`;

  // Generate warnings
  const warnings: string[] = [];
  if (legs.length >= 5) {
    warnings.push('Large parlays have significantly lower hit rates');
  }
  if (sameTeamPlayers >= 2) {
    warnings.push('Multiple teammates - if one misses value, others may too');
  }
  const hasAllOvers = legs.every((leg) => leg.isOver);
  const hasAllUnders = legs.every((leg) => !leg.isOver);
  if (hasAllOvers && legs.length >= 3) {
    warnings.push('All overs - consider pace and game total');
  }
  if (hasAllUnders && legs.length >= 3) {
    warnings.push('All unders - volatile if players get hot');
  }

  return {
    combinedConfidence: Math.max(5, combinedConfidence),
    correlationFactor,
    correlationDescription,
    riskLevel,
    estimatedOdds,
    warnings,
  };
}

function LegAnalysisCard({ leg, index, projData }: { leg: ParlayLeg; index: number; projData: ProjectedProp | null }) {
  const fullName = `${leg.player.first_name} ${leg.player.last_name}`;

  const hasData = projData != null && projData.projection != null;
  const projection = hasData ? projData.projection : null;
  const edge = hasData ? projData.edge : null;
  const edgePercent = hasData && edge != null && leg.line > 0 ? ((edge / leg.line) * 100).toFixed(1) : null;
  const confidence = hasData ? projData.visbetsScore : null;

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(index * 100)}
      style={styles.legCard}
    >
      <LinearGradient
        colors={[colors.background.secondary, colors.background.tertiary]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.legHeader}>
        {/* Player Image */}
        <View style={styles.legImageContainer}>
          {leg.imageUrl ? (
            <Image
              source={{ uri: leg.imageUrl }}
              style={styles.legImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.legFallbackImage}>
              <Text style={styles.legInitials}>{getInitials(fullName)}</Text>
            </View>
          )}
        </View>

        <View style={styles.legInfo}>
          <Text style={styles.legPlayerName}>{fullName}</Text>
          <Text style={styles.legTeam}>{leg.player.team.full_name}</Text>
        </View>

        <View style={[
          styles.pickBadge,
          { backgroundColor: leg.isOver ? colors.semantic.success + '20' : colors.semantic.danger + '20' },
        ]}>
          <Text style={[
            styles.pickText,
            { color: leg.isOver ? colors.semantic.success : colors.semantic.danger },
          ]}>
            {leg.isOver ? 'OVER' : 'UNDER'} {leg.line}
          </Text>
        </View>
      </View>

      <View style={styles.legStats}>
        <View style={styles.legStatItem}>
          <Text style={styles.legStatLabel}>{leg.statType}</Text>
          <Text style={styles.legStatValue}>{projection != null ? projection.toFixed(1) : '—'}</Text>
          <Text style={styles.legStatSubtext}>Projection</Text>
        </View>
        <View style={styles.legStatDivider} />
        <View style={styles.legStatItem}>
          <Text style={styles.legStatLabel}>Edge</Text>
          <Text style={[
            styles.legStatValue,
            edge != null ? { color: edge > 0 ? colors.semantic.success : colors.semantic.danger } : { color: colors.text.muted },
          ]}>
            {edgePercent != null ? `${edge! > 0 ? '+' : ''}${edgePercent}%` : '—'}
          </Text>
          <Text style={styles.legStatSubtext}>{edge != null ? (edge > 0 ? 'Favorable' : 'Unfavorable') : 'No data'}</Text>
        </View>
        <View style={styles.legStatDivider} />
        <View style={styles.legStatItem}>
          <Text style={styles.legStatLabel}>Conf.</Text>
          <Text style={styles.legStatValue}>{confidence != null ? `${confidence}%` : '—'}</Text>
          <Text style={styles.legStatSubtext}>Single</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ParlayAnalysisScreen() {
  const router = useRouter();
  const legs = useParlayBuilderStore((state) => state.legs);
  const clearParlay = useParlayBuilderStore((state) => state.clearParlay);
  const { data: projections } = useProjections();

  const analysis = useMemo(() => analyzeParlay(legs, projections), [legs, projections]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return colors.semantic.success;
      case 'Medium': return colors.semantic.warning;
      case 'High': return colors.semantic.danger;
      case 'Very High': return '#FF0000';
      default: return colors.text.secondary;
    }
  };

  const handleDone = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    analyticsService.track('Parlay Analysis Done', { legCount: legs.length, combinedConfidence: analysis.combinedConfidence });
    clearParlay();
    router.back();
  };

  if (legs.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parlay Analysis</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="layers-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyText}>No parlay to analyze</Text>
          <Text style={styles.emptySubtext}>Go back and add players to your parlay</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Build Parlay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parlay Analysis</Text>
        <View style={styles.legCountBadge}>
          <Text style={styles.legCountText}>{legs.length} LEGS</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.summaryCard}>
          <LinearGradient
            colors={[colors.primary.main + '15', colors.background.secondary]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <Text style={styles.summaryTitle}>Combined Analysis</Text>
              <Text style={styles.summarySubtitle}>{legs.length}-leg parlay</Text>
            </View>
            <View style={styles.oddsContainer}>
              <Text style={styles.oddsLabel}>Est. Odds</Text>
              <Text style={styles.oddsValue}>{analysis.estimatedOdds}</Text>
            </View>
          </View>

          <View style={styles.summaryStats}>
            {/* Confidence */}
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Hit Probability</Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${analysis.combinedConfidence}%` },
                    ]}
                  />
                </View>
                <Text style={styles.confidenceText}>{analysis.combinedConfidence}%</Text>
              </View>
            </View>

            {/* Risk Level */}
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Risk Level</Text>
              <View style={[
                styles.riskBadge,
                { backgroundColor: getRiskColor(analysis.riskLevel) + '20' },
              ]}>
                <Ionicons
                  name={analysis.riskLevel === 'Low' ? 'shield-checkmark' : 'warning'}
                  size={14}
                  color={getRiskColor(analysis.riskLevel)}
                />
                <Text style={[
                  styles.riskText,
                  { color: getRiskColor(analysis.riskLevel) },
                ]}>
                  {analysis.riskLevel}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Correlation Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-network-outline" size={20} color={colors.primary.main} />
            <Text style={styles.sectionTitle}>Correlation Analysis</Text>
          </View>
          <View style={styles.correlationContent}>
            <View style={[
              styles.correlationBadge,
              {
                backgroundColor: analysis.correlationFactor === 'Independent'
                  ? colors.semantic.success + '20'
                  : analysis.correlationFactor === 'Moderate'
                    ? colors.semantic.warning + '20'
                    : colors.semantic.danger + '20',
              },
            ]}>
              <Text style={[
                styles.correlationBadgeText,
                {
                  color: analysis.correlationFactor === 'Independent'
                    ? colors.semantic.success
                    : analysis.correlationFactor === 'Moderate'
                      ? colors.semantic.warning
                      : colors.semantic.danger,
                },
              ]}>
                {analysis.correlationFactor}
              </Text>
            </View>
            <Text style={styles.correlationDescription}>
              {analysis.correlationDescription}
            </Text>
          </View>
        </Animated.View>

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(150)} style={styles.warningsCard}>
            <View style={styles.warningsHeader}>
              <Ionicons name="alert-circle" size={20} color={colors.semantic.warning} />
              <Text style={styles.warningsTitle}>Things to Consider</Text>
            </View>
            {analysis.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <View style={styles.warningBullet} />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Leg Analysis */}
        <View style={styles.legsSection}>
          <Text style={styles.legsSectionTitle}>Leg Breakdown</Text>
          {legs.map((leg, index) => (
            <LegAnalysisCard
              key={leg.id}
              leg={leg}
              index={index}
              projData={getProjectionForLeg(leg, projections)}
            />
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Done Button */}
      <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.background.primary} />
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  legCountBadge: {
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  legCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  summaryCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
    marginBottom: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '30',
  },
  summaryHeaderLeft: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  summarySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
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
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  summaryStats: {
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryStatItem: {
    gap: spacing.xs,
  },
  summaryStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    minWidth: 50,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  riskText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  sectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  correlationContent: {
    gap: spacing.sm,
  },
  correlationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  correlationBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  correlationDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  warningsCard: {
    backgroundColor: colors.semantic.warning + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.semantic.warning + '30',
    marginBottom: spacing.md,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  warningsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.warning,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.semantic.warning,
    marginTop: 6,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  legsSection: {
    marginTop: spacing.md,
  },
  legsSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  legCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '30',
  },
  legImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
  },
  legImage: {
    width: '100%',
    height: '100%',
  },
  legFallbackImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  legInitials: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  legInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  legPlayerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  legTeam: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  pickBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  pickText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  legStats: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  legStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  legStatLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  legStatValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  legStatSubtext: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  legStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border.default,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  doneButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
});
