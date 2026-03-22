/**
 * UpgradePrompt
 * Shown when the backend returns a 403 upgrade_required error.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';

interface UpgradePromptProps {
  requiredTier: 'starter' | 'pro';
  featureName?: string;
}

export function UpgradePrompt({ requiredTier, featureName }: UpgradePromptProps) {
  const router = useRouter();
  const tierLabel = requiredTier === 'pro' ? 'VISMAX' : 'VisPlus';

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>{tierLabel} Feature</Text>
      <Text style={styles.body}>
        {featureName ? `${featureName} requires` : 'This feature requires'} a {tierLabel} subscription.
      </Text>
      <Pressable style={styles.button} onPress={() => router.push('/subscription')}>
        <Text style={styles.buttonText}>Upgrade to {tierLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
  },
  button: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#000000',
  },
});
