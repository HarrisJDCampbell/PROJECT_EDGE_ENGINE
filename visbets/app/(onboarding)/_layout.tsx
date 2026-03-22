/**
 * Onboarding Layout
 * Stack navigator for onboarding flow
 */

import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="username" />
      <Stack.Screen name="sportsbooks" />
      <Stack.Screen name="sports" />
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
