import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../theme';

interface BoardHeaderProps {
  onSearchPress?: () => void;
  onFilterPress?: () => void;
}

export function BoardHeader({ onSearchPress, onFilterPress }: BoardHeaderProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary + '80']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Left: Logo and subtitle */}
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/animations/visbets-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.logoGlow} />
            </View>
            <Text style={styles.subtitle}>Today's Slate</Text>
          </View>

          {/* Right: Action icons */}
          <View style={styles.rightSection}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={22} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={onFilterPress}
              activeOpacity={0.7}
            >
              <Ionicons name="options" size={22} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/subscription')}
              activeOpacity={0.7}
            >
              <Ionicons name="diamond" size={20} color={colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom divider with glow */}
        <View style={styles.divider} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
  },
  gradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  leftSection: {
    flex: 1,
  },
  logoContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  logo: {
    width: 110,
    height: 36,
  },
  logoGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
    opacity: 0.15,
    borderRadius: 8,
    transform: [{ scale: 1.2 }],
    zIndex: -1,
  },
  subtitle: {
    ...typography.presets.label,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.primary.main,
    marginTop: spacing.md,
    opacity: 0.3,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
