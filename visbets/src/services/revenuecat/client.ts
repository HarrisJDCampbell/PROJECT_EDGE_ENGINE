/**
 * RevenueCat client wrapper
 * Wraps react-native-purchases for type-safe usage throughout the app.
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

// ⚠️  DASHBOARD ACTION REQUIRED before purchases will work:
// RevenueCat → VisbetsProd → Product catalog → Offerings → default
// For each package, click "Attach" and link the App Store product:
//   $rc_monthly  → visplus_monthly
//   $rc_annual   → visplus_annual
//   pro_monthly  → vismax_monthly
//   pro_annual   → vismax_annual
// Until products are attached, getOfferings() returns packages with
// no product and all purchase attempts will silently fail.

let configured = false;

export function isRevenueCatConfigured(): boolean {
  return configured;
}

export async function initializeRevenueCat(userId?: string): Promise<void> {
  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) {
    if (__DEV__) console.warn('[RevenueCat] No API key — skipping initialization');
    return;
  }

  // Prevent duplicate Purchases.configure() calls — this can happen if
  // multiple store actions (initialize, syncWithUser) fire concurrently.
  if (configured) {
    if (__DEV__) console.log('[RevenueCat] Already configured — skipping');
    return;
  }

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  Purchases.configure({ apiKey, appUserID: userId ?? null });
  configured = true;

  if (__DEV__) console.log('[RevenueCat] Configured for user:', userId ?? 'anonymous');
}

export async function loginUser(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

export async function logoutUser(): Promise<void> {
  configured = false;
  await Purchases.logOut();
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.error('[RevenueCat] getOfferings error:', error);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error: any) {
    if (error?.userCancelled) return null;
    throw error;
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('[RevenueCat] getCustomerInfo error:', error);
    return null;
  }
}

export function addCustomerInfoListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
