/**
 * Player Route Layout
 * Required for Expo Router to recognize the player/[id] dynamic route
 * Header is hidden - custom back button is in PlayerHeaderCard
 *
 * Uses smooth iOS-style slide animation for navigation.
 */

import { Stack } from 'expo-router';

export default function PlayerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#0A0A0B',
        },
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
