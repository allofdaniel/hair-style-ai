import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';
import type { CustomerInfo, PurchasesPackage, PurchasesOffering } from '@revenuecat/purchases-capacitor';
import { logger } from './logger';

const isDebug = import.meta.env.DEV || import.meta.env.MODE === 'test';
const REVENUECAT_LOG_LEVEL = isDebug ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN;

const debugLog = (...args: unknown[]): void => {
  if (isDebug) {
    logger.log(...args);
  }
};

const isUserCancelledError = (error: unknown): error is { userCancelled: boolean } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'userCancelled' in error &&
    typeof (error as { userCancelled?: unknown }).userCancelled === 'boolean'
  );
};

const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_ANDROID_KEY || '';
const REVENUECAT_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_IOS_KEY || '';

// Entitlement IDs
export const ENTITLEMENTS = {
  PRO: 'pro',
  PREMIUM: 'premium',
} as const;

// Product IDs (Play Store/App Store?먯꽌 ?ㅼ젙??寃껉낵 ?숈씪)
export const PRODUCTS = {
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
} as const;

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isActive: boolean;
  expirationDate: Date | null;
  willRenew: boolean;
  productId: string | null;
}

let isInitialized = false;

/**
 * RevenueCat 珥덇린?? */
export async function initializeRevenueCat(): Promise<boolean> {
  if (isInitialized) return true;

  const platform = Capacitor.getPlatform();

  // Web?먯꽌??RevenueCat ?ъ슜 遺덇?
  if (platform === 'web') {
    debugLog('RevenueCat is not available on web platform');
    return false;
  }

  const apiKey = platform === 'android' ? REVENUECAT_API_KEY_ANDROID : REVENUECAT_API_KEY_IOS;

  if (!apiKey) {
    logger.warn('RevenueCat API key not configured');
    return false;
  }

  try {
    await Purchases.setLogLevel({ level: REVENUECAT_LOG_LEVEL });
    await Purchases.configure({
      apiKey,
    });
    isInitialized = true;
    debugLog('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize RevenueCat:', error);
    return false;
  }
}

/**
 * ?ъ슜??ID ?ㅼ젙 (濡쒓렇????
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    return customerInfo;
  } catch (error) {
    logger.error('RevenueCat login error:', error);
    return null;
  }
}

/**
 * ?ъ슜??濡쒓렇?꾩썐
 */
export async function logoutUser(): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logOut();
    return customerInfo;
  } catch (error) {
    logger.error('RevenueCat logout error:', error);
    return null;
  }
}

/**
 * ?꾩옱 援щ룆 ?뺣낫 媛?몄삤湲? */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  const defaultInfo: SubscriptionInfo = {
    tier: 'free',
    isActive: false,
    expirationDate: null,
    willRenew: false,
    productId: null,
  };

  if (!isInitialized) return defaultInfo;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    logger.error('Failed to get subscription info:', error);
    return defaultInfo;
  }
}

/**
 * CustomerInfo瑜?SubscriptionInfo濡?蹂?? */
function parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionInfo {
  const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
  const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];

  if (premiumEntitlement) {
    return {
      tier: 'premium',
      isActive: true,
      expirationDate: premiumEntitlement.expirationDate
        ? new Date(premiumEntitlement.expirationDate)
        : null,
      willRenew: premiumEntitlement.willRenew,
      productId: premiumEntitlement.productIdentifier,
    };
  }

  if (proEntitlement) {
    return {
      tier: 'pro',
      isActive: true,
      expirationDate: proEntitlement.expirationDate
        ? new Date(proEntitlement.expirationDate)
        : null,
      willRenew: proEntitlement.willRenew,
      productId: proEntitlement.productIdentifier,
    };
  }

  return {
    tier: 'free',
    isActive: false,
    expirationDate: null,
    willRenew: false,
    productId: null,
  };
}

/**
 * 援щℓ 媛?ν븳 ?곹뭹 紐⑸줉 媛?몄삤湲? */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isInitialized) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (error) {
    logger.error('Failed to get offerings:', error);
    return null;
  }
}

/**
 * 援щ룆 援щℓ
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<SubscriptionInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return parseCustomerInfo(customerInfo);
  } catch (error: unknown) {
    if (isUserCancelledError(error) && error.userCancelled) {
      debugLog('User cancelled purchase');
      return null;
    }
    logger.error('Purchase error:', error);
    throw error;
  }
}

/**
 * 援щ룆 蹂듭썝
 */
export async function restorePurchases(): Promise<SubscriptionInfo> {
  const defaultInfo: SubscriptionInfo = {
    tier: 'free',
    isActive: false,
    expirationDate: null,
    willRenew: false,
    productId: null,
  };

  if (!isInitialized) return defaultInfo;

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    logger.error('Restore purchases error:', error);
    return defaultInfo;
  }
}

/**
 * ?⑦궎吏 ??낅퀎 ?꾪꽣留? */
export function filterPackagesByType(
  packages: PurchasesPackage[],
  type: PACKAGE_TYPE
): PurchasesPackage[] {
  return packages.filter((pkg) => pkg.packageType === type);
}

/**
 * 援щ룆 愿由??섏씠吏 ?닿린
 */
export async function openSubscriptionManagement(): Promise<void> {
  const platform = Capacitor.getPlatform();

  if (platform === 'android') {
    // Android: Google Play 援щ룆 愿由??섏씠吏濡??대룞
    window.open('https://play.google.com/store/account/subscriptions', '_blank');
  } else if (platform === 'ios') {
    // iOS: ???ㅼ젙??援щ룆 愿由щ줈 ?대룞
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
  }
}

