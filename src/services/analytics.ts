import { logger } from './logger';
/**
 * Analytics service (GA4) with environment + consent safety checks.
 */
import { canUseAnalytics, canUseMarketing } from '../components/CookieConsent';

// GA4 event shape
interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface PageViewEvent {
  page_path: string;
  page_title: string;
  page_location: string;
}

interface UserProperties {
  language?: string;
  theme?: string;
  user_type?: 'new' | 'returning';
}

interface ConsentPayload {
  analytics_storage: 'denied' | 'granted';
  ad_storage: 'denied' | 'granted';
  ad_user_data: 'denied' | 'granted';
  ad_personalization: 'denied' | 'granted';
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
const isDebug = import.meta.env.DEV || import.meta.env.MODE === 'test';

const debugLog = (...args: unknown[]): void => {
  if (isDebug) {
    logger.log(...args);
  }
};
const IS_DEV_ANALYTICS = import.meta.env.DEV && import.meta.env.VITE_ENABLE_GA_DEV === 'true';
const IS_TEST = import.meta.env.MODE === 'test';
const GA_ID_PATTERN = /^G-[A-Z0-9]{6,}$/i;
const VALID_GA_ID = GA_ID_PATTERN.test(GA_MEASUREMENT_ID);
const RESOLVED_GA_ID = VALID_GA_ID ? GA_MEASUREMENT_ID : (IS_TEST ? 'G-TESTMODE' : '');
const CONSENT_SCRIPT_ID = 'google-tag-manager-gtag';

const getConsentPayload = (): ConsentPayload => {
  return {
    analytics_storage: canUseAnalytics() ? 'granted' : 'denied',
    ad_storage: canUseMarketing() ? 'granted' : 'denied',
    ad_user_data: canUseMarketing() ? 'granted' : 'denied',
    ad_personalization: canUseMarketing() ? 'granted' : 'denied',
  };
};

const shouldEnableTracking = (): boolean => {
  if (IS_TEST) return true;
  if (IS_DEV_ANALYTICS) return true;
  return canUseAnalytics();
};

const setNoopGtag = (): void => {
  window.gtag = () => {
    window.dataLayer = window.dataLayer || [];
  };
  window.dataLayer = window.dataLayer || [];
};

let isInitialized = false;
let isListenerRegistered = false;
let isTrackingEnabled = false;

const applyConsentUpdate = (): void => {
  if (typeof window?.gtag !== 'function') return;

  const payload = getConsentPayload();

  window.gtag('consent', 'update', payload);
};

const handleConsentUpdated = (): void => {
  if (shouldEnableTracking()) {
    isTrackingEnabled = true;
    if (!isInitialized) {
      initGA();
      return;
    }
    applyConsentUpdate();
    return;
  }

  isTrackingEnabled = false;
  setNoopGtag();
  isInitialized = false;
};

/**
 * Initialize GA script/config with consent + env checks.
 */
export const initGA = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!isListenerRegistered) {
    window.addEventListener('consent-updated', handleConsentUpdated);
    isListenerRegistered = true;
  }

  if (!shouldEnableTracking()) {
    isTrackingEnabled = false;
    setNoopGtag();
    return;
  }

  if (!RESOLVED_GA_ID) {
    isTrackingEnabled = false;
    setNoopGtag();
    logger.warn('[Analytics] GA initialization blocked: missing/invalid VITE_GA_MEASUREMENT_ID');
    return;
  }

  if (typeof window.gtag === 'function' && isInitialized) return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
  }

  // Avoid injecting script twice.
  if (!document.getElementById(CONSENT_SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = CONSENT_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${RESOLVED_GA_ID}`;
    document.head.appendChild(script);
  }

  const payload = getConsentPayload();

  window.gtag('consent', 'default', payload);
  window.gtag('js', new Date());
  window.gtag('config', RESOLVED_GA_ID, {
    send_page_view: false,
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  applyConsentUpdate();

  isInitialized = true;
  isTrackingEnabled = true;

  if (import.meta.env.DEV && !IS_DEV_ANALYTICS) {
    debugLog('[Analytics] GA disabled in development');
  }
};

/**
 * Track page view (privacy gated)
 */
export const trackPageView = (pageData?: Partial<PageViewEvent>): void => {
  if (!isTrackingEnabled || !shouldEnableTracking()) return;
  if (typeof window.gtag !== 'function') return;

  const data: PageViewEvent = {
    page_path: pageData?.page_path || window.location.pathname,
    page_title: pageData?.page_title || document.title,
    page_location: pageData?.page_location || window.location.href,
  };

  window.gtag('event', 'page_view', data);
};

/**
 * Track standard event (privacy gated)
 */
export const trackEvent = (event: GAEvent): void => {
  if (!isTrackingEnabled || !canUseAnalytics()) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
  });
};

/**
 * Track marketing events (privacy gated)
 */
export const trackMarketingEvent = (event: GAEvent): void => {
  if (!isTrackingEnabled || !canUseMarketing()) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
  });
};

/**
 * Set user properties (privacy gated)
 */
export const setUserProperties = (properties: UserProperties): void => {
  if (!isTrackingEnabled || !shouldEnableTracking()) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('set', 'user_properties', properties);
};

export const Analytics = {
  simulationStarted: (type: string, styleId?: string) => {
    trackEvent({
      action: 'simulation_started',
      category: 'simulation',
      label: type,
      value: styleId ? 1 : 0,
    });
  },

  simulationCompleted: (type: string, duration: number) => {
    trackEvent({
      action: 'simulation_completed',
      category: 'simulation',
      label: type,
      value: Math.round(duration / 1000),
    });
  },

  simulationFailed: (type: string, error: string) => {
    trackEvent({
      action: 'simulation_failed',
      category: 'simulation',
      label: `${type}:${error}`,
    });
  },

  photoCapture: (source: 'camera' | 'gallery') => {
    trackEvent({
      action: 'photo_capture',
      category: 'user_action',
      label: source,
    });
  },

  styleSelected: (styleId: string, gender: string) => {
    trackEvent({
      action: 'style_selected',
      category: 'user_action',
      label: `${gender}:${styleId}`,
    });
  },

  resultSaved: (type: string) => {
    trackEvent({
      action: 'result_saved',
      category: 'user_action',
      label: type,
    });
  },

  resultShared: (method: string) => {
    trackEvent({
      action: 'result_shared',
      category: 'user_action',
      label: method,
    });
  },

  featureUsed: (feature: string) => {
    trackEvent({
      action: 'feature_used',
      category: 'feature',
      label: feature,
    });
  },

  settingChanged: (setting: string, value: string) => {
    trackEvent({
      action: 'setting_changed',
      category: 'settings',
      label: `${setting}:${value}`,
    });
  },

  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent({
      action: 'error_occurred',
      category: 'error',
      label: `${errorType}:${errorMessage.slice(0, 100)}`,
    });
  },

  pwaInstalled: () => {
    trackEvent({
      action: 'pwa_installed',
      category: 'pwa',
      label: 'install_prompt_accepted',
    });
  },

  offlineUsed: () => {
    trackEvent({
      action: 'offline_used',
      category: 'pwa',
      label: 'offline_mode',
    });
  },
};

export default Analytics;