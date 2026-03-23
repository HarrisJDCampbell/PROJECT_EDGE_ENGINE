/**
 * Subscription Screen
 * Premium tier comparison and upgrade options with RevenueCat integration
 *
 * Modern, visually appealing design with smooth animations
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PurchasesPackage } from 'react-native-purchases';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { isRevenueCatConfigured } from '../src/services/revenuecat/client';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/styles';
import {
  SubscriptionTier,
  SUBSCRIPTION_FEATURES,
} from '../src/types/subscription';
import { analyticsService } from '../src/services/analytics/analyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated Pressable Button
function AnimatedButton({
  onPress,
  style,
  children,
  disabled = false,
}: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onPress();
  };

  return (
    <Animated.View style={[animatedStyle, disabled && { opacity: 0.6 }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          if (!disabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={style}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

interface TierConfig {
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradientColors: [string, string];
  popular?: boolean;
  features: string[];
}

const TIER_CONFIGS: TierConfig[] = [
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    tagline: 'Get started',
    icon: 'person-outline',
    color: colors.text.muted,
    gradientColors: [colors.background.secondary, colors.background.tertiary],
    features: SUBSCRIPTION_FEATURES[SubscriptionTier.FREE].features,
  },
  {
    tier: SubscriptionTier.STARTER,
    name: 'VisBets',
    tagline: 'For serious bettors',
    icon: 'star',
    color: colors.primary.main,
    gradientColors: [colors.primary.main + '15', colors.primary.main + '05'],
    popular: true,
    features: SUBSCRIPTION_FEATURES[SubscriptionTier.STARTER].features,
  },
  {
    tier: SubscriptionTier.PRO,
    name: 'VISMAX',
    tagline: 'Maximum edge',
    icon: 'diamond',
    color: '#FFD700',
    gradientColors: ['#FFD70015', '#FFD70005'],
    features: SUBSCRIPTION_FEATURES[SubscriptionTier.PRO].features,
  },
];

// Tier Card Component
function TierCard({
  config,
  isSelected,
  isCurrent,
  priceInfo,
  onSelect,
  index,
}: {
  config: TierConfig;
  isSelected: boolean;
  isCurrent: boolean;
  priceInfo: { price: string; period: string };
  onSelect: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onSelect();
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(200 + index * 100)}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
      >
        <View
          style={[
            styles.tierCard,
            isSelected && { borderColor: config.color, borderWidth: 2 },
            config.popular && !isSelected && styles.tierCardPopular,
          ]}
        >
          <LinearGradient
            colors={config.gradientColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Popular Badge */}
          {config.popular && (
            <View style={[styles.popularBadge, { backgroundColor: config.color }]}>
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.tierHeader}>
            <View style={[styles.tierIconContainer, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon} size={24} color={config.color} />
            </View>
            <View style={styles.tierInfo}>
              <Text style={[styles.tierName, { color: config.color }]}>{config.name}</Text>
              <Text style={styles.tierTagline}>{config.tagline}</Text>
            </View>
            <View style={[styles.radioOuter, isSelected && { borderColor: config.color }]}>
              {isSelected && (
                <View style={[styles.radioInner, { backgroundColor: config.color }]} />
              )}
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>{priceInfo.price}</Text>
            {priceInfo.period && (
              <Text style={styles.pricePeriod}>{priceInfo.period}</Text>
            )}
            {isCurrent && (
              <View style={[styles.currentPill, { backgroundColor: config.color + '20' }]}>
                <Text style={[styles.currentPillText, { color: config.color }]}>Current</Text>
              </View>
            )}
          </View>

          {/* Features Preview */}
          <View style={styles.featuresPreview}>
            {config.features.slice(0, 3).map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Ionicons name="checkmark" size={16} color={config.color} />
                <Text style={styles.featureText} numberOfLines={1}>{feature}</Text>
              </View>
            ))}
            {config.features.length > 3 && (
              <Text style={[styles.moreFeatures, { color: config.color }]}>
                +{config.features.length - 3} more features
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Feature Comparison Row
function FeatureComparisonRow({
  feature,
  free,
  starter,
  pro,
  comingSoon,
  index,
}: {
  feature: string;
  free: boolean;
  starter: boolean;
  pro: boolean;
  comingSoon?: boolean;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(600 + index * 50)}
      style={styles.comparisonRow}
    >
      <Text style={styles.comparisonFeature} numberOfLines={2}>{feature}</Text>
      <View style={styles.comparisonChecks}>
        <View style={styles.checkCell}>
          {free ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
          ) : (
            <Ionicons name="close-circle" size={20} color={colors.text.muted} />
          )}
        </View>
        <View style={styles.checkCell}>
          {starter ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary.main} />
          ) : (
            <Ionicons name="close-circle" size={20} color={colors.text.muted} />
          )}
        </View>
        <View style={styles.checkCell}>
          {pro && comingSoon ? (
            <View style={{ backgroundColor: '#FFD70022', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
              <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700' }}>SOON</Text>
            </View>
          ) : pro ? (
            <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
          ) : (
            <Ionicons name="close-circle" size={20} color={colors.text.muted} />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// Feature comparison data — must match actual entitlement gating
const FEATURE_COMPARISON = [
  // Free tier features
  { feature: 'Full prop board with book lines', free: true, starter: true, pro: true },
  { feature: 'Basic player stats', free: true, starter: true, pro: true },

  // Starter features (VisBets)
  { feature: 'VIS projections & edge calculations', free: false, starter: true, pro: true },
  { feature: 'Full game logs & trend charts', free: false, starter: true, pro: true },
  { feature: 'Hit rate & consistency metrics', free: false, starter: true, pro: true },
  { feature: 'Home/Away & rest day splits', free: false, starter: true, pro: true },
  { feature: 'AI-curated parlay combinations', free: false, starter: true, pro: true },
  { feature: 'Push notifications', free: false, starter: true, pro: true },

  // Pro-exclusive features (VISMAX)
  { feature: 'Situational splits & radar chart', free: false, starter: false, pro: true },
  { feature: 'Multi-book odds comparison', free: false, starter: false, pro: true },
  { feature: 'Line shopping for best value', free: false, starter: false, pro: true },
  { feature: 'Priority support', free: false, starter: false, pro: true },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const {
    tier: currentTier,
    isActive,
    expiresAt,
    packages,
    isLoading,
    isPurchasing,
    isRestoring,
    error,
    initialize,
    purchase,
    restore,
    setTier,
  } = useSubscriptionStore();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentTier);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    // Only re-initialize if we don't have packages yet
    if (packages.length === 0) {
      initialize();
    }
  }, []);

  // Map tier + billing period → RevenueCat package identifier
  const PACKAGE_ID_MAP: Record<SubscriptionTier, Record<'monthly' | 'yearly', string>> = {
    [SubscriptionTier.STARTER]: { monthly: '$rc_monthly', yearly: '$rc_annual' },
    [SubscriptionTier.PRO]: { monthly: 'pro_monthly', yearly: 'pro_annual' },
    [SubscriptionTier.FREE]: { monthly: '', yearly: '' },
  };

  const getPackageForTier = (tier: SubscriptionTier): PurchasesPackage | undefined => {
    const targetId = PACKAGE_ID_MAP[tier]?.[billingPeriod];
    if (!targetId) return undefined;
    return packages.find((pkg) => pkg.identifier === targetId);
  };

  const getDisplayPrice = (tier: SubscriptionTier): { price: string; period: string } => {
    if (tier === SubscriptionTier.FREE) {
      return { price: '$0', period: 'forever' };
    }

    const pkg = getPackageForTier(tier);
    if (pkg) {
      return {
        price: pkg.product.priceString,
        period: billingPeriod === 'monthly' ? '/mo' : '/yr',
      };
    }

    const features = SUBSCRIPTION_FEATURES[tier];
    if ('monthlyPrice' in features) {
      return {
        price: billingPeriod === 'monthly' ? features.monthlyPrice : features.annualPrice,
        period: billingPeriod === 'monthly' ? '/mo' : '/yr',
      };
    }

    return { price: '—', period: '' };
  };

  const handlePurchase = async () => {
    if (selectedTier === SubscriptionTier.FREE) {
      Alert.alert(
        'Downgrade to Free',
        'To downgrade, please cancel your subscription through your App Store or Google Play settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    const pkg = getPackageForTier(selectedTier);
    if (!pkg) {
      const isConfigured = isRevenueCatConfigured();

      if (!isConfigured) {
        Alert.alert(
          'Setup Required',
          'In-app purchases are not available. Please ensure RevenueCat API keys are configured.',
          [{ text: 'OK' }]
        );
      } else if (packages.length === 0) {
        Alert.alert(
          'Unavailable',
          'Subscription packages are currently unavailable. Please try again later.',
          [{ text: 'OK' }]
        );
      } else if (__DEV__) {
        Alert.alert(
          'Development Mode',
          `Set ${selectedTier} tier for testing?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set Tier',
              onPress: () => {
                setTier(selectedTier);
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert('Not Available', 'This package is not available.', [{ text: 'OK' }]);
      }
      return;
    }

    analyticsService.track('Purchase Started', { tier: selectedTier, billing: billingPeriod });
    const success = await purchase(pkg);
    if (success) {
      analyticsService.track('Purchase Completed', { tier: selectedTier, billing: billingPeriod });
      Alert.alert('Success', 'Your subscription is now active!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      analyticsService.track('Purchase Cancelled', { tier: selectedTier });
    }
  };

  const handleRestore = async () => {
    analyticsService.track('Restore Purchases Tapped');
    const success = await restore();
    if (success) {
      analyticsService.track('Restore Purchases Completed');
      Alert.alert('Restored', 'Your purchases have been restored.', [{ text: 'OK' }]);
    } else {
      analyticsService.track('Restore Purchases No Results');
      Alert.alert('No Purchases', 'No previous purchases found.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <AnimatedButton onPress={() => router.back()} style={styles.closeButton}>
            <View style={styles.closeButtonInner}>
              <Ionicons name="close" size={20} color={colors.text.primary} />
            </View>
          </AnimatedButton>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.hero}>
          <Image
            source={require('../assets/animations/visbets-logo.png')}
            style={{ width: 80, height: 80, marginBottom: spacing.md }}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Unlock Your Edge</Text>
          <Text style={styles.heroSubtitle}>
            Get advanced analytics and AI-powered insights
          </Text>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.duration(400).delay(150)} style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>Multiple</Text>
            <Text style={styles.statLabel}>Data Sources</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>Multi-Factor</Text>
            <Text style={styles.statLabel}>Projection Model</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>Live</Text>
            <Text style={styles.statLabel}>Updates</Text>
          </View>
        </Animated.View>

        {/* Billing Toggle */}
        <Animated.View entering={FadeInUp.duration(400).delay(180)} style={styles.billingToggleContainer}>
          <View style={styles.billingToggle}>
            <AnimatedButton
              onPress={() => setBillingPeriod('monthly')}
              style={[
                styles.billingOption,
                billingPeriod === 'monthly' && styles.billingOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.billingOptionText,
                  billingPeriod === 'monthly' && styles.billingOptionTextActive,
                ]}
              >
                Monthly
              </Text>
            </AnimatedButton>
            <AnimatedButton
              onPress={() => setBillingPeriod('yearly')}
              style={[
                styles.billingOption,
                billingPeriod === 'yearly' && styles.billingOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.billingOptionText,
                  billingPeriod === 'yearly' && styles.billingOptionTextActive,
                ]}
              >
                Yearly
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 33%</Text>
              </View>
            </AnimatedButton>
          </View>
        </Animated.View>

        {/* Error Display */}
        {error && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.errorBanner}>
            <Ionicons name="warning" size={18} color={colors.semantic.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Tier Cards */}
        <View style={styles.tierCardsContainer}>
          {TIER_CONFIGS.map((config, index) => (
            <TierCard
              key={config.tier}
              config={config}
              isSelected={selectedTier === config.tier}
              isCurrent={currentTier === config.tier && isActive}
              priceInfo={getDisplayPrice(config.tier)}
              onSelect={() => setSelectedTier(config.tier)}
              index={index}
            />
          ))}
        </View>

        {/* Info banner — shown when packages aren't available */}
        {packages.length === 0 && !isLoading && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.retryContainer}>
            <Text style={styles.retryMessage}>
              In-app purchases are currently restricted in this build.
            </Text>
            <AnimatedButton
              onPress={() => initialize()}
              style={styles.retryLoadButton}
            >
              <Ionicons name="refresh" size={16} color={colors.primary.main} />
              <Text style={styles.retryLoadButtonText}>Retry</Text>
            </AnimatedButton>
          </Animated.View>
        )}

        {/* Subscribe Button */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)}>
          <AnimatedButton
            onPress={handlePurchase}
            disabled={selectedTier === currentTier || isPurchasing}
            style={styles.subscribeButton}
          >
            <LinearGradient
              colors={
                selectedTier === currentTier
                  ? [colors.background.tertiary, colors.background.tertiary]
                  : selectedTier === SubscriptionTier.PRO
                    ? ['#FFD700', '#FFA500']
                    : [colors.primary.main, colors.primary.light]
              }
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {isPurchasing ? (
              <ActivityIndicator size="small" color={colors.background.primary} />
            ) : (
              <>
                {selectedTier === currentTier ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.text.muted} />
                ) : (
                  <Image
                    source={require('../assets/animations/visbets-logo.png')}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                )}
                <Text
                  style={[
                    styles.subscribeButtonText,
                    selectedTier === currentTier && styles.subscribeButtonTextDisabled,
                  ]}
                >
                  {selectedTier === currentTier
                    ? 'Current Plan'
                    : selectedTier === SubscriptionTier.FREE
                      ? 'Downgrade'
                      : `Get ${TIER_CONFIGS.find((t) => t.tier === selectedTier)?.name}`}
                </Text>
              </>
            )}
          </AnimatedButton>
        </Animated.View>

        {/* Restore */}
        <Animated.View entering={FadeIn.duration(300).delay(550)}>
          <AnimatedButton onPress={handleRestore} disabled={isRestoring} style={styles.restoreButton}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.text.secondary} />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </AnimatedButton>
        </Animated.View>

        {/* Subscription Status */}
        {isActive && expiresAt && (
          <Animated.View entering={FadeIn.duration(300).delay(600)} style={styles.statusInfo}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
            <Text style={styles.statusText}>
              Renews {new Date(expiresAt).toLocaleDateString()}
            </Text>
          </Animated.View>
        )}

        {/* Feature Comparison */}
        <Animated.View entering={FadeInUp.duration(400).delay(650)} style={styles.comparisonSection}>
          <Text style={styles.comparisonSectionTitle}>Feature Comparison</Text>
          <View style={styles.comparisonContainer}>
            {/* Header */}
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonHeaderFeature}>Feature</Text>
              <View style={styles.comparisonHeaderTiers}>
                <Text style={[styles.comparisonHeaderTier, { color: colors.text.muted }]}>Free</Text>
                <Text style={[styles.comparisonHeaderTier, { color: colors.primary.main }]}>VisBets</Text>
                <Text style={[styles.comparisonHeaderTier, { color: '#FFD700' }]}>VISMAX</Text>
              </View>
            </View>
            {FEATURE_COMPARISON.map((item, index) => (
              <FeatureComparisonRow
                key={index}
                feature={item.feature}
                free={item.free}
                starter={item.starter}
                pro={item.pro}
                index={index}
              />
            ))}
          </View>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View entering={FadeIn.duration(300).delay(700)}>
          <Text style={styles.disclaimer}>
            {`If a free trial is offered, any unused portion will be forfeited when the user purchases a subscription. Subscriptions automatically renew at the end of each billing period unless cancelled at least 24 hours before the renewal date. Payment will be charged to your ${Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account at purchase confirmation.\n\nTo cancel, go to your ${Platform.OS === 'ios' ? 'iPhone Settings → Apple ID → Subscriptions' : 'Google Play → Subscriptions'}. Cancellation takes effect at the end of the current period.`}
          </Text>
          <View style={styles.legalLinks}>
            <Pressable onPress={() => router.push('/terms-of-service')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.legalSeparator}> · </Text>
            <Pressable onPress={() => router.push('/privacy-policy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.xl,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary.main + '30',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.md,
  },

  // Billing Toggle
  billingToggleContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary.main + '30',
    gap: spacing.xs,
  },
  billingOption: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  billingOptionActive: {
    backgroundColor: colors.primary.main + '20',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  billingOptionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.muted,
  },
  billingOptionTextActive: {
    color: colors.primary.main,
  },
  saveBadge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.md,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.semantic.danger + '15',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.semantic.danger + '30',
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.semantic.danger,
  },

  // Tier Cards
  tierCardsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tierCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  tierCardPopular: {
    borderColor: colors.primary.main + '50',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: borderRadius.md,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
    letterSpacing: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tierName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  tierTagline: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text.primary,
  },
  pricePeriod: {
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
  },
  currentPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  currentPillText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  featuresPreview: {
    gap: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  moreFeatures: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },

  // Subscribe Button
  subscribeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  subscribeButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.primary,
  },
  subscribeButtonTextDisabled: {
    color: colors.text.muted,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  restoreButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },

  // Status
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },

  // Comparison Section
  comparisonSection: {
    marginTop: spacing.xl,
  },
  comparisonSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // Comparison Table
  comparisonContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  comparisonHeaderFeature: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  comparisonHeaderTiers: {
    flexDirection: 'row',
    width: 150,
  },
  comparisonHeaderTier: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default + '50',
  },
  comparisonFeature: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  comparisonChecks: {
    flexDirection: 'row',
    width: 150,
  },
  checkCell: {
    flex: 1,
    alignItems: 'center',
  },

  // Retry
  retryContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  retryMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryLoadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  retryLoadButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },

  // Disclaimer
  disclaimer: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  legalLink: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    textDecorationLine: 'underline' as const,
  },
  legalSeparator: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});
