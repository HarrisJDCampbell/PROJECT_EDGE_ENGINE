/**
 * PlayerAvatar - Player image with glow effect
 *
 * Displays the player's headshot with a color-coded glow
 * based on the projection recommendation.
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../../theme/colors';

interface PlayerAvatarProps {
  imageUrl: string | null;
  recommendation: 'OVER' | 'UNDER' | 'AVOID';
  size?: number;
}

const DEFAULT_PLAYER_IMAGE = 'https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png';

export function PlayerAvatar({ imageUrl, recommendation, size = 120 }: PlayerAvatarProps) {
  // Color based on recommendation
  const glowColor =
    recommendation === 'OVER'
      ? colors.semantic.success
      : recommendation === 'UNDER'
      ? colors.semantic.danger
      : colors.semantic.warning;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow effect */}
      <View
        style={[
          styles.glow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: glowColor + '30',
            shadowColor: glowColor,
          },
        ]}
      />

      {/* Image container with border */}
      <View
        style={[
          styles.imageContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: glowColor + '60',
          },
        ]}
      >
        <Image
          source={{ uri: imageUrl || DEFAULT_PLAYER_IMAGE }}
          style={[styles.image, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
          contentFit="cover"
          transition={200}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  imageContainer: {
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
  },
  image: {
    backgroundColor: colors.background.secondary,
  },
});
