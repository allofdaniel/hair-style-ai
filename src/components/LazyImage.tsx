/**
 * LazyImage - 이미지 지연 로딩 컴포넌트
 * Intersection Observer를 사용한 성능 최적화
 */
import { useState, useRef, useEffect, memo } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number | string;
  height?: number | string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  blurhash?: string;
}

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  width,
  height,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  fallbackSrc = '/placeholder.svg',
  blurhash,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer로 뷰포트 진입 감지
  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // IntersectionObserver 미지원 브라우저 대응
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${placeholderClassName}`}
      style={{ width, height }}
      role="img"
      aria-label={alt}
    >
      {/* 스켈레톤 플레이스홀더 */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 skeleton ${blurhash ? '' : 'bg-gray-100'}`}
          style={
            blurhash
              ? {
                  backgroundImage: `url(${blurhash})`,
                  backgroundSize: 'cover',
                  filter: 'blur(20px)',
                }
              : undefined
          }
          aria-hidden="true"
        />
      )}

      {/* 실제 이미지 */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
});

export default LazyImage;

/**
 * 이미지 프리로더 유틸리티
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 여러 이미지 프리로드
 */
export const preloadImages = async (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(preloadImage));
};
