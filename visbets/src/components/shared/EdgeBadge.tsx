/**
 * EdgeBadge Component
 * Badge showing edge value with color coding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/styles';
import { formatEdge } from '../../utils/formatters';

interface EdgeBadgeProps {
  edge: number;
  size?: 'sm' | 'md' | 'lg';
}

export function EdgeBadge({ edge, size = 'md' }: EdgeBadgeProps) {
  const color = getEdgeColor(edge);
  const sizeStyle = getSizeStyle(size);

  return (
    <View style={[styles.container, { backgroundColor: color + '20' }, sizeStyle.container]}>
      <Text style={[styles.text, { color }, sizeStyle.text]}>
        {formatEdge(edge)}
      </Text>
    </View>
  );
}

function getEdgeColor(edge: number): string {
  if (edge > 0) return colors.edge.positive;
  if (edge < 0) return colors.edge.negative;
  return colors.edge.neutral;
}

function getSizeStyle(size: EdgeBadgeProps['size']) {
  switch (size) {
    case 'sm':
      return {
        container: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
        text: { fontSize: typography.fontSize.xs },
      };
    case 'lg':
      return {
        container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
        text: { fontSize: typography.fontSize.xl },
      };
    default: // md
      return {
        container: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
        text: { fontSize: typography.fontSize.base },
      };
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.fontWeight.bold,
  },
});
