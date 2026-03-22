/**
 * TabBar - Animated tab selector for analytics dashboard
 *
 * Horizontal tab bar with animated underline indicator
 * and swipe gesture support.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { AnalyticsTab } from '../../types';

interface TabBarProps {
  tabs: { key: AnalyticsTab; label: string }[];
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const tabWidth = (SCREEN_WIDTH - spacing.md * 2 - spacing.sm * 2) / tabs.length;
  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  const indicatorLeft = useSharedValue(activeIndex * tabWidth);

  React.useEffect(() => {
    indicatorLeft.value = withTiming(activeIndex * tabWidth, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeIndex, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorLeft.value }],
  }));

  const handleTabPress = (tab: AnalyticsTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onTabChange(tab);
  };

  return (
    <View style={styles.container}>
      {/* Tab buttons */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { width: tabWidth - spacing.md },
          indicatorStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.muted,
  },
  tabTextActive: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },
  indicator: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs + spacing.sm / 2,
    height: 3,
    backgroundColor: colors.primary.main,
    borderRadius: 1.5,
  },
});
