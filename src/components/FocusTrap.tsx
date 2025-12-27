/**
 * FocusTrap - 모달/다이얼로그에서 포커스를 가두는 컴포넌트
 * 키보드 접근성을 위한 필수 컴포넌트
 */
import { useRef, useEffect, useCallback, memo, type ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  initialFocus?: string;
}

const FOCUSABLE_ELEMENTS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const FocusTrap = memo(function FocusTrap({
  children,
  active = true,
  onEscape,
  restoreFocus = true,
  initialFocus,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 포커스 가능한 요소들 가져오기
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
    ).filter((el) => el.offsetParent !== null); // 보이는 요소만
  }, []);

  // 초기 포커스 설정
  useEffect(() => {
    if (!active) return;

    // 이전 포커스 저장
    previousFocusRef.current = document.activeElement as HTMLElement;

    // 초기 포커스 설정
    const focusFirst = () => {
      if (initialFocus) {
        const target = containerRef.current?.querySelector<HTMLElement>(initialFocus);
        if (target) {
          target.focus();
          return;
        }
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    // 약간의 딜레이 후 포커스 (애니메이션 대기)
    requestAnimationFrame(focusFirst);

    // 클린업: 이전 포커스로 복원
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, initialFocus, restoreFocus, getFocusableElements]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!active) return;

      // Escape 키
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Tab 키
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift+Tab: 첫 번째 요소에서 마지막으로
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab: 마지막 요소에서 첫 번째로
        if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
          return;
        }
      }
    },
    [active, onEscape, getFocusableElements]
  );

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} role="dialog" aria-modal="true">
      {children}
    </div>
  );
});

export default FocusTrap;
