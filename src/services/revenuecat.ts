import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';
import type { CustomerInfo, PurchasesPackage, PurchasesOffering } from '@revenuecat/purchases-capacitor';

// RevenueCat API Keys - 실제 배포 시 환경변수로 관리
const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_ANDROID_KEY || '';
const REVENUECAT_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_IOS_KEY || '';

// Entitlement IDs
export const ENTITLEMENTS = {
  PRO: 'pro',
  PREMIUM: 'premium',
} as const;

// Product IDs (Play Store/App Store에서 설정한 것과 동일)
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
 * RevenueCat 초기화
 */
export async function initializeRevenueCat(): Promise<boolean> {
  if (isInitialized) return true;

  const platform = Capacitor.getPlatform();

  // Web에서는 RevenueCat 사용 불가
  if (platform === 'web') {
    console.log('RevenueCat is not available on web platform');
    return false;
  }

  const apiKey = platform === 'android' ? REVENUECAT_API_KEY_ANDROID : REVENUECAT_API_KEY_IOS;

  if (!apiKey) {
    console.warn('RevenueCat API key not configured');
    return false;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({
      apiKey,
    });
    isInitialized = true;
    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    return false;
  }
}

/**
 * 사용자 ID 설정 (로그인 시)
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat login error:', error);
    return null;
  }
}

/**
 * 사용자 로그아웃
 */
export async function logoutUser(): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logOut();
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat logout error:', error);
    return null;
  }
}

/**
 * 현재 구독 정보 가져오기
 */
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
    console.error('Failed to get subscription info:', error);
    return defaultInfo;
  }
}

/**
 * CustomerInfo를 SubscriptionInfo로 변환
 */
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
 * 구매 가능한 상품 목록 가져오기
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isInitialized) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
}

/**
 * 구독 구매
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<SubscriptionInfo | null> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return parseCustomerInfo(customerInfo);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled) {
      console.log('User cancelled purchase');
      return null;
    }
    console.error('Purchase error:', error);
    throw error;
  }
}

/**
 * 구독 복원
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
    console.error('Restore purchases error:', error);
    return defaultInfo;
  }
}

/**
 * 패키지 타입별 필터링
 */
export function filterPackagesByType(
  packages: PurchasesPackage[],
  type: PACKAGE_TYPE
): PurchasesPackage[] {
  return packages.filter((pkg) => pkg.packageType === type);
}

/**
 * 구독 관리 페이지 열기
 */
export async function openSubscriptionManagement(): Promise<void> {
  const platform = Capacitor.getPlatform();

  if (platform === 'android') {
    // Android: Google Play 구독 관리 페이지로 이동
    window.open('https://play.google.com/store/account/subscriptions', '_blank');
  } else if (platform === 'ios') {
    // iOS: 앱 설정의 구독 관리로 이동
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
  }
}
