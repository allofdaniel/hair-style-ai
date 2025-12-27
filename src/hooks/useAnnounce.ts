/**
 * useAnnounce - 스크린 리더 알림 훅
 * 동적 콘텐츠 변경을 스크린 리더에 알림
 */
import { useCallback, useRef, useEffect } from 'react';

type Politeness = 'polite' | 'assertive';

interface UseAnnounceReturn {
  announce: (message: string, politeness?: Politeness) => void;
  clearAnnouncement: () => void;
}

export function useAnnounce(): UseAnnounceReturn {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  // 라이브 리전 생성
  useEffect(() => {
    // Polite 리전
    if (!document.getElementById('announcer-polite')) {
      politeRef.current = document.createElement('div');
      politeRef.current.id = 'announcer-polite';
      politeRef.current.setAttribute('role', 'status');
      politeRef.current.setAttribute('aria-live', 'polite');
      politeRef.current.setAttribute('aria-atomic', 'true');
      politeRef.current.className = 'sr-only';
      document.body.appendChild(politeRef.current);
    } else {
      politeRef.current = document.getElementById('announcer-polite') as HTMLDivElement;
    }

    // Assertive 리전
    if (!document.getElementById('announcer-assertive')) {
      assertiveRef.current = document.createElement('div');
      assertiveRef.current.id = 'announcer-assertive';
      assertiveRef.current.setAttribute('role', 'alert');
      assertiveRef.current.setAttribute('aria-live', 'assertive');
      assertiveRef.current.setAttribute('aria-atomic', 'true');
      assertiveRef.current.className = 'sr-only';
      document.body.appendChild(assertiveRef.current);
    } else {
      assertiveRef.current = document.getElementById('announcer-assertive') as HTMLDivElement;
    }

    // 클린업은 하지 않음 (전역 싱글톤으로 유지)
  }, []);

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const region = politeness === 'assertive' ? assertiveRef.current : politeRef.current;
    if (!region) return;

    // 메시지 변경을 위해 일단 비움
    region.textContent = '';

    // 다음 프레임에서 메시지 설정 (스크린 리더 감지를 위해)
    requestAnimationFrame(() => {
      if (region) {
        region.textContent = message;
      }
    });
  }, []);

  const clearAnnouncement = useCallback(() => {
    if (politeRef.current) politeRef.current.textContent = '';
    if (assertiveRef.current) assertiveRef.current.textContent = '';
  }, []);

  return { announce, clearAnnouncement };
}

export default useAnnounce;
