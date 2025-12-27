/**
 * 이미지 최적화 서비스
 * - WebP 형식 지원 감지 및 자동 변환
 * - 연결 품질에 따른 적응형 이미지 품질
 * - 지연 로딩 (Intersection Observer)
 * - 프로그레시브 로딩
 * - 캐싱 전략
 */

import { getConnectionStatus, getOptimalImageQuality } from './networkResilience';

// 이미지 포맷 지원 캐시
let webpSupported: boolean | null = null;
let avifSupported: boolean | null = null;

/**
 * WebP 지원 여부 확인
 */
export const checkWebPSupport = (): Promise<boolean> => {
  if (webpSupported !== null) {
    return Promise.resolve(webpSupported);
  }

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webpSupported = webP.height === 2;
      resolve(webpSupported);
    };
    // 1x1 픽셀 WebP 이미지
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * AVIF 지원 여부 확인
 */
export const checkAVIFSupport = (): Promise<boolean> => {
  if (avifSupported !== null) {
    return Promise.resolve(avifSupported);
  }

  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      avifSupported = avif.height === 2;
      resolve(avifSupported);
    };
    // 1x1 픽셀 AVIF 이미지
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIhMxnA/wAAEAAASABACw==';
  });
};

/**
 * 연결 품질에 따른 이미지 품질 설정
 */
export interface ImageQualitySettings {
  quality: number;        // 0-100
  maxWidth: number;       // 최대 너비
  maxHeight: number;      // 최대 높이
  format: 'webp' | 'jpeg' | 'png';
  blur: boolean;          // 저품질 블러 프리뷰
}

export const getImageQualitySettings = async (): Promise<ImageQualitySettings> => {
  const networkQuality = getOptimalImageQuality();
  const supportsWebP = await checkWebPSupport();

  const baseFormat = supportsWebP ? 'webp' : 'jpeg';

  switch (networkQuality) {
    case 'high':
      return {
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
        format: baseFormat,
        blur: false,
      };
    case 'medium':
      return {
        quality: 70,
        maxWidth: 1280,
        maxHeight: 1280,
        format: baseFormat,
        blur: true,
      };
    case 'low':
      return {
        quality: 50,
        maxWidth: 800,
        maxHeight: 800,
        format: baseFormat,
        blur: true,
      };
    default:
      return {
        quality: 70,
        maxWidth: 1280,
        maxHeight: 1280,
        format: baseFormat,
        blur: true,
      };
  }
};

/**
 * 이미지 리사이즈 및 압축
 */
export const optimizeImage = async (
  file: File | Blob,
  options?: Partial<ImageQualitySettings>
): Promise<Blob> => {
  const settings = await getImageQualitySettings();
  const finalSettings = { ...settings, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 캔버스에 그리기
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // 비율 유지하면서 리사이즈
      if (width > finalSettings.maxWidth) {
        height = (height * finalSettings.maxWidth) / width;
        width = finalSettings.maxWidth;
      }
      if (height > finalSettings.maxHeight) {
        width = (width * finalSettings.maxHeight) / height;
        height = finalSettings.maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 이미지 스무딩 활성화
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, width, height);

      // Blob으로 변환
      const mimeType = finalSettings.format === 'webp'
        ? 'image/webp'
        : finalSettings.format === 'png'
          ? 'image/png'
          : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        mimeType,
        finalSettings.quality / 100
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // File/Blob을 이미지로 로드
    if (file instanceof File || file instanceof Blob) {
      img.src = URL.createObjectURL(file);
    }
  });
};

/**
 * 저품질 블러 프리뷰 생성 (LQIP - Low Quality Image Placeholder)
 */
export const generateLQIP = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // 매우 작은 크기로 축소
      const size = 20;
      const aspectRatio = img.width / img.height;

      if (aspectRatio > 1) {
        canvas.width = size;
        canvas.height = size / aspectRatio;
      } else {
        canvas.width = size * aspectRatio;
        canvas.height = size;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Base64 데이터 URL 반환
      resolve(canvas.toDataURL('image/jpeg', 0.1));
    };

    img.onerror = () => reject(new Error('Failed to generate LQIP'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 프로그레시브 이미지 로더
 */
export class ProgressiveImageLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages: Set<string> = new Set();

  constructor() {
    this.initObserver();
  }

  private initObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
          }
        });
      },
      {
        rootMargin: '50px 0px', // 뷰포트 50px 전에 로딩 시작
        threshold: 0.01,
      }
    );
  }

  private async loadImage(img: HTMLImageElement): Promise<void> {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) return;

    try {
      // 고품질 이미지 로딩
      const highQualityImg = new Image();
      highQualityImg.src = src;

      await new Promise((resolve, reject) => {
        highQualityImg.onload = resolve;
        highQualityImg.onerror = reject;
      });

      // 페이드 인 효과와 함께 교체
      img.style.transition = 'opacity 0.3s ease-in-out';
      img.style.opacity = '0.5';

      requestAnimationFrame(() => {
        img.src = src;
        img.style.opacity = '1';
        img.classList.remove('blur-sm');
      });

      this.loadedImages.add(src);
      this.observer?.unobserve(img);
    } catch (error) {
      console.error('[ImageOptimization] Failed to load image:', error);
    }
  }

  observe(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // IntersectionObserver 미지원 시 즉시 로드
      this.loadImage(img);
    }
  }

  unobserve(img: HTMLImageElement): void {
    this.observer?.unobserve(img);
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.loadedImages.clear();
  }
}

