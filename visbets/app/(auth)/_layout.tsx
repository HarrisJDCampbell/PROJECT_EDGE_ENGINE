/**
 * Auth Layout
 * Stack navigator for authentication screens
 */

import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="phone-verify" />
      <Stack.Screen name="email-verify" />
    </Stack>
  );
}
