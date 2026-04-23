import { logger } from './logger';
/**
 * ?±ëŠ¥ ìµœì ???œë¹„?? * - Core Web Vitals ëª¨ë‹ˆ?°ë§
 * - ?´ë?ì§€ lazy loading
 * - ë©”ëª¨ë¦?ê´€ë¦? * - ë²ˆë“¤ ?¬ê¸° ìµœì ?? */

// Web Vitals ?€???•ì˜
interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const isDebug = import.meta.env.DEV || import.meta.env.MODE === 'test';

const debugLog = (...args: unknown[]): void => {
  if (isDebug) {
    logger.log(...args);
  }
};

// Core Web Vitals ?„ê³„ê°?(ì°¸ê³ ?©ìœ¼ë¡?export)
// web-vitals v4+?ì„œ??FIDê°€ INPë¡??€ì²´ë¨
export const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint
};

/**
 * Web Vitals ëª¨ë‹ˆ?°ë§ ì´ˆê¸°?? */
export async function initWebVitals(onMetric?: (metric: Metric) => void) {
  if (typeof window === 'undefined') return;

  try {
    // ?™ì  importë¡?web-vitals ë¡œë“œ (ë²ˆë“¤ ?¬ê¸° ìµœì ??
    // web-vitals v4+?ì„œ??FIDê°€ INPë¡??€ì²´ë¨
    const { onLCP, onCLS, onFCP, onTTFB, onINP } = await import('web-vitals');

    const reportMetric = (metric: Metric) => {
      // ì½˜ì†”??ë¡œê·¸
      debugLog(`[Web Vitals] ${metric.name}:`, metric.value, `(${metric.rating})`);

      // Analytics???„ì†¡
      sendToAnalytics(metric);

      // ì½œë°± ?¸ì¶œ
      onMetric?.(metric);
    };

    onLCP(reportMetric);
    onCLS(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
    onINP(reportMetric);
  } catch (error) {
    logger.warn('Web Vitals not available:', error);
  }
}

/**
 * Analytics??ë©”íŠ¸ë¦??„ì†¡
 */
function sendToAnalytics(metric: Metric) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

/**
 * ?´ë?ì§€ Intersection Observer ê¸°ë°˜ lazy loading
 */
export function createImageObserver(options?: IntersectionObserverInit): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;

        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
      }
    });
  }, {
    rootMargin: '50px 0px', // 50px ?„ì— ë¯¸ë¦¬ ë¡œë“œ
    threshold: 0.01,
    ...options,
  });
}

/**
 * ?´ë?ì§€ ?„ë¦¬ë¡œë“œ
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * ì¤‘ìš” ?´ë?ì§€ ?„ë¦¬ë¡œë“œ (LCP ìµœì ??
 */
export function preloadCriticalImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

/**
 * ë©”ëª¨ë¦?ê´€ë¦?- Blob URL ?•ë¦¬
 */
const blobUrls = new Set<string>();

export function createBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  blobUrls.add(url);
  return url;
}

export function revokeBlobUrl(url: string): void {
  if (blobUrls.has(url)) {
    URL.revokeObjectURL(url);
    blobUrls.delete(url);
  }
}

export function revokeAllBlobUrls(): void {
  blobUrls.forEach((url) => URL.revokeObjectURL(url));
  blobUrls.clear();
}

/**
 * ?´ë?ì§€ ?•ì¶• (?´ë¼?´ì–¸???¬ì´??
 */
export async function compressImage(
  file: File | Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    type?: string;
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    type = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // ë¦¬ì‚¬?´ì§• ê³„ì‚°
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Canvasë¡??•ì¶•
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };

    img.src = url;
  });
}

/**
 * ë¦¬ì†Œ???ŒíŠ¸ ì¶”ê? (preconnect, prefetch)
 */
export function addResourceHint(
  type: 'preconnect' | 'prefetch' | 'preload' | 'dns-prefetch',
  href: string,
  options?: { as?: string; crossOrigin?: string }
): void {
  if (typeof document === 'undefined') return;

  // ?´ë? ì¡´ì¬?˜ëŠ”ì§€ ?•ì¸
  if (document.querySelector(`link[href="${href}"]`)) return;

  const link = document.createElement('link');
  link.rel = type;
  link.href = href;

  if (options?.as) {
    link.setAttribute('as', options.as);
  }
  if (options?.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * API ?„ë¦¬ì»¤ë„¥???¤ì •
 */
export function setupPreconnects(): void {
  // Google APIs
  addResourceHint('preconnect', 'https://fonts.googleapis.com');
  addResourceHint('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });

  // Gemini API
  addResourceHint('preconnect', 'https://generativelanguage.googleapis.com');

  // Analytics
  addResourceHint('preconnect', 'https://www.google-analytics.com');
  addResourceHint('preconnect', 'https://www.googletagmanager.com');
}

/**
 * ?”ë°”?´ìŠ¤ ?¨ìˆ˜
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * ?°ë¡œ?€ ?¨ìˆ˜
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Idle ì½œë°± (??? ?°ì„ ?œìœ„ ?‘ì—…??
 */
export function runWhenIdle(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
}

/**
 * ë©”ëª¨ë¦??¬ìš©??ëª¨ë‹ˆ?°ë§ (Chrome?ì„œë§??‘ë™)
 */
export function getMemoryInfo(): { usedJSHeapSize: number; totalJSHeapSize: number } | null {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
      };
    }
  }
  return null;
}

/**
 * ?±ëŠ¥ ë§ˆí¬ ë°?ì¸¡ì •
 */
export function markPerformance(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark: string): number | null {
  if (typeof performance !== 'undefined') {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      return entries.length > 0 ? entries[entries.length - 1].duration : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * ?¤ë¹„ê²Œì´???€?´ë° ?°ì´?? */
export function getNavigationTiming(): Record<string, number> | null {
  if (typeof performance !== 'undefined' && 'getEntriesByType' in performance) {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigation) {
      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };
    }
  }
  return null;
}

/**
 * ?±ëŠ¥ ì´ˆê¸°?? */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // ?„ë¦¬ì»¤ë„¥???¤ì •
  setupPreconnects();

  // Web Vitals ëª¨ë‹ˆ?°ë§
  initWebVitals();

  // ?˜ì´ì§€ ë¡œë“œ ?„ë£Œ ???±ëŠ¥ ?°ì´??ë¡œê¹…
  window.addEventListener('load', () => {
    runWhenIdle(() => {
      const timing = getNavigationTiming();
      if (timing) {
        debugLog('[Performance] Navigation Timing:', timing);
      }

      const memory = getMemoryInfo();
      if (memory) {
        debugLog('[Performance] Memory:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    });
  });

  // ?˜ì´ì§€ ?¸ë¡œ????Blob URL ?•ë¦¬
  window.addEventListener('beforeunload', () => {
    revokeAllBlobUrls();
  });
}