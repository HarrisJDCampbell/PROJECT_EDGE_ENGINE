/**
 * 404 Not Found Screen
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, usePathname, useLocalSearchParams } from 'expo-router';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/styles';

export default function NotFoundScreen() {
  const pathname = usePathname();
  const params = useLocalSearchParams();

  // Debug: Log what route was attempted
  useEffect(() => {
    console.log('[404 NOT FOUND] Attempted pathname:', pathname);
    console.log('[404 NOT FOUND] Params:', JSON.stringify(params));
  }, [pathname, params]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏀</Text>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page not found</Text>
      {__DEV__ && <Text style={styles.debug}>Attempted: {pathname}</Text>}
      <Link href="/" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Go to Board</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  icon: {
    fontSize: typography.fontSize['5xl'],
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  debug: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.danger,
    marginBottom: spacing.lg,
    fontFamily: 'monospace',
  },
});
