/**
 * ProjectionRow - Three-way projection comparison
 *
 * Displays [Left Book] | VIS Projection | [Right Book] in a
 * horizontal layout with color-coded edge indicators.
 * Book labels come from user's sportsbook preferences.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import { useUserPreferences } from '../../../../hooks/useUserPreferences';
import type { ProjectionComparison, StatType } from '../../types';

interface ProjectionRowProps {
  projection: ProjectionComparison;
  statType: StatType;
}

interface ProjectionItemProps {
  label: string;
  value: number | null;
  isHighlighted?: boolean;
  edgeValue?: number;
  delay?: number;
}

function ProjectionItem({ label, value, isHighlighted, edgeValue, delay = 0 }: ProjectionItemProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 200 }));
    opacity.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 200 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const edgeColor =
    edgeValue && edgeValue > 0
      ? colors.semantic.success
      : edgeValue && edgeValue < 0
      ? colors.semantic.danger
      : colors.text.muted;

  return (
    <Animated.View
      style={[
        styles.item,
        isHighlighted && styles.itemHighlighted,
        animatedStyle,
      ]}
    >
      <Text style={[styles.label, isHighlighted && styles.labelHighlighted]}>
        {label}
      </Text>
      <Text style={[styles.value, isHighlighted && styles.valueHighlighted]}>
        {value !== null ? value.toFixed(1) : '—'}
      </Text>
      {edgeValue !== undefined && edgeValue !== 0 && (
        <View style={[styles.edgeBadge, { backgroundColor: edgeColor + '20' }]}>
          <Text style={[styles.edgeText, { color: edgeColor }]}>
            {edgeValue > 0 ? '+' : ''}{edgeValue.toFixed(1)}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export function ProjectionRow({ projection, statType }: ProjectionRowProps) {
  const { leftBookLabel, rightBookLabel } = useUserPreferences();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ProjectionItem
          label={leftBookLabel}
          value={projection.prizePicksLine}
          delay={0}
        />
        <View style={styles.divider} />
        <ProjectionItem
          label="VIS"
          value={projection.visProjection}
          isHighlighted
          edgeValue={projection.edge}
          delay={100}
        />
        <View style={styles.divider} />
        <ProjectionItem
          label={projection.resolvedRightLabel ?? rightBookLabel}
          value={projection.draftKingsLine}
          delay={200}
        />
      </View>

      {/* Recommendation Badge */}
      <View style={styles.recommendationContainer}>
        <View
          style={[
            styles.recommendationBadge,
            {
              backgroundColor:
                projection.recommendation === 'OVER'
                  ? colors.semantic.success + '20'
                  : projection.recommendation === 'UNDER'
                  ? colors.semantic.danger + '20'
                  : colors.semantic.warning + '20',
              borderColor:
                projection.recommendation === 'OVER'
                  ? colors.semantic.success
                  : projection.recommendation === 'UNDER'
                  ? colors.semantic.danger
                  : colors.semantic.warning,
            },
          ]}
        >
          <Text
            style={[
              styles.recommendationText,
              {
                color:
                  projection.recommendation === 'OVER'
                    ? colors.semantic.success
                    : projection.recommendation === 'UNDER'
                    ? colors.semantic.danger
                    : colors.semantic.warning,
              },
            ]}
          >
            {projection.recommendation}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  itemHighlighted: {
    backgroundColor: colors.primary.main + '15',
    borderRadius: borderRadius.md,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  labelHighlighted: {
    color: colors.primary.main,
  },
  value: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  valueHighlighted: {
    color: colors.primary.main,
  },
  edgeBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  edgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  recommendationContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  recommendationBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  recommendationText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
});
