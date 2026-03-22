/**
 * StatsInsightRow
 * Three compact stat cards: Season vs L5 avg, Model Edge, Minutes health.
 * Available to all tiers (free).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
import { Skeleton } from '../player-v2/components/Skeleton';

interface StatsInsightRowProps {
  seasonAverage: number;
  last5Average: number;
  volatilityRating: 'low' | 'medium' | 'high';
  edge: number;
  edgeDirection: 'over' | 'under';
  minutesAvg5: number;
  minutesFlag: boolean;
  tier: 'free' | 'starter' | 'pro';
  onUpgradePress?: () => void;
  isLoading?: boolean;
}

const VOLATILITY_COLORS: Record<string, string> = {
  low: '#00FF88',
  medium: '#F5A623',
  high: '#FF4444',
};

const VOLATILITY_LABELS: Record<string, string> = {
  low: 'LOW',
  medium: 'MED',
  high: 'HIGH',
};

function TooltipModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={tooltipStyles.backdrop} onPress={onClose}>
        <View style={tooltipStyles.box}>
          <Text style={tooltipStyles.title}>Model Edge</Text>
          <Text style={tooltipStyles.body}>
            Edge measures how far the player's last 5 game average is from the
            current prop line, as a percentage. Positive = averaging above the
            line (OVER lean). Negative = below (UNDER lean).
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const tooltipStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  box: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    maxWidth: 280,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export function StatsInsightRow({
  seasonAverage,
  last5Average,
  volatilityRating,
  edge,
  edgeDirection,
  minutesAvg5,
  minutesFlag,
  tier,
  onUpgradePress,
  isLoading = false,
}: StatsInsightRowProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const isStarter = tier === 'starter' || tier === 'pro';

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Skeleton width="31%" height={80} />
          <Skeleton width="31%" height={80} />
          <Skeleton width="31%" height={80} />
        </View>
      </View>
    );
  }

  const l5VsSeason = last5Average - seasonAverage;
  const l5Arrow = l5VsSeason > 0 ? '↑' : l5VsSeason < 0 ? '↓' : '→';
  const l5Color =
    l5VsSeason > 0 ? '#00FF88' : l5VsSeason < 0 ? '#FF4444' : colors.text.muted;

  const volColor = VOLATILITY_COLORS[volatilityRating] ?? colors.text.muted;
  const volLabel = VOLATILITY_LABELS[volatilityRating] ?? '—';

  const content = (
    <View style={styles.row}>
      {/* Card 1: Season avg vs L5 */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>SEASON AVG</Text>
        <Text style={styles.cardBigNumber}>{seasonAverage.toFixed(1)}</Text>
        <View style={styles.cardSubRow}>
          <Text style={[styles.cardArrow, { color: l5Color }]}>{l5Arrow}</Text>
          <Text style={[styles.cardSub, { color: l5Color }]}>
            L5: {last5Average.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Card 2: Edge Meter */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => setTooltipVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.cardLabel}>MODEL EDGE</Text>
        <Text
          style={[
            styles.cardBigLabel,
            { color: edge > 0 ? '#00FF88' : edge < 0 ? '#FF4444' : colors.text.muted },
          ]}
        >
          {edge > 0 ? '+' : ''}{edge.toFixed(1)}%
        </Text>
        <Text
          style={[
            styles.cardSub,
            { color: edge > 0 ? '#00FF88' : edge < 0 ? '#FF4444' : colors.text.muted },
          ]}
        >
          {edgeDirection.toUpperCase()} LEAN
        </Text>
        <Text style={styles.cardSubSmall}>vs current line</Text>
      </TouchableOpacity>

      {/* Card 3: Minutes health */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>MINUTES</Text>
        <Text style={styles.cardBigNumber}>{minutesAvg5.toFixed(0)}</Text>
        <Text style={styles.cardSubSmall}>MPG (L5)</Text>
        {minutesFlag ? (
          <View style={styles.flagRow}>
            <Text style={styles.flagEmoji}>⚠</Text>
            <Text style={styles.flagText}>Down last game</Text>
          </View>
        ) : (
          <View style={styles.flagRow}>
            <Text style={styles.stableEmoji}>✓</Text>
            <Text style={styles.stableText}>Stable mins</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TooltipModal visible={tooltipVisible} onClose={() => setTooltipVisible(false)} />

      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardBigNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
  },
  cardBigLabel: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  cardArrow: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  cardSub: {
    fontSize: 10,
    color: colors.text.muted,
  },
  cardSubSmall: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 2,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  flagEmoji: {
    fontSize: 10,
    color: '#F5A623',
  },
  flagText: {
    fontSize: 9,
    color: '#F5A623',
    fontWeight: typography.fontWeight.semibold,
  },
  stableEmoji: {
    fontSize: 10,
    color: '#00FF88',
  },
  stableText: {
    fontSize: 9,
    color: '#00FF88',
    fontWeight: typography.fontWeight.semibold,
  },
  // Locked state
  lockedWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  blurContent: {
    opacity: 0.15,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,11,0.75)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.xs,
  },
  lockText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  lockSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
