/**
 * AdMob 광고 서비스
 * - 배너 광고, 전면 광고, 보상형 광고 지원
 * - 테스트 모드 및 실제 광고 ID 관리
 */

import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions, AdOptions, RewardAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

import { logger } from './logger';
// 광고 단위 ID (테스트 ID - 프로덕션 시 실제 ID로 교체)
const AD_UNITS = {
  // 테스트 광고 ID
  test: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  // 프로덕션 광고 ID (AdMob 콘솔에서 생성 후 입력)
  production: {
    banner: import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
    interstitial: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',
    rewarded: import.meta.env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917',
  },
};

// 개발 모드 여부
const IS_DEV = import.meta.env.DEV || import.meta.env.VITE_AD_TEST_MODE === 'true';

class AdMobService {
  private initialized = false;
  private interstitialLoaded = false;
  private rewardedLoaded = false;

  /**
   * AdMob 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!Capacitor.isNativePlatform()) {
      logger.log('[AdMob] 웹에서는 AdMob을 사용할 수 없습니다.');
      return;
    }

    try {
      await AdMob.initialize({
        testingDevices: IS_DEV ? ['YOUR_TEST_DEVICE_ID'] : [],
        initializeForTesting: IS_DEV,
      });
      this.initialized = true;
      logger.log('[AdMob] 초기화 완료');

      // 전면 광고 및 보상형 광고 사전 로드
      this.preloadInterstitial();
      this.preloadRewarded();
    } catch (error) {
      logger.error('[AdMob] 초기화 실패:', error);
    }
  }

  /**
   * 광고 단위 ID 가져오기
   */
  private getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded'): string {
    const units = IS_DEV ? AD_UNITS.test : AD_UNITS.production;
    return units[type];
  }

  /**
   * 배너 광고 표시
   */
  async showBanner(position: 'top' | 'bottom' = 'bottom'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const options: BannerAdOptions = {
        adId: this.getAdUnitId('banner'),
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: IS_DEV,
      };

      await AdMob.showBanner(options);
      logger.log('[AdMob] 배너 광고 표시');
    } catch (error) {
      logger.error('[AdMob] 배너 광고 표시 실패:', error);
    }
  }

  /**
   * 배너 광고 숨기기
   */
  async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.hideBanner();
      logger.log('[AdMob] 배너 광고 숨김');
    } catch (error) {
      logger.error('[AdMob] 배너 광고 숨기기 실패:', error);
    }
  }

  /**
   * 배너 광고 제거
   */
  async removeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.removeBanner();
      logger.log('[AdMob] 배너 광고 제거');
    } catch (error) {
      logger.error('[AdMob] 배너 광고 제거 실패:', error);
    }
  }

  /**
   * 전면 광고 사전 로드
   */
  async preloadInterstitial(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const options: AdOptions = {
        adId: this.getAdUnitId('interstitial'),
        isTesting: IS_DEV,
      };

      await AdMob.prepareInterstitial(options);
      this.interstitialLoaded = true;
      logger.log('[AdMob] 전면 광고 로드 완료');
    } catch (error) {
      logger.error('[AdMob] 전면 광고 로드 실패:', error);
      this.interstitialLoaded = false;
    }
  }

  /**
   * 전면 광고 표시
   */
  async showInterstitial(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    if (!this.interstitialLoaded) {
      await this.preloadInterstitial();
      if (!this.interstitialLoaded) return false;
    }

    try {
      await AdMob.showInterstitial();
      this.interstitialLoaded = false;
      logger.log('[AdMob] 전면 광고 표시');

      // 다음 광고 사전 로드
      setTimeout(() => this.preloadInterstitial(), 1000);
      return true;
    } catch (error) {
      logger.error('[AdMob] 전면 광고 표시 실패:', error);
      this.interstitialLoaded = false;
      return false;
    }
  }

  /**
   * 보상형 광고 사전 로드
   */
  async preloadRewarded(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const options: RewardAdOptions = {
        adId: this.getAdUnitId('rewarded'),
        isTesting: IS_DEV,
      };

      await AdMob.prepareRewardVideoAd(options);
      this.rewardedLoaded = true;
      logger.log('[AdMob] 보상형 광고 로드 완료');
    } catch (error) {
      logger.error('[AdMob] 보상형 광고 로드 실패:', error);
      this.rewardedLoaded = false;
    }
  }

  /**
   * 보상형 광고 표시 (크레딧 획득용)
   * @returns 보상 획득 여부
   */
  async showRewarded(): Promise<AdMobRewardItem | null> {
    if (!Capacitor.isNativePlatform()) {
      // 웹에서는 테스트용으로 바로 보상 제공
      return { type: 'credit', amount: 1 };
    }

    if (!this.rewardedLoaded) {
      await this.preloadRewarded();
      if (!this.rewardedLoaded) return null;
    }

    try {
      const result = await AdMob.showRewardVideoAd();
      this.rewardedLoaded = false;
      logger.log('[AdMob] 보상형 광고 완료:', result);

      // 다음 광고 사전 로드
      setTimeout(() => this.preloadRewarded(), 1000);

      // result 자체가 reward item
      return result || { type: 'credit', amount: 1 };
    } catch (error) {
      logger.error('[AdMob] 보상형 광고 표시 실패:', error);
      this.rewardedLoaded = false;
      return null;
    }
  }

  /**
   * 전면 광고 준비 여부
   */
  isInterstitialReady(): boolean {
    return this.interstitialLoaded;
  }

  /**
   * 보상형 광고 준비 여부
   */
  isRewardedReady(): boolean {
    return this.rewardedLoaded;
  }
}

// 싱글톤 인스턴스
export const admobService = new AdMobService();

// React Hook for AdMob
export function useAdMob() {
  return {
    initialize: () => admobService.initialize(),
    showBanner: (position?: 'top' | 'bottom') => admobService.showBanner(position),
    hideBanner: () => admobService.hideBanner(),
    removeBanner: () => admobService.removeBanner(),
    showInterstitial: () => admobService.showInterstitial(),
    showRewarded: () => admobService.showRewarded(),
    isInterstitialReady: () => admobService.isInterstitialReady(),
    isRewardedReady: () => admobService.isRewardedReady(),
  };
}

