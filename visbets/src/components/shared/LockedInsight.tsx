/**
 * LockedInsight Component
 * Small locked chips for premium micro-insights
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';

interface LockedInsightProps {
  label: string;
  onPress?: () => void;
}

export function LockedInsight({ label, onPress }: LockedInsightProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/subscription');
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="lock-closed" size={10} color={colors.text.tertiary} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default + '40',
    opacity: 0.6,
  },
  label: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
});
