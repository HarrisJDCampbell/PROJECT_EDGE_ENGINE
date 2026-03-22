/**
 * RiskIndicator Component
 * Small icon badges for risk factors (minutes, injury, matchup)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/styles';

type RiskType = 'minutes' | 'injury' | 'matchup';
type RiskLevel = 'Low' | 'Medium' | 'High';

interface RiskIndicatorProps {
  type: RiskType;
  level?: RiskLevel;
  label?: string;
}

export function RiskIndicator({ type, level = 'Medium', label }: RiskIndicatorProps) {
  const icon = getRiskIcon(type);
  const color = getRiskColor(level);
  const displayLabel = label || level;

  return (
    <View style={[styles.container, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.icon, { color }]}>{icon}</Text>
      <Text style={[styles.label, { color }]}>{displayLabel}</Text>
    </View>
  );
}

function getRiskIcon(type: RiskType): string {
  switch (type) {
    case 'minutes':
      return '⏱️';
    case 'injury':
      return '🏥';
    case 'matchup':
      return '⚔️';
    default:
      return '⚠️';
  }
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'High':
      return colors.risk.high;
    case 'Medium':
      return colors.risk.medium;
    case 'Low':
      return colors.risk.low;
    default:
      return colors.risk.medium;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  icon: {
    fontSize: typography.fontSize.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
});
