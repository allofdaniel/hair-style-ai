/**
 * usePageTransition - 페이지 전환 애니메이션 훅
 * View Transitions API 지원 브라우저에서 사용
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type TransitionDirection = 'forward' | 'backward' | 'fade';

interface UsePageTransitionOptions {
  direction?: TransitionDirection;
  duration?: number;
}

export function usePageTransition() {
  const navigate = useNavigate();

  const transitionTo = useCallback(
    (path: string | number, options: UsePageTransitionOptions = {}) => {
      const { direction = 'forward' } = options;

      // View Transitions API 지원 확인
      if (document.startViewTransition) {
        // 방향에 따른 클래스 설정
        document.documentElement.dataset.transition = direction;

        document.startViewTransition(() => {
          if (typeof path === 'number') {
            navigate(path);
          } else {
            navigate(path);
          }
        });
      } else {
        // 미지원 브라우저: 일반 네비게이션
        if (typeof path === 'number') {
          navigate(path);
        } else {
          navigate(path);
        }
      }
    },
    [navigate]
  );

  const goBack = useCallback(
    (options: Omit<UsePageTransitionOptions, 'direction'> = {}) => {
      transitionTo(-1, { ...options, direction: 'backward' });
    },
    [transitionTo]
  );

  const goForward = useCallback(
    (path: string, options: Omit<UsePageTransitionOptions, 'direction'> = {}) => {
      transitionTo(path, { ...options, direction: 'forward' });
    },
    [transitionTo]
  );

  const fade = useCallback(
    (path: string, options: Omit<UsePageTransitionOptions, 'direction'> = {}) => {
      transitionTo(path, { ...options, direction: 'fade' });
    },
    [transitionTo]
  );

  return {
    transitionTo,
    goBack,
    goForward,
    fade,
  };
}

export default usePageTransition;
