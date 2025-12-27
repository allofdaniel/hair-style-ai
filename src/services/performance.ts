/**
 * 성능 최적화 서비스
 * - Core Web Vitals 모니터링
 * - 이미지 lazy loading
 * - 메모리 관리
 * - 번들 크기 최적화
 */

// Web Vitals 타입 정의
interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Core Web Vitals 임계값 (참고용으로 export)
// web-vitals v4+에서는 FID가 INP로 대체됨
export const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint
};

/**
 * Web Vitals 모니터링 초기화
 */
export async function initWebVitals(onMetric?: (metric: Metric) => void) {
  if (typeof window === 'undefined') return;

  try {
    // 동적 import로 web-vitals 로드 (번들 크기 최적화)
    // web-vitals v4+에서는 FID가 INP로 대체됨
    const { onLCP, onCLS, onFCP, onTTFB, onINP } = await import('web-vitals');

    const reportMetric = (metric: Metric) => {
      // 콘솔에 로그
      console.log(`[Web Vitals] ${metric.name}:`, metric.value, `(${metric.rating})`);

      // Analytics에 전송
      sendToAnalytics(metric);

      // 콜백 호출
      onMetric?.(metric);
    };

    onLCP(reportMetric);
    onCLS(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
    onINP(reportMetric);
  } catch (error) {
    console.warn('Web Vitals not available:', error);
  }
}

/**
 * Analytics에 메트릭 전송
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
 * 이미지 Intersection Observer 기반 lazy loading
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
    rootMargin: '50px 0px', // 50px 전에 미리 로드
    threshold: 0.01,
    ...options,
  });
}

/**
 * 이미지 프리로드
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
 * 중요 이미지 프리로드 (LCP 최적화)
 */
export function preloadCriticalImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

/**
 * 메모리 관리 - Blob URL 정리
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
 * 이미지 압축 (클라이언트 사이드)
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

      // 리사이징 계산
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Canvas로 압축
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
 * 리소스 힌트 추가 (preconnect, prefetch)
 */
export function addResourceHint(
  type: 'preconnect' | 'prefetch' | 'preload' | 'dns-prefetch',
  href: string,
  options?: { as?: string; crossOrigin?: string }
): void {
  if (typeof document === 'undefined') return;

  // 이미 존재하는지 확인
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
 * API 프리커넥트 설정
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
 * 디바운스 함수
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
 * 쓰로틀 함수
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
 * Idle 콜백 (낮은 우선순위 작업용)
 */
export function runWhenIdle(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
}

/**
 * 메모리 사용량 모니터링 (Chrome에서만 작동)
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
 * 성능 마크 및 측정
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
 * 네비게이션 타이밍 데이터
 */
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
 * 성능 초기화
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // 프리커넥트 설정
  setupPreconnects();

  // Web Vitals 모니터링
  initWebVitals();

  // 페이지 로드 완료 후 성능 데이터 로깅
  window.addEventListener('load', () => {
    runWhenIdle(() => {
      const timing = getNavigationTiming();
      if (timing) {
        console.log('[Performance] Navigation Timing:', timing);
      }

      const memory = getMemoryInfo();
      if (memory) {
        console.log('[Performance] Memory:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    });
  });

  // 페이지 언로드 시 Blob URL 정리
  window.addEventListener('beforeunload', () => {
    revokeAllBlobUrls();
  });
}
