/**
 * 광고 배너 컴포넌트
 * - AdMob / AdSense 연동 준비
 * - Pro 사용자에게는 표시 안 함
 * - 다양한 광고 크기 지원
 */

import { useState, useEffect } from 'react';
import { useProStore } from '../stores/useProStore';
import { useI18n, type Language } from '../i18n/useI18n';

type AdSize = 'banner' | 'large-banner' | 'medium-rectangle' | 'interstitial';

interface AdBannerProps {
  size?: AdSize;
  className?: string;
  onAdLoaded?: () => void;
  onAdError?: () => void;
}

// 광고 사이즈 정의
const AD_SIZES: Record<AdSize, { width: number; height: number }> = {
  'banner': { width: 320, height: 50 },
  'large-banner': { width: 320, height: 100 },
  'medium-rectangle': { width: 300, height: 250 },
  'interstitial': { width: 320, height: 480 },
};

// 광고 제거 프로모션 텍스트
const PROMO_TEXTS: Record<Language, { upgrade: string; noAds: string }> = {
  ko: { upgrade: '업그레이드', noAds: '광고 없이 사용하기' },
  en: { upgrade: 'Upgrade', noAds: 'Use without ads' },
  zh: { upgrade: '升级', noAds: '无广告使用' },
  ja: { upgrade: 'アップグレード', noAds: '広告なしで使用' },
  es: { upgrade: 'Actualizar', noAds: 'Usar sin anuncios' },
  pt: { upgrade: 'Atualizar', noAds: 'Usar sem anúncios' },
  fr: { upgrade: 'Mettre à niveau', noAds: 'Utiliser sans publicité' },
  de: { upgrade: 'Upgraden', noAds: 'Ohne Werbung nutzen' },
  th: { upgrade: 'อัปเกรด', noAds: 'ใช้งานแบบไม่มีโฆษณา' },
  vi: { upgrade: 'Nâng cấp', noAds: 'Sử dụng không có quảng cáo' },
  id: { upgrade: 'Upgrade', noAds: 'Gunakan tanpa iklan' },
  hi: { upgrade: 'अपग्रेड', noAds: 'विज्ञापन के बिना उपयोग करें' },
  ar: { upgrade: 'ترقية', noAds: 'استخدم بدون إعلانات' },
};

export default function AdBanner({
  size = 'banner',
  className = '',
  onAdLoaded,
  onAdError: _onAdError,
}: AdBannerProps) {
  const { isPro } = useProStore();
  const { language } = useI18n();
  const [adLoaded, setAdLoaded] = useState(false);
  const [_adError, _setAdError] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);

  // 향후 광고 SDK 연동시 사용할 변수들
  void _onAdError;
  void _adError;
  void _setAdError;

  const texts = PROMO_TEXTS[language] || PROMO_TEXTS.en;
  const { width, height } = AD_SIZES[size];

  // Pro 사용자는 광고 표시 안 함
  if (isPro()) {
    return null;
  }

  useEffect(() => {
    // TODO: 실제 광고 SDK 초기화
    // AdMob, AdSense, 또는 다른 광고 네트워크 연동

    // 데모용 - 광고 로드 시뮬레이션
    const timer = setTimeout(() => {
      setAdLoaded(true);
      onAdLoaded?.();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 광고 로드 실패 시
  if (_adError) {
    return null;
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 overflow-hidden ${className}`}
      style={{ width: '100%', maxWidth: width, height }}
      onMouseEnter={() => setShowUpgradeHint(true)}
      onMouseLeave={() => setShowUpgradeHint(false)}
    >
      {!adLoaded ? (
        // 로딩 스켈레톤
        <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
      ) : (
        // 데모 광고 (실제 구현시 광고 SDK로 대체)
        <div className="w-full h-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex flex-col items-center justify-center">
          <span className="text-gray-400 dark:text-gray-500 text-xs">
            Advertisement
          </span>

          {/* 광고 제거 힌트 */}
          {showUpgradeHint && (
            <button className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-white text-sm font-medium">
              <span>⭐</span>
              <span>{texts.noAds}</span>
            </button>
          )}
        </div>
      )}

      {/* Ad 라벨 */}
      <span className="absolute top-0.5 right-0.5 bg-black/30 text-white text-[8px] px-1 rounded">
        AD
      </span>
    </div>
  );
}

// 인터스티셜 광고 컴포넌트
interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function InterstitialAd({ isOpen, onClose, onComplete }: InterstitialAdProps) {
  const { isPro } = useProStore();
  const { language } = useI18n();
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  const texts = PROMO_TEXTS[language] || PROMO_TEXTS.en;

  // Pro 사용자는 광고 건너뛰기
  useEffect(() => {
    if (isPro() && isOpen) {
      onComplete?.();
      onClose();
    }
  }, [isOpen, isPro]);

  // 카운트다운
  useEffect(() => {
    if (!isOpen || isPro()) return;

    setCountdown(5);
    setCanClose(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || isPro()) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* 닫기 버튼 / 카운트다운 */}
      <div className="absolute top-4 right-4 z-10">
        {canClose ? (
          <button
            onClick={() => {
              onComplete?.();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
            {countdown}
          </div>
        )}
      </div>

      {/* 광고 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">⭐</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">
            LookSim Pro
          </h3>
          <p className="text-white/60 text-sm mb-6">
            {texts.noAds}
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full">
            {texts.upgrade}
          </button>
        </div>
      </div>

      {/* 스킵 힌트 */}
      {canClose && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/40 text-sm">
            Tap X to continue
          </p>
        </div>
      )}
    </div>
  );
}

// 네이티브 광고 (피드 내 광고)
interface NativeAdProps {
  className?: string;
}

export function NativeAd({ className = '' }: NativeAdProps) {
  const { isPro } = useProStore();
  const { language } = useI18n();

  if (isPro()) return null;

  const texts = PROMO_TEXTS[language] || PROMO_TEXTS.en;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Sponsored 라벨 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
          Sponsored
        </span>
      </div>

      {/* 광고 콘텐츠 (데모) */}
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">⭐</span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            LookSim Pro
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
            {texts.noAds}
          </p>
          <button className="mt-2 text-purple-600 dark:text-purple-400 text-xs font-medium">
            {texts.upgrade} →
          </button>
        </div>
      </div>
    </div>
  );
}

// 보상형 광고 훅
export function useRewardedAd() {
  const { isPro } = useProStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isPro()) return;

    // TODO: 보상형 광고 사전 로드
    // AdMob rewarded ad preload

    const timer = setTimeout(() => setIsLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, [isPro]);

  const showAd = async (): Promise<boolean> => {
    if (isPro()) {
      return true; // Pro 사용자는 광고 없이 보상 제공
    }

    if (!isLoaded) {
      return false;
    }

    setIsShowing(true);

    // TODO: 실제 보상형 광고 표시
    // await AdMob.showRewardedAd();

    // 데모 - 3초 후 완료
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsShowing(false);
        setIsLoaded(false);
        resolve(true);

        // 다음 광고 로드
        setTimeout(() => setIsLoaded(true), 1000);
      }, 3000);
    });
  };

  return {
    isLoaded,
    isShowing,
    showAd,
  };
}