/**
 * 이미지 캐시 관리
 */
export const ImageCache = {
  // 캐시 이름
  CACHE_NAME: 'looksim-images-v1',

  // 이미지 캐싱
  async cache(url: string, blob: Blob): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(this.CACHE_NAME);
      const response = new Response(blob);
      await cache.put(url, response);
    } catch (error) {
      console.error('[ImageCache] Failed to cache image:', error);
    }
  },

  // 캐시에서 가져오기
  async get(url: string): Promise<Blob | null> {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open(this.CACHE_NAME);
      const response = await cache.match(url);
      if (response) {
        return await response.blob();
      }
    } catch (error) {
      console.error('[ImageCache] Failed to get cached image:', error);
    }
    return null;
  },

  // 캐시 정리 (오래된 항목 삭제)
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(this.CACHE_NAME);
      const keys = await cache.keys();
      const now = Date.now();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const cacheTime = new Date(dateHeader).getTime();
            if (now - cacheTime > maxAge) {
              await cache.delete(request);
            }
          }
        }
      }
    } catch (error) {
      console.error('[ImageCache] Failed to cleanup cache:', error);
    }
  },

  // 캐시 크기 확인
  async getSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    try {
      const cache = await caches.open(this.CACHE_NAME);
      const keys = await cache.keys();
      let totalSize = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  },
};

/**
 * 적응형 이미지 URL 생성 (CDN 지원 시)
 */
export const getOptimizedImageUrl = async (
  originalUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  }
): Promise<string> => {
  // CDN URL 패턴 확인 (예: Cloudflare, Cloudinary, imgix 등)
  const cdnPatterns = [
    /imagecdn\.app/,
    /cloudinary\.com/,
    /imgix\.net/,
    /imagekit\.io/,
  ];

  const isCDN = cdnPatterns.some((pattern) => pattern.test(originalUrl));

  if (!isCDN) {
    // CDN이 아니면 원본 URL 반환
    return originalUrl;
  }

  const settings = await getImageQualitySettings();
  const params = new URLSearchParams();

  if (options?.width || settings.maxWidth) {
    params.set('w', String(options?.width || settings.maxWidth));
  }
  if (options?.height || settings.maxHeight) {
    params.set('h', String(options?.height || settings.maxHeight));
  }
  if (options?.quality || settings.quality) {
    params.set('q', String(options?.quality || settings.quality));
  }
  if (options?.format) {
    params.set('f', options.format);
  } else if (settings.format) {
    params.set('f', settings.format);
  }

  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${params.toString()}`;
};

/**
 * 배치 이미지 프리로드
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  const { quality } = getConnectionStatus();

  // 오프라인이거나 느린 연결에서는 프리로드 스킵
  if (quality === 'offline' || quality === 'slow') {
    return;
  }

  const loadImage = (url: string): Promise<void> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // 에러 시에도 계속 진행
      img.src = url;
    });

  // 동시에 최대 3개씩 로드
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map(loadImage));
  }
};

/**
 * Base64 이미지 크기 추정
 */
export const estimateBase64Size = (base64: string): number => {
  // Base64는 원본 대비 약 33% 더 큼
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4 - padding);
};

/**
 * 이미지 크기가 제한을 초과하는지 확인
 */
export const isImageTooLarge = (
  sizeInBytes: number,
  maxSizeInMB: number = 5
): boolean => {
  return sizeInBytes > maxSizeInMB * 1024 * 1024;
};

// 싱글톤 프로그레시브 로더
let progressiveLoader: ProgressiveImageLoader | null = null;

export const getProgressiveLoader = (): ProgressiveImageLoader => {
  if (!progressiveLoader) {
    progressiveLoader = new ProgressiveImageLoader();
  }
  return progressiveLoader;
};

export default {
  checkWebPSupport,
  checkAVIFSupport,
  getImageQualitySettings,
  optimizeImage,
  generateLQIP,
  ImageCache,
  getOptimizedImageUrl,
  preloadImages,
  getProgressiveLoader,
  estimateBase64Size,
  isImageTooLarge,
};
