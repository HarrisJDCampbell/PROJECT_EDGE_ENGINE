/**
 * Tab Navigator Layout
 * Bottom tab navigation for main app screens
 *
 * Tabs:
 * 1. Board - Main player props grid
 * 2. Parlays - Curated parlay suggestions
 * 3. V - Custom parlay builder with analysis
 * 4. Profile - User settings and stats
 */

import React, { useEffect } from 'react';
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../../src/theme/colors';
import { analyticsService } from '../../src/services/analytics/analyticsService';

/**
 * Custom V logo component for the builder tab
 */
function VLogo({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.vContainer, focused && styles.vContainerFocused]}>
      <Image
        source={require('../../assets/animations/visbets-logo.png')}
        style={styles.vLogoImage}
        resizeMode="contain"
      />
    </View>
  );
}

const TAB_NAMES: Record<string, string> = {
  index: 'Board',
  parlays: 'Parlays',
  builder: 'Builder',
  profile: 'Profile',
};

export default function TabLayout() {
  const segments = useSegments();

  useEffect(() => {
    const tab = segments[segments.length - 1] ?? 'index';
    const screenName = TAB_NAMES[tab] ?? tab;
    analyticsService.screen(screenName);
  }, [segments.join('/')]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Board',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parlays"
        options={{
          title: 'Parlays',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="builder"
        options={{
          title: 'Builder',
          tabBarIcon: ({ focused }) => <VLogo focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  vContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.text.muted,
  },
  vContainerFocused: {
    backgroundColor: colors.primary.main + '20',
    borderColor: colors.primary.main,
  },
  vLogoImage: {
    width: 22,
    height: 22,
  },
});
