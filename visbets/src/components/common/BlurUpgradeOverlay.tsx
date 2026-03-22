/**
 * BlurUpgradeOverlay Component
 * Modern blur overlay for premium feature gating
 * Shows blurred content with upgrade CTA
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/styles';
const { width, height } = Dimensions.get('window');

interface BlurUpgradeOverlayProps {
  /** The tier required to access this feature */
  requiredTier: 'starter' | 'pro';
  /** Main headline */
  title?: string;
  /** Description text */
  description?: string;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Children to render behind the blur */
  children?: React.ReactNode;
  /** Whether to show as full screen overlay */
  fullScreen?: boolean;
}

export function BlurUpgradeOverlay({
  requiredTier,
  title,
  description,
  icon = 'diamond',
  children,
  fullScreen = false,
}: BlurUpgradeOverlayProps) {
  const router = useRouter();

  const tierName = requiredTier === 'pro' ? 'VISMAX' : 'VisPlus';
  const tierColor = requiredTier === 'pro' ? '#FFD700' : colors.primary.main;

  const defaultTitle = `Upgrade to ${tierName}`;
  const defaultDescription = requiredTier === 'pro'
    ? 'Unlock AI-powered parlay optimization, matchup analysis, and live alerts.'
    : 'Get advanced analytics, game logs, trend charts, and more.';

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      {/* Content behind blur */}
      {children && (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}

      {/* Blur overlay */}
      <BlurView intensity={25} tint="dark" style={styles.blurView}>
        <LinearGradient
          colors={['rgba(10, 10, 11, 0.7)', 'rgba(10, 10, 11, 0.9)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Upgrade CTA */}
        <View style={styles.ctaContainer}>
          {/* Icon with glow */}
          <View style={[styles.iconContainer, { shadowColor: tierColor }]}>
            <LinearGradient
              colors={[tierColor + '40', tierColor + '10']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name={icon} size={40} color={tierColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: tierColor }]}>
            {title || defaultTitle}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {description || defaultDescription}
          </Text>

          {/* Upgrade Button */}
          <TouchableOpacity
            style={[styles.upgradeButton, { borderColor: tierColor }]}
            onPress={() => router.push('/subscription')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[tierColor, tierColor + 'CC']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Image
              source={require('../../../assets/animations/visbets-logo.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
            <Text style={styles.upgradeButtonText}>Upgrade to {tierName}</Text>
          </TouchableOpacity>

          {/* Feature highlights */}
          <View style={styles.featureList}>
            {requiredTier === 'pro' ? (
              <>
                <FeatureItem icon="analytics" text="AI Optimized Predictions" color={tierColor} />
                <FeatureItem icon="trending-up" text="Edge Calculations vs. Book" color={tierColor} />
                <FeatureItem icon="shield-checkmark" text="Confidence Scoring" color={tierColor} />
              </>
            ) : (
              <>
                <FeatureItem icon="stats-chart" text="Advanced Analytics" color={tierColor} />
                <FeatureItem icon="time" text="Game Logs & History" color={tierColor} />
                <FeatureItem icon="trending-up" text="Trend Charts" color={tierColor} />
              </>
            )}
          </View>
        </View>
      </BlurView>
    </View>
  );
}

function FeatureItem({ icon, text, color }: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

/**
 * Compact blur overlay for inline use (e.g., when adding 3rd pick)
 */
export function CompactBlurOverlay({
  requiredTier,
  title,
  onUpgrade,
}: {
  requiredTier: 'starter' | 'pro';
  title: string;
  onUpgrade?: () => void;
}) {
  const router = useRouter();
  const tierName = requiredTier === 'pro' ? 'VISMAX' : 'VisPlus';
  const tierColor = requiredTier === 'pro' ? '#FFD700' : colors.primary.main;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription');
    }
  };

  return (
    <View style={styles.compactContainer}>
      <BlurView intensity={20} tint="dark" style={styles.compactBlur}>
        <LinearGradient
          colors={['rgba(10, 10, 11, 0.85)', 'rgba(10, 10, 11, 0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.compactContent}>
          <Ionicons name="lock-closed" size={24} color={tierColor} />
          <Text style={styles.compactTitle}>{title}</Text>
          <TouchableOpacity
            style={[styles.compactButton, { backgroundColor: tierColor }]}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <Text style={styles.compactButtonText}>Upgrade to {tierName}</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  contentContainer: {
    flex: 1,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    maxWidth: 340,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    minWidth: 220,
  },
  upgradeButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  featureList: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // Compact styles
  compactContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  compactBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  compactTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  compactButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  compactButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
});
