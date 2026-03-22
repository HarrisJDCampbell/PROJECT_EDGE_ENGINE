/**
 * DistributionSection — Standalone stat distribution card
 * Extracted from AnalyticsDashboard tabs.
 * Gated for VisPlus (starter) tier.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DistributionTab } from './AnalyticsDashboard/tabs/DistributionTab';
import { LockedFeatureWrapper } from '../../common/LockedFeatureWrapper';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme/styles';
import type { DistributionData } from '../types';

interface DistributionSectionProps {
  data: DistributionData;
  line: number;
  isPremium: boolean;
}

export function DistributionSection({ data, line, isPremium }: DistributionSectionProps) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.container}>
      <LockedFeatureWrapper
        requiredTier="starter"
        isLocked={!isPremium}
        featureName="Distribution Analysis"
      >
        <DistributionTab data={data} line={line} />
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
    overflow: 'hidden',
  },
});
