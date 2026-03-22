/**
 * Subscription Types
 * Defines subscription tiers and entitlements for VisBets
 *
 * Tiers:
 * - FREE: Basic access, limited features
 * - STARTER ($10/mo or $80/yr): Advanced stats, game logs, splits, odds
 * - PRO ($25/mo or $200/yr): Everything + situational splits, odds comparison, line shopping
 */

export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
}

export interface SubscriptionProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceNumber: number;
  period: 'monthly' | 'annual';
  tier: SubscriptionTier;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  productId: string | null;
}

/**
 * Feature entitlements by subscription tier
 * These map directly to gated features in the app
 */
export interface Entitlements {
  // Free tier features (everyone gets these)
  basicStats: boolean;

  // Starter tier features (VisBets — $10/mo)
  advancedStats: boolean;
  gameLogs: boolean;
  trendCharts: boolean;
  advancedSplits: boolean;
  noAds: boolean;
  oddsComparison: boolean;
  leagueRankings: boolean;
  teamContext: boolean;
  pushNotifications: boolean;
  projections: boolean;
  edgeCalculations: boolean;
  parlayOptimizer: boolean;

  // Pro-exclusive features (VISMAX — $25/mo)
  // These correspond to PlayerDetailScreen sections gated behind isPro()
  proSplitsMatchups: boolean;
  proOddsComparison: boolean;
  proLineShopping: boolean;
  prioritySupport: boolean;
}

// Map subscription tiers to entitlements
export const TIER_ENTITLEMENTS: Record<SubscriptionTier, Entitlements> = {
  [SubscriptionTier.FREE]: {
    basicStats: true,
    advancedStats: false,
    gameLogs: false,
    trendCharts: false,
    advancedSplits: false,
    noAds: false,
    oddsComparison: false,
    leagueRankings: false,
    teamContext: false,
    pushNotifications: false,
    projections: false,
    edgeCalculations: false,
    parlayOptimizer: false,
    proSplitsMatchups: false,
    proOddsComparison: false,
    proLineShopping: false,
    prioritySupport: false,
  },
  [SubscriptionTier.STARTER]: {
    basicStats: true,
    advancedStats: true,
    gameLogs: true,
    trendCharts: true,
    advancedSplits: true,
    noAds: true,
    oddsComparison: true,
    leagueRankings: true,
    teamContext: true,
    pushNotifications: true,
    projections: true,
    edgeCalculations: true,
    parlayOptimizer: true,
    proSplitsMatchups: false,
    proOddsComparison: false,
    proLineShopping: false,
    prioritySupport: false,
  },
  [SubscriptionTier.PRO]: {
    basicStats: true,
    advancedStats: true,
    gameLogs: true,
    trendCharts: true,
    advancedSplits: true,
    noAds: true,
    oddsComparison: true,
    leagueRankings: true,
    teamContext: true,
    pushNotifications: true,
    projections: true,
    edgeCalculations: true,
    parlayOptimizer: true,
    proSplitsMatchups: true,
    proOddsComparison: true,
    proLineShopping: true,
    prioritySupport: true,
  },
};

// RevenueCat configuration
export const REVENUECAT_CONFIG = {
  IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',

  // Entitlement identifiers — must match RevenueCat dashboard exactly
  ENTITLEMENTS: {
    STARTER: 'starter',
    PRO: 'pro',
  },

  // App Store Connect / Google Play product IDs — for dashboard reference only.
  // The subscription screen uses RevenueCat package identifiers ($rc_monthly, etc.)
  // to find packages, not these product IDs.
  PRODUCTS: {
    STARTER_MONTHLY: 'visplus_monthly',
    STARTER_ANNUAL: 'visplus_annual',
    PRO_MONTHLY: 'vismax_monthly',
    PRO_ANNUAL: 'vismax_annual',
  },
};

// Subscription features for marketing/display
// Prices shown here are fallbacks only — RevenueCat package priceString is authoritative
export const SUBSCRIPTION_FEATURES = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: '$0',
    features: [
      'Full daily prop board',
      'Book lines from major sportsbooks',
      'Basic player statistics',
    ],
  },
  [SubscriptionTier.STARTER]: {
    name: 'VisBets',
    monthlyPrice: '$10/mo',
    annualPrice: '$80/yr',
    features: [
      'All props, full player detail',
      'Sportsbook odds comparison',
      'League rankings & percentiles',
      'Team standings context',
      'Game logs & split analysis',
      'Trend charts & visualizations',
      'Push notifications (daily slate)',
      'Ad-free experience',
    ],
  },
  [SubscriptionTier.PRO]: {
    name: 'VISMAX',
    monthlyPrice: '$25/mo',
    annualPrice: '$200/yr',
    features: [
      'Everything in VisBets',
      'Situational splits & radar chart',
      'Multi-book odds comparison',
      'Line shopping for best value',
      'Priority support',
    ],
  },
};
