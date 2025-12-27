/**
 * Google Analytics 4 트래킹 서비스
 * GA4 측정 ID: 환경변수에서 설정
 * GDPR/CCPA 준수: 사용자 동의 후에만 트래킹
 */

import { canUseAnalytics, canUseMarketing } from '../components/CookieConsent';

// GA4 이벤트 타입 정의
interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// 페이지뷰 이벤트 타입
interface PageViewEvent {
  page_path: string;
  page_title: string;
  page_location: string;
}

// 사용자 속성 타입
interface UserProperties {
  language?: string;
  theme?: string;
  user_type?: 'new' | 'returning';
}

// gtag 전역 타입 선언
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// GA 측정 ID (환경변수에서 가져옴)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

/**
 * GA4 스크립트 초기화
 */
export const initGA = (): void => {
  // 이미 초기화된 경우 스킵
  if (typeof window.gtag === 'function') return;

  // 개발 환경에서는 GA 비활성화 옵션
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_GA_DEV) {
    console.log('[Analytics] GA disabled in development');
    // 빈 함수로 대체
    window.gtag = () => {};
    window.dataLayer = [];
    return;
  }

  // dataLayer 초기화
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };

  // GA 스크립트 로드
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // GA 초기 설정
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // SPA이므로 수동으로 페이지뷰 전송
    anonymize_ip: true, // IP 익명화 (GDPR 준수)
    cookie_flags: 'SameSite=None;Secure', // 보안 쿠키
  });
};

/**
 * 페이지뷰 트래킹 (동의 확인)
 */
export const trackPageView = (pageData?: Partial<PageViewEvent>): void => {
  // GDPR/CCPA: 동의 확인
  if (!canUseAnalytics()) {
    console.log('[Analytics] Tracking disabled - no consent');
    return;
  }

  if (typeof window.gtag !== 'function') return;

  const data: PageViewEvent = {
    page_path: pageData?.page_path || window.location.pathname,
    page_title: pageData?.page_title || document.title,
    page_location: pageData?.page_location || window.location.href,
  };

  window.gtag('event', 'page_view', data);
};

/**
 * 커스텀 이벤트 트래킹 (동의 확인)
 */
export const trackEvent = (event: GAEvent): void => {
  // GDPR/CCPA: 동의 확인
  if (!canUseAnalytics()) return;

  if (typeof window.gtag !== 'function') return;

  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
  });
};

/**
 * 마케팅 이벤트 트래킹 (마케팅 동의 필요)
 */
export const trackMarketingEvent = (event: GAEvent): void => {
  // GDPR/CCPA: 마케팅 동의 확인
  if (!canUseMarketing()) return;

  if (typeof window.gtag !== 'function') return;

  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
  });
};

/**
 * 사용자 속성 설정
 */
export const setUserProperties = (properties: UserProperties): void => {
  if (typeof window.gtag !== 'function') return;

  window.gtag('set', 'user_properties', properties);
};

// 앱 특화 이벤트 헬퍼 함수들
export const Analytics = {
  // 시뮬레이션 시작
  simulationStarted: (type: string, styleId?: string) => {
    trackEvent({
      action: 'simulation_started',
      category: 'simulation',
      label: type,
      value: styleId ? 1 : 0,
    });
  },

  // 시뮬레이션 완료
  simulationCompleted: (type: string, duration: number) => {
    trackEvent({
      action: 'simulation_completed',
      category: 'simulation',
      label: type,
      value: Math.round(duration / 1000), // 초 단위
    });
  },

  // 시뮬레이션 실패
  simulationFailed: (type: string, error: string) => {
    trackEvent({
      action: 'simulation_failed',
      category: 'simulation',
      label: `${type}:${error}`,
    });
  },

  // 사진 촬영/업로드
  photoCapture: (source: 'camera' | 'gallery') => {
    trackEvent({
      action: 'photo_capture',
      category: 'user_action',
      label: source,
    });
  },

  // 헤어스타일 선택
  styleSelected: (styleId: string, gender: string) => {
    trackEvent({
      action: 'style_selected',
      category: 'user_action',
      label: `${gender}:${styleId}`,
    });
  },

  // 결과 저장
  resultSaved: (type: string) => {
    trackEvent({
      action: 'result_saved',
      category: 'user_action',
      label: type,
    });
  },

  // 결과 공유
  resultShared: (method: string) => {
    trackEvent({
      action: 'result_shared',
      category: 'user_action',
      label: method,
    });
  },

  // 기능 사용
  featureUsed: (feature: string) => {
    trackEvent({
      action: 'feature_used',
      category: 'feature',
      label: feature,
    });
  },

  // 설정 변경
  settingChanged: (setting: string, value: string) => {
    trackEvent({
      action: 'setting_changed',
      category: 'settings',
      label: `${setting}:${value}`,
    });
  },

  // 에러 발생
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent({
      action: 'error_occurred',
      category: 'error',
      label: `${errorType}:${errorMessage.slice(0, 100)}`,
    });
  },

  // PWA 설치
  pwaInstalled: () => {
    trackEvent({
      action: 'pwa_installed',
      category: 'pwa',
      label: 'install_prompt_accepted',
    });
  },

  // 오프라인 사용
  offlineUsed: () => {
    trackEvent({
      action: 'offline_used',
      category: 'pwa',
      label: 'offline_mode',
    });
  },
};

export default Analytics;
