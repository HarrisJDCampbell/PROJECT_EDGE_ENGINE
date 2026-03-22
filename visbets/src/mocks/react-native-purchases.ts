/**
 * Mock for react-native-purchases (RevenueCat)
 * Used in Expo Go / web where the native module isn't available
 */

export enum LOG_LEVEL {
  VERBOSE = 'VERBOSE', DEBUG = 'DEBUG', INFO = 'INFO', WARN = 'WARN', ERROR = 'ERROR',
}

export interface PurchasesPackage { identifier: string; product: any; }
export interface CustomerInfo { entitlements: { active: Record<string, any> }; activeSubscriptions: string[]; }
export interface PurchasesOfferings { current: any; all: Record<string, any>; }

const Purchases = {
  configure: (_config: any) => {},
  setLogLevel: (_level: LOG_LEVEL) => {},
  logIn: async (_userId: string) => ({ customerInfo: { entitlements: { active: {} }, activeSubscriptions: [], originalAppUserId: '' } }),
  logOut: async () => ({ customerInfo: { entitlements: { active: {} }, activeSubscriptions: [], originalAppUserId: '' } }),
  getOfferings: async () => ({ current: null, all: {} }),
  getCustomerInfo: async () => ({ entitlements: { active: {} }, activeSubscriptions: [], originalAppUserId: '' }),
  purchasePackage: async (_pkg: any) => { throw new Error('Purchases not available in Expo Go'); },
  restorePurchases: async () => ({ entitlements: { active: {} }, activeSubscriptions: [], originalAppUserId: '' }),
  addCustomerInfoUpdateListener: (_listener: (info: CustomerInfo) => void) => {},
  removeCustomerInfoUpdateListener: (_listener: (info: CustomerInfo) => void) => {},
  isConfigured: false,
};

export default Purchases;
