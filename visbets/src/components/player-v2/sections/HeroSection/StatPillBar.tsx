/**
 * StatPillBar - Horizontal stat type selector with haptic feedback
 *
 * A modern pill-style selector for switching between stat types.
 * Includes gesture support for swiping and haptic feedback on selection.
 */

import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { StatType } from '../../types';

interface StatPillBarProps {
  stats: StatType[];
  selected: StatType;
  onSelect: (stat: StatType) => void;
}

const STAT_LABELS: Record<StatType, string> = {
  PTS: 'Points',
  REB: 'Rebounds',
  AST: 'Assists',
  PRA: 'PRA',
  '3PM': '3PM',
  STL: 'Steals',
  BLK: 'Blocks',
  TO: 'Turnovers',
};

const STAT_SHORT_LABELS: Record<StatType, string> = {
  PTS: 'PTS',
  REB: 'REB',
  AST: 'AST',
  PRA: 'PRA',
  '3PM': '3PM',
  STL: 'STL',
  BLK: 'BLK',
  TO: 'TO',
};

function StatPill({
  stat,
  isSelected,
  onPress,
}: {
  stat: StatType;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  // Separate animated scale wrapper from TouchableOpacity
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.pill, isSelected && styles.pillSelected]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
          {STAT_SHORT_LABELS[stat]}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function StatPillBar({ stats, selected, onSelect }: StatPillBarProps) {
  const scrollRef = useRef<ScrollView>(null);

  const handleSelect = useCallback(
    (stat: StatType) => {
      onSelect(stat);
    },
    [onSelect]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        {stats.map((stat) => (
          <StatPill
            key={stat}
            stat={stat}
            isSelected={stat === selected}
            onPress={() => handleSelect(stat)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pillSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  pillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pillTextSelected: {
    color: colors.background.primary,
  },
});
