/**
 * NeonButton Component
 * Styled button with neon glow effect
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/styles';
import { typography } from '../../theme/typography';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function NeonButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: NeonButtonProps) {
  const isDisabled = disabled || loading;

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.background.primary : colors.primary.main}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              sizeStyles[size].text,
              variant === 'primary' && styles.textPrimary,
              variant === 'secondary' && styles.textSecondary,
              variant === 'outline' && styles.textOutline,
              isDisabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (variant === 'primary' && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.container, sizeStyles[size].container, styles.glowPrimary, style]}
      >
        <LinearGradient
          colors={[colors.primary.main, colors.primary.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyles[size].container]}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        sizeStyles[size].container,
        variant === 'primary' && styles.primaryDisabled,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const sizeStyles = {
  sm: StyleSheet.create({
    container: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: typography.fontSize.sm,
    },
  }),
  md: StyleSheet.create({
    container: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: typography.fontSize.base,
    },
  }),
  lg: StyleSheet.create({
    container: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing['2xl'],
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: typography.fontSize.lg,
    },
  }),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  glowPrimary: {
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryDisabled: {
    backgroundColor: colors.text.disabled,
  },
  secondary: {
    backgroundColor: colors.background.tertiary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: typography.fontWeight.semibold as TextStyle['fontWeight'],
  },
  textPrimary: {
    color: colors.background.primary,
  },
  textSecondary: {
    color: colors.text.primary,
  },
  textOutline: {
    color: colors.primary.main,
  },
  textDisabled: {
    color: colors.text.muted,
  },
});
