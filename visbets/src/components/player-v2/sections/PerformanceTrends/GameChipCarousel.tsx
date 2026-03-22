/**
 * GameChipCarousel - Horizontal scrollable game chips
 *
 * Displays recent games as small chips with opponent,
 * value, and over/under indicator.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { GameChipData } from '../../types';

interface GameChipCarouselProps {
  games: GameChipData[];
  onChipPress?: (game: GameChipData, index: number) => void;
}

function GameChip({
  game,
  index,
  onPress,
}: {
  game: GameChipData;
  index: number;
  onPress?: () => void;
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
    onPress?.();
  };

  const chipColor = game.isOver ? colors.semantic.success : colors.semantic.danger;
  const chipBgColor = game.isOver ? colors.semantic.success + '15' : colors.semantic.danger + '15';

  // Format date to show just month/day
  const formattedDate = game.date
    ? new Date(game.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    : '';

  // Separate entering animation (wrapper) from interactive transform (inner)
  return (
    <Animated.View entering={FadeInRight.duration(300).delay(index * 50)}>
      <Animated.View style={animatedStyle}>
        <Pressable
          style={[
            styles.chip,
            { backgroundColor: chipBgColor, borderColor: chipColor + '40' },
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Opponent */}
          <Text style={styles.opponentText}>
            {game.isHome ? 'vs' : '@'} {game.opponent}
          </Text>

          {/* Value */}
          <Text style={[styles.valueText, { color: chipColor }]}>
            {game.value.toFixed(0)}
          </Text>

          {/* Over/Under indicator */}
          <View style={[styles.indicator, { backgroundColor: chipColor }]}>
            <Text style={styles.indicatorText}>{game.isOver ? 'O' : 'U'}</Text>
          </View>

          {/* Date (optional) */}
          {formattedDate && <Text style={styles.dateText}>{formattedDate}</Text>}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export function GameChipCarousel({ games, onChipPress }: GameChipCarouselProps) {
  if (games.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Recent Games</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces
      >
        {games.map((game, index) => (
          <GameChip
            key={`${game.opponent}-${index}`}
            game={game}
            index={index}
            onPress={() => onChipPress?.(game, index)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  opponentText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  valueText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginVertical: spacing.xs,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  dateText: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
