/**
 * Pro 기능 상태 관리 스토어
 * - 구독 상태 관리
 * - 광고 제거
 * - 프로 전용 기능 접근
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface ProFeature {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  icon: string;
}

// 프로 기능 목록
export const PRO_FEATURES: ProFeature[] = [
  {
    id: 'no_ads',
    name: '광고 제거',
    description: '모든 광고가 제거됩니다',
    tier: 'pro',
    icon: '🚫',
  },
  {
    id: 'unlimited_simulations',
    name: '무제한 시뮬레이션',
    description: '일일 제한 없이 무제한 사용',
    tier: 'pro',
    icon: '♾️',
  },
  {
    id: 'hd_export',
    name: 'HD 고화질 저장',
    description: '최대 4K 해상도로 저장',
    tier: 'pro',
    icon: '🖼️',
  },
  {
    id: 'priority_processing',
    name: '우선 처리',
    description: 'AI 처리 대기열 우선',
    tier: 'pro',
    icon: '⚡',
  },
  {
    id: 'exclusive_styles',
    name: '프리미엄 스타일',
    description: '50+ 프리미엄 헤어스타일',
    tier: 'premium',
    icon: '👑',
  },
  {
    id: 'back_view',
    name: '뒷머리 생성',
    description: '360° 뷰 지원',
    tier: 'premium',
    icon: '🔄',
  },
  {
    id: 'color_customization',
    name: '색상 커스터마이징',
    description: '무제한 색상 선택',
    tier: 'premium',
    icon: '🎨',
  },
  {
    id: 'history_sync',
    name: '클라우드 동기화',
    description: '기록 클라우드 백업',
    tier: 'premium',
    icon: '☁️',
  },
];

// 가격 정보 (USD 기준)
export const PRICING = {
  pro: {
    monthly: 4.99,
    yearly: 29.99,
    yearlyMonthly: 2.49, // 월 환산 가격
    savings: '50%',
  },
  premium: {
    monthly: 9.99,
    yearly: 59.99,
    yearlyMonthly: 4.99,
    savings: '50%',
  },
};

interface ProState {
  // 구독 상태
  tier: SubscriptionTier;
  subscriptionId: string | null;
  expiresAt: number | null; // 만료 시간 (timestamp)
  billingPeriod: 'monthly' | 'yearly' | null;

  // 무료 사용 제한
  dailySimulationCount: number;
  lastSimulationDate: string | null;

  // Actions
  setTier: (tier: SubscriptionTier) => void;
  setSubscription: (params: {
    tier: SubscriptionTier;
    subscriptionId: string;
    expiresAt: number;
    billingPeriod: 'monthly' | 'yearly';
  }) => void;
  cancelSubscription: () => void;
  incrementDailyCount: () => boolean; // 제한 도달시 false 반환
  resetDailyCount: () => void;

  // Getters
  isPro: () => boolean;
  isPremium: () => boolean;
  isSubscribed: () => boolean;
  isExpired: () => boolean;
  hasFeature: (featureId: string) => boolean;
  getRemainingSimulations: () => number;
}

const FREE_DAILY_LIMIT = 5;

export const useProStore = create<ProState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      subscriptionId: null,
      expiresAt: null,
      billingPeriod: null,
      dailySimulationCount: 0,
      lastSimulationDate: null,

      setTier: (tier) => set({ tier }),

      setSubscription: ({ tier, subscriptionId, expiresAt, billingPeriod }) =>
        set({ tier, subscriptionId, expiresAt, billingPeriod }),

      cancelSubscription: () =>
        set({
          tier: 'free',
          subscriptionId: null,
          expiresAt: null,
          billingPeriod: null,
        }),

      incrementDailyCount: () => {
        const state = get();
        const today = new Date().toDateString();

        // Pro 이상은 무제한
        if (state.tier !== 'free') return true;

        // 날짜가 바뀌었으면 리셋
        if (state.lastSimulationDate !== today) {
          set({ dailySimulationCount: 1, lastSimulationDate: today });
          return true;
        }

        // 제한 체크
        if (state.dailySimulationCount >= FREE_DAILY_LIMIT) {
          return false;
        }

        set({ dailySimulationCount: state.dailySimulationCount + 1 });
        return true;
      },

      resetDailyCount: () =>
        set({ dailySimulationCount: 0, lastSimulationDate: null }),

      isPro: () => {
        const state = get();
        return state.tier === 'pro' || state.tier === 'premium';
      },

      isPremium: () => get().tier === 'premium',

      isSubscribed: () => {
        const state = get();
        return state.tier !== 'free' && !state.isExpired();
      },

      isExpired: () => {
        const state = get();
        if (!state.expiresAt) return false;
        return Date.now() > state.expiresAt;
      },

      hasFeature: (featureId: string) => {
        const state = get();
        const feature = PRO_FEATURES.find((f) => f.id === featureId);
        if (!feature) return true; // 알 수 없는 기능은 허용

        if (feature.tier === 'premium') {
          return state.tier === 'premium';
        }
        if (feature.tier === 'pro') {
          return state.tier === 'pro' || state.tier === 'premium';
        }
        return true;
      },

      getRemainingSimulations: () => {
        const state = get();
        if (state.tier !== 'free') return Infinity;

        const today = new Date().toDateString();
        if (state.lastSimulationDate !== today) {
          return FREE_DAILY_LIMIT;
        }
        return Math.max(0, FREE_DAILY_LIMIT - state.dailySimulationCount);
      },
    }),
    {
      name: 'looksim-pro-storage',
      version: 1,
    }
  )
);

// 구독 상태 변경 리스너 (분석용)
useProStore.subscribe((state, prevState) => {
  if (state.tier !== prevState.tier) {
    // Analytics 이벤트 발송
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'subscription_change', {
        previous_tier: prevState.tier,
        new_tier: state.tier,
        billing_period: state.billingPeriod,
      });
    }
  }
});
