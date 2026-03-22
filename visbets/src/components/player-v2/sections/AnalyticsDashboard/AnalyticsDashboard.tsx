/**
 * AnalyticsDashboard - Tabbed analytics section
 *
 * Combines hit rate, momentum, and consistency
 * tabs with animated transitions and swipe navigation.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { TabBar } from './TabBar';
import { HitRateTab } from './tabs/HitRateTab';
import { MomentumTab } from './tabs/MomentumTab';
import { ConsistencyTab } from './tabs/ConsistencyTab';
import { LockedFeatureWrapper } from '../../../common/LockedFeatureWrapper';
import { colors } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/styles';
import type { AnalyticsDashboardProps, AnalyticsTab } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS: { key: AnalyticsTab; label: string }[] = [
  { key: 'hitRate', label: 'Hit Rate' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'consistency', label: 'Consistency' },
];

export function AnalyticsDashboard({
  data,
  statType,
  line,
  isPremium,
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('hitRate');
  const scrollRef = useRef<ScrollView>(null);

  const handleTabChange = useCallback((tab: AnalyticsTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setActiveTab(tab);
  }, []);

  // Swipe gesture for tab navigation
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      const { velocityX, translationX } = event;
      const currentIndex = TABS.findIndex((t) => t.key === activeTab);

      if (translationX < -50 || velocityX < -500) {
        // Swipe left - next tab
        if (currentIndex < TABS.length - 1) {
          const nextTab = TABS[currentIndex + 1].key;
          handleTabChange(nextTab);
        }
      } else if (translationX > 50 || velocityX > 500) {
        // Swipe right - previous tab
        if (currentIndex > 0) {
          const prevTab = TABS[currentIndex - 1].key;
          handleTabChange(prevTab);
        }
      }
    });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hitRate':
        return <HitRateTab data={data.hitRate} line={line} />;
      case 'momentum':
        return <MomentumTab data={data.momentum} />;
      case 'consistency':
        return <ConsistencyTab data={data.consistency} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.container}>
      <LockedFeatureWrapper
        requiredTier="starter"
        isLocked={!isPremium}
        featureName="Analytics Dashboard"
      >
        {/* Tab bar */}
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab content with swipe gesture */}
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.contentContainer}>{renderTabContent()}</View>
        </GestureDetector>
      </LockedFeatureWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.md,
    overflow: 'hidden',
  },
  contentContainer: {
    minHeight: 350,
  },
});
